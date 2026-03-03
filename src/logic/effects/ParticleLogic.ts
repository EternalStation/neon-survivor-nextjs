import type { GameState } from '../core/types';
import { formatLargeNumber } from '../../utils/format';

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    type?: 'shard' | 'spark' | 'shockwave' | 'bubble' | 'vapor' | 'void' | 'shockwave_circle' | 'dust';
    alpha?: number; // For fading effects
}

export function spawnParticles(state: GameState, x: number, y: number, color: string | string[], count: number = 8, sizeOverride?: number, lifeOverride?: number, type: 'shard' | 'spark' | 'shockwave' | 'bubble' | 'vapor' | 'void' | 'shockwave_circle' | 'dust' = 'spark') {
    if (!state.particles) state.particles = [];

    // Performance: Cap particles — void particles get a higher cap to ensure visibility
    const totalParticles = state.particles.length;
    if (type === 'void') {
        if (totalParticles > 700) return; // Void has extra budget
    } else {
        if (totalParticles > 500) return; // Non-void capped at 500
    }

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * 6.28;
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
            pV.vy = -Math.random() * 0.5 - 0.2; // Rise
        } else if (type === 'void') {
            pV.vx *= 0.1;
            pV.vy *= 0.1;
        }

        state.particles.push({
            x,
            y,
            vx: pV.vx,
            vy: pV.vy,
            life: (lifeOverride || 30) + Math.random() * 20,
            color: selectedColor,
            size: (sizeOverride || (Math.random() * 3 + 1)),
            type,
            alpha: 1.0
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
            p.vy -= 0.01; // Acceleration up
            p.vx += (Math.random() - 0.5) * 0.05; // Jitter
            if (p.type === 'vapor') p.alpha = p.life / 50;
        } else if (p.type === 'void') {
            p.vx *= 0.9;
            p.vy *= 0.9;
            p.size *= 0.98; // Shrink slower so they remain visible
        } else {
            p.vx *= 0.95;
            p.vy *= 0.95;
        }
        return p.life > 0;
    });

    if (state.floatingNumbers) {
        state.floatingNumbers = state.floatingNumbers.filter(fn => {
            fn.x += fn.vx;
            fn.y += fn.vy;
            fn.vy += 0.05; // Gentle float/gravity
            fn.life--;
            return fn.life > 0;
        });
    }
}

export function spawnFloatingNumber(state: GameState, x: number, y: number, value: string, color: string = '#ffffff', isCrit: boolean = false, backgroundColor?: string) {
    if (!state.floatingNumbers) state.floatingNumbers = [];

    // 1. Distance Check (Optimization)
    // Don't spawn floating numbers if too far away (e.g. > 1300px from player)
    const distSq = (x - state.player.x) ** 2 + (y - state.player.y) ** 2;
    if (distSq > 1300 * 1300) return;

    // 2. Format Value
    // If it's a pure number (no text like "FLUX"), format it
    let displayValue = value;
    // Check if string is a valid number (allowing negatives, decimals, and scientific notation)
    // Matches: 123, -123.45, 1.23e+21, 5E-10
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value)) {
        displayValue = formatLargeNumber(value);
    }

    // Offset slightly to avoid overlap with model (randomized angle)
    const angle = Math.random() * Math.PI * 2;
    const offsetDist = 15; // 15px offset
    const ox = x + Math.cos(angle) * offsetDist;
    const oy = y + Math.sin(angle) * offsetDist;

    state.floatingNumbers.push({
        x: ox,
        y: oy,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -2 - Math.random() * 1.5, // Always float up
        value: displayValue,
        color,
        backgroundColor,
        life: 60, // 1 second
        maxLife: 60,
        isCrit
    });
}
