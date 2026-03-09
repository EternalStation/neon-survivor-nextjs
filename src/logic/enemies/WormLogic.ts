
import type { GameState, Enemy } from '../core/Types';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { isInMap, getHexDistToWall } from '../mission/MapLogic';
import { getProgressionParams, getCycleHpMult } from './EnemySpawnLogic';

export function spawnVoidBurrower(state: GameState, x: number, y: number, segments: number = 16) {
    const wormId = `worm_${Math.random()}`;
    const { shapeDef, eraPalette } = getProgressionParams(state.gameTime);

    
    const minutes = state.gameTime / 60;
    const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
    const hpMult = getCycleHpMult(state.gameTime) * 1.5; 
    const baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult;
    const bossHpMult = 25 + Math.floor(minutes);
    const finalHp = baseHp * hpMult * bossHpMult; 

    
    
    const wormPalette = ['#ffffff', '#fde047', '#475569'];

    const head: Enemy = {
        id: Math.random(),
        type: 'worm',
        shape: 'worm',
        x, y,
        size: 28, 
        hp: finalHp,
        maxHp: finalHp,
        spd: state.player.speed * 0.63,
        boss: false, bossType: 0, bossAttackPattern: 0, lastAttack: state.gameTime, dead: false,
        shellStage: 2,
        palette: wormPalette,
        eraPalette: wormPalette,
        fluxState: 0, pulsePhase: 0, rotationPhase: 0,
        knockback: { x: 0, y: 0 },
        isRare: false, isElite: false,
        spawnedAt: state.gameTime,
        wormId,
        wormRole: 'head',
        wormSegmentIndex: 0,
        wormHistory: Array(150).fill(null).map(() => ({ x, y, state: 'surface' })), 
        wormBurrowState: 'surface',
        wormBurrowTimer: state.gameTime + 8 + Math.random() * 4,
        wormAIState: 'stalking',
        wormFlankAngle: Math.random() * Math.PI * 2,
        wormOrbitDir: Math.random() > 0.5 ? 1 : -1,
        wormOrbitRadius: 450,
        wormLungeTimer: state.gameTime + 4 + Math.random() * 2,
        wormLungeActive: false,
        wormTrueDamage: 20, 
        customCollisionDmg: 20
    };

    state.enemies.push(head);

    let prev = head;
    const segmentCount = 20; 
    for (let i = 1; i <= segmentCount; i++) {
        const segmentHp = finalHp * 0.20; 
        const segment: Enemy = {
            id: Math.random(),
            type: 'worm',
            shape: 'worm',
            x, y,
            size: 20 - (i * 0.4), 
            hp: segmentHp,
            maxHp: segmentHp,
            spd: head.spd,
            boss: false, bossType: 0, bossAttackPattern: 0, lastAttack: 0, dead: false,
            shellStage: 1,
            palette: head.palette,
            eraPalette: head.eraPalette,
            fluxState: 0, pulsePhase: 0, rotationPhase: 0,
            knockback: { x: 0, y: 0 },
            isRare: false, isElite: false,
            spawnedAt: state.gameTime,
            wormId,
            wormRole: 'segment',
            wormSegmentIndex: i,
            wormPrevId: prev.id,
            customCollisionDmg: 15, 
            dieOnCollision: true 
        };
        prev.wormNextId = segment.id;
        state.enemies.push(segment);
        prev = segment;
    }

    playSfx('rare-spawn');
    return head;
}

export function updateVoidBurrower(e: Enemy, state: GameState, step: number, onEvent?: (event: string, data?: any) => void) {
    const player = state.player;

    if (e.wormRole === 'head') {
        updateWormHead(e, state, step, player, onEvent);
    } else {
        updateWormSegment(e, state, step);
    }
}

function updateWormHead(e: Enemy, state: GameState, step: number, player: any, onEvent?: (event: string, data?: any) => void) {
    const now = state.gameTime;

    
    if (e.wormPromotionTimer && now < e.wormPromotionTimer) {
        e.vx = 0; e.vy = 0; 
        return;
    }

    if (e.wormPromotionTimer && now >= e.wormPromotionTimer) {
        
        e.wormPromotionTimer = undefined;
        e.wormBurrowState = 'digging';
        e.wormBurrowTimer = now + 1.2;
        e.size = 28; 
        playSfx('eruption');
    }

    
    if (state.frameCount % 180 === 0 && !e.wormLungeActive) {
        e.wormAIState = e.wormAIState === 'stalking' ? 'charging' : 'stalking';
        e.wormFlankAngle = Math.random() * Math.PI * 2;
    }

    
    
    let tx = player.x;
    let ty = player.y;

    if (e.wormBurrowState === 'surface') {
        const timeInState = now - (e.spawnedAt || 0);

        
        const cycleTime = 12; 
        const inCycle = now % cycleTime;
        const isAttacking = inCycle < 1.5; 

        if (isAttacking) {
            e.wormAIState = 'charging';
            
            tx = player.x;
            ty = player.y;
        } else {
            e.wormAIState = 'stalking';
            
            const orbitRadius = 400 + Math.sin(now) * 50;
            const orbitSpeed = 1.0 * (e.wormOrbitDir || 1);

            
            const currentAngle = Math.atan2(e.y - player.y, e.x - player.x);
            
            const targetAngle = currentAngle + orbitSpeed * 0.15;

            tx = player.x + Math.cos(targetAngle) * orbitRadius;
            ty = player.y + Math.sin(targetAngle) * orbitRadius;
        }
    } else if (e.wormBurrowState === 'underground') {
        
        const wanderAngle = (now * 0.4) + (e.id || 0);
        const wanderRadius = 650;
        tx = player.x + Math.cos(wanderAngle) * wanderRadius;
        ty = player.y + Math.sin(wanderAngle) * wanderRadius;

        
        if (state.frameCount % 10 === 0) {
            const regen = e.maxHp * 0.0025;
            e.hp = Math.min(e.maxHp, e.hp + regen);
            state.enemies.forEach(s => {
                if (s.wormId === e.wormId && s.maxHp && s.hp < s.maxHp) {
                    s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.005);
                }
            });
            if (Math.random() < 0.1) spawnParticles(state, e.x, e.y, '#4ade80', 1, 10, 20, 'void');
        }

        
        
        if (state.frameCount % 180 === 0) {
            const currentSegments = state.enemies.filter(s => s.wormId === e.wormId && s.wormRole === 'segment' && !s.dead);
            if (currentSegments.length < 20) {
                
                
                let tail = e;
                while (tail.wormNextId) {
                    const next = state.enemies.find(s => s.id === tail.wormNextId && !s.dead);
                    if (!next) {
                        
                        tail.wormNextId = undefined;
                        break;
                    }
                    tail = next;
                }

                const nextIdx = (tail.wormSegmentIndex || 0) + 1;
                const newSegment: Enemy = {
                    id: Math.random(),
                    type: 'worm',
                    shape: 'worm',
                    x: tail.x, y: tail.y,
                    size: 20 - (nextIdx * 0.4),
                    hp: e.maxHp * 0.15,
                    maxHp: e.maxHp * 0.15,
                    spd: e.spd,
                    boss: false, bossType: 0, bossAttackPattern: 0, lastAttack: 0, dead: false,
                    shellStage: 1,
                    palette: e.palette,
                    eraPalette: e.eraPalette,
                    fluxState: 0, pulsePhase: 0, rotationPhase: 0,
                    knockback: { x: 0, y: 0 },
                    isRare: false, isElite: false,
                    spawnedAt: state.gameTime,
                    wormId: e.wormId,
                    wormRole: 'segment',
                    wormSegmentIndex: nextIdx,
                    wormPrevId: tail.id,
                    customCollisionDmg: 15,
                    dieOnCollision: true
                };
                tail.wormNextId = newSegment.id;
                state.enemies.push(newSegment);
                spawnParticles(state, tail.x, tail.y, '#4ade80', 10, 20, 30, 'void');
                console.log(`[WORM] Regrew segment ${nextIdx}`);
            }
        }
    }

    const dx = tx - e.x;
    const dy = ty - e.y;
    const angle = Math.atan2(dy, dx);

    if (e.wormBurrowState === 'surface') {
        const currentSpd = e.wormAIState === 'charging' ? e.spd * 2.5 : e.spd * 1.3;
        
        const targetVx = Math.cos(angle) * currentSpd;
        const targetVy = Math.sin(angle) * currentSpd;
        e.vx = (e.vx || 0) * 0.9 + targetVx * 0.1;
        e.vy = (e.vy || 0) * 0.9 + targetVy * 0.1;

        if (state.frameCount % 10 === 0) {
            spawnParticles(state, e.x, e.y, e.palette[2], 2, 8, 15, 'void');
        }

        
        if (now >= (e.wormBurrowTimer || 0) && e.wormAIState !== 'charging') {
            e.wormBurrowState = 'digging';
            e.wormBurrowTimer = now + 1.2;
            playSfx('eruption');
            spawnParticles(state, e.x, e.y, e.palette[1], 20);
        }
    } else if (e.wormBurrowState === 'digging') {
        if (now >= (e.wormBurrowTimer || 0)) {
            e.wormBurrowState = 'underground';
            e.wormBurrowTimer = now + 8.0; 
            playSfx('smoke-puff');
        }
    } else if (e.wormBurrowState === 'underground') {
        const subterraneanSpd = e.spd * 0.8;
        e.vx = Math.cos(angle) * subterraneanSpd;
        e.vy = Math.sin(angle) * subterraneanSpd;

        if (state.frameCount % 8 === 0) {
            spawnParticles(state, e.x, e.y, e.palette[1], 1, 8, 15, 'void');
        }

        if (now >= (e.wormBurrowTimer || 0)) {
            e.wormBurrowState = 'erupting';
            e.wormBurrowTimer = now + 0.6;
            e.vx *= 0.5; e.vy *= 0.5;

            const pDist = Math.hypot(player.x - e.x, player.y - e.y);
            if (pDist < 160) {
                const pDx = player.x - e.x;
                const pDy = player.y - e.y;
                player.knockback.x = (pDx / pDist) * 35;
                player.knockback.y = (pDy / pDist) * 35;
            }
            playSfx('impact');
            spawnParticles(state, e.x, e.y, e.palette[0], 40, 30, 40, 'void');
        }
    } else if (e.wormBurrowState === 'erupting') {
        if (now >= (e.wormBurrowTimer || 0)) {
            e.wormBurrowState = 'surface';
            e.wormBurrowTimer = now + 12 + Math.random() * 5;
        }
    }

    
    const nX = e.x + (e.vx || 0);
    const nY = e.y + (e.vy || 0);
    if (isInMap(nX, nY)) {
        e.x = nX; e.y = nY;
    } else {
        
        const { normal } = getHexDistToWall(e.x, e.y);
        e.x += normal.x * 50;
        e.y += normal.y * 50;
    }

    
    if (!e.wormHistory) e.wormHistory = [];
    e.wormHistory.unshift({ x: e.x, y: e.y, state: e.wormBurrowState });
    if (e.wormHistory.length > 300) e.wormHistory.pop(); 
}

function updateWormSegment(e: Enemy, state: GameState, step: number) {
    const head = state.enemies.find(h => h.wormId === e.wormId && h.wormRole === 'head' && !h.dead);
    if (!head) {
        
        
        return;
    }

    
    
    const historyIndex = e.wormSegmentIndex! * 6; 
    if (head.wormHistory && head.wormHistory[historyIndex]) {
        const target = head.wormHistory[historyIndex];
        
        const prevPos = head.wormHistory[historyIndex - 1] || target; 
        e.x += (prevPos.x - e.x) * 0.4;
        e.y += (prevPos.y - e.y) * 0.4;

        
        if (state.frameCount % 20 === 0 && Math.random() < 0.3) {
            spawnParticles(state, e.x, e.y, e.palette[1], 1, 5, 12, 'void');
        }

        
        e.wormBurrowState = target.state;
    }
}

export function handleVoidBurrowerDeath(state: GameState, deadUnit: Enemy, onEvent?: (event: string, data?: any) => void) {
    if (deadUnit.shape !== 'worm') return;

    
    const prev = state.enemies.find(s => s.id === deadUnit.wormPrevId && !s.dead);
    if (prev) {
        prev.wormNextId = undefined;
    }

    
    let remainingSegments = 0;
    let nextToPromote = null;
    let scanId = deadUnit.wormNextId;
    while (scanId) {
        const candidate = state.enemies.find(s => s.id === scanId);
        if (!candidate) break;
        if (candidate.hp > 0 && !candidate.dead) {
            if (!nextToPromote) nextToPromote = candidate;
            remainingSegments++;
        }
        scanId = candidate.wormNextId;
    }

    if (nextToPromote && remainingSegments >= 3) {
        const isHeadDeath = deadUnit.wormRole === 'head';
        
        promoteToHead(state, nextToPromote, deadUnit, !isHeadDeath);

        if (isHeadDeath) {
            
            nextToPromote.wormPromotionTimer = state.gameTime + 3.0;
        } else {
            
            nextToPromote.wormPromotionTimer = state.gameTime + 1.0;
            console.log('[WORM] Segment destroyed. Tail promoted to new worm.');
        }
    } else if (nextToPromote) {
        
        let killId: number | undefined = nextToPromote.id;
        while (killId) {
            const candidate = state.enemies.find(s => s.id === killId);
            if (!candidate) break;
            const nextKillId = candidate.wormNextId;
            handleEnemyDeath(state, candidate, onEvent);
            killId = nextKillId;
        }
    }
}

function promoteToHead(state: GameState, next: Enemy, prevDeath: Enemy, isSplit: boolean = false) {
    next.wormRole = 'head';
    next.wormBurrowState = prevDeath.wormBurrowState || 'surface';
    next.wormBurrowTimer = state.gameTime + 2;

    
    
    
    
    const head = state.enemies.find(h => h.wormId === prevDeath.wormId && h.wormRole === 'head' && !h.dead);

    if (head && head.wormHistory && !isSplit) {
        next.wormHistory = [...head.wormHistory];
    } else {
        
        next.wormHistory = Array(150).fill(null).map(() => ({ x: next.x, y: next.y, state: next.wormBurrowState }));
    }

    if (isSplit) {
        next.wormId = `worm_split_${Math.random()}`;
    } else {
        next.wormId = prevDeath.wormId;
    }

    
    next.hp = next.maxHp * 2.5;
    next.maxHp *= 2.5;
    if (!isSplit) next.size = 28; 

    
    let current = next;
    let index = 1;
    while (current.wormNextId) {
        const following = state.enemies.find(s => s.id === current.wormNextId);
        if (!following) break;
        following.wormId = next.wormId;
        following.wormSegmentIndex = index++;
        current = following;
    }
}
