import { useCallback } from 'react';
import { GameState, UpgradeChoice, LegendaryHex, PlayerClass, TutorialStep } from '../logic/core/types';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { updatePlayer } from '../logic/player/PlayerLogic';
import { updateEnemies } from '../logic/enemies/EnemyLogic';
import { updateDirector } from '../logic/enemies/DirectorLogic';
import { updateExtraction } from '../logic/mission/ExtractionLogic';
import { updateBlueprints, isBuffActive } from '../logic/upgrades/BlueprintLogic';
import { updateProjectiles } from '../logic/combat/ProjectileLogic';
import { updateLoot } from '../logic/mission/LootLogic';
import { updateParticles, spawnParticles, spawnFloatingNumber } from '../logic/effects/ParticleLogic';
import { spawnUpgrades, spawnSnitchUpgrades } from '../logic/upgrades/UpgradeLogic';
import { getLegendaryOptions } from '../logic/upgrades/LegendaryLogic';
import { playSfx, startBossAmbience, stopBossAmbience, startPortalAmbience, stopPortalAmbience, switchBGM, fadeOutMusic } from '../logic/audio/AudioLogic';
import { ARENA_CENTERS, ARENA_RADIUS, PORTALS, getHexWallLine } from '../logic/mission/MapLogic';
import { calcStat } from '../logic/utils/MathUtils';
import { getChassisResonance } from '../logic/upgrades/EfficiencyLogic';
import { spawnBullet } from '../logic/combat/ProjectileSpawning';
import { updateTutorial } from '../logic/core/TutorialLogic';

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
    bossWarning
}: UseGameLogicProps) {
    const updateLogic = useCallback((state: GameState, step: number) => {
        const eventHandler = (event: string, _data?: any) => {
            if (event === 'level_up') {
                state.pendingLevelUps++;
                // If not already waiting, start timer
                if (state.levelUpTimer <= 0) state.levelUpTimer = 1.0;
            }
            if (event === 'boss_kill') {
                state.pendingBossKills++;
                state.bossKills = (state.bossKills || 0) + 1;
                // If not already waiting, start timer
                if (state.bossKillTimer <= 0) state.bossKillTimer = 1.0;
            }
            if (event === 'snitch_kill') {
                const choices = spawnSnitchUpgrades(state);
                setUpgradeChoices(choices);
                state.isPaused = true; // Force immediate pause
                playSfx('level');
            }
            if (event === 'game_over') {
                state.isPaused = true;
                setGameOver(true);
                import('../logic/audio/AudioLogic').then(mod => mod.stopAllLoops());
            }
        };
        state.legionLeads = state.legionLeads || {};

        if (state.extractionStatus !== 'departing' && state.portalState !== 'transferring') {
            const canvas = canvasRef.current;
            if (canvas && mousePos.current) {
                const rect = canvas.getBoundingClientRect();
                const screenX = mousePos.current.x - rect.left;
                const screenY = mousePos.current.y - rect.top;

                // 1 world unit = (windowScaleFactor * 0.58) logical pixels
                const logicalZoom = windowScaleFactor.current * 0.58;

                const offsetX = (screenX - rect.width / 2) / logicalZoom;
                const offsetY = (screenY - rect.height / 2) / logicalZoom;

                updatePlayer(state, keys.current, eventHandler, inputVector.current, { x: offsetX, y: offsetY });
            } else {
                updatePlayer(state, keys.current, eventHandler, inputVector.current);
            }

            // Tutorial Input Tracking
            if (state.tutorial.isActive && state.tutorial.currentStep === TutorialStep.MOVEMENT) {
                // Check WASD/Arrows
                ['keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].forEach(k => {
                    if (keys.current[k]) state.tutorial.pressedKeys.add(k);
                });

                // Check Joystick
                if (Math.abs(inputVector.current.x) > 0.1 || Math.abs(inputVector.current.y) > 0.1) {
                    state.tutorial.hasMoved = true;
                }
            }
        }

        if (state.spawnTimer > (GAME_CONFIG.PLAYER.SPAWN_DURATION * 0.9) && !state.hasPlayedSpawnSound) {
            playSfx('spawn');
            state.hasPlayedSpawnSound = true;
        }

        state.camera.x = state.player.x;
        state.camera.y = state.player.y;

        if (state.extractionStatus !== 'departing') {
            updateEnemies(state, eventHandler, step);
            updateDirector(state, step);
            updateTutorial(state, step);
        }
        updateExtraction(state, step);

        // --- ACTIVE SKILL & AREA EFFECT LOGIC (Processed BEFORE Projectiles to apply Debuffs) ---

        // Cooldowns
        state.player.activeSkills.forEach(s => {
            if (s.cooldown > 0) s.cooldown -= step;
        });

        // Blueprint System Update
        updateBlueprints(state, step);

        // Reset frame-based buffs
        if (state.player.buffs) {
            state.player.buffs.puddleRegen = false;
            if (state.player.buffs.epicenterShield && state.player.buffs.epicenterShield > 0) {
                state.player.buffs.epicenterShield -= step;
                if (state.player.buffs.epicenterShield < 0) state.player.buffs.epicenterShield = 0;
            }
        }

        // Area Effects
        for (let i = state.areaEffects.length - 1; i >= 0; i--) {
            const effect = state.areaEffects[i];
            effect.duration -= step;

            if (effect.type === 'puddle') {
                if (Math.random() < 0.05) {
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.5, effect.y + (Math.random() - 0.5) * effect.radius * 1.5, '#4ade80', 1, 2, 60, 'bubble');
                }
                if (Math.random() < 0.02) {
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.3, effect.y + (Math.random() - 0.5) * effect.radius * 1.3, '#10b981', 1, 4, 100, 'vapor');
                }
            } else if (effect.type === 'epicenter') {
                if (Math.random() < 0.4) {
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.2, effect.y + (Math.random() - 0.5) * effect.radius * 1.2, ['#ffffff', '#22d3ee', '#0ea5e9'], 1, 3, 30, 'spark');
                }
                if (Math.random() < 0.2) {
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.3, effect.y + (Math.random() - 0.5) * effect.radius * 1.3, ['#e0f2fe', '#ffffff'], 1, 5, 120, 'vapor');
                }
                if (Math.random() < 0.05) {
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius, effect.y + (Math.random() - 0.5) * effect.radius, '#bae6fd', 1, 2, 40, 'spark');
                }
            }

            if (effect.type === 'puddle') {
                const range = effect.radius;
                const dToPlayer = Math.hypot(effect.x - state.player.x, effect.y - state.player.y);
                if (dToPlayer < range && effect.level >= 3) {
                    state.player.buffs = state.player.buffs || {};
                    state.player.buffs.puddleRegen = true;
                }

                state.enemies.forEach(e => {
                    if (e.dead) return;
                    const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                    if (dist < range + e.size) {
                        const slowAmt = effect.level >= 4 ? 0.30 : 0.20;
                        e.slowFactor = Math.max(e.slowFactor || 0, slowAmt);
                        const dmgAmp = effect.level >= 4 ? 1.3 : 1.2;
                        e.takenDamageMultiplier = Math.max(e.takenDamageMultiplier || 1.0, dmgAmp);

                        if (effect.level >= 2) {
                            const dotDmg = (e.maxHp * 0.05) * step;
                            let appliedDmg = dotDmg;
                            if (e.legionId) {
                                const lead = state.legionLeads?.[e.legionId];
                                if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                                    const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                                    lead.legionShield = (lead.legionShield || 0) - shieldHit;
                                    appliedDmg -= shieldHit;
                                    if (Math.random() < 0.1) spawnParticles(state, e.x, e.y, '#60a5fa', 1);
                                }
                            }

                            if (appliedDmg > 0) {
                                e.hp -= appliedDmg;
                                state.player.damageDealt += appliedDmg;
                                if (e.hp <= 0) e.hp = 0;
                            }

                            if (Math.floor(state.gameTime * 2) > Math.floor((state.gameTime - step) * 2)) {
                                const tickVal = Math.ceil(e.maxHp * 0.05 * 0.5);
                                spawnFloatingNumber(state, e.x, e.y, tickVal.toString(), '#4ade80', false);
                            }
                        }
                    }
                });
            } else if (effect.type === 'epicenter') {
                const range = 500;
                const pulseInterval = 0.5;
                effect.pulseTimer = (effect.pulseTimer || 0) + step;

                const slowAmt = effect.level >= 4 ? 0.80 : 0.70;
                state.enemies.forEach(e => {
                    if (e.dead) return;
                    const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                    if (dist < range) {
                        e.slowFactor = Math.max(e.slowFactor || 0, slowAmt);
                    }
                });

                if (isBuffActive(state, 'STASIS_FIELD')) {
                    const nearbyEnemies = state.spatialGrid.query(effect.x, effect.y, effect.radius);
                    nearbyEnemies.forEach(e => {
                        if (!e.dead) e.slowFactor = Math.max(e.slowFactor || 0, 0.5);
                    });
                }

                if (effect.pulseTimer >= pulseInterval) {
                    effect.pulseTimer = 0;
                    const dmgPct = effect.level >= 4 ? 0.35 : 0.25;
                    const pDmg = calcStat(state.player.dmg);
                    const dmg = pDmg * dmgPct;

                    state.enemies.forEach(e => {
                        if (e.dead) return;
                        const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                        if (dist < range) {
                            let appliedDmg = dmg;
                            if (e.legionId) {
                                const lead = state.legionLeads?.[e.legionId];
                                if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                                    const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                                    lead.legionShield = (lead.legionShield || 0) - shieldHit;
                                    appliedDmg -= shieldHit;
                                    spawnParticles(state, e.x, e.y, '#60a5fa', 2);
                                }
                            }

                            if (appliedDmg > 0) {
                                e.hp -= appliedDmg;
                                state.player.damageDealt += appliedDmg;
                            }

                            if (Math.random() < 0.5) {
                                spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#0ea5e9', false);
                            }

                            if (Math.random() < 0.1) {
                                const particleColor = Math.random() > 0.5 ? '#ef4444' : '#f97316';
                                spawnParticles(state, e.x, e.y, particleColor, 2, 2, 20, 'spark');
                            }
                        }
                    });
                    playSfx('ice-loop');
                }
            } else if (effect.type === 'glitch_cloud') {
                const distToPlayer = Math.hypot(state.player.x - effect.x, state.player.y - effect.y);
                if (distToPlayer < effect.radius) {
                    state.player.invertedControlsUntil = state.gameTime + 0.5;
                    if (Math.random() < 0.2) {
                        spawnParticles(state, state.player.x, state.player.y, ['#ff00ff', '#00ffff'], 1, 5, 30, 'spark');
                    }
                }
            } else if (effect.type === 'blackhole') {
                const pullRadius = 400;
                const consumptionRadius = 40;
                const resonance = getChassisResonance(state);
                const pullMult = 1 + resonance;
                const basePull = 20;
                const scaledPull = basePull * (1 + resonance * 4);

                state.enemies.forEach(e => {
                    if (e.dead) return;
                    const dist = Math.hypot(e.x - effect.x, e.y - effect.y);

                    if (dist < pullRadius) {
                        if (dist < consumptionRadius) {
                            if (e.boss || e.isElite) {
                                const dmgPct = e.isElite ? 0.25 : 0.10;
                                let appliedDmg = (e.maxHp * dmgPct) * step;
                                if (e.legionId) {
                                    const lead = state.legionLeads?.[e.legionId];
                                    if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                                        const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                                        lead.legionShield = (lead.legionShield || 0) - shieldHit;
                                        appliedDmg -= shieldHit;
                                    }
                                }
                                if (appliedDmg > 0) {
                                    e.hp -= appliedDmg;
                                    state.player.damageDealt += appliedDmg;
                                }
                            } else {
                                if (e.legionId) {
                                    const lead = state.legionLeads?.[e.legionId];
                                    if (lead && (lead.legionShield || 0) > 0) {
                                        const shieldCrush = 100 * step;
                                        lead.legionShield = Math.max(0, (lead.legionShield || 0) - shieldCrush);
                                        return;
                                    }
                                }
                                e.hp = 0;
                                return;
                            }
                        }

                        const ang = Math.atan2(effect.y - e.y, effect.x - e.x);
                        const forceFactor = 1 - (dist / pullRadius);
                        const currentPull = (basePull + (scaledPull - basePull) * forceFactor) * pullMult;
                        const radialPull = currentPull * step;
                        e.x += Math.cos(ang) * radialPull;
                        e.y += Math.sin(ang) * radialPull;

                        const tangentAng = ang + Math.PI / 2;
                        const orbitalPull = (30 * forceFactor) * step;
                        e.x += Math.cos(tangentAng) * orbitalPull;
                        e.y += Math.sin(tangentAng) * orbitalPull;
                    }
                });

                const bulletPull = 50;
                const bulletOrbitalForce = 30;
                state.enemyBullets.forEach(bullet => {
                    const distToCenter = Math.hypot(bullet.x - effect.x, bullet.y - effect.y);
                    if (distToCenter < pullRadius && distToCenter > 5) {
                        const ang = Math.atan2(effect.y - bullet.y, effect.x - bullet.x);
                        const forceMult = 1 - (distToCenter / pullRadius);
                        const radialPull = bulletPull * (forceMult + 0.5) * step;
                        bullet.x += Math.cos(ang) * radialPull;
                        bullet.y += Math.sin(ang) * radialPull;
                        const tangentAng = ang + Math.PI / 2;
                        const orbitalPull = bulletOrbitalForce * forceMult * step;
                        bullet.x += Math.cos(tangentAng) * orbitalPull;
                        bullet.y += Math.sin(tangentAng) * orbitalPull;
                    }
                });
            }

            if (effect.duration <= 0) {
                if (effect.type === 'orbital_strike') {
                    const range = effect.radius;
                    const pDmg = calcStat(state.player.dmg);
                    const resonance = getChassisResonance(state);
                    const damage = pDmg * 1.5 * (1 + resonance);

                    playSfx('laser');
                    spawnParticles(state, effect.x, effect.y, ['#bae6fd', '#38bdf8', '#0ea5e9'], 30, 3, 40, 'spark');

                    state.areaEffects.push({
                        id: Date.now() + Math.random(),
                        type: 'crater',
                        x: effect.x,
                        y: effect.y,
                        radius: range,
                        duration: 5.0,
                        creationTime: state.gameTime,
                        level: 1
                    });

                    state.enemies.forEach(e => {
                        if (e.dead) return;
                        const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                        if (dist < range) {
                            let appliedDmg = damage;
                            if (e.legionId) {
                                const lead = state.legionLeads?.[e.legionId];
                                if (lead && lead.legionReady && (lead.legionShield || 0) > 0) {
                                    const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                                    lead.legionShield = (lead.legionShield || 0) - shieldHit;
                                    appliedDmg -= shieldHit;
                                    spawnParticles(state, e.x, e.y, '#60a5fa', 10);
                                }
                            }
                            if (appliedDmg > 0) {
                                e.hp -= appliedDmg;
                                state.player.damageDealt += appliedDmg;
                            }
                            spawnFloatingNumber(state, e.x, e.y, Math.round(damage).toString(), '#38bdf8', true);
                            spawnParticles(state, e.x, e.y, '#ef4444', 5);
                        }
                    });
                }

                if (effect.type === 'epicenter') state.player.immobilized = false;
                state.areaEffects.splice(i, 1);
            }
        }

        updateProjectiles(state, eventHandler);
        updateLoot(state);

        // --- PORTAL LOGIC ---
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
                state.portalTimer -= step;
                if (state.portalTimer <= 0) {
                    state.portalState = 'closed';
                    state.portalTimer = 0;
                    stopPortalAmbience();
                } else {
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

                if (['active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
                    switchBGM('evacuation', 1.0);
                } else if (!['requested', 'waiting'].includes(state.extractionStatus)) {
                    switchBGM(newArena, 7.0);
                }
                playSfx('spawn');
            }
        }

        state.enemies = state.enemies.filter(e => !e.dead);
        const { player } = state;
        const atkScore = calcStat(player.atk, state.dmgAtkBuffMult);
        let shotsPerSec = 2.64 * Math.log(atkScore / 100) - 1.25;
        const fireDelaySec = 1 / shotsPerSec;
        player.shotAccumulator = (player.shotAccumulator || 0) + step;
        const phaseShifted = player.phaseShiftUntil && state.gameTime < player.phaseShiftUntil;

        if (player.shotAccumulator >= fireDelaySec && state.spawnTimer <= 0 && state.portalState !== 'transferring' && !phaseShifted
            && !['departing', 'complete'].includes(state.extractionStatus)) {
            const d = calcStat(player.dmg, state.dmgAtkBuffMult);
            let maxBursts = 5;
            while (player.shotAccumulator >= fireDelaySec && maxBursts > 0) {
                for (let i = 0; i < player.multi; i++) {
                    const offset = (i - (player.multi - 1) / 2) * 0.15;
                    spawnBullet(state, player.x, player.y, player.targetAngle, d, player.pierce, offset);
                }
                player.shotAccumulator -= fireDelaySec;
                maxBursts--;
            }
            player.lastShot = state.gameTime;
            playSfx('shoot');
        }

        state.drones.forEach((d, i) => {
            d.a += 0.05;
            d.x = player.x + Math.cos(d.a + (i * 2)) * 60;
            d.y = player.y + Math.sin(d.a + (i * 2)) * 60;
            if (Date.now() - d.last > 800) {
                const droneDmgMult = player.droneCount > 3 ? Math.pow(2, player.droneCount - 3) : 1;
                spawnBullet(state, d.x, d.y, player.targetAngle, calcStat(player.dmg, state.dmgAtkBuffMult) * droneDmgMult, player.pierce);
                d.last = Date.now();
            }
        });

        updateParticles(state);
        if (state.critShake > 0) state.critShake *= 0.85;
        if (state.timeInArena) {
            state.timeInArena[state.currentArena] = (state.timeInArena[state.currentArena] || 0) + step;
        }
        state.gameTime += step;
        state.frameCount++;

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
