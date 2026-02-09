import { useEffect, useRef } from 'react';
import type { GameState, MeteoriteRarity } from '../logic/core/types';
import { spawnEnemy, spawnRareEnemy } from '../logic/enemies/EnemyLogic';
import { createMeteorite } from '../logic/mission/LootLogic';
import { castSkill } from '../logic/player/SkillLogic';
import { calcStat } from '../logic/utils/MathUtils';
import { getKeybinds } from '../logic/utils/Keybinds';
import { dropBlueprint } from '../logic/upgrades/BlueprintLogic';
import { spawnFloatingNumber } from '../logic/effects/ParticleLogic';
import { playSfx } from '../logic/audio/AudioLogic';
import { BlueprintType } from '../logic/core/types';

interface GameInputProps {
    gameState: React.MutableRefObject<GameState>;
    setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
    setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
    setShowModuleMenu: React.Dispatch<React.SetStateAction<boolean>>;
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
    triggerPortal: () => boolean;
    refreshUI: () => void;
}

export function useGameInput({ gameState, setShowSettings, setShowStats, setShowModuleMenu, setGameOver, triggerPortal, refreshUI }: GameInputProps) {
    const keys = useRef<Record<string, boolean>>({});
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
                setShowSettings(prev => !prev);
                return;
            }

            // Block all other input during extraction dialogue
            if (['requested', 'waiting'].includes(gameState.current.extractionStatus)) {
                return;
            }

            if (gameState.current.showSettings) return;

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

            // PORTAL TRIGGER
            if (code === (keybinds.portal || '').toLowerCase()) {
                triggerPortal();
            }

            // --- CHEAT CODES ---
            cheatBuffer += key;
            if (cheatBuffer.length > 20) cheatBuffer = cheatBuffer.slice(-20); // Longer buffer to handle movement noise

            // GLI - Spawn Prism Glitcher (MANUAL CONSTRUCTION)
            if (cheatBuffer.endsWith('gli')) {
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

            // YY / KO - 5100 Dust
            if (cheatBuffer.endsWith('yy') || cheatBuffer.endsWith('ko')) {
                gameState.current.player.dust += 5100;
                console.log('[CHEAT] Added 5100 Dust');
                refreshUI();
                cheatBuffer = '';
            }

            // L1 - Level Up
            if (cheatBuffer.endsWith('l1')) {
                gameState.current.player.xp.current = gameState.current.player.xp.needed;
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

            // B1-B5 Boss Spawning
            for (const [num, shape] of Object.entries(shapes)) {
                if (cheatBuffer.endsWith(`b${num}-`)) {
                    const p = gameState.current.player;
                    spawnEnemy(gameState.current, p.x + 500, p.y + 500, shape, true, 1);
                    console.log(`[CHEAT] Spawned Tier 1 ${shape} Boss`);
                }
                if (cheatBuffer.endsWith(`b${num}b`)) {
                    const p = gameState.current.player;
                    spawnEnemy(gameState.current, p.x + 500, p.y + 500, shape, true, 2);
                    console.log(`[CHEAT] Spawned Tier 2 ${shape} Boss`);
                }
                if (cheatBuffer.endsWith(`b${num}b${num}`) || (num === '5' && cheatBuffer.endsWith('b5b5'))) {
                    const recentT2Index = gameState.current.enemies.findIndex(e =>
                        e.boss && e.bossTier === 2 && e.shape === shape && (gameState.current.gameTime - (e.spawnedAt || 0)) < 2
                    );
                    if (recentT2Index !== -1) {
                        gameState.current.enemies.splice(recentT2Index, 1);
                    }
                    const p = gameState.current.player;
                    spawnEnemy(gameState.current, p.x + 500, p.y + 500, shape, true, 3);
                    console.log(`[CHEAT] Spawned Tier 3 ${shape} Boss`);
                    cheatBuffer = '';
                }
            }

            // E6 - Snitch
            if (cheatBuffer.endsWith('e6')) {
                spawnRareEnemy(gameState.current);
                cheatBuffer = '';
            }

            // o1-o8 - Spawn Blueprint (Drop in world at 300px range)
            const blueprintTypes: BlueprintType[] = ['METEOR_SHOWER', 'NEURAL_OVERCLOCK', 'STASIS_FIELD', 'PERK_RESONANCE', 'ARENA_SURGE', 'QUANTUM_SCRAPPER', 'MATRIX_OVERDRIVE', 'TEMPORAL_GUARD'];
            for (let i = 1; i <= 8; i++) {
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
            const rarities: MeteoriteRarity[] = ['scrap', 'anomalous', 'quantum', 'astral', 'radiant', 'void', 'eternal', 'divine', 'singularity'];
            for (let i = 1; i <= 9; i++) {
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
                gameState.current.activeEvent = { type: 'necrotic_surge', startTime: gameState.current.gameTime, duration: 30, endTime: gameState.current.gameTime + 30 };
                cheatBuffer = '';
            }
            if (cheatBuffer.endsWith('z2')) {
                gameState.current.activeEvent = { type: 'legion_formation', startTime: gameState.current.gameTime, duration: 30, endTime: gameState.current.gameTime + 30, data: { legions: [] } };
                cheatBuffer = '';
            }

            // T5-T60 - Time Warp
            [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].forEach(min => {
                if (cheatBuffer.endsWith(`t${min}`)) {
                    const gameTime = min * 60;
                    gameState.current.gameTime = gameTime;

                    // Aligned Boss Schedule Logic
                    const schedule = [2, 4, 6, 8, 10]; // 5 bosses per tier, every 2 minutes
                    const current10MinCycle = Math.floor(min / 10);
                    const currentMinuteInCycle = min % 10;

                    let nextMinuteInCycle = -1;
                    for (const m of schedule) {
                        if (m > currentMinuteInCycle + 0.01) {
                            nextMinuteInCycle = m;
                            break;
                        }
                    }

                    if (nextMinuteInCycle !== -1) {
                        gameState.current.nextBossSpawnTime = (current10MinCycle * 10 + nextMinuteInCycle) * 60;
                    } else {
                        gameState.current.nextBossSpawnTime = ((current10MinCycle + 1) * 10 + schedule[0]) * 60;
                    }
                    const p = gameState.current.player;
                    p.hp.base *= min;
                    p.dmg.base *= min;
                    p.atk.base *= (min * 30);
                    p.curHp = calcStat(p.hp);
                    p.level = min * 3;
                    cheatBuffer = '';
                }
            });
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
