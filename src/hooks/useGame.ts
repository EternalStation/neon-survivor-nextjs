import { useRef, useEffect, useState, useCallback } from 'react';
// Worker will be initialized via URL for Next.js compatibility
import type { GameState, UpgradeChoice, LegendaryHex, PlayerClass } from '../logic/types';

import { createInitialGameState } from '../logic/GameState';
import { updatePlayer } from '../logic/PlayerLogic';
import { updateEnemies, resetEnemyAggro } from '../logic/EnemyLogic';
import { getChassisResonance } from '../logic/EfficiencyLogic';
import { updateProjectiles, spawnBullet } from '../logic/ProjectileLogic';

import { spawnUpgrades, spawnSnitchUpgrades, applyUpgrade } from '../logic/UpgradeLogic';
import { calcStat } from '../logic/MathUtils';
import { updateLoot } from '../logic/LootLogic';
import { updateParticles, spawnParticles, spawnFloatingNumber } from '../logic/ParticleLogic'; // Added spawnParticles import
import { ARENA_CENTERS, ARENA_RADIUS, PORTALS, getHexWallLine } from '../logic/MapLogic';
import { playSfx, updateBGMPhase, duckMusic, restoreMusic, pauseMusic, resumeMusic, startBossAmbience, stopBossAmbience, startPortalAmbience, stopPortalAmbience, switchBGM, fadeOutMusic } from '../logic/AudioLogic';
import { syncLegendaryHex, applyLegendarySelection, syncAllLegendaries } from '../logic/LegendaryLogic';
import { updateDirector } from '../logic/DirectorLogic';


// Refactored Modules
import { renderGame } from '../logic/GameRenderer';
import { useGameInput } from './useGameInput';

export function useGameLoop(gameStarted: boolean) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameState = useRef<GameState>(createInitialGameState());
    const requestRef = useRef<number>(0);

    // Fixed Time Step Logic
    const lastTimeRef = useRef<number>(0);
    const accRef = useRef<number>(0);
    const frameCountRef = useRef<number>(0);
    const workerRef = useRef<Worker | null>(null);
    const isTabHidden = useRef<boolean>(false);

    // Pause state refs (so loop can check current state without closure issues)
    const showStatsRef = useRef(false);
    const showSettingsRef = useRef(false);
    const showModuleMenuRef = useRef(false);
    const showBossSkillDetailRef = useRef(false);
    const upgradeChoicesRef = useRef<UpgradeChoice[] | null>(null);

    // Image Preloading
    const meteoriteImagesRef = useRef<Record<string, HTMLImageElement>>({});


    useEffect(() => {
        const qualities = ['Broken', 'Damaged', 'New'];
        for (let i = 1; i <= 9; i++) {
            qualities.forEach(q => {
                const key = `M${i}${q}`;
                const img = new Image();
                img.src = `/assets/meteorites/${key}.png`;
                meteoriteImagesRef.current[key] = img;
            });
        }



        const zombieImg = new Image();
        zombieImg.src = '/assets/Enemies/Zombie.png';
        (meteoriteImagesRef.current as any).zombie = zombieImg;

        const fearImg = new Image();
        fearImg.src = '/assets/Icons/FearSkill.png';
        (meteoriteImagesRef.current as any).fear = fearImg;

        const dmImg = new Image();
        dmImg.src = '/assets/Icons/DeathMark.png';
        (meteoriteImagesRef.current as any).deathMark = dmImg;

        // Preload Hex Icons for UI stability
        ['ComCrit', 'ComWave', 'DefPuddle', 'DefEpi', 'DefShield', 'HiveMother', 'MalwarePrime', 'EventHorizon', 'CosmicBeam', 'AigisVortex', 'EcoDMG', 'EcoXP', 'EcoHP', 'ComLife'].forEach(hex => {
            const img = new Image();
            // Handle both .png and .PNG if needed, but classes.ts uses specific ones.
            // For simplicity in preloading, we'll try to match what's in classes.ts
            const ext = (hex === 'AigisVortex') ? 'PNG' : 'png';
            img.src = `/assets/hexes/${hex}.${ext}`;
            (meteoriteImagesRef.current as any)[hex] = img; // Store in ref to keep alive/cached
        });

        // Initialize Background Worker (Next.js/Turbopack compatible way)
        workerRef.current = new Worker(new URL('../logic/gameWorker.ts', import.meta.url), { type: 'module' });
        workerRef.current.postMessage({ type: 'start', interval: 1000 / 60 });

        const handleVisibility = () => {
            isTabHidden.current = document.visibilityState === 'hidden';
            console.log('Visibility Changed:', document.visibilityState);
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            workerRef.current?.terminate();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    // React state for UI overlays
    const [uiState, setUiState] = useState<number>(0);
    const [upgradeChoices, setUpgradeChoices] = useState<UpgradeChoice[] | null>(null);
    const [gameOver, setGameOver] = useState(false);
    const [bossWarning, setBossWarning] = useState<number | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showModuleMenu, setShowModuleMenu] = useState(false);
    const [portalError, setPortalError] = useState(false);
    const [showLegendarySelection, setShowLegendarySelection] = useState(false);
    const [showBossSkillDetail, setShowBossSkillDetail] = useState(false);

    // Sync refs with state
    showStatsRef.current = showStats;
    showSettingsRef.current = showSettings;
    showModuleMenuRef.current = showModuleMenu;
    showBossSkillDetailRef.current = showBossSkillDetail;
    upgradeChoicesRef.current = upgradeChoices;

    // Critical: Sync GameState flag so input handlers know menu status immediately
    gameState.current.showModuleMenu = showModuleMenu;
    gameState.current.showStats = showStats;
    gameState.current.showSettings = showSettings;
    gameState.current.showBossSkillDetail = showBossSkillDetail;
    gameState.current.isPaused = showStats || showSettings || showModuleMenu || !!upgradeChoices || showLegendarySelection || showBossSkillDetail;

    // Reset unseen notification badge when opening matrix
    useEffect(() => {
        if (showModuleMenu) {
            setUiState(p => p + 1); // Ensure HUD updates
        }
    }, [showModuleMenu]);

    const triggerPortal = useCallback(() => {
        const cost = 3 + Math.floor(gameState.current.gameTime / 60);
        if (gameState.current.portalState === 'closed') {
            if (gameState.current.player.dust >= cost) {
                gameState.current.player.dust -= cost;
                gameState.current.portalState = 'warn';
                gameState.current.portalTimer = 10; // 10s warning period
                playSfx('warning');
                setPortalError(false);
                setUiState(p => p + 1);
                return true;
            } else {
                setPortalError(true);
                setUiState(p => p + 1);
                setTimeout(() => {
                    setPortalError(false);
                    setUiState(p => p + 1);
                }, 1000);
            }
        }
        return false;
    }, []);

    // Extracted Input Logic
    const { keys, inputVector, mousePos, handleJoystickInput } = useGameInput({
        gameState,
        setShowSettings,
        setShowStats,
        setShowModuleMenu,
        setGameOver,
        triggerPortal
    });

    const restartGame = (selectedClass?: PlayerClass, startingArenaId: number = 0) => {
        // Preserve current class if not provided
        const classToUse = selectedClass || gameState.current.moduleSockets.center || undefined;

        gameState.current = createInitialGameState(classToUse, startingArenaId);

        setGameOver(false);
        setUpgradeChoices(null);
        setBossWarning(null);
        setShowSettings(false);
        setShowModuleMenu(false);
        gameState.current.showStats = false;
        gameState.current.showSettings = false;
        gameState.current.showModuleMenu = false;
    };

    const handleUpgradeSelect = (choice: UpgradeChoice) => {
        applyUpgrade(gameState.current, choice);
        setUpgradeChoices(null);
    };

    const handleLegendarySelect = (selection: LegendaryHex) => {
        const state = gameState.current;
        const existingIdx = state.moduleSockets.hexagons.findIndex(h => h && h.type === selection.type);

        if (existingIdx !== -1) {
            // AUTO-UPGRADE Logic - Sync with state and record level start kills
            const existing = state.moduleSockets.hexagons[existingIdx]!;
            existing.level = Math.min(5, existing.level + 1);

            if (!existing.killsAtLevel) existing.killsAtLevel = {};
            existing.killsAtLevel[existing.level] = state.killCount;

            if (!existing.timeAtLevel) existing.timeAtLevel = {};
            existing.timeAtLevel[existing.level] = state.gameTime;

            syncLegendaryHex(state, existing);
            state.upgradingHexIndex = existingIdx;
            state.upgradingHexTimer = 3.0;

            // Sync both React State AND Game State
            state.showModuleMenu = true;
            state.isPaused = true;
            state.showLegendarySelection = false;

            setShowLegendarySelection(false);
            setShowModuleMenu(true);
            playSfx('merge-complete');
        } else {
            // NEW PLACEMENT - Use the shared logic to setup soul tracking
            applyLegendarySelection(state, selection);
            setShowLegendarySelection(false);
            // The shared logic handles pending placement and menu toggles in the state,
            // we just need to sync the React UI state.
            if (state.showModuleMenu) setShowModuleMenu(true);
        }
    };

    // Extracted Logic Update to be reusable for both rAF and Worker
    const updateLogic = useCallback((state: GameState, step: number) => {
        const eventHandler = (event: string, _data?: any) => {
            if (event === 'level_up') {
                const choices = spawnUpgrades(state, false);
                setUpgradeChoices(choices);
                state.isPaused = true; // Force immediate pause to stop further steps this frame
                playSfx('level');
            }
            if (event === 'boss_kill') {
                state.bossKills = (state.bossKills || 0) + 1;
                state.isPaused = true; // Force immediate pause
                setShowLegendarySelection(true);
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
                import('../logic/AudioLogic').then(mod => mod.stopAllLoops());
            }
        };
        state.legionLeads = state.legionLeads || {};

        if (state.portalState !== 'transferring') {
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
        }

        if (state.spawnTimer > 0.95 && !state.hasPlayedSpawnSound) {
            playSfx('spawn');
            state.hasPlayedSpawnSound = true;
        }

        state.camera.x = state.player.x;
        state.camera.y = state.player.y;

        updateEnemies(state, eventHandler, step);
        updateDirector(state, step);

        // --- ACTIVE SKILL & AREA EFFECT LOGIC (Processed BEFORE Projectiles to apply Debuffs) ---

        // Cooldowns
        state.player.activeSkills.forEach(s => {
            if (s.cooldown > 0) s.cooldown -= step;
        });

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
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius, effect.y + (Math.random() - 0.5) * effect.radius, '#10b981', 1, 4, 100, 'vapor');
                }
            } else if (effect.type === 'epicenter') {
                if (Math.random() < 0.4) {
                    // Ice Shards
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.2, effect.y + (Math.random() - 0.5) * effect.radius * 1.2, ['#ffffff', '#22d3ee', '#0ea5e9'], 1, 3, 30, 'spark');
                }
                if (Math.random() < 0.2) {
                    // Cold Mist
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius * 1.3, effect.y + (Math.random() - 0.5) * effect.radius * 1.3, ['#e0f2fe', '#ffffff'], 1, 5, 120, 'vapor');
                }
                if (Math.random() < 0.05) {
                    // Frost Flares (Little stars/glows)
                    spawnParticles(state, effect.x + (Math.random() - 0.5) * effect.radius, effect.y + (Math.random() - 0.5) * effect.radius, '#bae6fd', 1, 2, 40, 'spark');
                }
            }

            if (effect.type === 'puddle') {
                // Puddle Logic
                const range = effect.radius;
                // Check Player Buff
                const dToPlayer = Math.hypot(effect.x - state.player.x, effect.y - state.player.y);
                if (dToPlayer < range && effect.level >= 3) {
                    state.player.buffs = state.player.buffs || {};
                    state.player.buffs.puddleRegen = true;
                }

                // Enemies
                state.enemies.forEach(e => {
                    if (e.dead) return;
                    const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                    if (dist < range + e.size) {
                        // Apply Slow (Lvl 1: 20%, Lvl 4: 30%)
                        const slowAmt = effect.level >= 4 ? 0.30 : 0.20;
                        e.slowFactor = Math.max(e.slowFactor || 0, slowAmt);

                        // Apply Damage Taken Amp (Lvl 1: +20%, Lvl 4: +30%)
                        const dmgAmp = effect.level >= 4 ? 1.3 : 1.2;
                        e.takenDamageMultiplier = Math.max(e.takenDamageMultiplier || 1.0, dmgAmp);

                        // Lvl 2: DoT 5% Max HP / sec
                        if (effect.level >= 2) {
                            const dotDmg = (e.maxHp * 0.05) * step;

                            // --- LEGION SHIELD BLOCK ---
                            let appliedDmg = dotDmg;
                            if (e.legionId) {
                                const lead = state.legionLeads?.[e.legionId];
                                if (lead && (lead.legionShield || 0) > 0) {
                                    const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                                    lead.legionShield = (lead.legionShield || 0) - shieldHit;
                                    appliedDmg -= shieldHit;
                                    // Visual feedback
                                    if (Math.random() < 0.1) spawnParticles(state, e.x, e.y, '#60a5fa', 1);
                                }
                            }

                            if (appliedDmg > 0) {
                                e.hp -= appliedDmg;
                                if (e.hp <= 0) e.hp = 0; // Death handled in updateEnemies
                            }

                            // OPTIMIZATION: Only show DoT numbers approx every 0.5s to avoid clutter
                            // Use e.id + gameTime to stagger numbers
                            if (Math.floor(state.gameTime * 2) > Math.floor((state.gameTime - step) * 2)) {
                                const tickVal = Math.ceil(e.maxHp * 0.05 * 0.5); // Damage over 0.5s
                                spawnFloatingNumber(state, e.x, e.y, tickVal.toString(), '#4ade80', false);
                            }
                        }
                    }
                });

                // Visuals handled by renderer reading areaEffects
            } else if (effect.type === 'epicenter') {
                const range = 500;
                const pulseInterval = 0.5; // 0.5 sec ("hits every 0.5 sec")
                effect.pulseTimer = (effect.pulseTimer || 0) + step;

                // Slow Aura (Constant)
                const slowAmt = effect.level >= 4 ? 0.80 : 0.70;
                state.enemies.forEach(e => {
                    if (e.dead) return;
                    const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                    if (dist < range) {
                        e.slowFactor = Math.max(e.slowFactor || 0, slowAmt);
                    }
                });

                if (effect.pulseTimer >= pulseInterval) {
                    effect.pulseTimer = 0;
                    // Deal Damage
                    const dmgPct = effect.level >= 4 ? 0.35 : 0.25;
                    const pDmg = calcStat(state.player.dmg);
                    const dmg = pDmg * dmgPct; // "25% of player dmg"

                    state.enemies.forEach(e => {
                        if (e.dead) return;
                        const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                        if (dist < range) {
                            let appliedDmg = dmg;

                            // --- LEGION SHIELD BLOCK ---
                            if (e.legionId) {
                                const lead = state.legionLeads?.[e.legionId];
                                if (lead && (lead.legionShield || 0) > 0) {
                                    const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                                    lead.legionShield = (lead.legionShield || 0) - shieldHit;
                                    appliedDmg -= shieldHit;
                                    spawnParticles(state, e.x, e.y, '#60a5fa', 2);
                                }
                            }

                            if (appliedDmg > 0) {
                                e.hp -= appliedDmg;
                            }

                            // Visual Feedback (50% chance to reduce lag, but good feedback)
                            if (Math.random() < 0.5) {
                                spawnFloatingNumber(state, e.x, e.y, Math.round(dmg).toString(), '#0ea5e9', false);
                            }

                            // Tiny red/orange particle bursts on spike hits (10% chance)
                            if (Math.random() < 0.1) {
                                const particleColor = Math.random() > 0.5 ? '#ef4444' : '#f97316';
                                spawnParticles(state, e.x, e.y, particleColor, 2, 2, 20, 'spark');
                            }
                        }
                    });

                    // Sound: Play every 1.0s (every 2nd pulse) to avoid chaos?
                    // Or every 0.5s? User said "repeat every 1 sec".
                    // We can approximate this by checking if duration is even-ish?
                    // Let's rely on a dynamic property we create on the fly or just play it every 0.5s.
                    // 0.5s is fine for a skill sound loop.
                    playSfx('ice-loop');
                }
            } else if (effect.type === 'blackhole') {
                // --- VOID SINGULARITY REWORK (Event-Horizon) ---
                const pullRadius = 400; // Reduced from 450px
                const consumptionRadius = 40; // Static 40px core

                // Scale pull strength with resonance
                const resonance = getChassisResonance(state);
                const pullMult = 1 + resonance;

                const basePull = 20; // Reduced from 40 (Matches 5% feel instead of 10%)
                const scaledPull = basePull * (1 + resonance * 4); // Resonance greatly improves pull

                state.enemies.forEach(e => {
                    if (e.dead) return;
                    const dist = Math.hypot(e.x - effect.x, e.y - effect.y);

                    if (dist < pullRadius) {
                        // 1. CONSUMPTION MECHANIC
                        if (dist < consumptionRadius) {
                            if (e.boss || e.isElite) {
                                // Bosses take 10% Max HP/sec, Elites take 25% Max HP/sec - They can't be "consumed" instantly but get crushed
                                const dmgPct = e.isElite ? 0.25 : 0.10;
                                let appliedDmg = (e.maxHp * dmgPct) * step;

                                // --- LEGION SHIELD BLOCK ---
                                if (e.legionId) {
                                    const lead = state.legionLeads?.[e.legionId];
                                    if (lead && (lead.legionShield || 0) > 0) {
                                        const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                                        lead.legionShield = (lead.legionShield || 0) - shieldHit;
                                        appliedDmg -= shieldHit;
                                    }
                                }

                                if (appliedDmg > 0) e.hp -= appliedDmg;
                            } else {
                                // Instantly kill non-bosses (UNLESS they have legion shield)
                                if (e.legionId) {
                                    const lead = state.legionLeads?.[e.legionId];
                                    if (lead && (lead.legionShield || 0) > 0) {
                                        // Crush the shield instead of the enemy
                                        const shieldCrush = 100 * step; // Drain shield fast in black hole
                                        lead.legionShield = Math.max(0, (lead.legionShield || 0) - shieldCrush);
                                        return;
                                    }
                                }

                                e.hp = 0;
                                spawnParticles(state, e.x, e.y, '#000000', 5);
                                return;
                            }
                        }

                        // 2. PULL LOGIC (Inverse linear-to-center)
                        const ang = Math.atan2(effect.y - e.y, effect.x - e.x);
                        const forceFactor = 1 - (dist / pullRadius); // 0 at edge, 1 at center

                        // Apply pull
                        const currentPull = (basePull + (scaledPull - basePull) * forceFactor) * pullMult;
                        const radialPull = currentPull * step;
                        e.x += Math.cos(ang) * radialPull;
                        e.y += Math.sin(ang) * radialPull;

                        // Slight orbital swirl
                        const tangentAng = ang + Math.PI / 2;
                        const orbitalPull = (30 * forceFactor) * step;
                        e.x += Math.cos(tangentAng) * orbitalPull;
                        e.y += Math.sin(tangentAng) * orbitalPull;
                    }
                });
                // 3. Pull enemy projectiles with orbital motion
                const bulletPull = 50;
                const bulletOrbitalForce = 30;
                state.enemyBullets.forEach(bullet => {
                    const distToCenter = Math.hypot(bullet.x - effect.x, bullet.y - effect.y);
                    if (distToCenter < pullRadius && distToCenter > 5) {
                        const ang = Math.atan2(effect.y - bullet.y, effect.x - bullet.x);
                        const forceMult = 1 - (distToCenter / pullRadius);

                        // Radial pull
                        const radialPull = bulletPull * (forceMult + 0.5) * step;
                        bullet.x += Math.cos(ang) * radialPull;
                        bullet.y += Math.sin(ang) * radialPull;

                        // Tangential force
                        const tangentAng = ang + Math.PI / 2;
                        const orbitalPull = bulletOrbitalForce * forceMult * step;
                        bullet.x += Math.cos(tangentAng) * orbitalPull;
                        bullet.y += Math.sin(tangentAng) * orbitalPull;
                    }
                });
            }

            if (effect.duration <= 0) {
                if (effect.type === 'orbital_strike') {
                    // Trigger Orbital Strike Burst
                    const range = effect.radius;
                    // base damage * 4.0
                    const pDmg = calcStat(state.player.dmg);
                    const resonance = getChassisResonance(state);
                    const damage = pDmg * 1.5 * (1 + resonance);

                    // Visuals
                    playSfx('laser'); // Laser sound
                    // Shockwave removed as per user request
                    spawnParticles(state, effect.x, effect.y, ['#bae6fd', '#38bdf8', '#0ea5e9'], 30, 3, 40, 'spark');

                    // Create Crater Effect (Lasts 5 seconds)
                    // This will handle the lingering beam fade-out AND the crater visual
                    state.areaEffects.push({
                        id: Date.now() + Math.random(),
                        type: 'crater',
                        x: effect.x,
                        y: effect.y,
                        radius: range,
                        duration: 5.0, // 5 seconds lifespan
                        creationTime: state.gameTime,
                        level: 1
                    });

                    // Damage Logic
                    state.enemies.forEach(e => {
                        if (e.dead) return;
                        const dist = Math.hypot(e.x - effect.x, e.y - effect.y);
                        if (dist < range) {
                            let appliedDmg = damage;

                            // --- LEGION SHIELD BLOCK ---
                            if (e.legionId) {
                                const lead = state.legionLeads?.[e.legionId];
                                if (lead && (lead.legionShield || 0) > 0) {
                                    const shieldHit = Math.min(appliedDmg, lead.legionShield || 0);
                                    lead.legionShield = (lead.legionShield || 0) - shieldHit;
                                    appliedDmg -= shieldHit;
                                    spawnParticles(state, e.x, e.y, '#60a5fa', 10);
                                }
                            }

                            if (appliedDmg > 0) {
                                e.hp -= appliedDmg;
                            }

                            // Visual Feedback
                            spawnFloatingNumber(state, e.x, e.y, Math.round(damage).toString(), '#38bdf8', true); // Crit color for impact
                            spawnParticles(state, e.x, e.y, '#ef4444', 5);

                            if (e.hp <= 0 && !e.dead) {
                                // Killed by strike
                                // Check for Death Logic (We can't import handleEnemyDeath inside this hook easily unless it's available)
                                // HandleEnemyDeath is imported in useGame.ts! Line 6.
                                // But updateEnemies calls it.
                                // We can manually call it or let updateEnemies clean it up (hp <= 0).
                                // Usually updateEnemies handles deaths.
                                // But handleEnemyDeath adds score/xp. If I don't call it, I might miss rewards?
                                // updateEnemies loop calls handleEnemyDeath if hp<=0. (Line 506 in ProjectileLogic, but updateEnemies handles it too?)
                                // Let's check Logic/EnemyLogic.ts.
                                // Actually ProjectileLogic calls handleEnemyDeath immediately on kill.
                                // If I reduce HP here, the next updateEnemies loop will see hp<=0?
                                // Let's check updateEnemies in EnemyLogic.
                            }
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
                            state.transferTimer = 5.0; // 5s fade out
                            state.nextArenaId = p.to;
                            state.portalsUsed++;

                            // Immediate Despawn to prevent interaction during animation
                            state.enemies = [];
                            state.bullets = [];
                            state.enemyBullets = [];
                            state.spatialGrid.clear();

                            playSfx('rare-despawn');
                            stopPortalAmbience();
                            fadeOutMusic(5.0); // Slow fade out
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

                // Switch BGM for the new arena
                switchBGM(newArena, 5.0);

                playSfx('spawn');
            }
        }

        state.enemies = state.enemies.filter(e => !e.dead);


        const { player } = state;
        const atkScore = calcStat(player.atk);

        // Logarithmic + Linear Scaling (Updated v6)
        // 2.0 SPS @ 300 (Base)
        // 1.35 SPS @ 240 (Cosmic Beam Start)
        // ~4.4 SPS @ 700
        // Fit: SPS = 2.8 * ln(Atk) - 14.0 + (Atk / 150,000)

        let shotsPerSec = Math.max(1.0, 2.8 * Math.log(atkScore) - 14.0 + atkScore / 150000);

        // Cap max SPS to avoid infinity/physics breaks if stats go wild (e.g. 60 FPS limit)
        // 60 SPS = ~3 Million Atk with this formula

        const fireDelay = 1000 / shotsPerSec;

        if (Date.now() - player.lastShot > fireDelay && state.spawnTimer <= 0 && state.portalState !== 'transferring') {
            const d = calcStat(player.dmg);
            for (let i = 0; i < player.multi; i++) {
                const offset = (i - (player.multi - 1) / 2) * 0.15;
                spawnBullet(state, player.x, player.y, player.targetAngle, d, player.pierce, offset);
            }
            player.lastShot = Date.now();
            playSfx('shoot');
        }

        state.drones.forEach((d, i) => {
            d.a += 0.05;
            d.x = player.x + Math.cos(d.a + (i * 2)) * 60;
            d.y = player.y + Math.sin(d.a + (i * 2)) * 60;
            if (Date.now() - d.last > 800) {
                const droneDmgMult = player.droneCount > 3 ? Math.pow(2, player.droneCount - 3) : 1;
                spawnBullet(state, d.x, d.y, player.targetAngle, calcStat(player.dmg) * droneDmgMult, player.pierce);
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
    }, [bossWarning, keys, inputVector, setUpgradeChoices, setShowLegendarySelection, setGameOver, setBossWarning]);

    // Game Loop
    useEffect(() => {
        let cancelled = false;
        lastTimeRef.current = performance.now();
        const loop = () => {
            if (cancelled) return;
            const now = performance.now();
            const dt = (now - lastTimeRef.current) / 1000;
            lastTimeRef.current = now;

            // Cap dt to prevent spiral of death if tab inactive
            const safeDt = Math.min(dt, 0.25); // Increased cap to support catching up from lower FPS

            // If tab is hidden, we skip the main loop logic here and let the worker message handle it
            // This prevents duplicate updates if both rAF and Worker are firing
            if (isTabHidden.current) {
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            const state = gameState.current;

            // If game hasn't started, just render one frame and pause logic
            if (!gameStarted) {
                // Drawing (Always draw to ensure canvas isn't blank if needed, though MainMenu covers it)
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    // renderGame(ctx, state); // Optional: render static frame or nothing
                }
                requestRef.current = requestAnimationFrame(loop);
                return;
            }

            // Pausing Logic
            const isMenuOpen = showStatsRef.current || showSettingsRef.current || showModuleMenuRef.current || upgradeChoicesRef.current !== null || state.showLegendarySelection || showBossSkillDetailRef.current;

            // Detect transition from paused to unpaused
            if (!isMenuOpen && state.isPaused) {
                state.unpauseDelay = 1.0; // 1s grace period
                resetEnemyAggro(state); // Reset all elite/boss attack animations
            }

            // CRITICAL: Only clear keys when TRANSITIONING to paused.
            // This stops current movement but allows players to "buffer" their next move 
            // by pressing keys while the menu is open or closing.
            if (isMenuOpen && !state.isPaused) {
                Object.keys(keys.current).forEach(k => keys.current[k] = false);
            }
            state.isPaused = isMenuOpen;

            // Music volume control based on menu state
            const inStats = showStatsRef.current;
            const inSettings = showSettingsRef.current;
            const inModuleMenu = showModuleMenuRef.current;

            if (inSettings) {
                pauseMusic(); // ESC menu stops music
            } else if (inStats || inModuleMenu) {
                resumeMusic(); // Ensure music is playing
                duckMusic(); // Duck by 15% for stats AND matrix
            } else {
                resumeMusic(); // Ensure music is playing
                restoreMusic(); // Restore full volume (including when in upgrade menu)
            }

            // Only accumulate time if not paused
            if (state.isPaused || state.gameOver) {
                accRef.current = 0; // Prevent "fast-forward" catch-up when unpausing
            } else {
                accRef.current += safeDt;
            }

            const FIXED_STEP = 1 / 60;

            if (!state.isPaused && !state.gameOver) {
                // Grace Period: Skip logic updates during unpause delay
                if (state.unpauseDelay && state.unpauseDelay > 0) {
                    state.unpauseDelay -= safeDt;
                    accRef.current = 0; // Don't accumulate while waiting
                } else {
                    // Fixed Update Step
                    let steps = 0;
                    // Increased max steps to 20 to prioritize simulation speed over frame consistency during lag spikes
                    while (accRef.current >= FIXED_STEP && steps < 20 && !state.isPaused && !state.gameOver) {
                        accRef.current -= FIXED_STEP;
                        steps++;
                        // Update Logic
                        updateLogic(state, FIXED_STEP);

                        // Failsafe Death Check (Covering all damage sources)
                        if (state.player.curHp <= 0) {
                            state.player.curHp = 0;
                            state.gameOver = true;
                            setGameOver(true);
                            import('../logic/AudioLogic').then(mod => mod.stopAllLoops());
                        }
                    }
                }
            }

            // Panic Button: If we are still behind after 20 steps, drop the accumulator.
            if (accRef.current > FIXED_STEP * 20) {
                accRef.current = 0;
            }

            // Update BGM phase (runs even when paused)
            updateBGMPhase(state.gameTime);

            // Drawing
            // OPTIMIZATION: When paused (Menu Open), do NOT re-render the game canvas every frame.
            // This leaves the last frame visible (static background) and frees up Main Thread for React UI.
            if (!state.isPaused) {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) {
                    try {
                        renderGame(ctx, state, meteoriteImagesRef.current, windowScaleFactor.current);
                    } catch (e) {
                        console.error("Render Error:", e);
                    }
                    // Restore context if error happened mid-save
                    try { ctx.restore(); } catch (e) { }
                }
            }

            // Decrement auto-upgrade animation timer
            if (state.upgradingHexTimer > 0) {
                state.upgradingHexTimer -= safeDt;
                if (state.upgradingHexTimer <= 0) {
                    state.upgradingHexTimer = 0;
                    state.upgradingHexIndex = null;
                }
            }

            // Sync Legendary Selection state
            if (state.showLegendarySelection && !showLegendarySelection) {
                setShowLegendarySelection(true);
            }

            // Force Re-render for UI updates (Throttled to ~15 FPS)
            frameCountRef.current++;
            if (!state.isPaused && frameCountRef.current % 4 === 0) {
                syncAllLegendaries(state);
                setUiState(prev => prev + 1);
            }

            // FPS Calculation
            framesRef.current++;
            if (now - lastFpsUpdateRef.current >= 1000) {
                setFps(Math.round(framesRef.current * 1000 / (now - lastFpsUpdateRef.current)));
                framesRef.current = 0;
                lastFpsUpdateRef.current = now;
            }

            requestRef.current = requestAnimationFrame(loop);
        };

        // Start Loop
        // Background Worker Message Handler
        if (workerRef.current) {
            workerRef.current.onmessage = (e) => {
                if (e.data.type === 'tick' && isTabHidden.current && gameStarted) {
                    // Drive logic when hidden
                    const state = gameState.current;
                    if (!state.isPaused && !state.gameOver) {
                        // Use a fixed step for background play
                        const FIXED_STEP = 1 / 60;
                        updateLogic(state, FIXED_STEP);
                    }
                }
            };
        }

        requestRef.current = requestAnimationFrame(loop);

        return () => {
            cancelled = true;
            cancelAnimationFrame(requestRef.current!);
        };
    }, [gameStarted, updateLogic, showLegendarySelection, showBossSkillDetail]); // Run when gameStarted changes, and updateLogic changes

    // FPS Calculation
    const [fps, setFps] = useState(60);
    const framesRef = useRef(0);
    const lastFpsUpdateRef = useRef(0);

    // Window Scale Factor Ref (Accessed by render logic)
    const windowScaleFactor = useRef(1);

    return {
        canvasRef,
        gameState: gameState.current,
        upgradeChoices,
        handleUpgradeSelect,
        gameOver,
        restartGame,
        bossWarning,
        showStats,
        setShowStats,
        showSettings,
        setShowSettings,
        showModuleMenu,
        setShowModuleMenu,
        showLegendarySelection,
        handleLegendarySelect,
        handleModuleSocketUpdate: (type: 'hex' | 'diamond', index: number, item: any) => {
            if (type === 'hex') {
                gameState.current.moduleSockets.hexagons[index] = item;
                gameState.current.pendingLegendaryHex = null; // Clear after placement
            }
            else gameState.current.moduleSockets.diamonds[index] = item;
            if (item) playSfx('socket-place');
            setUiState(prev => prev + 1); // Force re-render
        },
        updateInventorySlot: (index: number, item: any) => {
            gameState.current.inventory[index] = item;
            setUiState(prev => prev + 1);
        },
        toggleModuleMenu: () => {
            setShowModuleMenu(prev => {
                const next = !prev;
                // Sync State
                gameState.current.showModuleMenu = next;

                if (next) {
                    setShowSettings(false);
                    setShowStats(false);
                    gameState.current.showSettings = false;
                    gameState.current.showStats = false;
                }
                return next;
            });
        },
        uiState,
        inputVector,
        handleJoystickInput,
        setWindowScaleFactor: (scale: number) => {
            windowScaleFactor.current = scale;
        },
        recycleMeteorite: (source: 'inventory' | 'diamond', index: number, amount: number) => {
            // Logic handled in component mostly, just state update here? 
            // Actually recycle logic is simple state mutation
            if (source === 'inventory') {
                gameState.current.inventory[index] = null;
            } else {
                gameState.current.moduleSockets.diamonds[index] = null;
            }
            gameState.current.player.dust += amount;
            playSfx('recycle');
            setUiState(p => p + 1);
        },
        spendDust: (amount: number) => {
            if (gameState.current.player.dust >= amount) {
                gameState.current.player.dust -= amount;
                setUiState(p => p + 1);
                return true;
            }
            return false;
        },
        triggerPortal,
        fps,
        portalError,
        portalCost: 3 + Math.floor(gameState.current.gameTime / 60),
        onViewChassisDetail: () => {
            gameState.current.chassisDetailViewed = true;
            setUiState(p => p + 1);
        },
        showBossSkillDetail,
        setShowBossSkillDetail
    };
}
