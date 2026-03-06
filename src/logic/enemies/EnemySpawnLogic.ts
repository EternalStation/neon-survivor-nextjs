
import type { GameState, Enemy, ShapeType } from '../core/types';
import { SHAPE_DEFS, PALETTES, PULSE_RATES, SHAPE_CYCLE_ORDER } from '../core/constants';
import { isInMap, getArenaIndex, getRandomPositionInArena } from '../mission/MapLogic';
import { playSfx } from '../audio/AudioLogic';
import { GAME_CONFIG } from '../core/GameConfig';

export function getCycleHpMult(gameTime: number) {
    const minutes = gameTime / 60;
    const cycleCount = Math.floor(minutes / 5);
    let cycleMult = 1.0;
    for (let i = 1; i <= cycleCount; i++) {
        if (i < 3) {
            cycleMult *= 1.65;
        } else if (i === 3) {
            cycleMult *= 2.0;
        } else {
            cycleMult *= (2.0 + (i - 3) * 0.2);
        }
    }
    return cycleMult;
}

export function getProgressionParams(gameTime: number) {
    const minutes = Math.floor(gameTime / 60);
    const eraIndex = Math.floor(minutes / 15);
    const fluxState = Math.floor((minutes % 15) / 5);
    const shapeIndex = minutes % 5;

    const shapeId = SHAPE_CYCLE_ORDER[shapeIndex];
    const shapeDef = SHAPE_DEFS[shapeId];

    const eraPalette = PALETTES[eraIndex % PALETTES.length];

    // Pulse Speed
    const pulseDef = PULSE_RATES.find(p => minutes < p.time) || PULSE_RATES[PULSE_RATES.length - 1];

    return { shapeDef, eraPalette, fluxState, pulseDef };
}

export function getEventPalette(state: GameState): [string, string, string] | null {
    if (['active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        return ['#9ca3af', '#4b5563', '#1f2937'];
    }
    return null;
}

export function getCurrentMinuteEnemyHp(gameTime: number, extractionPowerMult: number = 1.0) {
    const minutes = gameTime / 60;
    const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
    const mInt = Math.floor(minutes);
    const shapeId = SHAPE_CYCLE_ORDER[mInt % 5];
    const hpMult = getCycleHpMult(gameTime) * SHAPE_DEFS[shapeId].hpMult;
    let baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult;
    baseHp *= extractionPowerMult;
    return Math.floor(baseHp * hpMult);
}

export function spawnEnemy(state: GameState, x?: number, y?: number, shape?: ShapeType, isBoss: boolean = false, bossTier?: number, isAnomaly: boolean = false) {
    const { player, gameTime } = state;
    const { shapeDef, eraPalette, fluxState } = getProgressionParams(gameTime);

    let chosenShape: ShapeType = shape || shapeDef.type as ShapeType;

    let spawnPos = (x !== undefined && y !== undefined) ? { x, y } : { x: player.x, y: player.y };
    const playerArena = getArenaIndex(player.x, player.y);
    let found = false;

    if (x === undefined || y === undefined) {
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



    const minutes = gameTime / 60;
    const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
    const hpMult = getCycleHpMult(gameTime) * (isAnomaly ? 2.0 : SHAPE_DEFS[chosenShape].hpMult);
    let baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult;

    if (['requested', 'waiting', 'active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        baseHp *= (state.extractionPowerMult || 1.0);
    }

    const isLvl2 = isBoss && (bossTier === 2 || (minutes >= 10 && minutes < 20 && bossTier !== 1));
    const isLvl4 = isBoss && (bossTier === 4 || (minutes >= 30 && bossTier !== 1));
    const isLvl3 = isBoss && (bossTier === 3 || (minutes >= 20 && bossTier !== 1)) || isLvl4;

    const mTotal = Math.floor(minutes);
    const intervals = [2, 5, 10, 15, 20];
    let progressiveBonus = 0;
    const fullIntervals = Math.floor(mTotal / 5);
    for (let i = 0; i < fullIntervals; i++) {
        const rate = intervals[Math.min(i, intervals.length - 1)];
        progressiveBonus += 5 * rate;
    }
    const currentRate = intervals[Math.min(fullIntervals, intervals.length - 1)];
    progressiveBonus += (mTotal % 5) * currentRate;
    const bossHpMult = 30 + progressiveBonus;

    let hp = (isBoss ? baseHp * bossHpMult : baseHp) * hpMult;
    if (isAnomaly) {
        const gen = state.anomalyBossCount || 0;
        hp *= (1.5 + (gen * 0.8));
    }

    const baseSize = isBoss ? 80 : (20 * SHAPE_DEFS[chosenShape].sizeMult);
    const size = isAnomaly ? baseSize * 1.0 : baseSize;

    const eventPalette = getEventPalette(state);
    let finalPalette = eventPalette || eraPalette.colors;

    if (isAnomaly) {
        finalPalette = ['#f59e0b', '#ef4444', '#7f1d1d'];
    }

    const newEnemy: Enemy = {
        id: Math.random(),
        type: (isBoss ? 'boss' : chosenShape) as 'boss' | ShapeType,
        x: spawnPos.x, y: spawnPos.y,
        size,
        hp,
        maxHp: hp,
        spd: isAnomaly ? player.speed * 0.84 : player.speed * SHAPE_DEFS[chosenShape].speedMult * (isBoss ? 0.9 : 1.0),
        boss: isBoss,
        bossType: isBoss ? Math.floor(Math.random() * 2) : 0,
        bossAttackPattern: 0,
        bossTier: bossTier || 0,
        dead: false,
        shape: (isAnomaly ? 'abomination' : chosenShape) as ShapeType,
        shellStage: 2,
        palette: finalPalette,
        eraPalette: finalPalette,
        fluxState: fluxState,
        pulsePhase: 0,
        rotationPhase: Math.random() * Math.PI * 2,
        lastAttack: (chosenShape === 'pentagon' || chosenShape === 'diamond') ? state.gameTime - 15.0 : state.gameTime + Math.random() * 2.0,
        timer: 0,
        summonState: 0,
        dodgeDir: Math.random() > 0.5 ? 1 : -1,
        wobblePhase: isBoss ? Math.random() * Math.PI * 2 : 0,
        jitterX: 0, jitterY: 0,
        glitchPhase: 0, crackPhase: 0,
        knockback: { x: 0, y: 0 },
        isRare: false,
        isElite: false,
        isAnomaly: isAnomaly,
        anomalyGeneration: isAnomaly ? (state.anomalyBossCount || 0) : undefined,
        spawnedAt: state.gameTime,
        isFlanker: !isBoss && ['circle', 'triangle', 'square'].includes(chosenShape) && Math.random() < 0.10,
        flankAngle: Math.random() * Math.PI * 2,
        flankDistance: 400 + Math.random() * 200,
        particleOrbit: isAnomaly ? 180 : (['active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus) ? 60 : 0)
    };

    state.enemies.push(newEnemy);
    return newEnemy;
}

export function getInfernalBossHp(state: GameState): number {
    const minutes = state.gameTime / 60;
    const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
    const hpMult = getCycleHpMult(state.gameTime) * 2.0; // Anomaly mult is 2.0
    let baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult;

    if (['requested', 'waiting', 'active', 'arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        baseHp *= (state.extractionPowerMult || 1.0);
    }

    const mTotal = Math.floor(minutes);
    const intervals = [2, 5, 10, 15, 20];
    let progressiveBonus = 0;
    const fullIntervals = Math.floor(mTotal / 5);
    for (let i = 0; i < fullIntervals; i++) {
        const rate = intervals[Math.min(i, intervals.length - 1)];
        progressiveBonus += 5 * rate;
    }
    const currentRate = intervals[Math.min(fullIntervals, intervals.length - 1)];
    progressiveBonus += (mTotal % 5) * currentRate;
    const bossHpMult = 30 + progressiveBonus;

    let hp = baseHp * bossHpMult * hpMult;
    const gen = state.anomalyBossCount || 0;
    hp *= (1.5 + (gen * 0.8));

    return Math.floor(hp);
}

export function spawnRareEnemy(state: GameState) {
    const { player } = state;

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

    const nextSpawnTime = 300 + (rareSpawnCycle * 120);

    if (gameTime >= nextSpawnTime) {
        spawnRareEnemy(state);
        state.rareSpawnCycle++;
    }
}

export function spawnShield(state: GameState, x: number, y: number, parentId?: number, maxHp?: number, initialPhase?: number) {
    const shield: Enemy = {
        id: Math.random(),
        type: 'orbital_shield' as any,
        x, y,
        size: 40,
        hp: maxHp || 1,
        maxHp: maxHp || 1,
        parentId,
        spd: 0,
        boss: false, bossType: 0, bossAttackPattern: 0, lastAttack: 0, dead: false,
        shape: 'orbital_shield' as any,
        shellStage: 0,
        palette: ['#06b6d4', '#0891b2', '#155e75'],
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
