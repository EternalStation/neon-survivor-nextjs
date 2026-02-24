import { useCallback } from 'react';
import { GameState, UpgradeChoice, PlayerClass, TutorialStep } from '../logic/core/types';
import { PLAYER_CLASSES } from '../logic/core/classes';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../logic/core/constants';
import { updatePlayer } from '../logic/player/PlayerLogic';
import { updateEnemies } from '../logic/enemies/EnemyLogic';
import { updateDirector } from '../logic/enemies/DirectorLogic';
import { updateExtraction } from '../logic/mission/ExtractionLogic';
import { updateBlueprints, isBuffActive } from '../logic/upgrades/BlueprintLogic';
import { handleEnemyDeath } from '../logic/mission/DeathLogic';
import { updateProjectiles } from '../logic/combat/ProjectileLogic';
import { updateLoot } from '../logic/mission/LootLogic';
import { updateParticles, spawnParticles, spawnFloatingNumber } from '../logic/effects/ParticleLogic';
import { spawnUpgrades, spawnSnitchUpgrades } from '../logic/upgrades/UpgradeLogic';
import { updateIncubator } from '../logic/upgrades/IncubatorLogic';
import { getLegendaryOptions } from '../logic/upgrades/LegendaryLogic';
import { playSfx, startBossAmbience, stopBossAmbience, startPortalAmbience, stopPortalAmbience, switchBGM, fadeOutMusic } from '../logic/audio/AudioLogic';
import { ARENA_CENTERS, ARENA_RADIUS, PORTALS, getHexWallLine } from '../logic/mission/MapLogic';
import { calcStat } from '../logic/utils/MathUtils';
import { getChassisResonance } from '../logic/upgrades/EfficiencyLogic';
import { spawnBullet } from '../logic/combat/ProjectileSpawning';
import { updateTutorial } from '../logic/core/TutorialLogic';
import { updateTurrets, updateAllies, relocateTurretsToArena } from '../logic/mission/TurretLogic';

interface UseGameLogicProps {
    gameState: React.MutableRefObject<GameState>;
    keys: React.MutableRefObject<Record<string, boolean>>;
    inputVector: React.MutableRefObject<{ x: number; y: number }>;
    mousePos: React.MutableRefObject<{ x: number; y: number } | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    windowScaleFactor: React.MutableRefObject<number>;
    setUpgradeChoices: (choices: UpgradeChoice[] | null) => void;
    setShowLegendarySelection: (show: boolean) => void;
    setGameOver: (over: boolean) => void;
    setBossWarning: (warning: number | null) => void;
    bossWarning: number | null;
    triggerOneTrickPony: (upgradeId: string) => void;
    triggerDamageTaken: (dmg: number) => void;
    triggerDeath: () => void;
    triggerWallIncompetence: () => void;
    onViewChassisDetail: () => void;
}

export function useGameLogic({
    gameState,
    keys,
    inputVector,
    mousePos,
    canvasRef,
    windowScaleFactor,
    setUpgradeChoices,
    setShowLegendarySelection,
    setGameOver,
    setBossWarning,
    bossWarning,
    triggerOneTrickPony,
    triggerDamageTaken,
    triggerDeath,
    triggerWallIncompetence,
    onViewChassisDetail
}: UseGameLogicProps) {
    const updateLogic = useCallback((state: GameState, step: number) => {
        const eventHandler = (event: string, _data?: any) => {
            if (event === 'level_up') {
                state.pendingLevelUps++;
                if (state.levelUpTimer <= 0) state.levelUpTimer = 1.0;
            }
            if (event === 'boss_kill') {
                state.pendingBossKills++;
                state.bossKills = (state.bossKills || 0) + 1;
                if (state.bossKillTimer <= 0) state.bossKillTimer = 1.0;
            }
            if (event === 'snitch_kill') {
                const choices = spawnSnitchUpgrades(state);
                setUpgradeChoices(choices);
                state.isPaused = true;
                playSfx('level');
            }
            if (event === 'game_over') {
                state.isPaused = true;
                setGameOver(true);
                import('../logic/audio/AudioLogic').then(mod => mod.stopAllLoops());
            }
        };
        state.legionLeads = state.legionLeads || {};

        const isHost = state.multiplayer.active ? state.multiplayer.isHost : true;

        if (state.isPaused) return;

        // --- HOST ONLY LOGIC (Enemies & Management) ---
        if (isHost) {
            // Reset Player Debuffs (Bosses will re-apply them during updateEnemies if relevant)
            if (state.players && Object.keys(state.players).length > 0) {
                Object.values(state.players).forEach(p => {
                    p.soulDrainMult = 1.0;
                    p.healingDisabled = false;
                });
            }
            if (state.player) {
                state.player.soulDrainMult = 1.0;
                state.player.healingDisabled = false;
            }

            if (state.extractionStatus !== 'departing') {
                updateEnemies(state, eventHandler, step);
                updateDirector(state, step);
                updateTutorial(state, step);
            }
            updateExtraction(state, step);
            updateTurrets(state, step);
            updateAllies(state, step);
        }

        // --- PLAYER UPDATE LOOP ---
        if (state.players && Object.keys(state.players).length > 0) {
            Object.values(state.players).forEach(p => {
                const isLocal = p.id === state.multiplayer.myId;

                // Determine inputs to use
                // For Local: Use 'keys.current' and 'inputVector.current'
                // For Remote (Host processing Guest): Use 'p.currentInput'
                let pKeys = isLocal ? keys.current : (p.currentInput?.keys || {});
                let pVector = isLocal ? inputVector.current : (p.currentInput?.vector || { x: 0, y: 0 });
                let pMouse = isLocal ? mousePos.current : (p.currentInput?.mouse || { x: 0, y: 0 }); // Fallback to 0,0

                // Host needs to run logic for EVERYONE
                // Client only runs logic for THEMSELVES (prediction) but we trust Host State? 
                // Actually, Client should only predict movement for themselves. 
                // But for simplicity/smoothness, let's run `updatePlayer` for everyone if we are Host.
                // If we are Client, we run `updatePlayer` for ourselves (for prediction) and maybe interpolate others?
                // For now, Client only runs SELF. Host runs ALL.

                if (isHost || isLocal) {
                    if (state.extractionStatus !== 'departing' && state.portalState !== 'transferring') {

                        // calculate mouse offset relative to screen center
                        // This logic relies on `mousePos` which is usually Local Mouse.
                        // For Remote player, we should trust `pMouse` (which should already be offset or raw?)
                        // `useGameInput` sends RAW mouse (clientX, clientY) usually? 
                        // Let's check `p.currentInput.mouse`. It assumes {x, y} relative to canvas center?
                        // NetworkManager sends what `useGameInput` provides.
                        // `useGameInput` provides `mousePos` ref which is client coordinates.
                        // So we need to process it.

                        // However, `updatePlayer` expects `mouseOffset` for aiming.
                        // If it's remote, `pMouse` might be the AIM VECTOR or Coordinates.
                        // Input sending sends: `mousePos.current` (ClientX/Y). 
                        // We need to convert it to Offset logic handled below.

                        let processedMouseOffset = { x: 0, y: 0 };

                        if (isLocal && canvasRef.current && mousePos.current) {
                            const canvas = canvasRef.current;
                            const rect = canvas.getBoundingClientRect();
                            const screenX = mousePos.current.x - rect.left;
                            const screenY = mousePos.current.y - rect.top;
                            const logicalZoom = windowScaleFactor.current * 0.58;
                            processedMouseOffset = {
                                x: (screenX - rect.width / 2) / logicalZoom,
                                y: (screenY - rect.height / 2) / logicalZoom
                            };
                        } else if (!isLocal && p.currentInput?.mouse) {
                            // Remote player sent us their raw mouse coordinates?
                            // This is problematic because Host doesn't know Guest's screen size/zoom perfectly.
                            // IDEALLY: Guest sends AIM ANGLE or AIM OFFSET, not raw mouse X/Y.
                            // But `NetworkManager` sends `mouse: {x, y}`. 
                            // Let's assume for now Guest assumes a standard size or we approximate.
                            // OR better: Guest sends the computed offset!
                            // I previously tweaked `useGame.ts` to send `mousePos.current`. 
                            // If I look at `useGame.ts`, it sends `mousePos.current`.
                            // Guest should convert to offset before sending... 
                            // But for now, let's just pass 0,0 or try to use what we have.
                            // Fix: Pass simple 0,0 or use the vector if we have aiming.
                            // Actually `updatePlayer` calculates angle using `mouseOffset`.
                            // If `pVector` is used for movement, `mouseOffset` is for aim.
                            // If we don't have accurate mouse, they aim at 0 deg.
                            // Whatever, movement is more important for "cant move".
                            processedMouseOffset = { x: 0, y: 0 }; // Temporary limitation
                        }

                        updatePlayer(state, pKeys, eventHandler, pVector, processedMouseOffset, p, triggerDamageTaken, triggerDeath, triggerWallIncompetence);
                    }
                }
            });
        } else {
            if (state.extractionStatus !== 'departing' && state.portalState !== 'transferring') {
                const canvas = canvasRef.current;
                if (canvas && mousePos.current) {
                    const rect = canvas.getBoundingClientRect();
                    const screenX = mousePos.current.x - rect.left;
                    const screenY = mousePos.current.y - rect.top;
                    const logicalZoom = windowScaleFactor.current * 0.58;
                    const offsetX = (screenX - rect.width / 2) / logicalZoom;
                    const offsetY = (screenY - rect.height / 2) / logicalZoom;
                    updatePlayer(state, keys.current, eventHandler, inputVector.current, { x: offsetX, y: offsetY }, state.player, triggerDamageTaken, triggerDeath, triggerWallIncompetence);
                } else {
                    updatePlayer(state, keys.current, eventHandler, inputVector.current, undefined, state.player, triggerDamageTaken, triggerDeath, triggerWallIncompetence);
                }
            }
        }

        if (state.tutorial.isActive && state.tutorial.currentStep === TutorialStep.MOVEMENT) {
            ['keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].forEach(k => {
                if (keys.current[k]) state.tutorial.pressedKeys.add(k);
            });
            if (Math.abs(inputVector.current.x) > 0.1 || Math.abs(inputVector.current.y) > 0.1) {
                state.tutorial.hasMoved = true;
            }
        }

        if (state.spawnTimer > (GAME_CONFIG.PLAYER.SPAWN_DURATION * 0.9) && !state.hasPlayedSpawnSound) {
            playSfx('spawn');
            state.hasPlayedSpawnSound = true;
        }

        // Camera Follow (for local player)
        // Follow the local player from the players map (or fallback to state.player for single-player)
        const localPlayer = (state.players && state.players[state.multiplayer.myId]) || state.player;
        state.camera.x = localPlayer.x;
        state.camera.y = localPlayer.y;

        // --- AREA EFFECTS UPDATE LOOP ---
        for (let i = state.areaEffects.length - 1; i >= 0; i--) {
            const effect = state.areaEffects[i];
            effect.duration -= step;

            if (effect.type === 'puddle') {
                if (Math.random() < 0.05) spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.5, effect.y + (Math.random() - 0.5) * effect.radius * 1.5, '#4ade80', 1, 2, 60, 'bubble');
                if (Math.random() < 0.02) spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.3, effect.y + (Math.random() - 0.5) * effect.radius * 1.3, '#10b981', 1, 4, 100, 'vapor');
            } else if (effect.type === 'epicenter') {
                if (Math.random() < 0.4) spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.2, effect.y + (Math.random() - 0.5) * effect.radius * 1.2, ['#ffffff', '#22d3ee', '#0ea5e9'], 1, 3, 30, 'spark');
            } else if (effect.type === 'orbital_strike') {
                // Start of the strike (Charging visual)
                if (Math.random() < 0.5) {
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius, effect.y + (Math.random() - 0.5) * effect.radius, '#06b6d4', 1, 2, 20, 'spark');
                }
            } else if (effect.type === 'blackhole') {
                // Blackhole visuals (Event Horizon)
                if (Math.random() < 0.3) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * effect.radius;
                    const px = effect.x + Math.cos(angle) * dist;
                    const py = effect.y + Math.sin(angle) * dist;
                    // Suck particles in
                    // We can't easily do suction with simple spawnParticles, so just spawn static void particles
                    spawnParticles(state, px, py, '#8b5cf6', 1, 2, 40, 'void');
                }
            }

            if (effect.type === 'glitch_cloud') {
                const range = effect.radius;
                const players = state.players ? Object.values(state.players) : [state.player].filter(p => !!p);
                players.forEach(p => {
                    const dist = Math.hypot(p.x - effect.x, p.y - effect.y);
                    if (dist < range + p.size) {
                        p.invertedControlsUntil = state.gameTime + 0.5; // Short duration that refreshes
                    }
                });
            }

            if (effect.type === 'puddle') {
                const range = effect.radius;
                state.enemies.forEach(e => {
                    if (e.dead || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                    const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                    if (dist < range + e.size) {
                        const slowAmt = effect.level >= 4 ? 0.40 : 0.20;
                        e.slowFactor = Math.max(e.slowFactor || 0, slowAmt);
                        const dmgAmp = effect.level >= 4 ? 1.4 : 1.2;
                        e.takenDamageMultiplier = Math.max(e.takenDamageMultiplier || 1.0, dmgAmp);

                        if (effect.level >= 1) {
                            const dotDmg = (e.maxHp * 0.05) * step;
                            e.hp -= dotDmg;
                            state.player.damageDealt += dotDmg;
                            if (e.hp <= 0) e.hp = 0;
                        }
                    }
                });
            } else if (effect.type === 'epicenter') {
                const range = 500;
                effect.pulseTimer = (effect.pulseTimer || 0) + step;
                if (effect.pulseTimer >= 1.0) {
                    effect.pulseTimer = 0;
                    const pDmg = calcStat(state.player.dmg);
                    const dmg = pDmg * (effect.level >= 4 ? 0.35 : 0.25);
                    state.enemies.forEach(e => {
                        if (e.dead || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                        if (Math.hypot(e.x - effect.x, e.y - effect.y) < range) {
                            e.hp -= dmg;
                            state.player.damageDealt += dmg;
                            spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#0ea5e9', false);
                        }
                    });
                    playSfx('ice-loop');
                }
            } else if (effect.type === 'blackhole') {
                // Continuous High Damage to Elites/Bosses, Instant Kill (or massive dmg) to minions at center?
                // Description: "Instantly consumes normal enemies at core, while Elites take 25% and Bosses take 10% Max HP per second."
                const range = effect.radius;
                // Pulse every 0.2s for damage? Or every frame?
                // Let's do per frame scaled by step.
                // Damage per second factors
                const eliteDps = 0.25; // 25% MaxHP/sec
                const bossDps = 0.10;  // 10% MaxHP/sec
                const minionCoreRadius = 80; // Center kill zone

                const damagedWorms = new Set<string>();

                state.enemies.forEach(e => {
                    if (e.dead || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                    // Elliptical collision to match visual perspective (0.6 squashed Y)
                    // User Request: "consume radius exact same as void radius"
                    const dx = e.x - effect.x;
                    const dy = (e.y - effect.y) / 0.6;
                    const dist = Math.hypot(dx, dy);

                    if (dist < range) {
                        // Pull Effect (Reverse Knockback)
                        // Use configured pull strength (Default 5% of 1000px/s reference = 50px/s)
                        const blackholeClass = PLAYER_CLASSES.find(c => c.id === 'eventhorizon');
                        const pullPct = blackholeClass?.capabilityMetrics.find(m => m.label === 'Pull Strength')?.value || 5;
                        const pullSpeed = 1000 * (pullPct / 100);
                        const pullStrength = pullSpeed * step;

                        const angle = Math.atan2(effect.y - e.y, effect.x - e.x);
                        e.x += Math.cos(angle) * pullStrength;
                        e.y += Math.sin(angle) * pullStrength;

                        // Damage Logic
                        if (e.boss) {
                            const dmg = (e.maxHp * bossDps) * step;
                            e.hp -= dmg;
                            state.player.damageDealt += dmg;
                            if (state.frameCount % 30 === 0) spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#8b5cf6', false);
                            if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, eventHandler);
                        } else if (e.isElite || e.isRare) {
                            const dmg = (e.maxHp * eliteDps) * step;
                            e.hp -= dmg;
                            state.player.damageDealt += dmg;
                            if (state.frameCount % 30 === 0) spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#8b5cf6', false);
                            if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, eventHandler);
                        } else {
                            // Normal Enemies & Worm Segments
                            if (dist < minionCoreRadius) {
                                // Instantly consume
                                e.hp = 0;
                                state.player.damageDealt += e.maxHp;
                                spawnParticles(state, e.x, e.y, '#8b5cf6', 5, 2, 30, 'void');
                                // Trigger immediate death
                                handleEnemyDeath(state, e, eventHandler);
                            } else if (e.shape !== 'worm') {
                                // Drag damage (Skip for Worms to prevent periodic damage numbers/drain)
                                const dmg = (e.maxHp * 0.5) * step; // 50% HP/sec drag dmg
                                e.hp -= dmg;
                                if (e.hp <= 0 && !e.dead) handleEnemyDeath(state, e, eventHandler);
                            }
                        }
                    }
                });
            }

            if (effect.duration <= 0) {
                if (effect.type === 'orbital_strike') {
                    // Trigger Massive Damage on Expiry
                    const range = effect.radius;
                    const pDmg = calcStat(state.player.dmg, state.dmgAtkBuffMult);
                    const dmg = pDmg * 1.5; // 150% Damage

                    state.enemies.forEach(e => {
                        if (e.dead || e.wormBurrowState === 'underground' || (e.wormPromotionTimer && e.wormPromotionTimer > state.gameTime)) return;
                        const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                        if (dist < range) {
                            e.hp -= dmg;
                            state.player.damageDealt += dmg;
                            spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#06b6d4', true); // Crit color? Or Theme color
                            spawnParticles(state, e.x, e.y, '#06b6d4', 5);
                        }
                    });

                    // Visual Explosion
                    spawnParticles(state, effect.x, effect.y, '#06b6d4', 30, 2, 20, 'spark');

                    // Spawn Persistent Crater Effect
                    state.areaEffects.push({
                        id: Date.now() + Math.random(),
                        type: 'crater',
                        x: effect.x,
                        y: effect.y,
                        radius: effect.radius,
                        duration: 5.0,
                        creationTime: state.gameTime,
                        level: effect.level
                    });

                    playSfx('laser');
                }

                if (effect.type === 'epicenter') state.player.immobilized = false;
                state.areaEffects.splice(i, 1);
            }
        }

        updateLoot(state);

        // Projectiles update for everyone (Host handles damage, Client handles just movement)
        updateProjectiles(state, eventHandler, triggerDeath);

        // Common Updates (Particles, Timers - run on both for smoothness, or Host only? 
        // Particles should probably run on both for visuals, but we rely on Host for important state)
        // For MVP: Run on both
        updateBlueprints(state, step);
        updateIncubator(state, step);
        updateParticles(state);
        if (state.critShake > 0) state.critShake *= 0.85;
        if (state.timeInArena) {
            state.timeInArena[state.currentArena] = (state.timeInArena[state.currentArena] || 0) + step;
        }
        state.gameTime += step;
        state.frameCount++;

        // Portal Logic
        if (isHost) {
            if (state.portalState !== 'transferring') {
                if (state.portalState === 'warn') {
                    state.portalTimer -= step;
                    if (state.portalTimer <= 0) {
                        state.portalState = 'open';
                        state.portalTimer = state.portalOpenDuration;
                        startPortalAmbience();
                        playSfx('spawn');
                    }
                } else if (state.portalState === 'open') {
                    // Only close automatically if NOT a one-time use portal (e.g. Evacuation)
                    if (!state.portalOneTimeUse) {
                        state.portalTimer -= step;
                        if (state.portalTimer <= 0) {
                            state.portalState = 'closed';
                            state.portalTimer = 0;
                            stopPortalAmbience();
                        }
                    }

                    if (state.portalState === 'open') {
                        const activePortals = PORTALS.filter(p => p.from === state.currentArena);
                        const currentArenaCenter = ARENA_CENTERS.find(c => c.id === state.currentArena) || ARENA_CENTERS[0];
                        for (const p of activePortals) {
                            const wall = getHexWallLine(currentArenaCenter.x, currentArenaCenter.y, ARENA_RADIUS, p.wall);
                            const num = Math.abs((wall.y2 - wall.y1) * state.player.x - (wall.x2 - wall.x1) * state.player.y + wall.x2 * wall.y1 - wall.y2 * wall.x1);
                            const den = Math.hypot(wall.y2 - wall.y1, wall.x2 - wall.x1);
                            const dist = num / den;
                            const wcx = (wall.x1 + wall.x2) / 2;
                            const wcy = (wall.y1 + wall.y2) / 2;
                            const distToCenter = Math.hypot(state.player.x - wcx, state.player.y - wcy);
                            const wallLen = den;
                            if (dist < 100 && distToCenter < wallLen / 2 + 50) {
                                state.portalState = 'transferring';
                                state.transferTimer = 2.0;
                                state.nextArenaId = p.to;
                                state.portalsUsed++;
                                state.enemies = [];
                                state.bullets = [];
                                state.enemyBullets = [];
                                state.spatialGrid.clear();
                                playSfx('rare-despawn');
                                stopPortalAmbience();
                                fadeOutMusic(0.1);
                                break;
                            }
                        }
                    }
                }
            } else {
                state.transferTimer -= step;
                if (state.transferTimer <= 0 && state.nextArenaId !== null) {
                    const oldArena = state.currentArena;
                    const newArena = state.nextArenaId;
                    const destCenter = ARENA_CENTERS.find(c => c.id === newArena) || ARENA_CENTERS[0];
                    const reversePortal = PORTALS.find(p => p.from === newArena && p.to === oldArena);
                    if (reversePortal) {
                        const wall = getHexWallLine(destCenter.x, destCenter.y, ARENA_RADIUS, reversePortal.wall);
                        const wcx = (wall.x1 + wall.x2) / 2;
                        const wcy = (wall.y1 + wall.y2) / 2;
                        state.player.x = wcx - wall.nx * 300;
                        state.player.y = wcy - wall.ny * 300;
                        state.player.knockback = { x: -wall.nx * 80, y: -wall.ny * 80 };
                    } else {
                        state.player.x = destCenter.x;
                        state.player.y = destCenter.y;
                    }

                    state.currentArena = newArena;
                    state.nextArenaId = null;
                    state.enemies = [];
                    state.bullets = [];
                    state.drones.forEach(d => { d.x = state.player.x; d.y = state.player.y; });
                    state.portalState = 'closed';
                    state.portalTimer = 0;

                    // Relocate and Spawn Turrets for the new arena (User Request: "Spawn in arena player joined")
                    relocateTurretsToArena(state, newArena);

                    if (['active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
                        switchBGM('evacuation', 1.0);
                    } else if (!['requested', 'waiting'].includes(state.extractionStatus)) {
                        switchBGM(newArena, 7.0);
                    }
                    playSfx('spawn');
                }
            }
        }

        // Clean up dead enemies (Host only)
        if (isHost) {
            state.enemies = state.enemies.filter(e => !e.dead);
        }

        // Drones (Update for all players? Or just local? Currently drones are on 'state.drones' which implies local player drones)
        // If we want multiplayer drones, they should be attached to Player object. 
        // For now, let's just update local drones for visual
        const { player } = state;
        state.drones.forEach((d, i) => {
            d.a += 0.05;
            d.x = player.x + Math.cos(d.a + (i * 2)) * 60;
            d.y = player.y + Math.sin(d.a + (i * 2)) * 60;
            if (Date.now() - d.last > 800) {
                const droneDmgMult = player.droneCount > 3 ? Math.pow(2, player.droneCount - 3) : 1;
                spawnBullet(state, player, d.x, d.y, player.targetAngle, calcStat(player.dmg, state.dmgAtkBuffMult) * droneDmgMult, player.pierce);
                d.last = Date.now();
            }
        });

        // Level Up / Boss Spawn Logic (Host Only checks, but UI triggers for everyone? 
        // Level up should be synchronized or individual. 
        // For shared XP, Host tracks XP, triggers level up, sends choice event?
        // For MVP, allow local triggers if state.pendingLevelUps > 0 (synced from host)

        if (state.levelUpTimer > 0) {
            state.levelUpTimer -= step;
            if (state.levelUpTimer <= 0 && state.pendingLevelUps > 0) {
                const choices = spawnUpgrades(state, false);
                setUpgradeChoices(choices);
                state.isPaused = true;
                state.pendingLevelUps--;
                playSfx('level');
                if (state.tutorial.isActive) state.tutorial.stepTimer = 0;
            }
        } else if (state.pendingLevelUps > 0 && !state.isPaused) {
            const choices = spawnUpgrades(state, false);
            setUpgradeChoices(choices);
            state.isPaused = true;
            state.pendingLevelUps--;
            playSfx('level');
        } else {
            if (state.bossKillTimer > 0) {
                state.bossKillTimer -= step;
                if (state.bossKillTimer <= 0 && state.pendingBossKills > 0) {
                    state.legendaryOptions = getLegendaryOptions(state);
                    setShowLegendarySelection(true);
                    state.showLegendarySelection = true;
                    state.isPaused = true;
                    state.pendingBossKills--;
                    playSfx('rare-spawn');
                }
            } else if (state.pendingBossKills > 0 && !state.isPaused) {
                state.legendaryOptions = getLegendaryOptions(state);
                setShowLegendarySelection(true);
                state.showLegendarySelection = true;
                state.isPaused = true;
                state.pendingBossKills--;
                playSfx('rare-spawn');
            }
        }

        const timeLeft = state.nextBossSpawnTime - state.gameTime;
        if (timeLeft <= 10 && timeLeft > 0) {
            const displayTime = Math.ceil(timeLeft);
            if (bossWarning !== displayTime) setBossWarning(displayTime);
        } else {
            if (bossWarning !== null) setBossWarning(null);
        }

        const activeBoss = state.enemies.some(e => e.boss);
        const targetPresence = activeBoss ? 1.0 : 0.0;
        state.bossPresence = state.bossPresence + (targetPresence - state.bossPresence) * 0.02;

        if (activeBoss) startBossAmbience();
        else stopBossAmbience();
    }, [bossWarning, keys, inputVector, setUpgradeChoices, setShowLegendarySelection, setGameOver, setBossWarning, canvasRef, mousePos, windowScaleFactor]);

    return { updateLogic };
}
