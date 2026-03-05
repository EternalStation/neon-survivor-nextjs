import { useEffect, useRef } from 'react';
import type { GameState, MeteoriteRarity, MapPOI } from '../logic/core/types';
import { spawnEnemy, spawnRareEnemy } from '../logic/enemies/EnemyLogic';
import { createMeteorite } from '../logic/mission/LootLogic';
import { castSkill } from '../logic/player/SkillLogic';
import { triggerDash } from '../logic/player/PlayerMovement';
import { triggerHiveMotherCone } from '../logic/player/PlayerCombat';
import { getKeybinds } from '../logic/utils/Keybinds';
import { dropBlueprint, isBuffActive } from '../logic/upgrades/BlueprintLogic';
import { getCdMod, isOnCooldown } from '../logic/utils/CooldownUtils';
import { GAME_CONFIG } from '../logic/core/GameConfig';
import { spawnFloatingNumber } from '../logic/effects/ParticleLogic';
import { playSfx } from '../logic/audio/AudioLogic';
import { getChassisResonance } from '../logic/upgrades/EfficiencyLogic';
import { BlueprintType } from '../logic/core/types';

import { spawnVoidBurrower } from '../logic/enemies/WormLogic';
import { applyLegendarySelection, LEGENDARY_UPGRADES } from '../logic/upgrades/LegendaryLogic';

interface GameInputProps {
    gameState: React.MutableRefObject<GameState>;
    keys?: React.MutableRefObject<Record<string, boolean>>;
    setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
    setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
    setShowModuleMenu: React.Dispatch<React.SetStateAction<boolean>>;
    setShowAdminConsole?: React.Dispatch<React.SetStateAction<boolean>>;
    setShowCheatPanel?: React.Dispatch<React.SetStateAction<boolean>>;
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
    triggerPortal: () => boolean;
    refreshUI: () => void;
    skipTime: (min: number) => void;
    windowScaleFactor: React.MutableRefObject<number>;
}

export function useGameInput({ gameState, keys: providedKeys, setShowSettings, setShowStats, setShowModuleMenu, setShowAdminConsole, setShowCheatPanel, setGameOver, triggerPortal, refreshUI, skipTime, windowScaleFactor }: GameInputProps) {
    const localKeys = useRef<Record<string, boolean>>({});
    const keys = providedKeys || localKeys;
    const inputVector = useRef({ x: 0, y: 0 });
    const mousePos = useRef({
        x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0
    });
    const currentKeybinds = useRef(getKeybinds());

    useEffect(() => {
        const updateKeybinds = () => {
            currentKeybinds.current = getKeybinds();
        };
        window.addEventListener('keybindsChanged', updateKeybinds);
        return () => window.removeEventListener('keybindsChanged', updateKeybinds);
    }, []);

    useEffect(() => {
        let cheatBuffer = '';

        const handleDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = (e.key || '').toLowerCase();
            const code = (e.code || '').toLowerCase();



            // Get latest keybinds from ref
            const keybinds = currentKeybinds.current;

            if (key === 'escape' || code === 'escape') {
                if (gameState.current.showModuleMenu || gameState.current.showBossSkillDetail) {
                    return;
                }
                if (gameState.current.showStats) {
                    setShowStats(false);
                    return;
                }
                setShowSettings(prev => !prev);
                return;
            }

            // Block all other input during extraction dialogue
            if (['requested', 'waiting'].includes(gameState.current.extractionStatus)) {
                return;
            }

            if (gameState.current.showSettings || gameState.current.showFeedbackModal || gameState.current.showAdminConsole) return;

            // Handle Stats toggle
            if (code === (keybinds.stats || '').toLowerCase()) {
                setShowStats(prev => {
                    const next = !prev;
                    if (next) {
                        setShowSettings(false);
                        setShowModuleMenu(false);
                    }
                    return next;
                });
            }

            // Handle Matrix toggle
            if (code === (keybinds.matrix || '').toLowerCase()) {
                setShowModuleMenu(prev => !prev);
            }

            // Track movement keys - prioritize physical location (code)
            if (['keyw', 'keys', 'keya', 'keyd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(code)) {
                keys.current[code] = true;
            } else {
                // Support potential custom characters if needed, but movement is mostly fixed code
                keys.current[code] = true;
            }

            // Skill Input (1-6)
            const skillBindings = [
                keybinds.skill1, keybinds.skill2, keybinds.skill3,
                keybinds.skill4, keybinds.skill5, keybinds.skill6
            ];

            skillBindings.forEach((bind, index) => {
                const player = gameState.current.player;
                if ((bind || '').toLowerCase() === code && player.activeSkills[index]) {
                    if (!player.phaseShiftUntil || Date.now() > player.phaseShiftUntil) {
                        castSkill(gameState.current, index);
                    }
                }
            });

            // DASH TRIGGER
            if (code === (keybinds.dash || 'space').toLowerCase()) {
                if (!gameState.current.isPaused && !gameState.current.gameOver) {
                    triggerDash(gameState.current, keys.current, inputVector.current);
                }
                e.preventDefault();
            }

            // CLASS ABILITY TRIGGER
            if (code === (keybinds.classAbility || 'keye').toLowerCase()) {
                const state = gameState.current;
                const player = state.player;

                if (!state.isPaused && !state.gameOver && player.playerClass === 'stormstrike') {
                    const ct = Math.max(0, Math.min(GAME_CONFIG.SKILLS.STORM_CIRCLE_MAX_CHARGE, player.stormCircleChargeTime ?? 0));
                    if (ct > 0) {
                        const resonance = getChassisResonance(state);
                        const strikeRadius = 350 * (1 + resonance);
                        const laserAoe = 60 * (1 + resonance);
                        const laserCount = Math.max(4, Math.round(4 + Math.max(0, ct - 1) * 8 / 9));
                        const baseDmgMult = 0.1 + Math.max(0, ct - 1) * (1.4 / 9);
                        const dmgMult = baseDmgMult * (1 + resonance);
                        const lastLaserDelay = 0.15 + (laserCount - 1) * 0.15;

                        state.areaEffects.push({
                            id: Date.now() + Math.random(),
                            type: 'storm_zone',
                            x: player.x,
                            y: player.y,
                            radius: strikeRadius,
                            duration: lastLaserDelay + 0.3,
                            creationTime: state.gameTime,
                            level: 1
                        });

                        for (let i = 0; i < laserCount; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const dist = 50 + Math.random() * (strikeRadius - 50);
                            state.areaEffects.push({
                                id: Date.now() + Math.random(),
                                type: 'storm_laser',
                                x: player.x + Math.cos(angle) * dist,
                                y: player.y + Math.sin(angle) * dist,
                                radius: laserAoe,
                                duration: 0.15 + i * 0.15,
                                creationTime: state.gameTime,
                                level: 1,
                                casterId: 1,
                                dmgMult,
                                pulseTimer: 0.15 + i * 0.15
                            });
                        }

                        playSfx('lock-on');
                        player.stormCircleChargeTime = 0;
                        player.stormCircleCooldownEnd = state.gameTime + GAME_CONFIG.SKILLS.STORM_CIRCLE_RECHARGE_DELAY;
                    }
                }

                if (!state.isPaused && !state.gameOver && player.playerClass === 'eventhorizon') {
                    const now = state.gameTime;
                    const cdMod = getCdMod(state, player);

                    if (player.voidMarkerActive) {
                        const bx = player.voidMarkerX ?? player.x;
                        const by = player.voidMarkerY ?? player.y;
                        state.areaEffects.push({
                            id: Date.now(),
                            type: 'blackhole',
                            x: bx,
                            y: by,
                            radius: 400,
                            duration: 3,
                            creationTime: now,
                            level: 1
                        });
                        player.voidMarkerActive = false;
                        player.lastBlackholeUse = now;
                        playSfx('impact');
                    } else if (!isOnCooldown(player.lastBlackholeUse ?? -999999, GAME_CONFIG.SKILLS.BLACKHOLE_COOLDOWN, cdMod, now)) {
                        const dx = mousePos.current.x - window.innerWidth / 2;
                        const dy = mousePos.current.y - window.innerHeight / 2;
                        const angle = Math.atan2(dy, dx);
                        const MARKER_SPEED = 800;
                        player.voidMarkerActive = true;
                        player.voidMarkerX = player.x;
                        player.voidMarkerY = player.y;
                        player.voidMarkerVx = Math.cos(angle) * MARKER_SPEED;
                        player.voidMarkerVy = Math.sin(angle) * MARKER_SPEED;
                        player.voidMarkerSpawnTime = now;
                        playSfx('spawn');
                    }
                }
                if (!state.isPaused && !state.gameOver && player.playerClass === 'hivemother') {
                    const now = state.gameTime;
                    const cdMod = getCdMod(state, player);
                    if (!isOnCooldown(player.lastHiveMotherSkill ?? -999999, 14, cdMod, now)) {
                        player.lastHiveMotherSkill = now;
                        const dpr = window.devicePixelRatio || 1;
                        const zoom = windowScaleFactor.current * 0.58 * dpr;
                        const camera = state.camera;
                        const cursorX = camera.x + (mousePos.current.x - window.innerWidth / 2) / zoom;
                        const cursorY = camera.y + (mousePos.current.y - window.innerHeight / 2) / zoom;
                        triggerHiveMotherCone(state, player, cursorX, cursorY);
                    }
                }
                if (!state.isPaused && !state.gameOver && player.playerClass === 'aigis') {
                    const now = state.gameTime;
                    const cdMod = getCdMod(state, player);
                    const lastUsed = player.lastVortexActivation ?? -999999;
                    if (!isOnCooldown(lastUsed, GAME_CONFIG.SKILLS.ORBITAL_VORTEX_COOLDOWN, cdMod, now)) {
                        player.orbitalVortexUntil = now + GAME_CONFIG.SKILLS.ORBITAL_VORTEX_DURATION;
                        player.lastVortexActivation = now + GAME_CONFIG.SKILLS.ORBITAL_VORTEX_DURATION + (GAME_CONFIG.SKILLS.ORBITAL_VORTEX_RECHARGE_DELAY || 3);
                        player.orbitalVortexCooldownEnd = player.lastVortexActivation;
                        spawnFloatingNumber(state, player.x, player.y - 40, 'ORBITAL VORTEX', '#f59e0b', true);
                        playSfx('power-up');
                    }
                }
                if (!state.isPaused && !state.gameOver && player.playerClass === 'malware') {
                    const now = state.gameTime;
                    const cdMod = getCdMod(state, player);
                    if (!isOnCooldown(player.sandboxCooldownStart ?? -999999, GAME_CONFIG.SKILLS.SANDBOX_COOLDOWN, cdMod, now)) {
                        const dpr = window.devicePixelRatio || 1;
                        const zoom = windowScaleFactor.current * 0.58 * dpr;
                        const camera = state.camera;
                        const worldX = camera.x + (mousePos.current.x - window.innerWidth / 2) / zoom;
                        const worldY = camera.y + (mousePos.current.y - window.innerHeight / 2) / zoom;
                        player.sandboxActive = true;
                        player.sandboxX = worldX;
                        player.sandboxY = worldY;
                        player.sandboxUntil = now + GAME_CONFIG.SKILLS.SANDBOX_DURATION;
                        player.sandboxCooldownStart = now;
                        spawnFloatingNumber(state, player.x, player.y - 40, 'SANDBOX', '#fb923c', true);
                        playSfx('power-up');
                    }
                }
            }

            // PORTAL TRIGGER
            if (code === (keybinds.portal || '').toLowerCase()) {
                triggerPortal();
            }

            // --- CHEAT CODES ---
            cheatBuffer += key;
            if (cheatBuffer.length > 40) cheatBuffer = cheatBuffer.slice(-40); // Buffer for readable names

            // GLI - Spawn Prism Glitcher (MANUAL CONSTRUCTION)
            if (cheatBuffer.endsWith('gli')) {
                // Check if one already exists
                if (gameState.current.enemies.some(e => e.shape === 'glitcher' && !e.dead)) {
                    console.log('[CHEAT] Glitcher already exists, skipping spawn');
                    cheatBuffer = '';
                    return;
                }

                const p = gameState.current.player;
                const now = gameState.current.gameTime;

                // MANUALLY CREATE THE GLITCHER ENEMY
                const glitcher = {
                    id: Math.random(),
                    type: 'glitcher' as const,
                    shape: 'glitcher' as const,
                    x: p.x + 100, // Spawn 100px to the right
                    y: p.y,
                    size: 33, // 1.5x base size (22 * 1.5)
                    hp: 500,
                    maxHp: 500,
                    spd: 3.36, // 2.4 * 1.4 (speedMult from constants)
                    boss: false,
                    bossType: 0,
                    bossAttackPattern: 0,
                    lastAttack: now,
                    dead: false,
                    palette: ['#ff00ff', '#00ffff', '#ffffff'], // Glitch colors
                    eraPalette: ['#ff00ff', '#00ffff', '#ffffff'],
                    shellStage: 2,
                    fluxState: 0,
                    pulsePhase: 0,
                    rotationPhase: 0,
                    knockback: { x: 0, y: 0 },
                    isElite: false,
                    spawnedAt: now,
                    // Glitcher-specific properties
                    glitchDecoy: false,
                    lastBlink: 0,
                    lastDecoy: 0,
                    lastLeak: 0,
                    longTrail: []
                };

                // DIRECTLY PUSH TO ENEMIES ARRAY
                gameState.current.enemies.push(glitcher);

                spawnFloatingNumber(gameState.current, p.x, p.y, 'GLITCHER SPAWNED!', '#ff00ff', true);
                playSfx('spawn');

                console.log('[CHEAT] MANUALLY spawned Glitcher:', glitcher);
                console.log('[CHEAT] Total enemies:', gameState.current.enemies.length);
                console.log('[CHEAT] Glitcher position:', glitcher.x, glitcher.y);

                refreshUI();
                cheatBuffer = '';
            }

            // BUG - Admin Console
            if (cheatBuffer.endsWith('bug')) {
                if (setShowAdminConsole) {
                    setShowAdminConsole(true);
                    gameState.current.showAdminConsole = true;
                    console.log('[CHEAT] Admin Console Opened');
                }
                cheatBuffer = '';
            }

            // KKK - Cheat Panel
            if (cheatBuffer.endsWith('kkk')) {
                if (setShowCheatPanel) {
                    setShowCheatPanel(true);
                    gameState.current.showCheatPanel = true;
                    console.log('[CHEAT] Cheat Panel Opened');
                }
                cheatBuffer = '';
            }

            // KO - 5100 Dust
            if (cheatBuffer.endsWith('ko')) {
                gameState.current.player.dust += 5100;
                console.log('[CHEAT] Added 5100 Dust');
                refreshUI();
                cheatBuffer = '';
            }

            // KP - 1000 Void Flux
            if (cheatBuffer.endsWith('kp')) {
                gameState.current.player.isotopes += 1000;
                spawnFloatingNumber(gameState.current, gameState.current.player.x, gameState.current.player.y, "+1000 FLUX", '#a855f7', true);
                playSfx('power-up');
                console.log('[CHEAT] Added 1000 Void Flux. New Total:', gameState.current.player.isotopes);
                refreshUI(); // Force Update
                cheatBuffer = '';
            }

            // KS5 - 500 Souls (Kills)
            if (cheatBuffer.endsWith('ks5')) {
                gameState.current.killCount += 500;
                spawnFloatingNumber(gameState.current, gameState.current.player.x, gameState.current.player.y, "+500 SOULS", '#fbbf24', true);
                playSfx('power-up');
                console.log('[CHEAT] Added 500 Kills (Souls). New Total:', gameState.current.killCount);
                import('../logic/upgrades/LegendaryLogic').then(mod => mod.syncAllLegendaries(gameState.current));
                refreshUI(); // Force Update
                cheatBuffer = '';
            }

            // NXP - Toggle XP gain on/off
            if (cheatBuffer.endsWith('nxp')) {
                gameState.current.xpDisabled = !gameState.current.xpDisabled;
                const status = gameState.current.xpDisabled ? 'DISABLED' : 'ENABLED';
                spawnFloatingNumber(gameState.current, gameState.current.player.x, gameState.current.player.y, `XP GAIN ${status}`, '#4ade80', true);
                console.log('[CHEAT] XP gain toggled:', status);
                cheatBuffer = '';
            }

            // i15 - Trigger Fake Portal Troll
            if (cheatBuffer.endsWith('i15')) {
                const history = gameState.current.assistant.history;
                (history as any).fakePortalTriggerTime = gameState.current.gameTime;
                console.log('[CHEAT] Fake Portal Troll Queued');
                cheatBuffer = '';
            }

            // K1 - Suicide
            if (cheatBuffer.endsWith('k1')) {
                gameState.current.player.curHp = 0;
                gameState.current.gameOver = true;
                gameState.current.player.deathCause = 'SIMULATION TERMINATED (DEBUG)';
                setGameOver(true);
                import('../logic/audio/AudioLogic').then(mod => mod.stopAllLoops());
                console.log('[CHEAT] Player Suicide Triggered via K1');
                cheatBuffer = '';
            }

            // LVL - Level Up + Unlock Portals
            if (cheatBuffer.endsWith('lvl')) {
                // Level Up logic
                gameState.current.player.xp.current = gameState.current.player.xp.needed;

                // Portal Unlock logic (Dimensional Gate effect)
                gameState.current.portalsUnlocked = true;
                gameState.current.portalState = 'warn';
                gameState.current.portalTimer = 0.5; // Open in 0.5s

                spawnFloatingNumber(gameState.current, gameState.current.player.x, gameState.current.player.y, "LEVEL UP & PORTALS UNLOCKED", '#00ffff', true);
                playSfx('rare-spawn');
                console.log('[CHEAT] Level up and Portals Unlocked via L1/LVL');

                refreshUI();
                cheatBuffer = '';
            }

            // E1-E5 - Spawn 5 Enemies
            const shapes: Record<string, any> = { '1': 'circle', '2': 'triangle', '3': 'square', '4': 'diamond', '5': 'pentagon' };
            for (const [num, shape] of Object.entries(shapes)) {
                if (cheatBuffer.endsWith(`e${num}`)) {
                    const p = gameState.current.player;
                    for (let i = 0; i < 5; i++) {
                        const a = (i / 5) * Math.PI * 2;
                        spawnEnemy(gameState.current, p.x + Math.cos(a) * 400, p.y + Math.sin(a) * 400, shape);
                    }
                    cheatBuffer = '';
                }
            }

            // --- BOSS SUMMONING CHEATS ---
            const bossForms: Record<number, string> = {
                1: 'circle',
                2: 'triangle',
                3: 'square',
                4: 'diamond',
                5: 'pentagon'
            };

            Object.entries(bossForms).forEach(([numStr, form]) => {
                const shapeNum = parseInt(numStr);

                // v1, v2, v3, v4, v5 - Default to Level 4 (Max Tier)
                if (cheatBuffer.endsWith(`v${shapeNum}`)) {
                    const p = gameState.current.player;
                    spawnEnemy(gameState.current, p.x + 500, p.y, form as any, true, 4);
                    spawnFloatingNumber(gameState.current, p.x, p.y, `SUMMONED LVL 4 ${form.toUpperCase()}`, '#ef4444', true);
                    playSfx('rare-spawn');
                    cheatBuffer = '';
                }

                // b[ShapeNum][Level] - e.g., b11 for Circle Lvl 1
                for (let level = 1; level <= 5; level++) {
                    const bCode = `b${shapeNum}${level}`;
                    if (cheatBuffer.endsWith(bCode)) {
                        const p = gameState.current.player;
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 500;
                        spawnEnemy(gameState.current, p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist, form as any, true, level);
                        spawnFloatingNumber(gameState.current, p.x, p.y, `SUMMONED LVL ${level} ${form.toUpperCase()}`, '#ef4444', true);
                        playSfx('rare-spawn');
                        console.log(`[CHEAT] Summoned Level ${level} ${form} Boss (MAPPED bXY)`);
                        cheatBuffer = '';
                    }
                }

            });

            // SNI - Snitch
            if (cheatBuffer.endsWith('sni')) {
                spawnRareEnemy(gameState.current);
                cheatBuffer = '';
            }

            // o1-o12 - Spawn Blueprint (Drop in world at 300px range)
            const blueprintTypes: BlueprintType[] = [
                'METEOR_SHOWER', 'NEURAL_OVERCLOCK', 'STASIS_FIELD', 'PERK_RESONANCE',
                'ARENA_SURGE', 'QUANTUM_SCRAPPER', 'MATRIX_OVERDRIVE', 'TEMPORAL_GUARD',
                'DIMENSIONAL_GATE', 'SECTOR_UPGRADE_ECO', 'SECTOR_UPGRADE_COM', 'SECTOR_UPGRADE_DEF'
            ];
            for (let i = 1; i <= blueprintTypes.length; i++) {
                if (cheatBuffer.endsWith(`o${i}`)) {
                    const p = gameState.current.player;
                    const angle = Math.random() * Math.PI * 2;
                    const spawnX = p.x + Math.cos(angle) * 300;
                    const spawnY = p.y + Math.sin(angle) * 300;
                    dropBlueprint(gameState.current, blueprintTypes[i - 1], spawnX, spawnY);
                    console.log(`[CHEAT] Dropped Blueprint: ${blueprintTypes[i - 1]} at 300px range`);
                    cheatBuffer = '';
                }
            }

            // M1-M9 - Spawn Meteorite
            // M1-M6 - Spawn Meteorite
            const rarities: MeteoriteRarity[] = ['anomalous', 'radiant', 'abyss', 'eternal', 'divine', 'singularity'];
            for (let i = 1; i <= 6; i++) {
                if (cheatBuffer.endsWith(`m${i}`)) {
                    const player = gameState.current.player;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 100;
                    const met = createMeteorite(gameState.current, rarities[i - 1], player.x + Math.cos(angle) * dist, player.y + Math.sin(angle) * dist);
                    gameState.current.meteorites.push(met);
                    cheatBuffer = '';
                }
                if (cheatBuffer.endsWith(`mi${i}`)) {
                    const met = createMeteorite(gameState.current, rarities[i - 1], 0, 0);
                    met.isNew = true;
                    const inv = gameState.current.inventory;
                    const emptyIdx = inv.findIndex(slot => slot === null);
                    if (emptyIdx !== -1) inv[emptyIdx] = met;
                    refreshUI();
                    cheatBuffer = '';
                }
            }

            // POR - Portal
            if (cheatBuffer.endsWith('por')) {
                gameState.current.portalState = 'closed';
                gameState.current.portalTimer = 10.1;
                cheatBuffer = '';
            }

            // RMO - Armor
            if (cheatBuffer.endsWith('rmo')) {
                const p = gameState.current.player;
                p.arm.base += 100;
                p.arm.mult = (p.arm.mult || 0) + 10;
                refreshUI();
                cheatBuffer = '';
            }

            // Z1-Z2 - Events
            if (cheatBuffer.endsWith('z1')) {
                gameState.current.activeEvent = { type: 'legion_formation', startTime: gameState.current.gameTime, duration: 600, endTime: gameState.current.gameTime + 600, data: { legions: [] } };
                cheatBuffer = '';
            }
            if (cheatBuffer.endsWith('z2')) {
                gameState.current.activeEvent = { type: 'necrotic_surge', startTime: gameState.current.gameTime, duration: 30, endTime: gameState.current.gameTime + 30 };
                cheatBuffer = '';
            }
            if (cheatBuffer.endsWith('z3')) {
                const p = gameState.current.player;
                const angle = Math.random() * Math.PI * 2;
                spawnVoidBurrower(gameState.current, p.x + Math.cos(angle) * 2000, p.y + Math.sin(angle) * 2000);
                spawnFloatingNumber(gameState.current, p.x, p.y, 'VOID BURROWER SPAWNED!', '#E942FF', true);
                cheatBuffer = '';
            }

            // T5-T60 - Time Warp
            [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].forEach(min => {
                if (cheatBuffer.endsWith(`t${min}`)) {
                    skipTime(min);
                    cheatBuffer = '';
                }
            });

            // --- TURRET CHEATS ---
            // turf1-6 (Fire), turi1-6 (Ice), turh1-6 (Heal)
            const turretVariants: Record<string, 'fire' | 'ice' | 'heal'> = { 'f': 'fire', 'i': 'ice', 'h': 'heal' };
            let turretSpawned = false;
            for (const [keyChar, variant] of Object.entries(turretVariants)) {
                if (turretSpawned) break;
                for (let level = 1; level <= 6; level++) {
                    if (cheatBuffer.endsWith(`t${keyChar}${level}`)) {
                        const p = gameState.current.player;
                        const angle = Math.random() * Math.PI * 2;
                        const dist = 100;
                        const tx = p.x + Math.cos(angle) * dist;
                        const ty = p.y + Math.sin(angle) * dist;

                        const newTurret: MapPOI = {
                            id: Math.random(),
                            type: 'turret',
                            x: tx,
                            y: ty,
                            radius: 120 * (1 + (level - 1) * 0.1),
                            arenaId: gameState.current.currentArena,
                            active: true,
                            progress: 0,
                            activationProgress: 0,
                            activeDuration: 0,
                            cooldown: 0,
                            respawnTimer: 0,
                            lastUsed: 0,
                            turretVariant: variant,
                            turretUses: level
                        };

                        gameState.current.pois.push(newTurret);
                        spawnFloatingNumber(gameState.current, tx, ty, `LVL ${level} ${variant.toUpperCase()} TURRET`, '#F59E0B', true);
                        playSfx('power-up');
                        console.log(`[CHEAT] Spawned Lvl ${level} ${variant} Turret at (${tx.toFixed(0)}, ${ty.toFixed(0)})`);
                        console.log(`[CHEAT] Total POIs:`, gameState.current.pois.length);
                        console.log(`[CHEAT] Turret details:`, newTurret);

                        cheatBuffer = '';
                        turretSpawned = true;
                        break;
                    }
                }
            }

            // --- LEGENDARY SPAWN CHEATS ---
            // Y1-Y4: Economic
            // Y5-Y8: Combat
            // Y9-Y=: Defensive
            const legendaryCheats: Record<string, string> = {
                'y1': 'EcoDMG',
                'y2': 'EcoXP',
                'y3': 'EcoHP',
                'y4': 'CombShield',
                'y5': 'ComLife',
                'y6': 'ComCrit',
                'y7': 'ComWave',
                'y8': 'RadiationCore',
                'y9': 'DefPuddle',
                'y0': 'DefEpi',
                'y-': 'KineticBattery',
                'y=': 'ChronoPlating'
            };

            for (const [buffCode, type] of Object.entries(legendaryCheats)) {
                if (cheatBuffer.endsWith(buffCode)) {
                    const state = gameState.current;
                    const base = LEGENDARY_UPGRADES[type];
                    if (base) {
                        const pastTime = state.gameTime - 3600;
                        const selection: any = {
                            ...base,
                            level: 4,
                            killsAtAcquisition: state.killCount,
                            timeAtAcquisition: pastTime,
                            killsAtLevel: { 1: state.killCount, 2: state.killCount, 3: state.killCount, 4: state.killCount },
                            timeAtLevel: { 1: pastTime, 2: pastTime, 3: pastTime, 4: pastTime },
                            statBonuses: {}
                        };
                        applyLegendarySelection(state, selection);
                        spawnFloatingNumber(state, state.player.x, state.player.y, `LEGENDARY ${selection.name} SPAWNED!`, '#FFD700', true);
                        playSfx('rare-spawn');
                        setShowModuleMenu(true); // Open menu to place it
                        refreshUI();
                    }
                    cheatBuffer = '';
                }
            }


            // CDR - Cooldown Reduction +20% per press (max 90%)
            if (cheatBuffer.endsWith('cdr')) {
                const state = gameState.current;
                const cur = state.player.cooldownReductionBonus || 0;
                const next = Math.min(0.9, cur + 0.2);
                state.player.cooldownReductionBonus = next;
                spawnFloatingNumber(state, state.player.x, state.player.y, `CDR ${(next * 100).toFixed(0)}%`, '#00ffff', true);
                playSfx('power-up');
                refreshUI();
                cheatBuffer = '';
            }

            // CS2 - Boost Chassis Resonance (x2 from current per press)
            if (cheatBuffer.endsWith('cs2')) {
                const state = gameState.current;
                const cur = state.chassisResonanceBonus || 0;
                state.chassisResonanceBonus = cur === 0 ? 0.5 : cur * 2;
                spawnFloatingNumber(state, state.player.x, state.player.y, `RESONANCE ${state.chassisResonanceBonus.toFixed(1)}`, '#a855f7', true);
                playSfx('power-up');
                refreshUI();
                cheatBuffer = '';
            }
        };

        const handleUp = (e: KeyboardEvent) => {
            const code = (e.code || '').toLowerCase();
            keys.current[code] = false;
        };

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleJoystickInput = (x: number, y: number) => {
        inputVector.current = { x, y };
    };

    return { keys, inputVector, mousePos, handleJoystickInput };
}
