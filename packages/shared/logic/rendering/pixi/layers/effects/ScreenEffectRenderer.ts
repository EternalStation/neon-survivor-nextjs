import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { Application } from 'pixi.js'
import type { Enemy, GameState } from '../../../../core/Types'
import { calcStat } from '../../../../utils/MathUtils'
import { getPulseIntensity } from '../../../../effects/PulseSystem'

const VIEWPORT_SCALE = 0.58
const EDGE_PADDING = 60
const BOSS_ARROW_OFFSET = 36
const BOSS_ARROW_LENGTH = 28
const BOSS_ARROW_WIDTH = 18

export class ScreenEffectRenderer {
    readonly container: Container

    private vignetteSprite: Sprite
    private dangerSprite: Sprite
    private latePulseSprite: Sprite
    private flashSprite: Sprite
    private bossIndicatorGfx: Graphics
    private radialOverlayTexture: Texture | null = null
    private vignetteTexture: Texture | null = null
    private lastWidth = 0
    private lastHeight = 0

    constructor(_app: Application) {
        this.container = new Container()

        this.vignetteSprite = new Sprite(Texture.EMPTY)
        this.vignetteSprite.eventMode = 'none'

        this.dangerSprite = new Sprite(Texture.EMPTY)
        this.dangerSprite.eventMode = 'none'
        this.dangerSprite.tint = 0xdc1414
        this.dangerSprite.alpha = 0

        this.latePulseSprite = new Sprite(Texture.EMPTY)
        this.latePulseSprite.eventMode = 'none'
        this.latePulseSprite.tint = 0xdc2626
        this.latePulseSprite.alpha = 0

        this.flashSprite = new Sprite(Texture.WHITE)
        this.flashSprite.eventMode = 'none'
        this.flashSprite.tint = 0xffffff
        this.flashSprite.alpha = 0

        this.bossIndicatorGfx = new Graphics()
        this.bossIndicatorGfx.eventMode = 'none'

        this.container.addChild(this.vignetteSprite)
        this.container.addChild(this.dangerSprite)
        this.container.addChild(this.latePulseSprite)
        this.container.addChild(this.flashSprite)
        this.container.addChild(this.bossIndicatorGfx)
    }

    update(state: GameState, screenWidth: number, screenHeight: number): void {
        if (screenWidth <= 0 || screenHeight <= 0) return

        if (screenWidth !== this.lastWidth || screenHeight !== this.lastHeight) {
            this.rebuildTextures(screenWidth, screenHeight)
            this.lastWidth = screenWidth
            this.lastHeight = screenHeight
        }

        this.updateDangerOverlay(state)
        this.updateLatePulse(state)
        this.updateFlash(state, screenWidth, screenHeight)
        this.updateBossIndicators(state, screenWidth, screenHeight)
    }

    destroy(): void {
        this.container.destroy({ children: true })
        this.vignetteTexture?.destroy(true)
        this.radialOverlayTexture?.destroy(true)
        this.vignetteTexture = null
        this.radialOverlayTexture = null
    }

    private rebuildTextures(width: number, height: number): void {
        this.vignetteTexture?.destroy(true)
        this.radialOverlayTexture?.destroy(true)

        this.vignetteTexture = Texture.from(this.buildVignetteCanvas(width, height))
        this.radialOverlayTexture = Texture.from(this.buildRadialOverlayCanvas(width, height))

        this.vignetteSprite.texture = this.vignetteTexture
        this.dangerSprite.texture = this.radialOverlayTexture
        this.latePulseSprite.texture = this.radialOverlayTexture

        this.vignetteSprite.position.set(0, 0)
        this.dangerSprite.position.set(0, 0)
        this.latePulseSprite.position.set(0, 0)
        this.flashSprite.position.set(0, 0)

        this.vignetteSprite.width = width
        this.vignetteSprite.height = height
        this.dangerSprite.width = width
        this.dangerSprite.height = height
        this.latePulseSprite.width = width
        this.latePulseSprite.height = height
        this.flashSprite.width = width
        this.flashSprite.height = height
    }

    private updateDangerOverlay(state: GameState): void {
        const maxHp = calcStat(state.player.hp)
        const hpRatio = Math.max(0, Math.min(1, state.player.curHp / Math.max(1, maxHp)))
        let ambientAlpha = 0

        if (hpRatio <= 0.5) {
            if (hpRatio > 0.2) ambientAlpha = ((0.5 - hpRatio) / 0.3) * 0.15
            else ambientAlpha = 0.15 + ((0.2 - hpRatio) / 0.2) * 0.15

            if (hpRatio <= 0.2) {
                const pulse = 0.5 + 0.5 * Math.sin(state.gameTime * 1.2 * Math.PI * 2)
                ambientAlpha *= 0.7 + 0.3 * pulse
            }
        }

        let damageAlpha = 0
        if (state.player.lastDamageTime !== undefined) {
            const elapsedDamage = state.gameTime - state.player.lastDamageTime
            const flashDuration = 0.35
            if (elapsedDamage < flashDuration && hpRatio <= 0.5) {
                const flashProgress = 1 - (elapsedDamage / flashDuration)
                const maxFlash = hpRatio <= 0.2 ? 0.22 : 0.12
                damageAlpha = flashProgress * maxFlash
            }
        }

        this.dangerSprite.alpha = Math.min(1, ambientAlpha + damageAlpha)
    }

    private updateLatePulse(state: GameState): void {
        if (state.gameTime <= 1800) {
            this.latePulseSprite.alpha = 0
            return
        }

        const intensity = getPulseIntensity(state.gameTime)
        this.latePulseSprite.alpha = Math.max(0, (intensity - 0.4) * 0.2)
    }

    private updateFlash(state: GameState, screenWidth: number, screenHeight: number): void {
        this.flashSprite.width = screenWidth
        this.flashSprite.height = screenHeight
        this.flashSprite.alpha = Math.max(0, Math.min(1, state.flashIntensity || 0))
    }

    private updateBossIndicators(state: GameState, screenWidth: number, screenHeight: number): void {
        this.bossIndicatorGfx.clear()

        const bosses = state.enemies.filter(enemy => enemy.boss && !enemy.dead)
        if (!bosses.length) return

        const centerX = screenWidth / 2
        const centerY = screenHeight / 2
        const maxX = Math.max(0, centerX - EDGE_PADDING)
        const maxY = Math.max(0, centerY - EDGE_PADDING)

        bosses.forEach((enemy, index) => {
            const bossScreen = this.worldToScreen(enemy, state, screenWidth, screenHeight)
            const visible = (
                bossScreen.x >= EDGE_PADDING &&
                bossScreen.x <= screenWidth - EDGE_PADDING &&
                bossScreen.y >= EDGE_PADDING &&
                bossScreen.y <= screenHeight - EDGE_PADDING
            )
            if (visible) return

            const dirX = bossScreen.x - centerX
            const dirY = bossScreen.y - centerY
            const length = Math.hypot(dirX, dirY) || 1
            const normX = dirX / length
            const normY = dirY / length
            const edgeScale = Math.min(
                maxX / Math.max(Math.abs(dirX), 1e-5),
                maxY / Math.max(Math.abs(dirY), 1e-5),
            )

            const tangentX = -normY
            const tangentY = normX
            const spread = (index - (bosses.length - 1) / 2) * BOSS_ARROW_OFFSET
            const x = centerX + dirX * edgeScale + tangentX * spread
            const y = centerY + dirY * edgeScale + tangentY * spread
            const angle = Math.atan2(normY, normX)
            const pulse = 1 + Math.sin(state.gameTime * 8 + index * 0.7) * 0.15

            this.drawBossArrow(x, y, angle, pulse)
        })
    }

    private drawBossArrow(x: number, y: number, angle: number, scale: number): void {
        const len = BOSS_ARROW_LENGTH * scale
        const width = BOSS_ARROW_WIDTH * scale
        const tail = len * 0.7
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const perpX = -sin
        const perpY = cos

        const tip = { x: x + cos * len, y: y + sin * len }
        const left = { x: x - cos * tail + perpX * width, y: y - sin * tail + perpY * width }
        const right = { x: x - cos * tail - perpX * width, y: y - sin * tail - perpY * width }
        const inner = { x: x - cos * (tail * 0.2), y: y - sin * (tail * 0.2) }

        this.bossIndicatorGfx.moveTo(tip.x, tip.y)
        this.bossIndicatorGfx.lineTo(left.x, left.y)
        this.bossIndicatorGfx.lineTo(inner.x, inner.y)
        this.bossIndicatorGfx.lineTo(right.x, right.y)
        this.bossIndicatorGfx.closePath()
        this.bossIndicatorGfx.fill({ color: 0xff0000, alpha: 0.9 })

        this.bossIndicatorGfx.moveTo(tip.x, tip.y)
        this.bossIndicatorGfx.lineTo(left.x, left.y)
        this.bossIndicatorGfx.lineTo(inner.x, inner.y)
        this.bossIndicatorGfx.lineTo(right.x, right.y)
        this.bossIndicatorGfx.closePath()
        this.bossIndicatorGfx.stroke({ color: 0xffffff, width: 2, alpha: 0.7 })
    }

    private worldToScreen(enemy: Enemy, state: GameState, screenWidth: number, screenHeight: number): { x: number; y: number } {
        return {
            x: (enemy.x - state.camera.x) * VIEWPORT_SCALE + screenWidth / 2,
            y: (enemy.y - state.camera.y) * VIEWPORT_SCALE + screenHeight / 2,
        }
    }

    private buildVignetteCanvas(width: number, height: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return canvas

        const radius = Math.max(width, height) * 0.8
        const cx = width / 2
        const cy = height / 2
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius)
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)')
        grad.addColorStop(0.6, 'rgba(2, 6, 23, 0.2)')
        grad.addColorStop(1, 'rgba(2, 6, 23, 0.9)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
        return canvas
    }

    private buildRadialOverlayCanvas(width: number, height: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return canvas

        const radius = Math.max(width, height) * 0.75
        const cx = width / 2
        const cy = height / 2
        const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius)
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)')
        grad.addColorStop(1, 'rgba(255, 255, 255, 1)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
        return canvas
    }
}
