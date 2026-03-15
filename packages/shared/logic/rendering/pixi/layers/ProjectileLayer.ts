import { Container, Graphics, Sprite } from 'pixi.js'
import type { Bullet, GameState } from '../../../core/Types'
import { isVisible } from '../../ViewportCulling'
import type { Viewport } from '../../ViewportCulling'
import type { Texture } from 'pixi.js'
import type { AtlasParticleShape } from '../SpriteAtlasGenerator'

type ProjectileAtlas = {
    getBulletTexture(size: number): Texture
    getBulletEffectTexture(effect: 'ring' | 'mist' | 'nanite'): Texture
    getParticleTexture(shape: AtlasParticleShape): Texture
}

const TWO_PI = Math.PI * 2
const VIEWPORT_SCALE = 0.58

export class ProjectileLayer {
    container: Container
    private trailsGfx: Graphics
    private ringGfx: Graphics
    private bulletGlowContainer: Container
    private bulletBodyContainer: Container
    private enemyGlowContainer: Container
    private enemyBodyContainer: Container
    private bulletSprites = new Map<number, Sprite>()
    private bulletGlowSprites = new Map<number, Sprite>()
    private enemyBulletSprites = new Map<number, Sprite>()
    private enemyBulletGlowSprites = new Map<number, Sprite>()
    private atlas: ProjectileAtlas

    constructor(atlas: ProjectileAtlas) {
        this.atlas = atlas
        this.container = new Container()
        this.trailsGfx = new Graphics()
        this.ringGfx = new Graphics()
        this.bulletGlowContainer = new Container()
        this.bulletBodyContainer = new Container()
        this.enemyGlowContainer = new Container()
        this.enemyBodyContainer = new Container()

        this.container.addChild(this.trailsGfx)
        this.container.addChild(this.enemyGlowContainer)
        this.container.addChild(this.enemyBodyContainer)
        this.container.addChild(this.bulletGlowContainer)
        this.container.addChild(this.bulletBodyContainer)
        this.container.addChild(this.ringGfx)
    }

    update(state: GameState, screenWidth?: number, screenHeight?: number): void {
        const { bullets, enemyBullets, player, gameTime, camera } = state
        const isMalware = player.playerClass === 'malware'
        const viewport = buildProjectileViewport(camera, screenWidth, screenHeight)

        this.trailsGfx.clear()
        this.ringGfx.clear()

        this.updateBullets(bullets, isMalware, gameTime, viewport)
        this.updateEnemyBullets(enemyBullets, viewport)
    }

    private updateBullets(
        bullets: Bullet[],
        isMalware: boolean,
        gameTime: number,
        viewport: Viewport | null,
    ): void {
        const activeIds = new Set<number>()

        for (const bullet of bullets) {
            activeIds.add(bullet.id)

            const cullRadius = getProjectileCullRadius(bullet)
            const visible = !viewport || isVisible(bullet.x, bullet.y, cullRadius, viewport)

            if (!visible) {
                this.setSpriteVisibility(this.bulletSprites, bullet.id, false)
                this.setSpriteVisibility(this.bulletGlowSprites, bullet.id, false)
                continue
            }

            if (bullet.isRing && bullet.ringRadius) {
                this.drawRingOverlay(bullet, gameTime)
            }

            if (!bullet.isShockwaveCircle && !bullet.isRing && !bullet.isMist && !(bullet.isNanite && !isMalware)) {
                this.drawTrails(bullet)
            }
            this.syncBulletSprites(
                bullet,
                this.bulletSprites,
                this.bulletGlowSprites,
                this.bulletBodyContainer,
                this.bulletGlowContainer,
                false,
                isMalware,
            )
        }

        this.pruneSprites(activeIds, this.bulletSprites, this.bulletBodyContainer)
        this.pruneSprites(activeIds, this.bulletGlowSprites, this.bulletGlowContainer)
    }

    private updateEnemyBullets(enemyBullets: Bullet[], viewport: Viewport | null): void {
        const activeIds = new Set<number>()

        for (const bullet of enemyBullets) {
            activeIds.add(bullet.id)

            const visible = !viewport || isVisible(bullet.x, bullet.y, getProjectileCullRadius(bullet), viewport)
            if (!visible) {
                this.setSpriteVisibility(this.enemyBulletSprites, bullet.id, false)
                this.setSpriteVisibility(this.enemyBulletGlowSprites, bullet.id, false)
                continue
            }

            this.syncBulletSprites(
                bullet,
                this.enemyBulletSprites,
                this.enemyBulletGlowSprites,
                this.enemyBodyContainer,
                this.enemyGlowContainer,
                true,
                false,
            )
        }

        this.pruneSprites(activeIds, this.enemyBulletSprites, this.enemyBodyContainer)
        this.pruneSprites(activeIds, this.enemyBulletGlowSprites, this.enemyGlowContainer)
    }

    private syncBulletSprites(
        bullet: Bullet,
        bodies: Map<number, Sprite>,
        glows: Map<number, Sprite>,
        bodyContainer: Container,
        glowContainer: Container,
        isEnemy: boolean,
        isMalware: boolean,
    ): void {
        let body = bodies.get(bullet.id)
        let glow = glows.get(bullet.id)

        const texture = getProjectileTexture(this.atlas, bullet, isMalware)
        if (!body) {
            body = new Sprite(texture)
            body.anchor.set(0.5)
            bodyContainer.addChild(body)
            bodies.set(bullet.id, body)
        }
        if (!glow) {
            glow = new Sprite(texture)
            glow.anchor.set(0.5)
            glowContainer.addChild(glow)
            glows.set(bullet.id, glow)
        }

        if (body.texture !== texture) body.texture = texture
        if (glow.texture !== texture) glow.texture = texture

        const color = bullet.color ?? (isEnemy ? '#ef4444' : '#22d3ee')
        const baseScale = getProjectileScale(bullet, body.texture, isMalware)
        const alpha = getProjectileAlpha(bullet, isMalware)

        body.position.set(bullet.x, bullet.y)
        body.scale.set(baseScale)
        body.rotation = getProjectileRotation(bullet)
        body.tint = color
        body.alpha = alpha
        body.visible = true

        glow.position.set(bullet.x, bullet.y)
        glow.scale.set(baseScale * getGlowScaleMultiplier(bullet, isEnemy, isMalware))
        glow.rotation = body.rotation
        glow.tint = color
        glow.alpha = Math.min(1, alpha * 1.15)
        glow.visible = true
    }

    private pruneSprites(
        activeIds: Set<number>,
        pool: Map<number, Sprite>,
        container: Container,
    ): void {
        for (const [id, sprite] of pool) {
            if (!activeIds.has(id)) {
                container.removeChild(sprite)
                sprite.destroy()
                pool.delete(id)
            }
        }
    }

    private setSpriteVisibility(pool: Map<number, Sprite>, id: number, visible: boolean): void {
        const sprite = pool.get(id)
        if (sprite) sprite.visible = visible
    }

    private drawTrails(bullet: Bullet): void {
        if (!bullet.trails || bullet.trails.length === 0) return

        const color = bullet.color ?? '#22d3ee'
        const points = bullet.trails

        if (points.length > 1) {
            for (let idx = 0; idx < points.length - 1; idx++) {
                const current = points[idx]
                const next = points[idx + 1]
                const alpha = 0.3 * (1 - idx / points.length)
                const width = Math.max(1, bullet.size * (0.8 - (idx / points.length) * 0.35))
                this.trailsGfx.moveTo(current.x, current.y)
                this.trailsGfx.lineTo(next.x, next.y)
                this.trailsGfx.stroke({ color, width, alpha, cap: 'round' })
            }
        }

        for (let idx = 0; idx < points.length; idx++) {
            const pos = points[idx]
            const alpha = 0.5 * (1 - idx / points.length)
            const trailSize = bullet.size * (0.9 - (idx / points.length) * 0.4)
            this.trailsGfx.circle(pos.x, pos.y, trailSize)
            this.trailsGfx.fill({ color, alpha })
        }
    }

    private drawRingOverlay(bullet: Bullet, gameTime: number): void {
        if (!bullet.ringRadius) return

        const baseIntensity = Math.min(1.5, Math.max(0.5, (bullet.ringAmmo ?? 200) / 200))
        const intensity = bullet.ringVisualIntensity
            ? baseIntensity * bullet.ringVisualIntensity
            : baseIntensity
        const color = bullet.color ?? '#22d3ee'

        this.drawDashedArc(bullet.x, bullet.y, bullet.ringRadius + 6, color, 0.3, gameTime)
        this.drawDashedArc(bullet.x, bullet.y, bullet.ringRadius - 8, color, 0.18 * intensity, gameTime * 0.8)
    }

    private drawDashedArc(
        cx: number,
        cy: number,
        radius: number,
        color: string,
        alpha: number,
        gameTime: number,
    ): void {
        const dashAngle = 20 / radius
        const gapAngle = 60 / radius
        const period = dashAngle + gapAngle
        const offset = (gameTime * 5) % period

        let angle = -offset
        const end = TWO_PI - offset

        while (angle < end) {
            const start = angle
            const finish = Math.min(angle + dashAngle, end)
            this.ringGfx.moveTo(cx + Math.cos(start) * radius, cy + Math.sin(start) * radius)

            const steps = Math.max(2, Math.ceil((finish - start) * radius / 4))
            for (let i = 1; i <= steps; i++) {
                const current = start + (finish - start) * (i / steps)
                this.ringGfx.lineTo(cx + Math.cos(current) * radius, cy + Math.sin(current) * radius)
            }

            this.ringGfx.stroke({ color, width: 1, alpha })
            angle += period
        }
    }

    destroy(): void {
        this.container.destroy({ children: true })
        this.bulletSprites.clear()
        this.bulletGlowSprites.clear()
        this.enemyBulletSprites.clear()
        this.enemyBulletGlowSprites.clear()
    }
}

function buildProjectileViewport(
    camera: { x: number; y: number },
    screenWidth?: number,
    screenHeight?: number,
): Viewport | null {
    if (!screenWidth || !screenHeight) return null

    return {
        x: camera.x,
        y: camera.y,
        halfW: screenWidth / (2 * VIEWPORT_SCALE),
        halfH: screenHeight / (2 * VIEWPORT_SCALE),
    }
}

function getProjectileCullRadius(bullet: Bullet): number {
    if (bullet.isRing && bullet.ringRadius) return bullet.ringRadius + 30
    if (bullet.isShockwaveCircle) return (bullet.size || bullet.maxSize || 0) + 50
    if (bullet.isNanite) return bullet.size * 4 + 20
    if (bullet.isMist) return bullet.size * 3 + 10
    return bullet.size + 10
}

function getProjectileTexture(atlas: ProjectileAtlas, bullet: Bullet, isMalware: boolean): Texture {
    if (bullet.isShockwaveCircle) return atlas.getParticleTexture('shockwave_circle')
    if (bullet.isRing) return atlas.getBulletEffectTexture('ring')
    if (bullet.isMist) return atlas.getBulletEffectTexture('mist')
    if (bullet.isNanite && !isMalware) return atlas.getBulletEffectTexture('nanite')
    return atlas.getBulletTexture(bullet.size)
}

function getProjectileScale(bullet: Bullet, texture: Texture, isMalware: boolean): number {
    if (bullet.isShockwaveCircle) {
        const maxLife = bullet.maxLife ?? 1
        const progress = 1 - Math.max(0, Math.min(1, bullet.life / maxLife))
        const radius = bullet.size > 0 ? bullet.size : (bullet.maxSize ?? 0) * progress
        return Math.max(0, (radius * 2) / texture.width)
    }

    if (bullet.isRing && bullet.ringRadius) {
        return (bullet.ringRadius * 2) / texture.width
    }

    if (bullet.isMist) {
        return (bullet.size * 6) / texture.width
    }

    if (bullet.isNanite && !isMalware) {
        return (bullet.size * 8) / texture.width
    }

    return (bullet.size * 2) / texture.width
}

function getProjectileAlpha(bullet: Bullet, isMalware: boolean): number {
    if (bullet.isMist) {
        return Math.max(0, 0.24 * (bullet.life / 40))
    }

    if (bullet.isShockwaveCircle) {
        const maxLife = bullet.maxLife ?? 1
        return Math.max(0.1, bullet.life / maxLife)
    }

    if (bullet.isRing) {
        const baseIntensity = Math.min(1.5, Math.max(0.5, (bullet.ringAmmo ?? 200) / 200))
        const intensity = bullet.ringVisualIntensity ? baseIntensity * bullet.ringVisualIntensity : baseIntensity
        return Math.min(1, 0.55 + intensity * 0.2)
    }

    if (bullet.isNanite && !isMalware) {
        return 0.85
    }

    return bullet.isVisualOnly ? 0.45 : 0.95
}

function getProjectileRotation(bullet: Bullet): number {
    if (bullet.isShockwaveCircle) {
        return bullet.startAngle ?? 0
    }

    if (bullet.isNanite) {
        return (bullet.id % 16) * (Math.PI / 8)
    }

    return 0
}

function getGlowScaleMultiplier(bullet: Bullet, isEnemy: boolean, isMalware: boolean): number {
    if (bullet.isMist) return 1.05
    if (bullet.isShockwaveCircle) return bullet.isTsunami || bullet.isSingularity ? 1.04 : 1.02
    if (bullet.isRing) return 1.03
    if (bullet.isNanite && !isMalware) return 1.08
    return isEnemy ? 1.08 : 1.12
}
