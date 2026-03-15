import type { PixiApp } from './PixiApp'

const LERP_FACTOR = 0.12
const SHAKE_DECAY = 0.85

export class PixiCamera {
    x = 0
    y = 0
    zoom = 1

    private shakeX = 0
    private shakeY = 0
    private shakeIntensity = 0

    applyTo(pixi: PixiApp): void {
        const sx = this.shakeX
        const sy = this.shakeY
        pixi.updateCamera(this.x + sx, this.y + sy, this.zoom)
    }

    follow(targetX: number, targetY: number, dt: number): void {
        const t = 1 - Math.pow(1 - LERP_FACTOR, dt * 60)
        this.x += (targetX - this.x) * t
        this.y += (targetY - this.y) * t
    }

    snapTo(targetX: number, targetY: number): void {
        this.x = targetX
        this.y = targetY
    }

    addShake(intensity: number): void {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity)
    }

    update(dt: number): void {
        if (this.shakeIntensity > 0.1) {
            const frames = dt * 60
            const decay = Math.pow(SHAKE_DECAY, frames)
            this.shakeX = (Math.random() * 2 - 1) * this.shakeIntensity
            this.shakeY = (Math.random() * 2 - 1) * this.shakeIntensity
            this.shakeIntensity *= decay
        } else {
            this.shakeX = 0
            this.shakeY = 0
            this.shakeIntensity = 0
        }
    }
}
