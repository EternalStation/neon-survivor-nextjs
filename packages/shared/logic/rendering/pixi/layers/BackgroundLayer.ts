import { Container, Graphics } from 'pixi.js'
import type { GameState } from '../../../core/Types'
import { ARENA_CENTERS, ARENA_RADIUS } from '../../../mission/MapLogic'

const GRID_HEX_RADIUS = 120
const GRID_COLOR = 0x1e293b
const GRID_ALPHA = 0.3
const BOUNDARY_COLOR = 0x3b82f6
const BOUNDARY_WIDTH = 30
const BOUNDARY_ALPHA = 0.3

export class BackgroundLayer {
    container: Container
    private gridGraphics: Graphics
    private maskGraphics: Graphics
    private boundaryGraphics: Graphics
    private lastPortalsUnlocked: boolean | null = null

    constructor() {
        this.container = new Container()
        this.maskGraphics = new Graphics()
        this.gridGraphics = new Graphics()
        this.boundaryGraphics = new Graphics()

        this.container.addChild(this.maskGraphics)
        this.gridGraphics.mask = this.maskGraphics
        this.container.addChild(this.gridGraphics)
        this.container.addChild(this.boundaryGraphics)
    }

    update(state: GameState, screenWidth: number, screenHeight: number): void {
        const { camera, portalsUnlocked } = state

        if (this.lastPortalsUnlocked !== portalsUnlocked) {
            this.lastPortalsUnlocked = portalsUnlocked
            this.rebuildMask(portalsUnlocked)
            this.rebuildBoundaries(portalsUnlocked)
        }

        this.rebuildGrid(camera.x, camera.y, screenWidth, screenHeight)
        // The original canvas renderer leaves arena vignette empty/commented out,
        // so this layer intentionally skips the Pixi vignette for parity.
    }

    private visibleArenas(portalsUnlocked: boolean) {
        return portalsUnlocked ? ARENA_CENTERS : ARENA_CENTERS.filter(c => c.id === 0)
    }

    private drawHexPath(gfx: Graphics, cx: number, cy: number, r: number): void {
        for (let i = 0; i < 6; i++) {
            const ang = Math.PI / 3 * i
            const x = cx + r * Math.cos(ang)
            const y = cy + r * Math.sin(ang)
            if (i === 0) gfx.moveTo(x, y)
            else gfx.lineTo(x, y)
        }
        gfx.closePath()
    }

    private rebuildMask(portalsUnlocked: boolean): void {
        this.maskGraphics.clear()
        for (const c of this.visibleArenas(portalsUnlocked)) {
            this.drawHexPath(this.maskGraphics, c.x, c.y, ARENA_RADIUS)
        }
        this.maskGraphics.fill({ color: 0xffffff })
    }

    private rebuildBoundaries(portalsUnlocked: boolean): void {
        this.boundaryGraphics.clear()
        for (const c of this.visibleArenas(portalsUnlocked)) {
            this.drawHexPath(this.boundaryGraphics, c.x, c.y, ARENA_RADIUS)
        }
        this.boundaryGraphics.stroke({
            width: BOUNDARY_WIDTH,
            color: BOUNDARY_COLOR,
            alpha: BOUNDARY_ALPHA,
            cap: 'round',
            join: 'round',
        })
    }

    private rebuildGrid(cameraX: number, cameraY: number, screenWidth: number, screenHeight: number): void {
        const r = GRID_HEX_RADIUS
        const hDist = 1.5 * r
        const vDist = Math.sqrt(3) * r
        const scale = 0.58
        const vW = screenWidth / scale
        const vH = screenHeight / scale

        const startX = Math.floor((cameraX - vW / 2) / hDist) - 1
        const endX = Math.ceil((cameraX + vW / 2) / hDist) + 1
        const startY = Math.floor((cameraY - vH / 2) / vDist) - 1
        const endY = Math.ceil((cameraY + vH / 2) / vDist) + 2

        this.gridGraphics.clear()

        for (let i = startX; i <= endX; i++) {
            for (let j = startY; j <= endY; j++) {
                const x = i * hDist
                const y = j * vDist + (i % 2 === 0 ? 0 : vDist / 2)
                this.gridGraphics.moveTo(x + r, y)
                for (let k = 1; k < 6; k++) {
                    const ang = (Math.PI / 3) * k
                    this.gridGraphics.lineTo(x + r * Math.cos(ang), y + r * Math.sin(ang))
                }
                this.gridGraphics.closePath()
            }
        }

        this.gridGraphics.stroke({
            width: 1,
            color: GRID_COLOR,
            alpha: GRID_ALPHA,
        })
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
