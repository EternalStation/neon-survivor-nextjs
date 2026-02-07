
import type { GameState, Enemy } from '../types';

/**
 * Implements a "Flanker" AI behavior where the enemy circles the player
 * to attack from the side or behind, instead of charging directly.
 */
export function getFlankingVelocity(e: Enemy, state: GameState, targetX: number, targetY: number, currentSpd: number, pushX: number, pushY: number): { vx: number, vy: number } {
    if (e.flankStatus === undefined) e.flankStatus = 0;
    if (!e.flankTimer) e.flankTimer = state.gameTime;

    const dx = targetX - e.x;
    const dy = targetY - e.y;
    const distToPlayer = Math.hypot(dx, dy);
    const angleToPlayer = Math.atan2(dy, dx);
    const flankDist = e.flankDistance || 600;

    // Movement logic
    if (e.flankStatus === 0) {
        // FLANKING STATE: Orbit the player to find an opening
        if (e.flankAngle === undefined) {
            // Pick a side (cw or ccw) 
            e.flankAngle = angleToPlayer + Math.PI;
            e.dodgeDir = Math.random() > 0.5 ? 1 : -1;
        }

        // Rotate orbit point
        const orbitSpd = 0.02 * (e.dodgeDir || 1);
        e.flankAngle += orbitSpd;

        // Targeted position in orbit
        const tx = targetX + Math.cos(e.flankAngle) * flankDist;
        const ty = targetY + Math.sin(e.flankAngle) * flankDist;

        const moveDx = tx - e.x;
        const moveDy = ty - e.y;
        const moveDist = Math.hypot(moveDx, moveDy);

        // Transition to Strike: If within range of orbit AND relative angle from original entrance is large enough
        // This ensures they don't just "ping-pong", but actually "come around"
        const angleDiff = Math.abs(((e.flankAngle - angleToPlayer + Math.PI) % (Math.PI * 2)) - Math.PI);
        if (angleDiff > Math.PI * 0.7 && moveDist < 150) {
            e.flankStatus = 1;
            e.flankTimer = state.gameTime + 3.0 + Math.random() * 2; // Strike for a few seconds
        }

        if (moveDist > 2) {
            return {
                vx: (moveDx / moveDist) * currentSpd + pushX,
                vy: (moveDy / moveDist) * currentSpd + pushY
            };
        }
    } else {
        // STRIKING STATE: Proactive charge
        if (state.gameTime > (e.flankTimer || 0)) {
            e.flankStatus = 0;
            e.flankDistance = 500 + Math.random() * 400; // Reset orbit distance
            e.flankAngle = undefined; // Force re-calc side
        }

        // Direct chase with increased aggression
        return {
            vx: Math.cos(angleToPlayer) * currentSpd * 1.15 + pushX,
            vy: Math.sin(angleToPlayer) * currentSpd * 1.15 + pushY
        };
    }

    // Default (shouldn't really hit)
    return {
        vx: Math.cos(angleToPlayer) * currentSpd + pushX,
        vy: Math.sin(angleToPlayer) * currentSpd + pushY
    };
}
