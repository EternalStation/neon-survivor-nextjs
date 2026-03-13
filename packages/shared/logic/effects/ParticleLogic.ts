import type { GameState } from '../core/Types';
import { formatLargeNumber } from '../../utils/Format';

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife?: number;
    color: string;
    size: number;
    type?: 'shard' | 'spark' | 'shockwave' | 'bubble' | 'vapor' | 'void' | 'shockwave_circle' | 'dust';
    alpha?: number;
    startAngle?: number;
    endAngle?: number;
}

export function spawnParticles(state: GameState, x: number, y: number, color: string | string[], count: number = 8, sizeOverride?: number, lifeOverride?: number, type: 'shard' | 'spark' | 'shockwave' | 'bubble' | 'vapor' | 'void' | 'shockwave_circle' | 'dust' = 'spark', startAngle?: number, endAngle?: number) {
    if (!state.particles) state.particles = [];

    const totalParticles = state.particles.length;
    if (type === 'void') {
        if (totalParticles > 700) return;
    } else {
        if (totalParticles > 500) return;
    }

    for (let i = 0; i < count; i++) {
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

        state.particles.push({
            x,
            y,
            vx: pV.vx,
            vy: pV.vy,
            life,
            maxLife: life,
            color: selectedColor,
            size: (sizeOverride || (Math.random() * 3 + 1)),
            type,
            alpha: 1.0,
            startAngle,
            endAngle
        });
    }
}

export function updateParticles(state: GameState) {
    if (!state.particles) return;

    state.particles = state.particles.filter(p => {
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
        return p.life > 0;
    });

    if (state.floatingNumbers) {
        state.floatingNumbers = state.floatingNumbers.filter(fn => {
            fn.life--;
            if (fn.anchorId !== undefined) {
                const enemy = state.enemies.find(e => e.id === fn.anchorId);
                if (enemy && !enemy.dead) {
                    fn.x = enemy.x;
                    fn.y = enemy.y - enemy.size - 70;
                }
            }
            return fn.life > 0;
        });
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

    state.floatingNumbers.push({
        x: ox,
        y: oy,
        vx: 0,
        vy: 0,
        value: displayValue,
        color,
        backgroundColor,
        life: lifeDuration,
        maxLife: lifeDuration,
        isCrit,
        fontSize,
        anchorId
    });
}
