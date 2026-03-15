const GLOW_SIZES = [16, 24, 32, 48, 64, 96, 128, 192, 384];
const sprites: HTMLCanvasElement[] = [];
let initialized = false;

export function initGlowSprites(): void {
    if (initialized) return;
    initialized = true;
    for (const size of GLOW_SIZES) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const c = canvas.getContext('2d');
        if (!c) { sprites.push(canvas); continue; }
        const cx = size / 2;
        const grad = c.createRadialGradient(cx, cx, 0, cx, cx, cx);
        grad.addColorStop(0, 'rgba(255,255,255,0.9)');
        grad.addColorStop(0.35, 'rgba(255,255,255,0.5)');
        grad.addColorStop(0.7, 'rgba(255,255,255,0.15)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = grad;
        c.fillRect(0, 0, size, size);
        sprites.push(canvas);
    }
}

export function getGlowSprite(radius: number): HTMLCanvasElement | null {
    if (!initialized || sprites.length === 0) return null;
    const needed = radius * 2;
    for (const s of sprites) {
        if (s.width >= needed) return s;
    }
    return sprites[sprites.length - 1];
}

function makeTransparent(color: string): string {
    if (/^#[0-9a-fA-F]{6}$/.test(color)) return color + '00';
    if (/^#[0-9a-fA-F]{3}$/.test(color)) return color + '0';
    return 'rgba(0,0,0,0)';
}

export function drawGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    alpha: number
): void {
    if (alpha <= 0 || radius <= 0) return;
    const r = Math.max(1, radius);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = Math.min(1, alpha);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, makeTransparent(color));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
