import type { GameState, Particle, FloatingNumber } from '../core/Types';
import { formatLargeNumber } from '../../utils/Format';
import { ObjectPool, removeDeadInPlace } from '../core/ObjectPool';

export type { Particle, FloatingNumber };

const MAX_GPU_PARTICLES = 10000;

export const particlePool = new ObjectPool<Particle>(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, color: '', size: 0 }),
    (p) => {
        p.x = 0; p.y = 0; p.vx = 0; p.vy = 0; p.life = 0; p.color = ''; p.size = 0;
        p.type = undefined; p.alpha = undefined; p.maxLife = undefined;
        p.decay = undefined; p.isTsunami = undefined; p.isSingularity = undefined;
        p.startAngle = undefined; p.endAngle = undefined;
    }
)

export const floatingNumberPool = new ObjectPool<FloatingNumber>(
    () => ({ x: 0, y: 0, vx: 0, vy: 0, value: '', color: '', life: 0, maxLife: 0, isCrit: false }),
    (fn) => {
        fn.x = 0; fn.y = 0; fn.vx = 0; fn.vy = 0; fn.value = ''; fn.color = '';
        fn.life = 0; fn.maxLife = 0; fn.isCrit = false;
        fn.backgroundColor = undefined; fn.fontSize = undefined; fn.anchorId = undefined;
    }
)

export function spawnParticles(state: GameState, x: number, y: number, color: string | string[], count: number = 8, sizeOverride?: number, lifeOverride?: number, type: 'shard' | 'spark' | 'shockwave' | 'bubble' | 'vapor' | 'void' | 'shockwave_circle' | 'dust' = 'spark', startAngle?: number, endAngle?: number) {
    if (!state.particles) state.particles = [];

    const totalParticles = state.particles.length;
    if (totalParticles >= MAX_GPU_PARTICLES) return;

    for (let i = 0; i < count; i++) {
        if (state.particles.length >= MAX_GPU_PARTICLES) break;
        let angle = Math.random() * 6.28;
        if (startAngle !== undefined && endAngle !== undefined) {
            angle = startAngle + Math.random() * (endAngle - startAngle);
        }
        const speed = type === 'shard' ? (Math.random() * 4 + 2) : (Math.random() * 2 + 1);

        let selectedColor = '';
        if (Array.isArray(color)) {
            selectedColor = color[Math.floor(Math.random() * color.length)];
        } else {
            selectedColor = color;
        }

        let pV = { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };

        if (type === 'bubble') {
            pV.vx = (Math.random() - 0.5) * 0.5;
            pV.vy = -Math.random() * 0.5 - 0.2;
        } else if (type === 'void') {
            pV.vx *= 0.1;
            pV.vy *= 0.1;
        }

        const life = (lifeOverride || 30) + Math.random() * 20;

        const p = particlePool.acquire();
        p.x = x;
        p.y = y;
        p.vx = pV.vx;
        p.vy = pV.vy;
        p.life = life;
        p.maxLife = life;
        p.color = selectedColor;
        p.size = sizeOverride || (Math.random() * 3 + 1);
        p.type = type;
        p.alpha = 1.0;
        p.startAngle = startAngle;
        p.endAngle = endAngle;
        state.particles.push(p);
    }
}

export function updateParticles(state: GameState) {
    if (!state.particles) return;

    for (const p of state.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.type === 'bubble' || p.type === 'vapor') {
            p.vy -= 0.01;
            p.vx += (Math.random() - 0.5) * 0.05;
            if (p.type === 'vapor') p.alpha = p.life / 50;
        } else if (p.type === 'void') {
            p.vx *= 0.9;
            p.vy *= 0.9;
            p.size *= 0.98;
        } else {
            p.vx *= 0.95;
            p.vy *= 0.95;
        }
    }
    removeDeadInPlace(state.particles, p => p.life <= 0, particlePool);

    if (state.floatingNumbers) {
        for (const fn of state.floatingNumbers) {
            fn.life--;
            if (fn.anchorId !== undefined) {
                const enemy = state.enemies.find(e => e.id === fn.anchorId);
                if (enemy && !enemy.dead) {
                    fn.x = enemy.x;
                    fn.y = enemy.y - enemy.size - 70;
                }
            }
        }
        removeDeadInPlace(state.floatingNumbers, fn => fn.life <= 0, floatingNumberPool);
    }
}

export function spawnFloatingNumber(state: GameState, x: number, y: number, value: string, color: string = '#ffffff', isCrit: boolean = false, backgroundColor?: string, fontSize?: number, anchorId?: number) {
    if (!state.floatingNumbers) state.floatingNumbers = [];

    const distSq = (x - state.player.x) ** 2 + (y - state.player.y) ** 2;
    if (distSq > 1300 * 1300) return;

    let displayValue = value;
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
        displayValue = formatLargeNumber(value);
    }

    const ox = x + (Math.random() - 0.5) * 10;
    const oy = y - 25 - Math.random() * 10;

    const isCombatText = /^[+-]?\d+(?:\.\d+)?[a-zA-Z]?$/.test(displayValue) || displayValue === "CRIT";
    const isAlert = isCrit && !isCombatText;
    const lifeDuration = isAlert ? 90 : 60;

    const fn = floatingNumberPool.acquire();
    fn.x = ox;
    fn.y = oy;
    fn.vx = 0;
    fn.vy = 0;
    fn.value = displayValue;
    fn.color = color;
    fn.backgroundColor = backgroundColor;
    fn.life = lifeDuration;
    fn.maxLife = lifeDuration;
    fn.isCrit = isCrit;
    fn.fontSize = fontSize;
    fn.anchorId = anchorId;
    state.floatingNumbers.push(fn);
}
