import { useCallback } from 'react';
import { GameState, UpgradeChoice, PlayerClass, TutorialStep } from '../logic/core/Types';
import { PLAYER_CLASSES } from '../logic/core/Classes';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../logic/core/Constants';
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
import { getLegendaryOptions, getHexLevel, getHexMultiplier } from '../logic/upgrades/LegendaryLogic';
import { playSfx, startBossAmbience, stopBossAmbience, startPortalAmbience, stopPortalAmbience, switchBGM, fadeOutMusic } from '../logic/audio/AudioLogic';
import { ARENA_CENTERS, ARENA_RADIUS, PORTALS, getHexWallLine } from '../logic/mission/MapLogic';
import { calcStat } from '../logic/utils/MathUtils';
import { getChassisResonance } from '../logic/upgrades/EfficiencyLogic';
import { spawnBullet } from '../logic/combat/ProjectileSpawning';
import { spawnNanitesFromCloud } from '../logic/player/PlayerCombat';
import { updateTutorial } from '../logic/core/TutorialLogic';
import { updateTurrets, updateAllies, relocateTurretsToArena } from '../logic/mission/TurretLogic';

import { updateAreaEffects } from './UseAreaEffectLogic';
import { getKeybinds } from '../logic/utils/Keybinds';

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
    triggerIncubatorDestroyed: (met?: any) => void;
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
    triggerIncubatorDestroyed,
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
                state.snitchRewardActive = true;
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
            if (event === 'incubator_destroyed') {
                triggerIncubatorDestroyed(_data);
            }
        };
        state.legionLeads = state.legionLeads || {};

        const isHost = state.multiplayer.active ? state.multiplayer.isHost : true;

        if (state.isPaused) return;


        if (isHost) {

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


        if (state.players && Object.keys(state.players).length > 0) {
            Object.values(state.players).forEach(p => {
                const isLocal = p.id === state.multiplayer.myId;




                let pKeys = isLocal ? keys.current : (p.currentInput?.keys || {});
                let pVector = isLocal ? inputVector.current : (p.currentInput?.vector || { x: 0, y: 0 });
                let pMouse = isLocal ? mousePos.current : (p.currentInput?.mouse || { x: 0, y: 0 });








                if (isHost || isLocal) {
                    if (state.extractionStatus !== 'departing' && state.portalState !== 'transferring') {















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















                            processedMouseOffset = { x: 0, y: 0 };
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
            const movementOptions = ['keyw', 'keya', 'keys', 'keyd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
            const binds = getKeybinds();
            if (!binds.useDefaultMovement) {
                if (binds.moveUp) movementOptions.push(binds.moveUp.toLowerCase());
                if (binds.moveDown) movementOptions.push(binds.moveDown.toLowerCase());
                if (binds.moveLeft) movementOptions.push(binds.moveLeft.toLowerCase());
                if (binds.moveRight) movementOptions.push(binds.moveRight.toLowerCase());
            }

            movementOptions.forEach(k => {
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



        const localPlayer = (state.players && state.players[state.multiplayer.myId]) || state.player;
        state.camera.x = localPlayer.x;
        state.camera.y = localPlayer.y;


        if (state.player.playerClass === 'stormstrike') {
            const p = state.player;
            const maxCharge = GAME_CONFIG.SKILLS.STORM_CIRCLE_MAX_CHARGE;
            const cooldownEnd = p.stormCircleCooldownEnd ?? 0;
            const ct = p.stormCircleChargeTime ?? 0;

            if (state.gameTime >= cooldownEnd && ct < maxCharge) {
                p.stormCircleChargeTime = Math.min(maxCharge, ct + step);
            }
        }


        if (state.player.voidMarkerActive) {
            state.player.voidMarkerX = (state.player.voidMarkerX ?? state.player.x) + (state.player.voidMarkerVx ?? 0) * step;
            state.player.voidMarkerY = (state.player.voidMarkerY ?? state.player.y) + (state.player.voidMarkerVy ?? 0) * step;
            const markerAge = state.gameTime - (state.player.voidMarkerSpawnTime ?? 0);
            if (markerAge > 6) {
                state.player.voidMarkerActive = false;
            }
        }


        updateAreaEffects(state, step, eventHandler);

        updateLoot(state);


        updateProjectiles(state, eventHandler, triggerDeath);




        updateBlueprints(state, step);
        updateIncubator(state, step, eventHandler);
        updateParticles(state);
        if (state.critShake > 0) state.critShake *= 0.85;
        if (state.timeInArena) {
            state.timeInArena[state.currentArena] = (state.timeInArena[state.currentArena] || 0) + step;
        }
        state.gameTime += step;
        state.frameCount++;

        // Minute Marker Tracking (for damage per minute charts)
        if (Math.floor(state.gameTime / 60) > state.lastMinuteMark) {
            state.classSkillDamageHistory.push(state.currentMinuteClassSkillDamage || 0);
            state.currentMinuteClassSkillDamage = 0;
            state.lastMinuteMark = Math.floor(state.gameTime / 60);
        }


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


        if (isHost) {
            state.enemies = state.enemies.filter(e => !e.dead);
        }




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


        const isWarning = timeLeft <= 10 && timeLeft > 0;
        if (isWarning) startBossAmbience();
        else stopBossAmbience();
    }, [bossWarning, keys, inputVector, setUpgradeChoices, setShowLegendarySelection, setGameOver, setBossWarning, canvasRef, mousePos, windowScaleFactor, triggerIncubatorDestroyed]);

    return { updateLogic };
}
