import { Application, Container, Graphics, RenderTexture, Sprite, Texture } from 'pixi.js'
import type { Enemy, GameState } from '../../../core/Types'
import { PALETTES } from '../../../core/Constants'
import { isVisible } from '../../ViewportCulling'
import type { Viewport } from '../../ViewportCulling'

const VIEWPORT_SCALE = 0.58
const BEAM_LENGTH = 3000

type BossVisual = {
    container: Container
    aura: Sprite
    afterglow: Sprite
    body: Graphics
    fx: Graphics
    indicators: Graphics
}

type BossColors = { core: number; inner: number; outer: number }
type Point = { x: number; y: number }

export class BossLayer {
    container: Container
    private app: Application
    private auraContainer: Container
    private bodyContainer: Container
    private indicatorContainer: Container
    private overlayGfx: Graphics
    private bosses = new Map<number, BossVisual>()
    private radialTextures = new Map<string, Texture>()

    constructor(app: Application) {
        this.app = app
        this.container = new Container()
        this.auraContainer = new Container()
        this.bodyContainer = new Container()
        this.indicatorContainer = new Container()
        this.overlayGfx = new Graphics()

        this.container.addChild(this.auraContainer)
        this.container.addChild(this.indicatorContainer)
        this.container.addChild(this.bodyContainer)
        this.container.addChild(this.overlayGfx)
    }

    update(state: GameState, screenWidth?: number, screenHeight?: number): void {
        const viewport = buildViewport(state.camera, screenWidth, screenHeight)
        const activeIds = new Set<number>()

        this.overlayGfx.clear()

        for (const enemy of state.enemies) {
            if (enemy.dead) continue
            const support = enemy.isPhalanxDrone || enemy.type === 'orbital_shield'
            if (!enemy.boss && !enemy.isAnomaly && !support) continue

            const cullRadius = enemy.boss ? enemy.size + 600 : enemy.size + 200
            if (viewport && !isVisible(enemy.x, enemy.y, cullRadius, viewport)) continue

            activeIds.add(enemy.id)
            const visual = this.getOrCreateVisual(enemy.id)
            this.syncVisual(visual, enemy, state)
        }

        this.pruneVisuals(activeIds)
    }

    destroy(): void {
        for (const visual of this.bosses.values()) {
            visual.aura.destroy()
            visual.indicators.destroy()
            visual.container.destroy({ children: true })
        }
        this.bosses.clear()
        this.container.destroy({ children: true })
        for (const texture of this.radialTextures.values()) texture.destroy(true)
        this.radialTextures.clear()
    }

    private getOrCreateVisual(id: number): BossVisual {
        const existing = this.bosses.get(id)
        if (existing) return existing

        const container = new Container()
        const aura = new Sprite(Texture.EMPTY)
        const afterglow = new Sprite(Texture.EMPTY)
        const indicators = new Graphics()
        const body = new Graphics()
        const fx = new Graphics()

        aura.anchor.set(0.5)
        aura.blendMode = 'add'
        afterglow.anchor.set(0.5)
        afterglow.blendMode = 'add'

        container.addChild(afterglow)
        container.addChild(body)
        container.addChild(fx)

        this.auraContainer.addChild(aura)
        this.indicatorContainer.addChild(indicators)
        this.bodyContainer.addChild(container)

        const visual = { container, aura, afterglow, body, fx, indicators }
        this.bosses.set(id, visual)
        return visual
    }

    private syncVisual(visual: BossVisual, enemy: Enemy, state: GameState): void {
        visual.body.clear()
        visual.fx.clear()
        visual.indicators.clear()

        const jitterX = enemy.jitterX ?? 0
        const jitterY = enemy.jitterY ?? 0
        visual.container.position.set(enemy.x + jitterX, enemy.y + jitterY)
        visual.container.rotation = enemy.rotationPhase || 0
        visual.indicators.position.set(enemy.x + jitterX, enemy.y + jitterY)
        visual.indicators.rotation = 0

        if (enemy.isAnomaly) this.drawAnomalyAura(visual, enemy, state)
        else visual.aura.visible = false

        if (enemy.isPhalanxDrone) {
            this.drawPhalanxDrone(visual, enemy, state)
            return
        }

        if (enemy.type === 'orbital_shield') {
            this.drawOrbitalShield(visual, enemy, state)
            return
        }

        if (!enemy.boss) {
            visual.afterglow.visible = false
            return
        }

        const colors = getBossColors(enemy)
        this.drawBossIndicators(visual.indicators, enemy, state)
        this.drawBossAuraLayers(visual.body, enemy, state)
        this.drawBossBody(visual.body, enemy, state, colors)
        this.drawBossInnerFx(visual.fx, enemy, state, colors)
        this.syncAfterglow(visual.afterglow, enemy, state, colors)
        this.drawBossStatus(enemy)
    }

    private drawBossAuraLayers(gfx: Graphics, enemy: Enemy, state: GameState): void {
        const tier = enemy.bossTier || 1
        const t = state.gameTime
        const flicker = Math.sin(Math.floor(t * 12) * 7.3 + enemy.id * 3.1) > -0.3 ? 1 : 0.4
        const layers = [
            { color: 0xff0000, scale: 1.4 + tier * 0.1, width: 10, alpha: 0.15 * flicker },
            { color: 0x8b0000, scale: 1.3, width: 6, alpha: 0.25 * flicker },
            { color: 0xff4500, scale: 1.2, width: 3, alpha: (0.5 + Math.sin(t * 10) * 0.3) * flicker },
            { color: 0xff0040, scale: 1.15, width: 2, alpha: (0.4 + Math.sin(t * 15) * 0.3) * flicker },
        ]

        for (const layer of layers) {
            drawBossShape(gfx, enemy, enemy.size * layer.scale, state)
            gfx.stroke({ color: layer.color, width: layer.width, alpha: layer.alpha })
        }
    }

    private drawBossBody(gfx: Graphics, enemy: Enemy, state: GameState, colors: BossColors): void {
        const pulse = 1 + Math.sin(enemy.pulsePhase || 0) * 0.05
        const stage = Math.floor((state.gameTime % 900) / 300)
        const innerRadius = enemy.size * (0.65 + Math.sin(state.gameTime * (stage === 1 ? 4 : 2) + enemy.id) * (stage === 1 ? 0.08 : 0.03))
        const coreRadius = enemy.size * (stage === 0 ? 0.45 : 0.35)

        drawBossShape(gfx, enemy, enemy.size * pulse, state)
        gfx.fill({ color: colors.inner, alpha: 0.18 })
        drawBossShape(gfx, enemy, enemy.size * pulse, state)
        gfx.stroke({ color: colors.outer, width: 3, alpha: 1 })

        if (enemy.shape !== 'abomination') {
            gfx.circle(0, 0, innerRadius * pulse)
            gfx.stroke({ color: colors.inner, width: stage === 1 ? 2 : 1.2, alpha: stage === 1 ? 0.9 : 0.7 })
        }

        drawBossShape(gfx, enemy, coreRadius * pulse, state)
        gfx.fill({ color: 0xffffff, alpha: 0.45 })
        drawBossShape(gfx, enemy, coreRadius * pulse, state)
        gfx.fill({ color: colors.core, alpha: 0.9 })
    }

    private drawBossInnerFx(gfx: Graphics, enemy: Enemy, state: GameState, colors: BossColors): void {
        const t = state.gameTime
        const chaos = Math.min(1, Math.max(0, (t / 60 - 2) / 10))
        const tier = enemy.bossTier || 1

        for (let i = 0; i < 3 + Math.floor(chaos * 5) + tier; i++) {
            const cx = (pseudoRandom(i + enemy.id + Math.floor(t * 10)) - 0.5) * enemy.size * 1.2
            const cy = (pseudoRandom(i + enemy.id + 100 + Math.floor(t * 10)) - 0.5) * enemy.size * 1.2
            gfx.circle(cx, cy, 5 + pseudoRandom(i * 7 + enemy.id) * 12)
            gfx.fill({ color: 0x000000, alpha: 0.35 })
        }

        for (let i = 0; i < 3 + tier; i++) {
            const start = (i / (3 + tier)) * Math.PI * 2 + t * 0.5
            gfx.moveTo(Math.cos(start) * enemy.size * 0.1, Math.sin(start) * enemy.size * 0.1)
            for (let seg = 1; seg <= 4; seg++) {
                const frac = seg / 4
                const angle = start + Math.sin(t * 3 + i * 2 + seg) * 0.8
                gfx.lineTo(Math.cos(angle) * enemy.size * frac * 0.8, Math.sin(angle) * enemy.size * frac * 0.8)
            }
            gfx.stroke({ color: 0xff0000, width: 1, alpha: 0.2 + chaos * 0.15 })
        }

        if ((enemy.bossTier || 1) >= 2) {
            const r = enemy.size * (0.15 + (enemy.bossTier || 1) * 0.05)
            gfx.circle(0, 0, r)
            gfx.fill({ color: colors.core, alpha: 0.6 + Math.sin(t * 5) * 0.2 })
            gfx.circle(0, 0, r * (0.4 + Math.sin(t * 3) * 0.08))
            gfx.fill({ color: 0x000000, alpha: 0.9 })
            gfx.circle(r * 0.13, -r * 0.13, r * 0.16)
            gfx.fill({ color: 0xff2020, alpha: 0.85 })
        }
    }

    private syncAfterglow(sprite: Sprite, enemy: Enemy, state: GameState, colors: BossColors): void {
        const texture = this.getRadialTexture(`afterglow:${colors.core}:${colors.inner}`, [
            { radius: 1.0, color: colors.inner, alpha: 0 },
            { radius: 0.4, color: colors.inner, alpha: 0.28 },
            { radius: 0.12, color: colors.core, alpha: 0.42 },
        ])
        const tier = enemy.bossTier || 1
        const size = enemy.size * (1.6 + tier * 0.2 + Math.sin(state.gameTime * 2) * 0.2)

        sprite.visible = true
        sprite.texture = texture
        sprite.position.set(0, 0)
        sprite.scale.set((size * 2) / texture.width)
        sprite.alpha = 0.1 + Math.sin(state.gameTime * 3) * 0.05
    }

    private drawBossIndicators(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (enemy.shape === 'triangle' && enemy.berserkState) {
            drawTriangle(gfx, enemy.size * 2)
            gfx.stroke({ color: 0xf59e0b, width: 3, alpha: 0.6 + Math.sin(state.gameTime * 20) * 0.4 })
        }

        if (enemy.shape === 'circle') {
            this.drawCircleDashWarning(gfx, enemy, state)
            this.drawCircleSoulSuck(gfx, enemy, state)
        }

        if (enemy.shape === 'diamond') {
            this.drawDiamondBeamCharge(gfx, enemy, state)
            this.drawDiamondBeam(gfx, enemy, state)
            this.drawDiamondSatelliteStrike(gfx, enemy, state)
            this.drawDiamondCrystalFence(gfx, enemy, state)
        }

        if (enemy.shape === 'pentagon') {
            this.drawPentagonSoulLinks(gfx, enemy, state)
            this.drawPentagonParasiteLink(gfx, enemy, state)
        }

        this.drawLegionShield(enemy, state)
    }

    private drawCircleDashWarning(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (enemy.dashState !== 1) return
        const angle = Math.atan2((enemy.dashLockY || state.player.y) - enemy.y, (enemy.dashLockX || state.player.x) - enemy.x)
        const progress = Math.min(1, (enemy.dashTimer || 0) / 30)
        const h = enemy.size * 2 * (0.5 + progress * 0.5)
        const dx = Math.cos(angle)
        const dy = Math.sin(angle)
        const nx = -dy
        const ny = dx

        gfx.moveTo(0, 0)
        gfx.lineTo(dx * 2000, dy * 2000)
        gfx.stroke({ color: toHex(enemy.palette[1] || '#ef4444'), width: 2, alpha: 0.3 + progress * 0.5 })
        gfx.moveTo(nx * h * 0.5, ny * h * 0.5)
        gfx.lineTo(dx * 2000 + nx * h * 0.5, dy * 2000 + ny * h * 0.5)
        gfx.lineTo(dx * 2000 - nx * h * 0.5, dy * 2000 - ny * h * 0.5)
        gfx.lineTo(-nx * h * 0.5, -ny * h * 0.5)
        gfx.closePath()
        gfx.fill({ color: toHex(enemy.palette[1] || '#ef4444'), alpha: 0.14 + progress * 0.1 })
    }

    private drawCircleSoulSuck(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (!enemy.soulSuckActive) return
        const totalTime = 300
        const progress = Math.min(1, (totalTime - (enemy.soulSuckTimer || 0)) / totalTime)
        const t = state.gameTime
        const px = state.player.x - enemy.x
        const py = state.player.y - enemy.y

        for (let i = 0; i < 3; i++) {
            const points = buildWobblePath(px, py, 0, 0, 20, t, 30 + i * 10, (i / 3) * Math.PI * 2, 8, 6)
            strokePolyline(gfx, points, 0xeab308, 2 + i * 0.5, 0.35 + progress * 0.25)
        }

        for (let i = 0; i < 8 + Math.floor(progress * 8); i++) {
            const frac = (t * 2 + i * 0.15) % 1
            const point = sampleLinkPoint(px, py, 0, 0, frac, t, 25)
            gfx.circle(point.x, point.y, Math.max(1, 2 + Math.sin(t * 8 + i) * 1.5))
            gfx.fill({ color: i % 3 === 0 ? 0xfbbf24 : (i % 3 === 1 ? 0xf59e0b : 0xeab308), alpha: 0.5 })
        }

        gfx.circle(0, 0, enemy.soulSuckCoreSize || 5)
        gfx.fill({ color: 0xfbbf24, alpha: 0.65 + Math.sin(t * 8) * 0.2 })
        gfx.circle(px, py, 40)
        gfx.fill({ color: 0xeab308, alpha: 0.18 })
    }

    private drawDiamondBeamCharge(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (enemy.beamState !== 1) return
        const charge = Math.min(1, (enemy.beamTimer || 0) / 60)
        const angle = enemy.beamAngle || Math.atan2((enemy.beamY || 0) - enemy.y, (enemy.beamX || 0) - enemy.x)
        const highTier = (enemy.bossTier || 0) >= 4 || (state.gameTime > 1800 && enemy.bossTier !== 1)
        const angles = highTier ? [angle + Math.PI / 4, angle - Math.PI / 4] : [angle]

        for (const a of angles) {
            gfx.moveTo(0, 0)
            gfx.lineTo(Math.cos(a) * BEAM_LENGTH, Math.sin(a) * BEAM_LENGTH)
            gfx.stroke({ color: toHex(enemy.palette[1]), width: highTier ? 1 : 1.5, alpha: 0.2 + charge * 0.35 })
        }

        const orbCount = 4 + Math.floor(charge * 4)
        for (let i = 0; i < orbCount; i++) {
            const orbAngle = (i / orbCount) * Math.PI * 2 + state.gameTime * 3
            const orbDist = enemy.size * (1.5 - charge * 0.8)
            gfx.circle(Math.cos(orbAngle) * orbDist, Math.sin(orbAngle) * orbDist, 2 + charge * 3)
            gfx.fill({ color: toHex(enemy.palette[0]), alpha: 0.5 })
        }
    }

    private drawDiamondBeam(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (enemy.beamState !== 2 || enemy.beamX === undefined || enemy.beamY === undefined) return
        const highTier = (enemy.bossTier || 0) >= 4 || (state.gameTime > 1800 && enemy.bossTier !== 1)
        const center = enemy.beamAngle || Math.atan2(enemy.beamY - enemy.y, enemy.beamX - enemy.x)
        const duration = highTier ? 240 : 30
        const progress = Math.min(1, (enemy.beamTimer || 0) / duration)
        const width = (highTier ? 30 : 40) + Math.sin(state.gameTime * 50) * 10
        const offset = ((45 - 40.5 * progress) * Math.PI) / 180
        const angles = highTier ? [center + offset, center - offset] : [center]

        for (const angle of angles) {
            fillBeam(gfx, angle, width, toHex(enemy.palette[1]), 0.3)
            fillBeam(gfx, angle, width / 3, 0xffffff, 0.8)
        }
    }

    private drawDiamondSatelliteStrike(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (!enemy.satelliteTargets || enemy.satelliteState === 0) return
        const t = state.gameTime
        const eraIndex = Math.floor(((enemy.spawnedAt || state.gameTime) / 60) / 15) % 5
        const strikeColor = [0x4ade80, 0x3b82f6, 0xa855f7, 0xf97316, 0xef4444][eraIndex]

        if (enemy.satelliteState === 1) {
            const progress = Math.min(1, (enemy.satelliteTimer || 0) / 90)
            for (const target of enemy.satelliteTargets) {
                const tx = target.x - enemy.x
                const ty = target.y - enemy.y
                gfx.circle(tx, ty, 50 + (1 - progress) * 40)
                gfx.stroke({ color: strikeColor, width: 1, alpha: 0.3 + progress * 0.4 })
                gfx.circle(tx, ty, 30 * progress)
                gfx.stroke({ color: strikeColor, width: 1.5, alpha: 0.5 })
                drawCross(gfx, tx, ty, 15 * progress, strikeColor, 2, 0.6 * progress)
                for (let i = 0; i < 5 + Math.floor(progress * 8); i++) {
                    const a = (i / (5 + Math.floor(progress * 8))) * Math.PI * 2 + t * 4
                    const d = 30 + (1 - progress) * 50
                    gfx.circle(tx + Math.cos(a) * d, ty + Math.sin(a) * d, Math.max(0.5, 1.5 + Math.sin(t * 8 + i)))
                    gfx.fill({ color: strikeColor, alpha: 0.55 })
                }
            }
        }

        if (enemy.satelliteState === 2) {
            const fireProgress = Math.min(1, (enemy.satelliteTimer || 0) / 20)
            const fade = 1 - fireProgress
            for (const target of enemy.satelliteTargets) {
                const tx = target.x - enemy.x
                const ty = target.y - enemy.y
                gfx.rect(tx - 20, ty - 800, 40, 850)
                gfx.fill({ color: strikeColor, alpha: 0.28 * fade })
                gfx.rect(tx - 6, ty - 800, 12, 850)
                gfx.fill({ color: 0xffffff, alpha: 0.55 * fade })
                gfx.circle(tx, ty, 40 * (1 + Math.sin(t * 20) * 0.3))
                gfx.fill({ color: 0xffffff, alpha: 0.45 * fade })
            }
        }
    }

    private drawDiamondCrystalFence(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (!enemy.crystalPositions?.length) return
        const eraIndex = Math.floor(((enemy.spawnedAt || state.gameTime) / 60) / 15) % PALETTES.length
        const crystalColor = toHex(PALETTES[eraIndex].colors[0])

        if (enemy.crystalState === 1) {
            const progress = Math.min(1, (enemy.timer || 0) / 60)
            enemy.crystalPositions.forEach((point, index) => {
                const next = enemy.crystalPositions![(index + 1) % enemy.crystalPositions!.length]
                drawDiamondAt(gfx, point.x - enemy.x, point.y - enemy.y, 15)
                gfx.stroke({ color: crystalColor, width: 2, alpha: 0.3 + progress * 0.4 })
                gfx.moveTo(point.x - enemy.x, point.y - enemy.y)
                gfx.lineTo(next.x - enemy.x, next.y - enemy.y)
                gfx.stroke({ color: crystalColor, width: 1, alpha: progress * 0.5 })
            })
        } else if (enemy.crystalState === 2) {
            enemy.crystalPositions.forEach((point, index) => {
                const next = enemy.crystalPositions![(index + 1) % enemy.crystalPositions!.length]
                const points = buildWobblePath(point.x - enemy.x, point.y - enemy.y, next.x - enemy.x, next.y - enemy.y, 10, state.gameTime, 8, index * 0.8, 10, 50)
                gfx.moveTo(point.x - enemy.x, point.y - enemy.y)
                gfx.lineTo(next.x - enemy.x, next.y - enemy.y)
                gfx.stroke({ color: crystalColor, width: 8 + Math.sin(state.gameTime * 30) * 4, alpha: 0.35 })
                strokePolyline(gfx, points, 0xffffff, 2, 0.75)
                drawDiamondAt(gfx, point.x - enemy.x, point.y - enemy.y, 18)
                gfx.fill({ color: crystalColor, alpha: 0.7 })
                drawDiamondAt(gfx, point.x - enemy.x, point.y - enemy.y, 18)
                gfx.stroke({ color: 0xffffff, width: 2, alpha: 0.9 })
            })
        }
    }

    private drawPentagonSoulLinks(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (!enemy.soulLinkTargets?.length) return
        const eraIndex = Math.floor(((enemy.spawnedAt || state.gameTime) / 60) / 15) % PALETTES.length
        const linkColor = toHex(PALETTES[eraIndex].colors[0])

        enemy.soulLinkTargets.forEach((targetId, index) => {
            const target = state.enemies.find(entry => entry.id === targetId && !entry.dead)
            if (!target) return
            const points = buildWobblePath(0, 0, target.x - enemy.x, target.y - enemy.y, 12, state.gameTime, 15 + Math.sin(state.gameTime * 2 + index) * 5, index * 2, 12, 5)
            strokePolyline(gfx, points, linkColor, 3, 0.2)
            strokePolyline(gfx, points, linkColor, 1.5, 0.5 + Math.sin(state.gameTime * 4 + index * 1.3) * 0.2)
            gfx.circle(target.x - enemy.x, target.y - enemy.y, 10)
            gfx.fill({ color: linkColor, alpha: 0.35 })
            const p = samplePolyline(points, (state.gameTime * 1.2 + index * 0.2) % 1)
            gfx.circle(p.x, p.y, 2)
            gfx.fill({ color: 0xffffff, alpha: 0.5 })
        })
    }

    private drawPentagonParasiteLink(gfx: Graphics, enemy: Enemy, state: GameState): void {
        if (!enemy.parasiteLinkActive) return
        const tx = state.player.x - enemy.x
        const ty = state.player.y - enemy.y
        for (let layer = 0; layer < 3; layer++) {
            const points = buildWobblePath(0, 0, tx, ty, 30, state.gameTime, 20 + layer * 8, layer * 2.1, 10, 7, true)
            const color = layer === 0 ? 0xdc2626 : (layer === 1 ? 0xef4444 : 0xfca5a5)
            const width = layer === 0 ? 4 : (layer === 1 ? 2 : 1)
            const alpha = layer === 0 ? 0.15 : (layer === 1 ? 0.4 + Math.sin(state.gameTime * 5) * 0.15 : 0.3 + Math.sin(state.gameTime * 8) * 0.15)
            strokePolyline(gfx, points, color, width, alpha)
        }

        for (let i = 0; i < 6; i++) {
            const point = sampleLinkPoint(0, 0, tx, ty, (state.gameTime * 1.2 + i * 0.17) % 1, state.gameTime, 20)
            gfx.circle(point.x, point.y, 2.5)
            gfx.fill({ color: i % 2 === 0 ? 0xef4444 : 0xfca5a5, alpha: 0.6 })
        }

        gfx.circle(tx, ty, 30)
        gfx.fill({ color: 0xef4444, alpha: 0.18 })
        gfx.circle(0, 0, 25)
        gfx.fill({ color: 0x4ade80, alpha: 0.2 })
    }

    private drawLegionShield(enemy: Enemy, state: GameState): void {
        if (!enemy.legionId || !enemy.maxLegionShield || !enemy.legionShield || enemy.id !== enemy.legionLeadId) return
        const spacing = enemy.size * 2.5
        const gridWidth = 5 * spacing
        const gridHeight = 4 * spacing
        const centerX = -(enemy.legionSlot?.x || 0) * spacing
        const centerY = -(enemy.legionSlot?.y || 0) * spacing
        const barWidth = gridWidth + 40
        const barY = enemy.y + centerY - gridHeight / 2 - 80
        const barX = enemy.x + centerX - barWidth / 2
        const shieldPct = Math.max(0, enemy.legionShield / enemy.maxLegionShield)

        this.overlayGfx.circle(enemy.x + centerX, enemy.y + centerY, gridWidth * 1.2)
        this.overlayGfx.fill({ color: 0x38bdf8, alpha: 0.15 * (0.5 + Math.sin(state.gameTime * 3) * 0.2) })
        this.overlayGfx.rect(barX, barY, barWidth, 8)
        this.overlayGfx.fill({ color: 0x000000, alpha: 0.7 })
        this.overlayGfx.rect(barX, barY, barWidth * shieldPct, 8)
        this.overlayGfx.fill({ color: 0x38bdf8, alpha: 1 })
    }

    private drawBossStatus(enemy: Enemy): void {
        if (enemy.maxHp > 0 && enemy.hp < enemy.maxHp) {
            const barW = enemy.size * 3.5
            const y = enemy.y - enemy.size * 2.2
            this.overlayGfx.rect(enemy.x - barW / 2, y, barW, 6)
            this.overlayGfx.fill({ color: 0x000000, alpha: 0.6 })
            this.overlayGfx.rect(enemy.x - barW / 2, y, barW * (enemy.hp / enemy.maxHp), 6)
            this.overlayGfx.fill({ color: toHex(enemy.palette?.[1] ?? '#ff0000'), alpha: 1 })
            this.overlayGfx.rect(enemy.x - barW / 2 + barW * 0.33, y, 1.5, 6)
            this.overlayGfx.fill({ color: 0xffffff, alpha: 0.8 })
            this.overlayGfx.rect(enemy.x - barW / 2 + barW * 0.66, y, 1.5, 6)
            this.overlayGfx.fill({ color: 0xffffff, alpha: 0.8 })
        }

        if (enemy.frozen && enemy.frozen > 0) {
            this.overlayGfx.circle(enemy.x, enemy.y, enemy.size * 1.2)
            this.overlayGfx.fill({ color: 0xbae6fd, alpha: 0.35 })
        }
    }

    private drawAnomalyAura(visual: BossVisual, enemy: Enemy, state: GameState): void {
        const stage = enemy.stage || 1
        const radius = 390 + (enemy.anomalyGeneration || 0) * 10 + (enemy.bonusBurnRadius || 0)
        const texture = this.getRadialTexture(`anomaly:${stage}`, getAnomalyStops(stage))
        visual.aura.visible = true
        visual.aura.texture = texture
        visual.aura.position.set(enemy.x, enemy.y)
        visual.aura.scale.set((radius * 2 * (1 + Math.sin(state.gameTime * 4) * 0.05)) / texture.width)
        visual.aura.alpha = 1

        visual.fx.circle(0, 0, enemy.size * 1.6)
        visual.fx.stroke({ color: stage === 1 ? 0xef4444 : (stage === 2 ? 0xdc2626 : 0xb91c1c), width: 3, alpha: 0.6 + (stage - 1) * 0.1 })
    }

    private drawOrbitalShield(visual: BossVisual, enemy: Enemy, state: GameState): void {
        visual.aura.visible = false
        visual.afterglow.visible = false
        visual.container.rotation = 0

        const pulse = 1 + Math.sin(state.gameTime * 4 + (enemy.rotationPhase || 0) * 3) * 0.1
        const face = (enemy.rotationPhase || 0) + Math.PI
        const points = [
            project(face, -3.6, -37.5 * pulse),
            project(face, 12, -22.5 * pulse),
            project(face, 14.4, 0),
            project(face, 12, 22.5 * pulse),
            project(face, -3.6, 37.5 * pulse),
            project(face, -6, 0),
        ]
        strokeClosedPolygon(visual.body, points, 0x67e8f9, 2, 0.9, 0x06b6d4, 0.45)
        const inner = [project(face, 6, -26.25 * pulse), project(face, 9.6, 0), project(face, 6, 26.25 * pulse)]
        strokePolyline(visual.fx, inner, 0xffffff, 1, 0.45 + Math.sin(state.gameTime * 8 + (enemy.rotationPhase || 0)) * 0.2)
    }

    private drawPhalanxDrone(visual: BossVisual, enemy: Enemy, state: GameState): void {
        visual.aura.visible = false
        visual.afterglow.visible = false
        visual.container.rotation = enemy.rotationPhase || 0
        const size = enemy.size
        const bodyLength = size * 2.2
        const bodyWidth = size * 0.6

        strokeClosedPolygon(visual.body, [
            { x: bodyLength * 0.5, y: 0 },
            { x: -bodyLength * 0.1, y: -bodyWidth },
            { x: -bodyLength * 0.5, y: -bodyWidth * 0.6 },
            { x: -bodyLength * 0.5, y: bodyWidth * 0.6 },
            { x: -bodyLength * 0.1, y: bodyWidth },
        ], 0xeab308, 1.5, 1, 0x334155, 0.9)

        for (const side of [-1, 1]) {
            strokeClosedPolygon(visual.body, [
                { x: bodyLength * 0.1, y: side * bodyWidth * 0.5 },
                { x: -bodyLength * 0.2, y: side * bodyWidth * 2 },
                { x: -bodyLength * 0.4, y: side * bodyWidth * 1.5 },
                { x: -bodyLength * 0.3, y: side * bodyWidth * 0.5 },
            ], 0xeab308, 1, 1, 0x475569, 0.9)
        }

        for (let i = 0; i < 3; i++) {
            const x = bodyLength * 0.3 - i * bodyLength * 0.25
            const s = size * (0.3 - i * 0.05)
            fillClosedPolygon(visual.fx, [
                { x: x + s, y: 0 },
                { x: x - s * 0.5, y: -s * 0.6 },
                { x: x - s * 0.3, y: 0 },
                { x: x - s * 0.5, y: s * 0.6 },
            ], 0xffffff, 0.7 - i * 0.15)
        }

        visual.fx.circle(bodyLength * 0.35, 0, 3)
        visual.fx.fill({ color: 0x22d3ee, alpha: 0.6 + Math.sin(state.gameTime * 10) * 0.3 })

        if (Math.hypot(enemy.vx || 0, enemy.vy || 0) > 2) {
            for (let i = 0; i < 8; i++) {
                const frac = (i + 1) / 8
                const x = -enemy.size * 1.1 - 60 * frac
                const y = Math.sin(state.gameTime * 15 + i * 3) * 3
                visual.fx.circle(x, y, (1 - frac * 0.3) * 8 + Math.sin(state.gameTime * 15 + i * 2) * 3)
                visual.fx.fill({ color: i < 2 ? 0xffffff : 0x22d3ee, alpha: (1 - frac) * 0.35 })
            }
        }
    }

    private pruneVisuals(activeIds: Set<number>): void {
        for (const [id, visual] of this.bosses) {
            if (activeIds.has(id)) continue
            this.auraContainer.removeChild(visual.aura)
            this.indicatorContainer.removeChild(visual.indicators)
            this.bodyContainer.removeChild(visual.container)
            visual.aura.destroy()
            visual.indicators.destroy()
            visual.container.destroy({ children: true })
            this.bosses.delete(id)
        }
    }

    private getRadialTexture(key: string, stops: Array<{ radius: number; color: number; alpha: number }>): Texture {
        const cached = this.radialTextures.get(key)
        if (cached) return cached
        const size = 512
        const center = size / 2
        const gfx = new Graphics()
        ;(gfx as Graphics & { label?: string | null }).label ??= `boss-radial:${key}`
        for (let i = stops.length - 1; i >= 0; i--) {
            gfx.circle(center, center, center * stops[i].radius)
            gfx.fill({ color: stops[i].color, alpha: stops[i].alpha })
        }
        const texture = RenderTexture.create({ width: size, height: size })
        ;(texture.source as { label?: string | null }).label ??= `boss-radial:${key}`
        try {
            this.app.renderer.render({ container: gfx, target: texture })
            this.radialTextures.set(key, texture)
            return texture
        } catch (error) {
            console.warn(`Boss radial texture generation failed for ${key}, falling back to default texture.`, error)
            texture.destroy(true)
            this.radialTextures.set(key, Texture.WHITE)
            return Texture.WHITE
        } finally {
            gfx.destroy()
        }
    }
}

function buildViewport(camera: { x: number; y: number }, screenWidth?: number, screenHeight?: number): Viewport | null {
    if (!screenWidth || !screenHeight) return null
    return {
        x: camera.x,
        y: camera.y,
        halfW: screenWidth / (2 * VIEWPORT_SCALE),
        halfH: screenHeight / (2 * VIEWPORT_SCALE),
    }
}

function getBossColors(enemy: Enemy): BossColors {
    const palette = enemy.eraPalette?.length ? enemy.eraPalette : enemy.palette
    return {
        core: toHex(palette?.[0] ?? '#ffffff'),
        inner: toHex(palette?.[1] ?? '#880000'),
        outer: toHex(palette?.[2] ?? '#440000'),
    }
}

function getAnomalyStops(stage: number): Array<{ radius: number; color: number; alpha: number }> {
    if (stage === 2) return [{ radius: 1, color: 0xdc2626, alpha: 0 }, { radius: 0.7, color: 0xdc2626, alpha: 0.2 }, { radius: 0.1, color: 0xef4444, alpha: 0.5 }]
    if (stage === 3) return [{ radius: 1, color: 0x991b1b, alpha: 0 }, { radius: 0.7, color: 0xb91c1c, alpha: 0.3 }, { radius: 0.1, color: 0xdc2626, alpha: 0.6 }]
    return [{ radius: 1, color: 0xef4444, alpha: 0 }, { radius: 0.7, color: 0xef4444, alpha: 0.15 }, { radius: 0.1, color: 0xf59e0b, alpha: 0.4 }]
}

function drawBossShape(gfx: Graphics, enemy: Enemy, size: number, state: GameState): void {
    const t = state.gameTime
    const warp = 0.05 + (enemy.bossTier || 1) * 0.03
    const spike = 0.1 + (enemy.bossTier || 1) * 0.05
    switch (enemy.shape) {
        case 'circle': return drawDistortedCircle(gfx, size, t, enemy.id, warp, spike)
        case 'triangle': return drawDistortedPolygon(gfx, triangleVertices(size), t, size, warp, spike, 12)
        case 'square': return drawDistortedPolygon(gfx, squareVertices(size), t, size, warp, spike, 10)
        case 'diamond': return drawDistortedPolygon(gfx, diamondVertices(size), t, size, warp, spike, 10)
        case 'pentagon': return drawDistortedPolygon(gfx, regularPolygon(5, size), t, size, warp, spike, 10)
        case 'abomination': return drawAbomination(gfx, size, enemy, state)
        default: gfx.circle(0, 0, size)
    }
}

function drawDistortedCircle(gfx: Graphics, size: number, time: number, enemyId: number, warp: number, spike: number): void {
    for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2
        const radius = size * (1 + Math.sin(a * 6 + time * 4 + enemyId) * warp + Math.sin(a * 10 - time * 7) * warp * 0.5 + Math.max(0, Math.sin(a * 3 + time * 2)) * spike)
        const p = { x: Math.cos(a) * radius, y: Math.sin(a) * radius }
        if (i === 0) gfx.moveTo(p.x, p.y)
        else gfx.lineTo(p.x, p.y)
    }
    gfx.closePath()
}

function drawDistortedPolygon(gfx: Graphics, vertices: Point[], time: number, size: number, warp: number, spike: number, divisions: number): void {
    for (let v = 0; v < vertices.length; v++) {
        const from = vertices[v]
        const to = vertices[(v + 1) % vertices.length]
        for (let i = 0; i <= divisions; i++) {
            const frac = i / divisions
            const edge = Math.sin(frac * Math.PI)
            const dx = to.x - from.x
            const dy = to.y - from.y
            const len = Math.hypot(dx, dy) || 1
            const nx = -dy / len
            const ny = dx / len
            const x = from.x + dx * frac + Math.sin(time * (3.5 + v * 0.4) + v * 3 + frac * 12) * size * warp * edge + nx * Math.max(0, Math.sin(frac * Math.PI * 3 + time * 3 + v)) * size * spike * edge
            const y = from.y + dy * frac + Math.cos(time * (4.5 + v * 0.2) + v * 2 + frac * 8) * size * warp * edge + ny * Math.max(0, Math.sin(frac * Math.PI * 3 + time * 3 + v)) * size * spike * edge
            if (v === 0 && i === 0) gfx.moveTo(x, y)
            else gfx.lineTo(x, y)
        }
    }
    gfx.closePath()
}

function drawAbomination(gfx: Graphics, size: number, enemy: Enemy, state: GameState): void {
    const dx = state.player.x - enemy.x
    const dy = state.player.y - enemy.y
    const angle = Math.atan2(dy, dx) - (enemy.rotationPhase || 0) + Math.PI / 2
    const rotate = (x: number, y: number): Point => ({ x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) })
    const points = [[0, -0.8], [0.5, -0.8], [0.8, -0.5], [0.8, -0.2], [0.5, 0.4], [0.6, 0.7], [0, 1], [-0.6, 0.7], [-0.5, 0.4], [-0.8, -0.2], [-0.8, -0.5], [-0.5, -0.8]]
    points.forEach(([x, y], index) => {
        const p = rotate(x * size, y * size)
        if (index === 0) gfx.moveTo(p.x, p.y)
        else gfx.lineTo(p.x, p.y)
    })
    gfx.closePath()
}

function triangleVertices(size: number): Point[] {
    return [{ x: 0, y: -size }, { x: size * 0.866, y: size * 0.5 }, { x: -size * 0.866, y: size * 0.5 }]
}

function squareVertices(size: number): Point[] {
    return [{ x: -size, y: -size }, { x: size, y: -size }, { x: size, y: size }, { x: -size, y: size }]
}

function diamondVertices(size: number): Point[] {
    return [{ x: 0, y: -size * 1.3 }, { x: size, y: 0 }, { x: 0, y: size * 1.3 }, { x: -size, y: 0 }]
}

function regularPolygon(sides: number, size: number): Point[] {
    return Array.from({ length: sides }, (_, i) => {
        const a = (i * 2 * Math.PI) / sides - Math.PI / 2
        return { x: Math.cos(a) * size, y: Math.sin(a) * size }
    })
}

function drawTriangle(gfx: Graphics, size: number): void {
    gfx.moveTo(0, -size)
    gfx.lineTo(size * 0.866, size * 0.5)
    gfx.lineTo(-size * 0.866, size * 0.5)
    gfx.closePath()
}

function drawDiamondAt(gfx: Graphics, x: number, y: number, size: number): void {
    gfx.moveTo(x, y - size)
    gfx.lineTo(x + size, y)
    gfx.lineTo(x, y + size)
    gfx.lineTo(x - size, y)
    gfx.closePath()
}

function buildWobblePath(startX: number, startY: number, endX: number, endY: number, segments: number, time: number, amplitude: number, phase: number, frequency: number, speed: number, chaos = false): Point[] {
    const angle = Math.atan2(endY - startY, endX - startX)
    const perpX = -Math.sin(angle)
    const perpY = Math.cos(angle)
    const points: Point[] = []

    for (let i = 0; i <= segments; i++) {
        const frac = i / segments
        const x = startX + (endX - startX) * frac
        const y = startY + (endY - startY) * frac
        const edge = Math.sin(frac * Math.PI)
        const wobble = Math.sin(frac * frequency + time * speed + phase) * amplitude * edge
        const extra = chaos ? Math.sin(frac * 20 + time * 12 + phase * 2) * 5 * edge : 0
        points.push({ x: x + perpX * (wobble + extra), y: y + perpY * (wobble + extra) })
    }

    return points
}

function sampleLinkPoint(startX: number, startY: number, endX: number, endY: number, frac: number, time: number, amplitude: number): Point {
    const angle = Math.atan2(endY - startY, endX - startX)
    const perpX = -Math.sin(angle)
    const perpY = Math.cos(angle)
    const x = startX + (endX - startX) * frac
    const y = startY + (endY - startY) * frac
    const wobble = Math.sin(frac * 10 + time * 7) * amplitude * Math.sin(frac * Math.PI)
    return { x: x + perpX * wobble, y: y + perpY * wobble }
}

function strokePolyline(gfx: Graphics, points: Point[], color: number, width: number, alpha: number): void {
    if (points.length === 0) return
    gfx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) gfx.lineTo(points[i].x, points[i].y)
    gfx.stroke({ color, width, alpha })
}

function samplePolyline(points: Point[], frac: number): Point {
    return points[Math.min(points.length - 1, Math.max(0, Math.floor(frac * (points.length - 1))))]
}

function strokeClosedPolygon(gfx: Graphics, points: Point[], stroke: number, width: number, alpha: number, fill?: number, fillAlpha?: number): void {
    if (!points.length) return
    gfx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) gfx.lineTo(points[i].x, points[i].y)
    gfx.closePath()
    if (fill !== undefined) gfx.fill({ color: fill, alpha: fillAlpha ?? 1 })
    gfx.stroke({ color: stroke, width, alpha })
}

function fillClosedPolygon(gfx: Graphics, points: Point[], fill: number, alpha: number): void {
    if (!points.length) return
    gfx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) gfx.lineTo(points[i].x, points[i].y)
    gfx.closePath()
    gfx.fill({ color: fill, alpha })
}

function fillBeam(gfx: Graphics, angle: number, width: number, color: number, alpha: number): void {
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const nx = -dy
    const ny = dx
    const hw = width * 0.5
    gfx.moveTo(nx * hw, ny * hw)
    gfx.lineTo(dx * BEAM_LENGTH + nx * hw, dy * BEAM_LENGTH + ny * hw)
    gfx.lineTo(dx * BEAM_LENGTH - nx * hw, dy * BEAM_LENGTH - ny * hw)
    gfx.lineTo(-nx * hw, -ny * hw)
    gfx.closePath()
    gfx.fill({ color, alpha })
}

function drawCross(gfx: Graphics, x: number, y: number, size: number, color: number, width: number, alpha: number): void {
    gfx.moveTo(x - size, y)
    gfx.lineTo(x + size, y)
    gfx.moveTo(x, y - size)
    gfx.lineTo(x, y + size)
    gfx.stroke({ color, width, alpha })
}

function project(rotation: number, x: number, y: number): Point {
    return { x: x * Math.cos(rotation) - y * Math.sin(rotation), y: x * Math.sin(rotation) + y * Math.cos(rotation) }
}

function toHex(color: string): number {
    return Number.parseInt(color.replace('#', ''), 16)
}

function pseudoRandom(seed: number): number {
    const n = Math.sin(seed) * 10000
    return n - Math.floor(n)
}
