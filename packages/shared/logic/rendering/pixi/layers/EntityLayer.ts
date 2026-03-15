import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { Enemy, GameState } from '../../../core/Types'
import { getShellVisibility } from '../../ColorPalettes'
import { isVisible } from '../../ViewportCulling'
import type { Viewport } from '../../ViewportCulling'
import type { AtlasEnemyShape } from '../SpriteAtlasGenerator'

const VIEWPORT_SCALE = 0.58
const ENEMY_ATLAS_RADIUS = 36

const ATLAS_SHAPE_SET: Partial<Record<string, true>> = {
    circle: true,
    triangle: true,
    square: true,
    diamond: true,
    pentagon: true,
    hexagon: true,
    snitch: true,
    minion: true,
    elite_minion: true,
    long_drone: true,
    glitcher: true,
}

interface EnemySpriteSet {
    container: Container
    outer: Sprite
    inner: Sprite
    core: Sprite
}

interface PaletteColors {
    coreColor: string
    innerColor: string
    outerColor: string
}

type EntityAtlas = {
    getEnemyTexture(shape: AtlasEnemyShape): Texture
}

export class EntityLayer {
    container: Container
    private glowContainer: Container
    private bodyContainer: Container
    private hpBarGfx: Graphics
    private effectGfx: Graphics
    private bodySprites = new Map<number, EnemySpriteSet>()
    private glowSprites = new Map<number, Sprite>()
    private atlas: EntityAtlas

    constructor(atlas: EntityAtlas) {
        this.atlas = atlas
        this.container = new Container()
        this.glowContainer = new Container()
        this.bodyContainer = new Container()
        this.hpBarGfx = new Graphics()
        this.effectGfx = new Graphics()

        this.container.addChild(this.glowContainer)
        this.container.addChild(this.bodyContainer)
        this.container.addChild(this.hpBarGfx)
        this.container.addChild(this.effectGfx)
    }

    update(state: GameState, screenWidth: number, screenHeight: number): void {
        const { enemies, gameTime, camera } = state
        const viewport = buildEntityViewport(camera, screenWidth, screenHeight)
        const visibility = getShellVisibility(gameTime)
        const stage = Math.floor((gameTime % 900) / 300)
        const activeBodyIds = new Set<number>()
        const activeGlowIds = new Set<number>()

        this.hpBarGfx.clear()
        this.effectGfx.clear()

        for (const enemy of enemies) {
            if (enemy.dead) continue

            const cullRadius = enemy.boss ? enemy.size + 500 : enemy.size + 50
            if (!isVisible(enemy.x, enemy.y, cullRadius, viewport)) continue

            const colors = getPaletteColors(enemy)

            this.drawEliteEffects(enemy, gameTime)
            this.drawSpecialEnemyEffects(enemy, gameTime, colors)

            if (this.drawUniqueEnemy(enemy, gameTime, colors)) {
                this.drawStatusOverlay(enemy)
                continue
            }

            const shape = getAtlasShape(enemy)
            if (shape) {
                activeBodyIds.add(enemy.id)
                this.syncBodySprites(enemy, shape, gameTime, stage, visibility, colors)
            }

            if (enemy.isElite) {
                activeGlowIds.add(enemy.id)
                this.syncGlowSprite(enemy, colors.outerColor)
            }

            this.drawStatusOverlay(enemy)
        }

        this.pruneBodySprites(activeBodyIds)
        this.pruneGlowSprites(activeGlowIds)
    }

    private syncBodySprites(
        enemy: Enemy,
        shape: AtlasEnemyShape,
        gameTime: number,
        stage: number,
        visibility: { core: number; inner: number; outer: number },
        colors: PaletteColors,
    ): void {
        let entry = this.bodySprites.get(enemy.id)
        const texture = this.atlas.getEnemyTexture(shape)

        if (!entry) {
            entry = this.createBodySpriteSet(texture)
            this.bodyContainer.addChild(entry.container)
            this.bodySprites.set(enemy.id, entry)
        } else {
            entry.outer.texture = texture
            entry.inner.texture = texture
            entry.core.texture = texture
        }

        const jitterX = enemy.jitterX ?? 0
        const jitterY = enemy.jitterY ?? 0
        const pulse = 1 + Math.sin(enemy.pulsePhase || 0) * 0.05
        const baseScale = (enemy.size / ENEMY_ATLAS_RADIUS) * pulse
        const isMinion = enemy.shape === 'minion' || enemy.shape === 'elite_minion'
        const pulseSpeed = stage === 1 ? 4 : 2
        const pulseAmount = stage === 1 ? 0.08 : 0.03
        const innerRadius = enemy.size * (0.65 + Math.sin(gameTime * pulseSpeed + enemy.id) * pulseAmount)
        const innerScale = (innerRadius / ENEMY_ATLAS_RADIUS) * pulse
        const coreRadius = enemy.size * (isMinion ? 0.15 : (stage === 0 ? 0.45 : 0.35))
        const coreScale = (coreRadius / ENEMY_ATLAS_RADIUS) * pulse

        entry.container.position.set(enemy.x + jitterX, enemy.y + jitterY)
        entry.container.rotation = enemy.rotationPhase || 0
        entry.container.visible = true

        entry.outer.scale.set(baseScale)
        entry.outer.tint = hexToNum(colors.outerColor)
        entry.outer.alpha = enemy.boss ? 1 : Math.max(0.35, visibility.outer)

        entry.inner.visible = !isMinion
        if (!isMinion) {
            entry.inner.scale.set(innerScale)
            entry.inner.tint = hexToNum(colors.innerColor)
            entry.inner.alpha = visibility.inner * (stage === 1 ? 0.9 : 0.7)
        }

        entry.core.visible = true
        entry.core.scale.set(coreScale)
        entry.core.tint = hexToNum(colors.coreColor)
        entry.core.alpha = visibility.core
    }

    private syncGlowSprite(enemy: Enemy, color: string): void {
        let sprite = this.glowSprites.get(enemy.id)
        const texture = this.atlas.getEnemyTexture(getAtlasShape(enemy) ?? 'circle')

        if (!sprite) {
            sprite = new Sprite(texture)
            sprite.anchor.set(0.5)
            this.glowContainer.addChild(sprite)
            this.glowSprites.set(enemy.id, sprite)
        }
        if (sprite.texture !== texture) sprite.texture = texture

        const jitterX = enemy.jitterX ?? 0
        const jitterY = enemy.jitterY ?? 0
        const pulse = 1 + Math.sin(enemy.pulsePhase || 0) * 0.05
        const glowScale = ((enemy.size * 2.1) / sprite.texture.width) * pulse

        sprite.position.set(enemy.x + jitterX, enemy.y + jitterY)
        sprite.rotation = enemy.rotationPhase || 0
        sprite.scale.set(glowScale)
        sprite.tint = hexToNum(color)
        sprite.alpha = 1
        sprite.visible = true
    }

    private drawStatusOverlay(enemy: Enemy): void {
        const isUnique = enemy.isZombie || enemy.shape === 'worm' || enemy.shape === 'glitcher' || !!(enemy as { meteoriteDrop?: unknown }).meteoriteDrop

        if ((enemy.isElite || isUnique || enemy.boss) && enemy.maxHp > 0 && enemy.hp < enemy.maxHp) {
            const barW = enemy.boss ? enemy.size * 3.5 : enemy.size * 2.5
            const barH = enemy.boss ? 6 : 4
            const y = enemy.boss ? enemy.y - enemy.size * 2.2 : enemy.y - enemy.size * 1.8

            this.hpBarGfx.rect(enemy.x - barW / 2, y, barW, barH)
            this.hpBarGfx.fill({ color: 0x000000, alpha: 0.6 })

            const hpColor = enemy.palette?.[1] ?? '#ff0000'
            this.hpBarGfx.rect(enemy.x - barW / 2, y, barW * (enemy.hp / enemy.maxHp), barH)
            this.hpBarGfx.fill({ color: hexToNum(hpColor) })

            if (enemy.boss) {
                this.hpBarGfx.rect(enemy.x - barW / 2 + barW * 0.33, y, 1.5, barH)
                this.hpBarGfx.fill({ color: 0xffffff, alpha: 0.8 })
                this.hpBarGfx.rect(enemy.x - barW / 2 + barW * 0.66, y, 1.5, barH)
                this.hpBarGfx.fill({ color: 0xffffff, alpha: 0.8 })
            }
        }

        if (enemy.frozen && enemy.frozen > 0) {
            this.effectGfx.circle(enemy.x, enemy.y, enemy.size * 1.2)
            this.effectGfx.fill({ color: 0xbae6fd, alpha: 0.4 })
        }
    }

    private drawEliteEffects(enemy: Enemy, gameTime: number): void {
        if (!enemy.isElite) return

        if (enemy.shape === 'diamond' && enemy.eliteState === 1) {
            const angle = enemy.dashState || 0
            const remaining = (enemy.timer || 0) - gameTime
            const isLocked = remaining <= 0.8
            const color = enemy.palette?.[1] ?? '#00ffff'

            this.effectGfx.moveTo(enemy.x, enemy.y)
            this.effectGfx.lineTo(enemy.x + Math.cos(angle) * 3000, enemy.y + Math.sin(angle) * 3000)
            this.effectGfx.stroke({
                color: hexToNum(color),
                width: isLocked ? 3 : 1,
                alpha: isLocked ? 0.8 : 0.3,
            })
        }

        if (
            enemy.shape === 'diamond' &&
            enemy.eliteState === 2 &&
            enemy.lockedTargetX !== undefined &&
            enemy.lockedTargetY !== undefined
        ) {
            const pulse = 0.8 + Math.sin(gameTime * 20) * 0.2
            const baseWidth = 4 * pulse
            const outerColor = enemy.palette?.[1] ?? '#00ffff'
            const innerColor = enemy.palette?.[0] ?? '#ffffff'

            this.effectGfx.moveTo(enemy.x, enemy.y)
            this.effectGfx.lineTo(enemy.lockedTargetX, enemy.lockedTargetY)
            this.effectGfx.stroke({ color: hexToNum(outerColor), width: baseWidth * 5, alpha: 0.15 })

            this.effectGfx.moveTo(enemy.x, enemy.y)
            this.effectGfx.lineTo(enemy.lockedTargetX, enemy.lockedTargetY)
            this.effectGfx.stroke({ color: hexToNum(outerColor), width: baseWidth * 2.5, alpha: 0.35 })

            this.effectGfx.moveTo(enemy.x, enemy.y)
            this.effectGfx.lineTo(enemy.lockedTargetX, enemy.lockedTargetY)
            this.effectGfx.stroke({ color: hexToNum(innerColor), width: baseWidth, alpha: 0.8 })

            this.effectGfx.moveTo(enemy.x, enemy.y)
            this.effectGfx.lineTo(enemy.lockedTargetX, enemy.lockedTargetY)
            this.effectGfx.stroke({ color: 0xffffff, width: baseWidth * 0.3, alpha: 1 })
        }

        if (enemy.shape === 'triangle' && enemy.eliteState === 1) {
            const pulse = 1.2 + Math.sin(gameTime * 20) * 0.3
            const size = enemy.size * pulse
            const alpha = 0.6 + Math.sin(gameTime * 20) * 0.4

            this.effectGfx.moveTo(enemy.x, enemy.y - size)
            this.effectGfx.lineTo(enemy.x + size * 0.866, enemy.y + size * 0.5)
            this.effectGfx.lineTo(enemy.x - size * 0.866, enemy.y + size * 0.5)
            this.effectGfx.closePath()
            this.effectGfx.stroke({ color: 0xef4444, width: 3, alpha })
        }
    }

    private drawUniqueEnemy(enemy: Enemy, gameTime: number, colors: PaletteColors): boolean {
        if (enemy.isZombie) {
            const risePulse = enemy.zombieState === 'rising' ? 0.75 + Math.sin(gameTime * 18) * 0.15 : 1
            this.effectGfx.circle(enemy.x, enemy.y, enemy.size * risePulse)
            this.effectGfx.fill({ color: 0x4ade80, alpha: 0.7 })
            this.effectGfx.circle(enemy.x, enemy.y, enemy.size * 0.58 * risePulse)
            this.effectGfx.fill({ color: hexToNum(colors.innerColor), alpha: 0.55 })
            this.effectGfx.circle(enemy.x, enemy.y, enemy.size * 0.22)
            this.effectGfx.fill({ color: hexToNum(colors.coreColor), alpha: 0.9 })
            return true
        }

        if (enemy.shape === 'worm') {
            this.drawWorm(enemy, gameTime, colors)
            return true
        }

        return false
    }

    private drawSpecialEnemyEffects(enemy: Enemy, gameTime: number, colors: PaletteColors): void {
        if (enemy.shape === 'snitch') {
            this.drawSnitch(enemy, gameTime, colors)
            return
        }

        if (enemy.shape === 'glitcher') {
            for (let i = 0; i < 2; i++) {
                const angle = i * Math.PI + gameTime * 5
                const length = enemy.size * (1.8 + Math.sin(gameTime * 20 + i) * 0.7)
                const color = i === 0 ? 0xff00ff : 0x00ffff

                this.effectGfx.moveTo(enemy.x, enemy.y)
                this.effectGfx.lineTo(enemy.x + Math.cos(angle) * length, enemy.y + Math.sin(angle) * length)
                this.effectGfx.stroke({ color, width: 3 })
            }
        }
    }

    private drawWorm(enemy: Enemy, gameTime: number, colors: PaletteColors): void {
        const isUnderground = enemy.wormBurrowState === 'underground'
        const isPromoDormant = enemy.wormPromotionTimer !== undefined && gameTime < enemy.wormPromotionTimer
        const isHead = enemy.wormRole === 'head' && !isPromoDormant
        const alpha = isUnderground ? 0.35 : (isPromoDormant ? 0.5 : 1)

        if (isHead) {
            const moveAngle = enemy.vx !== undefined && enemy.vy !== undefined
                ? Math.atan2(enemy.vy, enemy.vx)
                : 0

            for (let i = 0; i <= 8; i++) {
                const angle = moveAngle + ((i / 8) - 0.5) * Math.PI * 1.2
                const radius = enemy.size * (1.2 + Math.sin(gameTime * 10 + i) * 0.1)
                const px = enemy.x + Math.cos(angle) * radius
                const py = enemy.y + Math.sin(angle) * radius

                if (i === 0) this.effectGfx.moveTo(px, py)
                else this.effectGfx.lineTo(px, py)
            }

            this.effectGfx.lineTo(
                enemy.x + Math.cos(moveAngle + Math.PI) * enemy.size * 0.5,
                enemy.y + Math.sin(moveAngle + Math.PI) * enemy.size * 0.5,
            )
            this.effectGfx.closePath()
            this.effectGfx.stroke({ color: hexToNum(colors.outerColor), width: 4, alpha })
            this.effectGfx.fill({ color: 0x111827, alpha })

            const isCharging = (enemy as Enemy & { wormAIState?: string }).wormAIState === 'charging' && !isUnderground
            const eyeColor = isCharging ? 0xff0000 : hexToNum(colors.coreColor)
            const eyeAlpha = isUnderground ? 0.5 : 1
            const eyePositions = [
                { angle: 0.2, distance: 0.8 },
                { angle: -0.2, distance: 0.8 },
                { angle: 0.5, distance: 0.6 },
                { angle: -0.5, distance: 0.6 },
                { angle: 0, distance: 1.1 },
            ]

            for (const eye of eyePositions) {
                const pulse = (isCharging ? 1.2 : 0.8) + Math.sin(gameTime * 10 + eye.angle * 5) * 0.2
                this.effectGfx.circle(
                    enemy.x + Math.cos(moveAngle + eye.angle) * enemy.size * eye.distance,
                    enemy.y + Math.sin(moveAngle + eye.angle) * enemy.size * eye.distance,
                    3 * pulse,
                )
                this.effectGfx.fill({ color: eyeColor, alpha: eyeAlpha })
            }

            const drawMandible = (side: number) => {
                const open = Math.sin(gameTime * 15) * 0.4 + 0.5
                const angle = moveAngle + (0.7 + open) * side
                const j1x = Math.cos(angle) * enemy.size * 1.5
                const j1y = Math.sin(angle) * enemy.size * 1.5

                this.effectGfx.moveTo(
                    enemy.x + Math.cos(moveAngle + 0.4 * side) * enemy.size * 0.8,
                    enemy.y + Math.sin(moveAngle + 0.4 * side) * enemy.size * 0.8,
                )
                this.effectGfx.lineTo(enemy.x + j1x, enemy.y + j1y)

                const tipAngle = angle + 0.8 * side
                this.effectGfx.lineTo(
                    enemy.x + j1x + Math.cos(tipAngle) * enemy.size * 0.8,
                    enemy.y + j1y + Math.sin(tipAngle) * enemy.size * 0.8,
                )
                this.effectGfx.stroke({ color: hexToNum(colors.innerColor), width: 4, alpha })
            }

            drawMandible(1)
            drawMandible(-1)
        } else {
            const rotation = gameTime * 3 + (enemy.wormSegmentIndex || 0) * 0.4
            const cos = Math.cos(rotation)
            const sin = Math.sin(rotation)
            const size = enemy.size

            this.effectGfx.moveTo(enemy.x - sin * (-size * 1.2), enemy.y + cos * (-size * 1.2))
            this.effectGfx.lineTo(enemy.x + cos * (size * 0.8), enemy.y + sin * (size * 0.8))
            this.effectGfx.lineTo(enemy.x - sin * (size * 1.2), enemy.y + cos * (size * 1.2))
            this.effectGfx.lineTo(enemy.x - cos * (size * 0.8), enemy.y - sin * (size * 0.8))
            this.effectGfx.closePath()
            this.effectGfx.stroke({
                color: hexToNum(colors.outerColor),
                width: isUnderground ? 1.5 : 4,
                alpha,
            })
            this.effectGfx.fill({ color: isUnderground ? 0x0f172a : 0x1e293b, alpha })

            if (!isUnderground) {
                this.effectGfx.moveTo(enemy.x - size * 0.4, enemy.y)
                this.effectGfx.lineTo(enemy.x + size * 0.4, enemy.y)
                this.effectGfx.stroke({ color: hexToNum(colors.innerColor), width: 1 })

                this.effectGfx.moveTo(enemy.x, enemy.y - size * 0.6)
                this.effectGfx.lineTo(enemy.x, enemy.y + size * 0.6)
                this.effectGfx.stroke({ color: hexToNum(colors.innerColor), width: 1 })
            }
        }

        if (isUnderground) {
            const rippleRadius = enemy.size * (1.5 + Math.sin(gameTime * 5) * 0.2)
            this.effectGfx.circle(enemy.x, enemy.y, rippleRadius)
            this.effectGfx.stroke({ color: hexToNum(colors.outerColor), width: 1, alpha: 0.2 })
        }
    }

    private drawSnitch(enemy: Enemy, gameTime: number, colors: PaletteColors): void {
        const isReal = enemy.rareReal !== false
        const ringRotation = isReal ? gameTime * 4 : gameTime * 2
        const wingCount = isReal ? 3 : 2

        for (let i = 0; i < wingCount; i++) {
            const angle = (i / wingCount) * Math.PI * 2 - ringRotation * 1.5
            const wx = enemy.x + Math.cos(ringRotation + angle) * enemy.size * 0.9
            const wy = enemy.y + Math.sin(ringRotation + angle) * enemy.size * 0.9
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)

            this.effectGfx.moveTo(wx + cos * 8, wy + sin * 8)
            this.effectGfx.lineTo(wx - cos * 4 + sin * 6, wy - sin * 4 - cos * 6)
            this.effectGfx.lineTo(wx - cos * 4 - sin * 6, wy - sin * 4 + cos * 6)
            this.effectGfx.closePath()
            this.effectGfx.fill({ color: hexToNum(colors.innerColor), alpha: 0.8 })
        }

        const pulse = 1 + Math.sin(gameTime * 15) * 0.15
        this.effectGfx.circle(enemy.x, enemy.y, enemy.size * 0.6 * pulse)
        this.effectGfx.fill({ color: hexToNum(colors.coreColor), alpha: 0.9 })

        this.effectGfx.circle(enemy.x, enemy.y, enemy.size * 0.3 * pulse)
        this.effectGfx.fill({ color: 0xffffff, alpha: 0.5 })
    }

    private createBodySpriteSet(texture: Texture): EnemySpriteSet {
        const container = new Container()
        const outer = new Sprite(texture)
        const inner = new Sprite(texture)
        const core = new Sprite(texture)

        outer.anchor.set(0.5)
        inner.anchor.set(0.5)
        core.anchor.set(0.5)

        container.addChild(outer)
        container.addChild(inner)
        container.addChild(core)

        return { container, outer, inner, core }
    }

    private pruneBodySprites(activeIds: Set<number>): void {
        for (const [id, entry] of this.bodySprites) {
            if (!activeIds.has(id)) {
                this.bodyContainer.removeChild(entry.container)
                entry.container.destroy({ children: true })
                this.bodySprites.delete(id)
            }
        }
    }

    private pruneGlowSprites(activeIds: Set<number>): void {
        for (const [id, sprite] of this.glowSprites) {
            if (!activeIds.has(id)) {
                this.glowContainer.removeChild(sprite)
                sprite.destroy()
                this.glowSprites.delete(id)
            }
        }
    }

    destroy(): void {
        this.container.destroy({ children: true })
        this.bodySprites.clear()
        this.glowSprites.clear()
    }
}

function getPaletteColors(enemy: Enemy): PaletteColors {
    const palette = enemy.palette ?? []
    const eraPalette = enemy.eraPalette

    return {
        coreColor: eraPalette?.[0] ?? palette[0] ?? '#ffffff',
        innerColor: eraPalette?.[1] ?? palette[1] ?? '#aaaaaa',
        outerColor: eraPalette?.[2] ?? palette[2] ?? '#555555',
    }
}

function getAtlasShape(enemy: Enemy): AtlasEnemyShape | null {
    return ATLAS_SHAPE_SET[enemy.shape] ? enemy.shape as AtlasEnemyShape : null
}

function buildEntityViewport(
    camera: { x: number; y: number },
    screenWidth: number,
    screenHeight: number,
): Viewport {
    return {
        x: camera.x,
        y: camera.y,
        halfW: screenWidth / (2 * VIEWPORT_SCALE),
        halfH: screenHeight / (2 * VIEWPORT_SCALE),
    }
}

function hexToNum(hex: string): number {
    return parseInt(hex.replace('#', ''), 16)
}
