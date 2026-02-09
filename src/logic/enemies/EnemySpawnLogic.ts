
import type { GameState, Enemy, ShapeType } from '../core/types';
import { SHAPE_DEFS, PALETTES, PULSE_RATES, SHAPE_CYCLE_ORDER } from '../core/constants';
import { isInMap, getArenaIndex, getRandomPositionInArena } from '../mission/MapLogic';
import { playSfx } from '../audio/AudioLogic';
// import { spawnParticles } from '../effects/ParticleLogic'; // Unused
import { GAME_CONFIG } from '../core/GameConfig';

// Helper to determine current game era params
// Helper to determine current game era params
export function getProgressionParams(gameTime: number) {
    const minutes = Math.floor(gameTime / 60);
    const eraIndex = Math.floor(minutes / 15);
    const fluxState = Math.floor((minutes % 15) / 5); // 0: Containment, 1: Active Flux, 2: Overload
    const shapeIndex = minutes % 5;

    // Cycle shapes: Circle -> Triangle -> Square -> Diamond -> Pentagon
    const shapeId = SHAPE_CYCLE_ORDER[shapeIndex];
    const shapeDef = SHAPE_DEFS[shapeId];

    // Era Palette (Green -> Blue -> Purple -> Orange -> Red)
    const eraPalette = PALETTES[eraIndex % PALETTES.length];

    // Pulse Speed
    const pulseDef = PULSE_RATES.find(p => minutes < p.time) || PULSE_RATES[PULSE_RATES.length - 1];

    return { shapeDef, eraPalette, fluxState, pulseDef };
}

export function getEventPalette(state: GameState): [string, string, string] | null {
    if (['active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        return ['#9ca3af', '#4b5563', '#1f2937']; // Brighter Black/Grey (Onyx/Slate)
    }
    return null;
}

export function spawnEnemy(state: GameState, x?: number, y?: number, shape?: ShapeType, isBoss: boolean = false, bossTier?: number) {
    const { player, gameTime } = state;
    const { shapeDef, eraPalette, fluxState } = getProgressionParams(gameTime);

    // We no longer randomly override normal spawns with glitchers here, 
    // as they are handled by the scheduled 15%/min logic in EnemyLogic.ts
    let chosenShape: ShapeType = shape || shapeDef.type as ShapeType;

    // If specific position provided (cheat command), use it; otherwise calculate spawn location
    let spawnPos = (x !== undefined && y !== undefined) ? { x, y } : { x: player.x, y: player.y };
    const playerArena = getArenaIndex(player.x, player.y);
    let found = false;

    // Only calculate spawn position if not provided
    if (x === undefined || y === undefined) {
        // Try Ring around player valid in arena
        for (let i = 0; i < 8; i++) {
            const a = Math.random() * 6.28;
            const d = (isBoss ? 1500 : 1200) + Math.random() * 300;
            const tx = player.x + Math.cos(a) * d;
            const ty = player.y + Math.sin(a) * d;

            if (isInMap(tx, ty) && getArenaIndex(tx, ty) === playerArena) {
                spawnPos = { x: tx, y: ty };
                found = true;
                break;
            }

        }


        // Fallback: Random spot in Arena
        if (!found) {
            spawnPos = getRandomPositionInArena(playerArena);
        }

    }



    // Scaling
    const minutes = gameTime / 60;
    const cycleCount = Math.floor(minutes / 5);
    const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
    const hpMult = Math.pow(1.65, cycleCount) * SHAPE_DEFS[chosenShape].hpMult;
    let baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult; // User formula: 60 base, 1.2 exponential, 1.65 cycle multiplier

    // Extraction Rage scaling (Fast growth)
    if (['requested', 'waiting', 'active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        // Apply the dynamic power multiplier from ExtractionLogic
        baseHp *= (state.extractionPowerMult || 1.0);
    }

    const isLvl2 = isBoss && (bossTier === 2 || (minutes >= 10 && minutes < 20 && bossTier !== 1)); // 10-20 min
    const isLvl3 = isBoss && (bossTier === 3 || (minutes >= 20 && bossTier !== 1)); // 20+ min

    const size = isBoss ? (isLvl3 ? 60 : (isLvl2 ? 50 : 50)) : (20 * SHAPE_DEFS[chosenShape].sizeMult);
    const bossHpMult = 25 + Math.floor(minutes);
    let hp = (isBoss ? baseHp * bossHpMult : baseHp) * hpMult;


    const eventPalette = getEventPalette(state);
    const finalPalette = eventPalette || eraPalette.colors;

    const newEnemy: Enemy = {
        id: Math.random(),
        type: (isBoss ? 'boss' : chosenShape) as 'boss' | ShapeType,
        x: spawnPos.x, y: spawnPos.y,
        size,
        hp,
        maxHp: hp,
        spd: 2.4 * SHAPE_DEFS[chosenShape].speedMult,
        boss: isBoss,
        bossType: isBoss ? Math.floor(Math.random() * 2) : 0,
        bossAttackPattern: 0,
        bossTier: bossTier || 0, // 0 = Auto
        dead: false,
        shape: chosenShape as ShapeType,
        shellStage: 2,
        palette: finalPalette,
        eraPalette: finalPalette,
        fluxState: fluxState,
        pulsePhase: 0,
        rotationPhase: Math.random() * Math.PI * 2,
        lastAttack: state.gameTime + Math.random() * 2.0,
        timer: 0,
        summonState: 0,
        dodgeDir: Math.random() > 0.5 ? 1 : -1,
        wobblePhase: isBoss ? Math.random() * Math.PI * 2 : 0,
        jitterX: 0, jitterY: 0,
        glitchPhase: 0, crackPhase: 0,
        knockback: { x: 0, y: 0 },
        isRare: false,
        isElite: false,
        spawnedAt: state.gameTime,
        isFlanker: !isBoss && ['circle', 'triangle', 'square'].includes(chosenShape) && Math.random() < 0.10,
        flankAngle: Math.random() * Math.PI * 2,
        flankDistance: 400 + Math.random() * 200,
        particleOrbit: ['active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus) ? 60 : 0
    };

    state.enemies.push(newEnemy);
}

export function spawnRareEnemy(state: GameState) {
    const { player } = state;
    // const { activeColors } = getProgressionParams(gameTime); // Not needed for fixed snitch

    // Spawn near player or random valid
    let spawnPos = { x: player.x, y: player.y };
    let found = false;
    const playerArena = getArenaIndex(player.x, player.y);

    for (let i = 0; i < 10; i++) {
        const a = Math.random() * 6.28;
        const d = 1150 + Math.random() * 100;
        const tx = player.x + Math.cos(a) * d;
        const ty = player.y + Math.sin(a) * d;
        if (isInMap(tx, ty) && getArenaIndex(tx, ty) === playerArena) {
            spawnPos = { x: tx, y: ty };
            found = true;
            break;
        }
    }
    if (!found) spawnPos = getRandomPositionInArena(playerArena);

    const { x, y } = spawnPos;

    const rareEnemy: Enemy = {
        id: Math.random(),
        type: 'snitch',
        x, y,
        hp: GAME_CONFIG.ENEMY.SNITCH_HP,
        maxHp: GAME_CONFIG.ENEMY.SNITCH_HP,
        spd: player.speed * GAME_CONFIG.ENEMY.SNITCH_SPEED_MULT,
        boss: false, bossType: 0, bossAttackPattern: 0, lastAttack: 0, dead: false,
        shape: 'snitch',
        shellStage: 2,
        palette: ['#FACC15', '#EAB308', '#CA8A04'],
        eraPalette: ['#FACC15', '#EAB308', '#CA8A04'],
        fluxState: 0,
        pulsePhase: 0, rotationPhase: 0, timer: state.gameTime,
        isRare: true, size: 18,
        rarePhase: 0, rareTimer: state.gameTime, rareIntent: 0, rareReal: true, canBlock: false,
        trails: [], longTrail: [{ x, y }], wobblePhase: 0,
        knockback: { x: 0, y: 0 },
        glitchPhase: 0, crackPhase: 0, particleOrbit: 0,
        spawnedAt: state.gameTime
    };

    state.enemies.push(rareEnemy);
    playSfx('rare-spawn');
    state.rareSpawnActive = true;
}

export function manageRareSpawnCycles(state: GameState) {
    const { gameTime, rareSpawnCycle, rareSpawnActive } = state;
    if (rareSpawnActive) return;

    const nextSpawnTime = 60 + (rareSpawnCycle * 120);

    if (gameTime >= nextSpawnTime) {
        spawnRareEnemy(state);
        state.rareSpawnCycle++;
    }
}

export function spawnShield(state: GameState, x: number, y: number, parentId?: number, maxHp?: number, initialPhase?: number) {
    const shield: Enemy = {
        id: Math.random(),
        type: 'orbital_shield' as any, // Special type for logic
        x, y,
        size: 40, // Large hitbox to protect boss and be easier to target
        hp: maxHp || 1,
        maxHp: maxHp || 1,
        parentId, // Link to boss
        spd: 0,
        boss: false, bossType: 0, bossAttackPattern: 0, lastAttack: 0, dead: false,
        shape: 'orbital_shield' as any, // Visual shape
        shellStage: 0,
        palette: ['#06b6d4', '#0891b2', '#155e75'], // Cyan/Blue Energy Shield
        eraPalette: ['#06b6d4', '#0891b2', '#155e75'],
        fluxState: 0,
        pulsePhase: 0,
        rotationPhase: initialPhase !== undefined ? initialPhase : Math.random() * 6.28,
        spawnedAt: state.gameTime,
        knockback: { x: 0, y: 0 },
        isRare: false,
        isNeutral: true
    };
    state.enemies.push(shield);
}
