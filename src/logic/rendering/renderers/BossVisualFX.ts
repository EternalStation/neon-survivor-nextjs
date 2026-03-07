import type { GameState, Enemy } from '../../core/types';

export function renderBossDistortion(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    const t = state.gameTime;
    const tier = e.bossTier || 1;
    const intensity = Math.min(1, 0.4 + tier * 0.15);

    renderEyeOfChaos(ctx, e, t, tier);
}

function renderEyeOfChaos(ctx: CanvasRenderingContext2D, e: Enemy, t: number, tier: number) {
    if (tier < 2) return;

    const eyeRadius = e.size * (0.15 + tier * 0.05);
    const breathe = 1 + Math.sin(t * 3) * 0.2;
    const pupilRadius = eyeRadius * 0.4 * breathe;

    ctx.save();

    const eyeGrad = ctx.createRadialGradient(0, 0, pupilRadius * 0.3, 0, 0, eyeRadius);
    eyeGrad.addColorStop(0, '#ff0000');
    eyeGrad.addColorStop(0.3, '#ff0040');
    eyeGrad.addColorStop(0.7, '#880020');
    eyeGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = eyeGrad;
    ctx.globalAlpha = 0.6 + Math.sin(t * 5) * 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(0, 0, pupilRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff2020';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(pupilRadius * 0.3, -pupilRadius * 0.3, pupilRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    if (tier >= 4) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4 + Math.sin(t * 10) * 0.2;
        const irisSegments = 8;
        for (let i = 0; i < irisSegments; i++) {
            const iAngle = (i / irisSegments) * Math.PI * 2 + t * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(iAngle) * pupilRadius, Math.sin(iAngle) * pupilRadius);
            ctx.lineTo(Math.cos(iAngle) * eyeRadius * 0.8, Math.sin(iAngle) * eyeRadius * 0.8);
            ctx.stroke();
        }
    }

    ctx.restore();
}

export function drawDistortedBossShape(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    size: number,
    state: GameState
) {
    const t = state.gameTime;
    const tier = e.bossTier || 1;
    const warpIntensity = 0.05 + tier * 0.03;
    const spikeFactor = 0.1 + tier * 0.05;

    switch (e.shape) {
        case 'circle':
            drawDistortedCircle(ctx, size, t, e, warpIntensity, spikeFactor);
            break;
        case 'triangle':
            drawDistortedTriangle(ctx, size, t, e, warpIntensity, spikeFactor);
            break;
        case 'square':
            drawDistortedSquare(ctx, size, t, e, warpIntensity, spikeFactor);
            break;
        case 'diamond':
            drawDistortedDiamond(ctx, size, t, e, warpIntensity, spikeFactor);
            break;
        case 'pentagon':
            drawDistortedPentagon(ctx, size, t, e, warpIntensity, spikeFactor);
            break;
        case 'abomination':
            drawAbominationPath(ctx, size, e, state);
            break;
        default:
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            break;
    }
}

export function drawAbominationPath(ctx: CanvasRenderingContext2D, size: number, e: Enemy, state: GameState) {
    const dx = state.player.x - e.x;
    const dy = state.player.y - e.y;
    const angleToPlayer = Math.atan2(dy, dx);
    const relativeAngle = angleToPlayer - (e.rotationPhase || 0) + Math.PI / 2;

    ctx.save();
    ctx.rotate(relativeAngle);

    const s = size;
    const snoutW = s * 0.5;
    const headCW = s * 0.8;
    const headCY = -s * 0.2;

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(s * 0.5, -s * 0.8);
    ctx.lineTo(headCW, -s * 0.5);
    ctx.lineTo(headCW, headCY);
    ctx.lineTo(snoutW, s * 0.4);
    ctx.lineTo(snoutW * 1.2, s * 0.7);
    ctx.lineTo(0, s * 1.0);
    ctx.lineTo(-snoutW * 1.2, s * 0.7);
    ctx.lineTo(-snoutW, s * 0.4);
    ctx.lineTo(-headCW, headCY);
    ctx.lineTo(-headCW, -s * 0.5);
    ctx.lineTo(-s * 0.5, -s * 0.8);
    ctx.lineTo(0, -s * 0.8);
    ctx.closePath();

    const drawHorn = (side: number) => {
        const hornBaseX = side * s * 0.5;
        const hornBaseY = -s * 0.8;
        const hornTipX = side * s * 2.2;
        const hornTipY = -s * 1.4;

        ctx.moveTo(hornBaseX, hornBaseY);
        ctx.quadraticCurveTo(side * s * 1.5, -s * 0.7, hornTipX, hornTipY);
        ctx.quadraticCurveTo(side * s * 0.9, -s * 0.4, hornBaseX - (side * s * 0.2), hornBaseY + (s * 0.3));
    };
    drawHorn(1);
    drawHorn(-1);

    ctx.restore();
}

function drawDistortedCircle(
    ctx: CanvasRenderingContext2D,
    size: number,
    t: number,
    e: Enemy,
    warp: number,
    spike: number
) {
    const points = 48;
    for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noise1 = Math.sin(angle * 6 + t * 4 + (e.id || 0)) * warp;
        const noise2 = Math.sin(angle * 10 - t * 7) * warp * 0.5;
        const spikeNoise = Math.max(0, Math.sin(angle * 3 + t * 2)) * spike;
        const r = size * (1 + noise1 + noise2 + spikeNoise);
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

function drawDistortedTriangle(
    ctx: CanvasRenderingContext2D,
    size: number,
    t: number,
    e: Enemy,
    warp: number,
    spike: number
) {
    const vertices = [
        { x: 0, y: -size },
        { x: size * 0.866, y: size * 0.5 },
        { x: -size * 0.866, y: size * 0.5 }
    ];
    const subDivisions = 12;

    for (let v = 0; v < 3; v++) {
        const from = vertices[v];
        const to = vertices[(v + 1) % 3];
        for (let s = 0; s <= subDivisions; s++) {
            const frac = s / subDivisions;
            let px = from.x + (to.x - from.x) * frac;
            let py = from.y + (to.y - from.y) * frac;

            const edgeDist = Math.sin(frac * Math.PI);
            const noiseX = Math.sin(t * 5 + v * 3 + frac * 12) * size * warp * edgeDist;
            const noiseY = Math.cos(t * 4 + v * 2 + frac * 8) * size * warp * edgeDist;

            const spikeOut = Math.max(0, Math.sin(frac * Math.PI * 3 + t * 3 + v)) * size * spike * edgeDist;
            const nx = py - from.y;
            const ny = -(px - from.x);
            const nLen = Math.sqrt(nx * nx + ny * ny) || 1;

            px += noiseX + (nx / nLen) * spikeOut;
            py += noiseY + (ny / nLen) * spikeOut;

            if (v === 0 && s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
}

function drawDistortedSquare(
    ctx: CanvasRenderingContext2D,
    size: number,
    t: number,
    e: Enemy,
    warp: number,
    spike: number
) {
    const vertices = [
        { x: -size, y: -size },
        { x: size, y: -size },
        { x: size, y: size },
        { x: -size, y: size }
    ];
    const subDivisions = 10;

    for (let v = 0; v < 4; v++) {
        const from = vertices[v];
        const to = vertices[(v + 1) % 4];
        for (let s = 0; s <= subDivisions; s++) {
            const frac = s / subDivisions;
            let px = from.x + (to.x - from.x) * frac;
            let py = from.y + (to.y - from.y) * frac;

            const edgeDist = Math.sin(frac * Math.PI);
            const noiseX = Math.sin(t * 4 + v * 4 + frac * 10) * size * warp * edgeDist;
            const noiseY = Math.cos(t * 3 + v * 3 + frac * 7) * size * warp * edgeDist;

            const spikeOut = Math.max(0, Math.sin(frac * Math.PI * 2 + t * 2.5 + v * 1.5)) * size * spike * edgeDist;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const edgeLen = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / edgeLen;
            const ny = dx / edgeLen;

            px += noiseX + nx * spikeOut;
            py += noiseY + ny * spikeOut;

            if (v === 0 && s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
}

function drawDistortedDiamond(
    ctx: CanvasRenderingContext2D,
    size: number,
    t: number,
    e: Enemy,
    warp: number,
    spike: number
) {
    const vertices = [
        { x: 0, y: -size * 1.3 },
        { x: size, y: 0 },
        { x: 0, y: size * 1.3 },
        { x: -size, y: 0 }
    ];
    const subDivisions = 10;

    for (let v = 0; v < 4; v++) {
        const from = vertices[v];
        const to = vertices[(v + 1) % 4];
        for (let s = 0; s <= subDivisions; s++) {
            const frac = s / subDivisions;
            let px = from.x + (to.x - from.x) * frac;
            let py = from.y + (to.y - from.y) * frac;

            const edgeDist = Math.sin(frac * Math.PI);
            const noiseX = Math.sin(t * 6 + v * 2.5 + frac * 14) * size * warp * edgeDist;
            const noiseY = Math.cos(t * 5 + v * 3.5 + frac * 9) * size * warp * edgeDist;

            const spikeOut = Math.max(0, Math.sin(frac * Math.PI * 4 + t * 3.5 + v * 2)) * size * spike * edgeDist;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const edgeLen = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / edgeLen;
            const ny = dx / edgeLen;

            px += noiseX + nx * spikeOut;
            py += noiseY + ny * spikeOut;

            if (v === 0 && s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
}

function drawDistortedPentagon(
    ctx: CanvasRenderingContext2D,
    size: number,
    t: number,
    e: Enemy,
    warp: number,
    spike: number
) {
    const vertices: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 5; i++) {
        const ang = (i * 2 * Math.PI / 5) - Math.PI / 2;
        vertices.push({ x: Math.cos(ang) * size, y: Math.sin(ang) * size });
    }
    const subDivisions = 10;

    for (let v = 0; v < 5; v++) {
        const from = vertices[v];
        const to = vertices[(v + 1) % 5];
        for (let s = 0; s <= subDivisions; s++) {
            const frac = s / subDivisions;
            let px = from.x + (to.x - from.x) * frac;
            let py = from.y + (to.y - from.y) * frac;

            const edgeDist = Math.sin(frac * Math.PI);
            const noiseX = Math.sin(t * 3.5 + v * 5 + frac * 11) * size * warp * edgeDist;
            const noiseY = Math.cos(t * 4.5 + v * 4 + frac * 13) * size * warp * edgeDist;

            const spikeOut = Math.max(0, Math.sin(frac * Math.PI * 2.5 + t * 2 + v * 1.8)) * size * spike * edgeDist;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const edgeLen = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / edgeLen;
            const ny = dx / edgeLen;

            px += noiseX + nx * spikeOut;
            py += noiseY + ny * spikeOut;

            if (v === 0 && s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
}

function drawBossOutline(ctx: CanvasRenderingContext2D, e: Enemy, size: number) {
    switch (e.shape) {
        case 'circle':
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            break;
        case 'triangle':
            ctx.moveTo(0, -size);
            ctx.lineTo(size * 0.866, size * 0.5);
            ctx.lineTo(-size * 0.866, size * 0.5);
            ctx.closePath();
            break;
        case 'square':
            ctx.rect(-size, -size, size * 2, size * 2);
            break;
        case 'diamond':
            ctx.moveTo(0, -size * 1.3);
            ctx.lineTo(size, 0);
            ctx.lineTo(0, size * 1.3);
            ctx.lineTo(-size, 0);
            ctx.closePath();
            break;
        case 'pentagon':
            for (let i = 0; i < 5; i++) {
                const ang = (i * 2 * Math.PI / 5) - Math.PI / 2;
                ctx.lineTo(Math.cos(ang) * size, Math.sin(ang) * size);
            }
            ctx.closePath();
            break;
        default:
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            break;
    }
}

export function renderBossAfterglow(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    const t = state.gameTime;
    const tier = e.bossTier || 1;
    const p = e.palette || ['#ff0000', '#880000', '#440000'];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const pulseAlpha = 0.1 + Math.sin(t * 3) * 0.05;
    const glowSize = e.size * (1.6 + tier * 0.2 + Math.sin(t * 2) * 0.2);

    const glow = ctx.createRadialGradient(0, 0, e.size * 0.3, 0, 0, glowSize);
    glow.addColorStop(0, p[0]);
    glow.addColorStop(0.4, p[1]);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.globalAlpha = pulseAlpha;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();

    const particleCount = 3 + tier;
    for (let i = 0; i < particleCount; i++) {
        const pAngle = (i / particleCount) * Math.PI * 2 + t * 1.5;
        const pDist = e.size * (1.2 + Math.sin(t * 4 + i * 2) * 0.4);
        const pSize = 2 + Math.sin(t * 6 + i * 3) * 1.5;

        ctx.fillStyle = i % 2 === 0 ? p[0] : '#ffffff';
        ctx.globalAlpha = 0.3 + Math.sin(t * 5 + i) * 0.2;
        ctx.beginPath();
        ctx.arc(Math.cos(pAngle) * pDist, Math.sin(pAngle) * pDist, Math.max(0.5, pSize), 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}
