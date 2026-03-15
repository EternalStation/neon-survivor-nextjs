export interface Viewport {
    x: number
    y: number
    halfW: number
    halfH: number
}

export function isVisible(ex: number, ey: number, radius: number, vp: Viewport): boolean {
    return (
        ex + radius > vp.x - vp.halfW &&
        ex - radius < vp.x + vp.halfW &&
        ey + radius > vp.y - vp.halfH &&
        ey - radius < vp.y + vp.halfH
    )
}

export function buildViewport(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }): Viewport {
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1
    const halfW = ctx.canvas.width / (dpr * 2 * 0.58)
    const halfH = ctx.canvas.height / (dpr * 2 * 0.58)
    return { x: camera.x, y: camera.y, halfW, halfH }
}
