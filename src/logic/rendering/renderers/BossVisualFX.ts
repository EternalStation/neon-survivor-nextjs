import type { GameState, Enemy } from '../../core/types';

export function renderBossDistortion(ctx: CanvasRenderingContext2D, e: Enemy, state: GameState) {
    const t = state.gameTime;
    const tier = e.bossTier || 1;
    const intensity = Math.min(1, 0.4 + tier * 0.15);

    renderGlitchFrame(ctx, e, t, intensity);
    renderCorruptionTendrils(ctx, e, t, tier);
    renderVoidRift(ctx, e, t, intensity);
    renderChromaticSplit(ctx, e, t, tier);
    renderScanlineDistortion(ctx, e, t, intensity);
    renderEyeOfChaos(ctx, e, t, tier);
}

function renderGlitchFrame(ctx: CanvasRenderingContext2D, e: Enemy, t: number, intensity: number) {
    const glitchSeed = Math.floor(t * 15);
    const pseudoRand = (n: number) => {
        const s = Math.sin(n * 127.1 + glitchSeed * 311.7) * 43758.5453;
        return s - Math.floor(s);
    };

    const shouldGlitch = pseudoRand(e.id || 0) > (1 - intensity * 0.6);
    if (!shouldGlitch) return;

    ctx.save();
    const sliceCount = 3 + Math.floor(pseudoRand((e.id || 0) + 1) * 5);
    for (let i = 0; i < sliceCount; i++) {
        const sliceY = (pseudoRand(i * 7 + (e.id || 0)) - 0.5) * e.size * 2.5;
        const sliceH = 2 + pseudoRand(i * 3 + 1) * 8;
        const offsetX = (pseudoRand(i * 11 + 2) - 0.5) * e.size * 1.5 * intensity;

        ctx.save();
        ctx.beginPath();
        ctx.rect(-e.size * 2, sliceY, e.size * 4, sliceH);
        ctx.clip();
        ctx.translate(offsetX, 0);

        const hue = pseudoRand(i * 13) > 0.5 ? '#ff0040' : '#00ffff';
        ctx.globalAlpha = 0.3 + pseudoRand(i * 17) * 0.4;
        ctx.fillStyle = hue;
        ctx.fillRect(-e.size * 1.5, sliceY, e.size * 3, sliceH);
        ctx.restore();
    }
    ctx.restore();
}

function renderCorruptionTendrils(ctx: CanvasRenderingContext2D, e: Enemy, t: number, tier: number) {
    const tendrilCount = 4 + tier * 2;
    const p = e.palette || ['#ff0000', '#880000', '#440000'];
    const maxLen = e.size * (1.8 + tier * 0.4);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < tendrilCount; i++) {
        const baseAngle = (i / tendrilCount) * Math.PI * 2 + t * (0.3 + i * 0.05);
        const wobble = Math.sin(t * 3 + i * 1.7) * 0.4;
        const angle = baseAngle + wobble;
        const lengthPulse = 0.6 + Math.sin(t * 4 + i * 2.1) * 0.4;
        const len = maxLen * lengthPulse;

        ctx.save();
        ctx.rotate(angle);

        const grad = ctx.createLinearGradient(e.size * 0.5, 0, len, 0);
        grad.addColorStop(0, p[0]);
        grad.addColorStop(0.5, p[1]);
        grad.addColorStop(1, 'transparent');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 3 - i * 0.15;
        ctx.globalAlpha = 0.4 + Math.sin(t * 6 + i) * 0.2;

        ctx.beginPath();
        ctx.moveTo(e.size * 0.5, 0);
        const segments = 6;
        for (let s = 1; s <= segments; s++) {
            const frac = s / segments;
            const sx = e.size * 0.5 + (len - e.size * 0.5) * frac;
            const sy = Math.sin(t * 5 + i * 3 + frac * 8) * e.size * 0.3 * frac;
            ctx.lineTo(sx, sy);
        }
        ctx.stroke();

        ctx.restore();
    }
    ctx.restore();
}

function renderVoidRift(ctx: CanvasRenderingContext2D, e: Enemy, t: number, intensity: number) {
    const riftPulse = 0.5 + Math.sin(t * 2) * 0.3;
    const riftSize = e.size * (0.4 + intensity * 0.3) * riftPulse;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.15 + intensity * 0.15;

    const riftGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, riftSize);
    riftGrad.addColorStop(0, 'rgba(0,0,0,1)');
    riftGrad.addColorStop(0.6, 'rgba(0,0,0,0.5)');
    riftGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = riftGrad;
    ctx.beginPath();
    ctx.arc(0, 0, riftSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const ringCount = 2 + Math.floor(intensity * 2);
    for (let r = 0; r < ringCount; r++) {
        const ringRadius = riftSize * (0.8 + r * 0.5);
        const ringAlpha = (0.3 - r * 0.08) * (0.7 + Math.sin(t * 8 + r * 2) * 0.3);

        ctx.strokeStyle = r % 2 === 0 ? '#ff0040' : '#8000ff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = Math.max(0.05, ringAlpha);
        ctx.setLineDash([4, 6 + r * 2]);
        ctx.lineDashOffset = t * 40 * (r % 2 === 0 ? 1 : -1);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
}

function renderChromaticSplit(ctx: CanvasRenderingContext2D, e: Enemy, t: number, tier: number) {
    const splitSeed = Math.floor(t * 8);
    const pRand = (n: number) => {
        const s = Math.sin(n * 91.3 + splitSeed * 43.1) * 23421.631;
        return s - Math.floor(s);
    };

    const shouldSplit = pRand((e.id || 0) + 100) > 0.55;
    if (!shouldSplit && tier < 3) return;

    const offset = (2 + tier * 1.5) * (0.5 + Math.sin(t * 12) * 0.5);
    const splitAngle = t * 0.5 + (e.id || 0) * 0.3;

    const colors = ['#ff0000', '#00ff00', '#0000ff'];
    const offsets = [
        { x: Math.cos(splitAngle) * offset, y: Math.sin(splitAngle) * offset },
        { x: Math.cos(splitAngle + 2.09) * offset, y: Math.sin(splitAngle + 2.09) * offset },
        { x: Math.cos(splitAngle + 4.19) * offset, y: Math.sin(splitAngle + 4.19) * offset }
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let c = 0; c < 3; c++) {
        ctx.save();
        ctx.translate(offsets[c].x, offsets[c].y);
        ctx.globalAlpha = 0.12 + tier * 0.03;
        ctx.strokeStyle = colors[c];
        ctx.lineWidth = 2;
        ctx.beginPath();
        drawBossOutline(ctx, e, e.size * 0.95);
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function renderScanlineDistortion(ctx: CanvasRenderingContext2D, e: Enemy, t: number, intensity: number) {
    ctx.save();

    const scanSpeed = 60 + intensity * 40;
    const scanY = ((t * scanSpeed) % (e.size * 4)) - e.size * 2;
    const scanWidth = e.size * 3;
    const scanHeight = 3 + intensity * 4;

    ctx.globalAlpha = 0.15 + intensity * 0.15;
    const scanGrad = ctx.createLinearGradient(0, scanY - scanHeight, 0, scanY + scanHeight);
    scanGrad.addColorStop(0, 'transparent');
    scanGrad.addColorStop(0.3, '#ffffff');
    scanGrad.addColorStop(0.5, '#ffffff');
    scanGrad.addColorStop(0.7, '#ffffff');
    scanGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = scanGrad;
    ctx.fillRect(-scanWidth / 2, scanY - scanHeight, scanWidth, scanHeight * 2);

    const lineSpacing = 4;
    ctx.globalAlpha = 0.04 + intensity * 0.03;
    ctx.fillStyle = '#000000';
    for (let ly = -e.size * 1.5; ly < e.size * 1.5; ly += lineSpacing) {
        ctx.fillRect(-e.size * 1.5, ly, e.size * 3, 1);
    }

    ctx.restore();
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
