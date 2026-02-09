
import type { GameState, Enemy } from '../core/types';
import { spawnParticles, spawnFloatingNumber } from '../effects/ParticleLogic';
import { playSfx } from '../audio/AudioLogic';
import { handleEnemyDeath } from '../mission/DeathLogic';
import { isInMap, getHexDistToWall } from '../mission/MapLogic';
import { getProgressionParams } from './EnemySpawnLogic';

export function spawnVoidBurrower(state: GameState, x: number, y: number, segments: number = 16) {
    const wormId = `worm_${Math.random()}`;
    const { shapeDef, eraPalette } = getProgressionParams(state.gameTime);

    // Scaling (matches spawnEnemy base logic roughly)
    const minutes = state.gameTime / 60;
    const difficultyMult = 1 + (minutes * Math.log2(2 + minutes) / 30);
    const hpMult = Math.pow(1.65, Math.floor(minutes / 5)) * 1.5; // Worm is tough
    const baseHp = 60 * Math.pow(1.2, minutes) * difficultyMult;
    const bossHpMult = 25 + Math.floor(minutes);
    const finalHp = baseHp * hpMult * bossHpMult; // Updated to 25x + 1x per minute as requested for bosses

    // UNIQUE PALETTE: Pale Nightmare (Ghostly White Body + Sulfur Yellow Accents + Deep Slate Outline)
    // 0: Core (Eyes), 1: Outer (Outline/Sand), 2: Inner (Pincers/Glow)
    const wormPalette = ['#ffffff', '#fde047', '#475569'];

    const head: Enemy = {
        id: Math.random(),
        type: 'worm',
        shape: 'worm',
        x, y,
        size: 28, // Smaller head
        hp: finalHp,
        maxHp: finalHp,
        spd: 1.6,
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
        wormHistory: Array(150).fill(null).map(() => ({ x, y, state: 'surface' })), // Corrected initialization
        wormBurrowState: 'surface',
        wormBurrowTimer: state.gameTime + 8 + Math.random() * 4,
        wormAIState: 'stalking',
        wormFlankAngle: Math.random() * Math.PI * 2,
        wormOrbitDir: Math.random() > 0.5 ? 1 : -1,
        wormOrbitRadius: 450,
        wormLungeTimer: state.gameTime + 4 + Math.random() * 2,
        wormLungeActive: false,
        wormTrueDamage: 20, // 20% True Damage (Pierces armor/reduction)
        customCollisionDmg: 20
    };

    state.enemies.push(head);

    let prev = head;
    const segmentCount = 20; // Exactly 20 segments
    for (let i = 1; i <= segmentCount; i++) {
        const segmentHp = finalHp * 0.20; // 20% of head HP as requested
        const segment: Enemy = {
            id: Math.random(),
            type: 'worm',
            shape: 'worm',
            x, y,
            size: 20 - (i * 0.4), // Bigger segments, subtle taper
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
            customCollisionDmg: 15, // 15% player HP damage on collision
            dieOnCollision: true // Body segments die if they touch player
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

    // --- PROMOTION DELAY (Hydra Split) ---
    if (e.wormPromotionTimer && now < e.wormPromotionTimer) {
        e.vx = 0; e.vy = 0; // Freeze while emerging
        return;
    }

    if (e.wormPromotionTimer && now >= e.wormPromotionTimer) {
        // FINISH PROMOTION: Immediately dive underground and grow to head size
        e.wormPromotionTimer = undefined;
        e.wormBurrowState = 'digging';
        e.wormBurrowTimer = now + 1.2;
        e.size = 28; // Now it becomes a full head
        playSfx('eruption');
    }

    // AI State Switching
    if (state.frameCount % 180 === 0 && !e.wormLungeActive) {
        e.wormAIState = e.wormAIState === 'stalking' ? 'charging' : 'stalking';
        e.wormFlankAngle = Math.random() * Math.PI * 2;
    }

    // --- BAITED AI: PREDATORY ORBIT & EXPOSE ---
    // The worm wants you to hit its body to trigger a split.
    let tx = player.x;
    let ty = player.y;

    if (e.wormBurrowState === 'surface') {
        const timeInState = now - (e.spawnedAt || 0);

        // Timer-based state switching for rhythmic behavior
        const cycleTime = 12; // 12s per full loop
        const inCycle = now % cycleTime;
        const isAttacking = inCycle < 1.5; // 1.5s attack window

        if (isAttacking) {
            e.wormAIState = 'charging';
            // Snap to target player
            tx = player.x;
            ty = player.y;
        } else {
            e.wormAIState = 'stalking';
            // PREDATORY ORBIT: Calculate a point on the orbit circle
            const orbitRadius = 400 + Math.sin(now) * 50;
            const orbitSpeed = 1.0 * (e.wormOrbitDir || 1);

            // Current angle of head relative to player
            const currentAngle = Math.atan2(e.y - player.y, e.x - player.x);
            // Target angle is slightly ahead in the orbit direction
            const targetAngle = currentAngle + orbitSpeed * 0.15;

            tx = player.x + Math.cos(targetAngle) * orbitRadius;
            ty = player.y + Math.sin(targetAngle) * orbitRadius;
        }
    } else if (e.wormBurrowState === 'underground') {
        // WANDER & REGENERATE: Move aimlessly far away
        const wanderAngle = (now * 0.4) + (e.id || 0);
        const wanderRadius = 650;
        tx = player.x + Math.cos(wanderAngle) * wanderRadius;
        ty = player.y + Math.sin(wanderAngle) * wanderRadius;

        // Regeneration: 1.5% max HP per second
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

        // --- REGENERATIVE GROWTH ---
        // Regrow 1 segment every 3 seconds if below cap (20)
        if (state.frameCount % 180 === 0) {
            const currentSegments = state.enemies.filter(s => s.wormId === e.wormId && s.wormRole === 'segment' && !s.dead);
            if (currentSegments.length < 20) {
                // Find the current tail to append to
                // Find the current tail to append to
                let tail = e;
                while (tail.wormNextId) {
                    const next = state.enemies.find(s => s.id === tail.wormNextId && !s.dead);
                    if (!next) {
                        // Trail is broken by death, sever link to old tail
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
        // Smooth velocity application (easing)
        const targetVx = Math.cos(angle) * currentSpd;
        const targetVy = Math.sin(angle) * currentSpd;
        e.vx = (e.vx || 0) * 0.9 + targetVx * 0.1;
        e.vy = (e.vy || 0) * 0.9 + targetVy * 0.1;

        if (state.frameCount % 10 === 0) {
            spawnParticles(state, e.x, e.y, e.palette[2], 2, 8, 15, 'void');
        }

        // Transition to Digging (Wait if charging)
        if (now >= (e.wormBurrowTimer || 0) && e.wormAIState !== 'charging') {
            e.wormBurrowState = 'digging';
            e.wormBurrowTimer = now + 1.2;
            playSfx('eruption');
            spawnParticles(state, e.x, e.y, e.palette[1], 20);
        }
    } else if (e.wormBurrowState === 'digging') {
        if (now >= (e.wormBurrowTimer || 0)) {
            e.wormBurrowState = 'underground';
            e.wormBurrowTimer = now + 8.0; // Longer underground for wander/regen
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

    // Update Position
    const nX = e.x + (e.vx || 0);
    const nY = e.y + (e.vy || 0);
    if (isInMap(nX, nY)) {
        e.x = nX; e.y = nY;
    } else {
        // Bounce off walls
        const { normal } = getHexDistToWall(e.x, e.y);
        e.x += normal.x * 50;
        e.y += normal.y * 50;
    }

    // Update History
    if (!e.wormHistory) e.wormHistory = [];
    e.wormHistory.unshift({ x: e.x, y: e.y, state: e.wormBurrowState });
    if (e.wormHistory.length > 300) e.wormHistory.pop(); // Capacity for long snakes
}

function updateWormSegment(e: Enemy, state: GameState, step: number) {
    const head = state.enemies.find(h => h.wormId === e.wormId && h.wormRole === 'head' && !h.dead);
    if (!head) {
        // Orphaned segment - should be promoted or die soon. 
        // Logic in handleVoidBurrowerDeath should prevent this, but we'll return to be safe.
        return;
    }

    // Follow history of head
    // Each segment is spaced by ~30-45px
    const historyIndex = e.wormSegmentIndex! * 9; // Increased from 6 for more elongated spacing
    if (head.wormHistory && head.wormHistory[historyIndex]) {
        const target = head.wormHistory[historyIndex];
        // Move towards history point
        const prevPos = head.wormHistory[historyIndex - 1] || target; // Get previous position for smoother follow
        e.x += (prevPos.x - e.x) * 0.4;
        e.y += (prevPos.y - e.y) * 0.4;

        // Small sand trail for segments
        if (state.frameCount % 20 === 0 && Math.random() < 0.3) {
            spawnParticles(state, e.x, e.y, e.palette[1], 1, 5, 12, 'void');
        }

        // Derive burrow state from history for SEQUENTIAL TRANSITIONS
        e.wormBurrowState = target.state;
    }
}

export function handleVoidBurrowerDeath(state: GameState, deadUnit: Enemy, onEvent?: (event: string, data?: any) => void) {
    if (deadUnit.shape !== 'worm') return;

    // 1. Sever link from the previous segment (Stop the front from following the dead part)
    const prev = state.enemies.find(s => s.id === deadUnit.wormPrevId && !s.dead);
    if (prev) {
        prev.wormNextId = undefined;
    }

    // 2. Find the NEXT ALIVE segment to promote to the new head
    let nextToPromote = null;
    let scanId = deadUnit.wormNextId;
    while (scanId) {
        const candidate = state.enemies.find(s => s.id === scanId);
        if (!candidate) break;
        if (!candidate.dead) {
            nextToPromote = candidate;
            break;
        }
        scanId = candidate.wormNextId;
    }

    if (nextToPromote) {
        const isHeadDeath = deadUnit.wormRole === 'head';
        // Head death: same worm. Body death: Hydra Split (new worm).
        promoteToHead(state, nextToPromote, deadUnit, !isHeadDeath);

        if (!isHeadDeath) {
            // Specific Split logic: Spawn floating number and timer (already in promote if we want, but let's keep it here)
            nextToPromote.wormPromotionTimer = state.gameTime + 1.0;
            console.log('[WORM] Segment destroyed. Tail promoted to new worm.');
            spawnFloatingNumber(state, nextToPromote.x, nextToPromote.y, 'HYDRA SPLIT', '#ff0000', true);
        }
    }
}

function promoteToHead(state: GameState, next: Enemy, prevDeath: Enemy, isSplit: boolean = false) {
    next.wormRole = 'head';
    next.wormBurrowState = prevDeath.wormBurrowState || 'surface';
    next.wormBurrowTimer = state.gameTime + 2;

    // Smooth history transition: inherit or reset history
    // For a split/promotion, we need history for segments to follow.
    // If we inherit, the segments follow the *dead* head's path.
    // That's actually perfect for a ghost follow.
    const head = state.enemies.find(h => h.wormId === prevDeath.wormId && h.wormRole === 'head' && !h.dead);

    if (head && head.wormHistory && !isSplit) {
        next.wormHistory = [...head.wormHistory];
    } else {
        // Reset history for fresh start if it was a split or no head found
        next.wormHistory = Array(150).fill(null).map(() => ({ x: next.x, y: next.y, state: next.wormBurrowState }));
    }

    if (isSplit) {
        next.wormId = `worm_split_${Math.random()}`;
    } else {
        next.wormId = prevDeath.wormId;
    }

    // Buff the new head to make it a distinct target
    next.hp = next.maxHp * 2.5;
    next.maxHp *= 2.5;
    if (!isSplit) next.size = 28; // Only set size immediately if NOT a split (e.g. head promotion)

    // Update all subsequent segments
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
