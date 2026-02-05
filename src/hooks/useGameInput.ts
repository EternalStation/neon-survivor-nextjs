import { useEffect, useRef } from 'react';
import type { GameState, MeteoriteRarity } from '../logic/types';
import { spawnEnemy, spawnRareEnemy } from '../logic/EnemyLogic';
import { createMeteorite } from '../logic/LootLogic';
import { castSkill } from '../logic/SkillLogic';
import { calcStat } from '../logic/MathUtils';
import { startBGM } from '../logic/AudioLogic';
import { getKeybinds } from '../logic/Keybinds';

interface GameInputProps {
    gameState: React.MutableRefObject<GameState>;
    setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
    setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
    setShowModuleMenu: React.Dispatch<React.SetStateAction<boolean>>;
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
    triggerPortal: () => boolean;
}

export function useGameInput({ gameState, setShowSettings, setShowStats, setShowModuleMenu, setGameOver, triggerPortal }: GameInputProps) {
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
        const handleDown = (e: KeyboardEvent) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();

            // Start music on first interaction
            startBGM(gameState.current.currentArena);

            // Get latest keybinds from ref
            const keybinds = currentKeybinds.current;

            if (key === 'escape' || code === 'escape') {
                // If Module Menu or Boss Skill is open, let its own listener handle the close
                if (gameState.current.showModuleMenu || gameState.current.showBossSkillDetail) {
                    return;
                }

                // Settings Menu Toggle Logic
                // If Settings is open -> Close it (Resume)
                // If Settings is closed -> Open it (Pause) - This will overlay other menus due to z-index
                setShowSettings(prev => !prev);

                // Note: We deliberately do NOT close other menus (Module/Stats) here,
                // so Settings can overlay them.
                return; // Ensure we don't process other logic for Escape
            }

            // CRITICAL: If Settings is open, ignore all other game logic keys
            // to prevent interference with rebinding or accidentally triggering skills.
            if (gameState.current.showSettings) return;

            // Handle Stats toggle
            if (key === keybinds.stats) {
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
            if (key === keybinds.matrix) {
                setShowModuleMenu(prev => !prev);
                // Refs are synced in useGame loop
            }

            // Track movement keys - use both code and key for maximum compatibility
            if (['keyw', 'keys', 'keya', 'keyd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(code)) {
                keys.current[code] = true;
                keys.current[key] = true;
            } else {
                keys.current[key] = true;
            }

            // Skill Input (1-6) - Check all matches to allow duplicate keybinds
            const skillBindings = [
                keybinds.skill1,
                keybinds.skill2,
                keybinds.skill3,
                keybinds.skill4,
                keybinds.skill5,
                keybinds.skill6
            ];

            skillBindings.forEach((bind, index) => {
                if (bind === key && gameState.current.player.activeSkills[index]) {
                    castSkill(gameState.current, index);
                }
            });

            // PORTAL TRIGGER (Configurable)
            if (key === keybinds.portal) {
                triggerPortal();
            }
        };

        const handleUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const code = e.code.toLowerCase();
            keys.current[key] = false;
            keys.current[code] = false;
        };

        // Cheat Code Buffer
        let cheatBuffer = '';
        const handleCheat = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            cheatBuffer += key;
            if (cheatBuffer.length > 10) cheatBuffer = cheatBuffer.slice(-10);

            // K1 - Kill Player
            if (cheatBuffer.endsWith('k1')) {
                setGameOver(true);

                cheatBuffer = '';
            }

            // L1 - Level Up
            if (cheatBuffer.endsWith('l1')) {
                gameState.current.player.xp.current = gameState.current.player.xp.needed;
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
            // b1- : Tier 1 (Normal)
            // b1b : Tier 2 (Enhanced)
            // b1b1: Tier 3 (Ascended)
            for (const [num, shape] of Object.entries(shapes)) {
                if (cheatBuffer.endsWith(`b${num}-`)) {
                    const p = gameState.current.player;
                    spawnEnemy(gameState.current, p.x + 500, p.y + 500, shape, true, 1);
                    console.log(`Cheat: Spawned Tier 1 ${shape} Boss`);
                    // Do NOT clear buffer to allow chaining/extensions if needed, though '-' ends it usually.
                    // Actually, '-' is unique. But let's keep it consistent.
                }
                if (cheatBuffer.endsWith(`b${num}b`)) {
                    const p = gameState.current.player;
                    spawnEnemy(gameState.current, p.x + 500, p.y + 500, shape, true, 2);
                    console.log(`Cheat: Spawned Tier 2 ${shape} Boss`);
                    // Do NOT clear buffer so 'b1b' can become 'b1b1'
                }
                if (cheatBuffer.endsWith(`b${num}b${num}`) || (num === '5' && cheatBuffer.endsWith('b5b5'))) {
                    // Check if a Tier 2 boss of this shape was just spawned and remove it to avoid duplicates
                    // We look for a T2 boss of same shape spawned very recently (within last 2 seconds)
                    const recentT2Index = gameState.current.enemies.findIndex(e =>
                        e.boss && e.bossTier === 2 && e.shape === shape && (gameState.current.gameTime - (e.spawnedAt || 0)) < 2
                    );

                    if (recentT2Index !== -1) {
                        gameState.current.enemies.splice(recentT2Index, 1);
                        console.log(`Cheat: Upgraded existing T2 ${shape} to T3`);
                    }

                    const p = gameState.current.player;
                    spawnEnemy(gameState.current, p.x + 500, p.y + 500, shape, true, 3);
                    console.log(`Cheat: Spawned Tier 3 ${shape} Boss`);
                    cheatBuffer = ''; // Clear after T3
                }
            }

            // E6 - Snitch
            if (cheatBuffer.endsWith('e6')) {
                spawnRareEnemy(gameState.current);
                cheatBuffer = '';
            }

            // M1-M9 - Spawn Meteorite (World Spawn)
            const rarities: MeteoriteRarity[] = ['scrap', 'anomalous', 'quantum', 'astral', 'radiant', 'void', 'eternal', 'divine', 'singularity'];
            for (let i = 1; i <= 9; i++) {
                if (cheatBuffer.endsWith(`m${i}`)) {
                    const player = gameState.current.player;
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 50 + Math.random() * 250;
                    const x = player.x + Math.cos(angle) * dist;
                    const y = player.y + Math.sin(angle) * dist;

                    const met = createMeteorite(gameState.current, rarities[i - 1], x, y);
                    gameState.current.meteorites.push(met);
                    cheatBuffer = '';
                }

                // MI1-MI9 - Spawn Meteorite DIRECTLY to Inventory (Use for menu testing)
                if (cheatBuffer.endsWith(`mi${i}`)) {
                    const met = createMeteorite(gameState.current, rarities[i - 1], 0, 0);
                    met.isNew = true;
                    const inventory = gameState.current.inventory;
                    const emptyIdx = inventory.findIndex(slot => slot === null);
                    if (emptyIdx !== -1) {
                        inventory[emptyIdx] = met;
                    } else {
                        inventory[inventory.length - 1] = met;
                    }
                    cheatBuffer = '';
                }
            }

            if (cheatBuffer.endsWith('por')) {
                // Trigger Portal Sequence (10s warning then open)
                gameState.current.portalState = 'closed';
                gameState.current.portalTimer = 10.1; // Slightly above 10 to ensure clean transition
                cheatBuffer = '';
            }

            // Z1 - Trigger Necrotic Surge Event
            if (cheatBuffer.endsWith('z1')) {
                // Import and use director logic to start event directly
                gameState.current.activeEvent = {
                    type: 'necrotic_surge',
                    startTime: gameState.current.gameTime,
                    duration: 30,
                    endTime: gameState.current.gameTime + 30,
                    data: {}
                };
                console.log('Cheat: Necrotic Surge activated for 30 seconds');
                cheatBuffer = '';
            }

            // Z2 - Trigger Legion Formation Event
            if (cheatBuffer.endsWith('z2')) {
                gameState.current.activeEvent = {
                    type: 'legion_formation',
                    startTime: gameState.current.gameTime,
                    duration: 30, // Form legions for 30s
                    endTime: gameState.current.gameTime + 30,
                    data: { legions: [] }
                };
                console.log('Cheat: Legion Formation activated for 30 seconds');
                cheatBuffer = '';
            }

            // T5, T10, T15... Time Jump
            const timeIntervals = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
            timeIntervals.forEach(min => {
                if (cheatBuffer.endsWith(`t${min}`)) {
                    const factor = min;
                    console.log(`Cheat: Time Jump to ${min}m. Buffing stats by ${factor}x`);

                    gameState.current.gameTime = min * 60;
                    // Also warp the next boss spawn time so it doesn't trigger immediately if we jump past it
                    gameState.current.nextBossSpawnTime = (min * 60) + 120;

                    // Buff Stats
                    const p = gameState.current.player;
                    p.hp.base *= factor;
                    p.dmg.base *= factor;
                    p.atk.base *= factor;

                    // Heal to full (Using robust calculation)
                    p.curHp = calcStat(p.hp);

                    // XP / Level Boost
                    p.level = min * 3;
                    p.xp.current = 0;
                    p.xp.needed = 100 * Math.pow(1.15, p.level); // Generic curve approximation

                    cheatBuffer = '';
                }
            });
        };

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        window.addEventListener('keydown', handleCheat);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            window.removeEventListener('keydown', handleCheat);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleJoystickInput = (x: number, y: number) => {
        inputVector.current = { x, y };
    };

    return { keys, inputVector, mousePos, handleJoystickInput };
}
