import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { AreaEffect, GameState } from '../../../../core/Types'
import { isVisible } from '../../../ViewportCulling'
import type { Viewport } from '../../../ViewportCulling'

type AreaEffectVisual = {
    container: Container
    base: Sprite
    aura: Sprite
    detail: Sprite
    gfx: Graphics
}

type AreaTextures = {
    bubbleTexture: Texture
    voidTexture: Texture
    noiseTexture: Texture
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value))
}

function getEffectCullRadius(effect: AreaEffect): number {
    switch (effect.type) {
        case 'storm_hit':
        case 'afk_strike_hit':
            return Math.max(2000, (effect.radius || 0) + 150)
        case 'crater':
        case 'orbital_strike':
        case 'storm_zone':
        case 'storm_laser':
        case 'glitch_cloud':
        case 'nanite_cloud':
        case 'temporal_burst':
        case 'temporal_freeze_wave':
        case 'afk_strike':
            return (effect.radius || 300) + 120
        case 'blackhole':
            return (effect.radius || 400) + 140
        case 'epicenter':
            return (effect.radius || 500) + 160
        case 'puddle':
            return (effect.radius || 500) + 120
        default:
            return (effect.radius || 200) + 100
    }
}

export class AreaEffectRenderer {
    readonly container: Container

    private areaEffects = new Map<number, AreaEffectVisual>()
    private bubbleTexture: Texture
    private voidTexture: Texture
    private noiseTexture: Texture

    constructor(textures: AreaTextures) {
        this.container = new Container()
        this.bubbleTexture = textures.bubbleTexture
        this.voidTexture = textures.voidTexture
        this.noiseTexture = textures.noiseTexture
    }

    update(state: GameState, viewport: Viewport | null): void {
        const activeIds = new Set<number>()

        for (const effect of state.areaEffects) {
            const cullRadius = getEffectCullRadius(effect)
            const visible = !viewport || isVisible(effect.x, effect.y, cullRadius, viewport)
            if (!visible) continue

            activeIds.add(effect.id)
            const visual = this.getOrCreateAreaVisual(effect.id)
            visual.container.visible = true
            visual.container.position.set(effect.x, effect.y)
            visual.gfx.clear()

            switch (effect.type) {
                case 'puddle':
                    this.drawPuddle(effect, state, visual)
                    break
                case 'epicenter':
                    this.drawEpicenter(effect, state, visual)
                    break
                case 'blackhole':
                    this.drawBlackhole(effect, state, visual)
                    break
                case 'glitch_cloud':
                    this.drawGlitchCloud(effect, state, visual)
                    break
                case 'orbital_strike':
                    this.drawOrbitalStrike(effect, state, visual)
                    break
                case 'storm_zone':
                    this.drawStormZone(effect, state, visual)
                    break
                case 'storm_laser':
                    this.drawStormLaser(effect, state, visual)
                    break
                case 'storm_hit':
                    this.drawStormHit(effect, state, visual)
                    break
                case 'crater':
                    this.drawCrater(effect, state, visual)
                    break
                case 'nanite_cloud':
                    this.drawNaniteCloud(effect, state, visual)
                    break
                case 'afk_strike':
                    this.drawAfkStrike(effect, state, visual)
                    break
                case 'afk_strike_hit':
                    this.drawAfkStrikeHit(effect, state, visual)
                    break
                case 'temporal_burst':
                    this.drawTemporalBurst(effect, state, visual)
                    break
                case 'temporal_freeze_wave':
                    this.drawTemporalFreezeWave(effect, state, visual)
                    break
                default:
                    this.hideAreaSprites(visual)
                    break
            }
        }

        for (const [id, visual] of this.areaEffects) {
            if (!activeIds.has(id)) {
                this.container.removeChild(visual.container)
                visual.container.destroy({ children: true })
                this.areaEffects.delete(id)
            }
        }
    }

    destroy(): void {
        for (const visual of this.areaEffects.values()) {
            visual.container.destroy({ children: true })
        }
        this.areaEffects.clear()
        this.container.destroy({ children: true })
    }

    private getOrCreateAreaVisual(id: number): AreaEffectVisual {
        const existing = this.areaEffects.get(id)
        if (existing) return existing

        const container = new Container()
        const base = new Sprite(this.bubbleTexture)
        const aura = new Sprite(this.bubbleTexture)
        const detail = new Sprite(this.bubbleTexture)
        const gfx = new Graphics()

        base.anchor.set(0.5)
        aura.anchor.set(0.5)
        detail.anchor.set(0.5)
        aura.blendMode = 'add'
        detail.blendMode = 'add'

        container.addChild(base)
        container.addChild(aura)
        container.addChild(detail)
        container.addChild(gfx)

        const visual = { container, base, aura, detail, gfx }
        this.container.addChild(container)
        this.areaEffects.set(id, visual)
        return visual
    }

    private hideAreaSprites(visual: AreaEffectVisual): void {
        visual.base.visible = false
        visual.aura.visible = false
        visual.detail.visible = false
    }

    private drawPuddle(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const baseRadius = effect.radius
        const t = state.gameTime
        const pulse = 0.98 + Math.sin(t * 1.8 + effect.id) * 0.03

        visual.base.visible = true
        visual.base.texture = this.bubbleTexture
        visual.base.scale.set((baseRadius * 2 * pulse) / this.bubbleTexture.width)
        visual.base.tint = 0x15803d
        visual.base.alpha = 0.34

        visual.aura.visible = true
        visual.aura.texture = this.bubbleTexture
        visual.aura.scale.set((baseRadius * 1.45) / this.bubbleTexture.width)
        visual.aura.tint = 0x4ade80
        visual.aura.alpha = 0.22

        visual.detail.visible = true
        visual.detail.texture = this.noiseTexture
        visual.detail.scale.set((baseRadius * 1.75) / this.noiseTexture.width)
        visual.detail.tint = 0x06b6d4
        visual.detail.alpha = 0.12
        visual.detail.rotation = t * 0.18

        const segments = 30
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const offset = Math.sin(angle * 6 + t * 2) * 20
                + Math.sin(angle * 15 - t * 4) * 10
                + Math.sin(angle * 3 + t) * 15
            const r = baseRadius + offset
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r
            if (i === 0) visual.gfx.moveTo(x, y)
            else visual.gfx.lineTo(x, y)
        }
        visual.gfx.closePath()
        visual.gfx.fill({ color: 0x16a34a, alpha: 0.2 })
        visual.gfx.stroke({ color: 0x06b6d4, width: 4, alpha: 0.8 })

        const rippleRadius = (t * 50) % baseRadius
        visual.gfx.circle(0, 0, Math.max(1, rippleRadius))
        visual.gfx.stroke({ color: 0xbef264, width: 2, alpha: 0.28 })
    }

    private drawEpicenter(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const baseRadius = effect.radius || 500
        const t = state.gameTime
        const pulse = 1 + Math.sin(t * 2 + effect.id) * 0.025
        const isGold = !!(effect.isGravityAnchor || effect.isGravitationalHarvest)
        const accent = isGold ? 0xfbbf24 : 0x22d3ee

        visual.base.visible = true
        visual.base.texture = this.bubbleTexture
        visual.base.scale.set((baseRadius * 2 * pulse) / this.bubbleTexture.width, (baseRadius * 1.2 * pulse) / this.bubbleTexture.height)
        visual.base.tint = 0x0ea5e9
        visual.base.alpha = 0.16

        visual.aura.visible = true
        visual.aura.texture = this.bubbleTexture
        visual.aura.scale.set((baseRadius * 1.2) / this.bubbleTexture.width, (baseRadius * 0.72) / this.bubbleTexture.height)
        visual.aura.tint = accent
        visual.aura.alpha = 0.18

        visual.detail.visible = true
        visual.detail.texture = this.noiseTexture
        visual.detail.scale.set((baseRadius * 1.55) / this.noiseTexture.width, (baseRadius * 0.92) / this.noiseTexture.height)
        visual.detail.tint = 0xffffff
        visual.detail.alpha = 0.08
        visual.detail.rotation = -t * 0.14

        for (let a = 0; a < Math.PI * 2; a += 0.2) {
            const ripple = Math.sin(a * 8 + t * 2) * 5
            const r = baseRadius + ripple
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r * 0.6
            if (a === 0) visual.gfx.moveTo(x, y)
            else visual.gfx.lineTo(x, y)
        }
        visual.gfx.closePath()
        visual.gfx.fill({ color: 0x38bdf8, alpha: 0.08 })
        visual.gfx.stroke({ color: 0x22d3ee, width: 6, alpha: 0.3 })
        visual.gfx.stroke({ color: accent, width: 2, alpha: 0.95 })

        const pulseProgress = (state.gameTime % 1.5) / 1.5
        const pulseRadius = baseRadius * (0.5 + pulseProgress)
        visual.gfx.ellipse(0, 0, Math.max(1, pulseRadius), Math.max(1, pulseRadius * 0.6))
        visual.gfx.stroke({ color: accent, width: 1, alpha: 1 - pulseProgress })

        const progress = ((effect.pulseTimer || 0) / 0.5) % 1
        for (let i = 0; i < 16; i++) {
            const seedX = Math.sin(i * 123.4) * (baseRadius * 0.75)
            const seedY = Math.cos(i * 567.8) * (baseRadius * 0.75) * 0.6
            const localOffset = (i * 0.13) % 0.5
            const heightProgress = Math.max(0, Math.sin(((progress + localOffset) % 1) * Math.PI))
            const h = (70 + Math.sin(i * 2) * 15) * heightProgress
            const w = 15 + Math.cos(i) * 5
            const tilt = Math.sin(i * 456) * 10 * (Math.PI / 180)

            if (h <= 0.5) continue

            const leftX = seedX + Math.cos(Math.PI + tilt) * (w / 2)
            const leftY = seedY + Math.sin(Math.PI + tilt) * (w / 2)
            const rightX = seedX + Math.cos(tilt) * (w / 2)
            const rightY = seedY + Math.sin(tilt) * (w / 2)
            const topX = seedX + Math.sin(tilt) * h
            const topY = seedY - Math.cos(tilt) * h

            visual.gfx.moveTo(leftX, leftY)
            visual.gfx.lineTo(topX, topY)
            visual.gfx.lineTo(rightX, rightY)
            visual.gfx.closePath()
            visual.gfx.fill({ color: i % 2 === 0 && isGold ? 0xfbbf24 : 0x22d3ee, alpha: 0.55 })
            visual.gfx.stroke({ color: 0xffffff, width: 1, alpha: 0.28 })
        }
    }

    private drawBlackhole(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const pullRadius = effect.radius || 400
        const coreRadius = 40
        const t = state.gameTime

        visual.base.visible = true
        visual.base.texture = this.bubbleTexture
        visual.base.scale.set((pullRadius * 2.05) / this.bubbleTexture.width, (pullRadius * 1.25) / this.bubbleTexture.height)
        visual.base.tint = 0x4c1d95
        visual.base.alpha = 0.12
        visual.base.rotation = t * 0.1

        visual.aura.visible = true
        visual.aura.texture = this.noiseTexture
        visual.aura.scale.set((pullRadius * 2.2) / this.noiseTexture.width, (pullRadius * 1.3) / this.noiseTexture.height)
        visual.aura.tint = 0x7e22ce
        visual.aura.alpha = 0.16
        visual.aura.rotation = -t * 0.18

        visual.detail.visible = true
        visual.detail.texture = this.voidTexture
        visual.detail.scale.set((coreRadius * 2) / this.voidTexture.width)
        visual.detail.tint = 0x000000
        visual.detail.alpha = 1

        const rotation = (t * 3) % (Math.PI * 2)
        for (let layer = 0; layer < 6; layer++) {
            const layerRadius = coreRadius + (pullRadius - coreRadius) * (0.2 + (layer / 5) * 0.8)
            const segments = 60

            for (let i = 0; i <= segments; i++) {
                const angle = (i / segments) * Math.PI * 2 + rotation + layer * 0.3
                const distorted = angle + Math.sin(angle * 3 + t * 5) * 0.3
                const x = Math.cos(distorted) * layerRadius
                const y = Math.sin(distorted) * layerRadius * 0.6
                if (i === 0) visual.gfx.moveTo(x, y)
                else visual.gfx.lineTo(x, y)
            }
            visual.gfx.stroke({
                color: 0x7e22ce,
                width: Math.max(0.8, 3 - layer * 0.4),
                alpha: Math.max(0, (0.35 - layer * 0.05) * (0.7 + Math.sin(t * 4 + layer) * 0.3)),
            })
        }

        visual.gfx.circle(0, 0, coreRadius + 4)
        visual.gfx.stroke({ color: 0x38bdf8, width: 6, alpha: 0.5 })
        visual.gfx.stroke({ color: 0xf8fafc, width: 2, alpha: 0.9 })

        visual.gfx.circle(0, 0, coreRadius)
        visual.gfx.fill({ color: 0x000000, alpha: 1 })
    }

    private drawGlitchCloud(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const radius = effect.radius || 100
        const t = state.gameTime

        visual.base.visible = true
        visual.base.texture = this.noiseTexture
        visual.base.scale.set((radius * 2.1) / this.noiseTexture.width)
        visual.base.tint = 0xff00ff
        visual.base.alpha = 0.14
        visual.base.rotation = t * 0.2

        visual.aura.visible = true
        visual.aura.texture = this.noiseTexture
        visual.aura.scale.set((radius * 1.7) / this.noiseTexture.width)
        visual.aura.tint = 0x00ffff
        visual.aura.alpha = 0.14
        visual.aura.rotation = -t * 0.24

        visual.detail.visible = false

        for (let i = 0; i < 15; i++) {
            const offX = Math.sin(i * 123 + t * 5) * radius * 0.8
            const offY = Math.cos(i * 456 + t * 5) * radius * 0.8
            const size = 10 + Math.sin(i + t * 10) * 5
            visual.gfx.rect(offX, offY, size, size)
            visual.gfx.fill({
                color: i % 2 === 0 ? 0xff00ff : 0x00ffff,
                alpha: clamp01(0.4 + Math.sin(t * 20 + i) * 0.2),
            })
        }

        for (let a = 0; a < Math.PI * 2; a += 0.5) {
            const r = radius * (0.92 + Math.sin(a * 7 + effect.id) * 0.08)
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r
            if (a === 0) visual.gfx.moveTo(x, y)
            else visual.gfx.lineTo(x, y)
        }
        visual.gfx.closePath()
        visual.gfx.stroke({ color: 0xffffff, width: 1, alpha: 0.2 })
    }

    private drawOrbitalStrike(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const timeLeft = effect.duration
        const progress = 1 - (timeLeft / 0.3)
        const baseRadius = effect.radius || 150

        visual.base.visible = true
        visual.base.texture = this.bubbleTexture
        visual.base.scale.set((baseRadius * 2) / this.bubbleTexture.width)
        visual.base.tint = 0x38bdf8
        visual.base.alpha = 0.08

        visual.aura.visible = true
        visual.aura.texture = this.noiseTexture
        visual.aura.scale.set((baseRadius * 2.1) / this.noiseTexture.width)
        visual.aura.tint = 0x38bdf8
        visual.aura.alpha = 0.08
        visual.aura.rotation = state.gameTime * 2

        visual.detail.visible = false

        visual.gfx.circle(0, 0, baseRadius * (1 - progress * 0.5))
        visual.gfx.stroke({ color: 0x38bdf8, width: 2, alpha: 0.5 + progress * 0.5 })
        visual.gfx.circle(0, 0, baseRadius * 0.2)
        visual.gfx.stroke({ color: 0x38bdf8, width: 2, alpha: 1 })
    }

    private drawStormZone(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const alpha = Math.min(1, effect.duration * 3)
        const baseRadius = effect.radius || 250

        visual.base.visible = false
        visual.aura.visible = false
        visual.detail.visible = false

        const dashCount = 24
        const dashSpan = (Math.PI * 2) / dashCount
        const dashOffset = -(state.gameTime * 60) % 24
        for (let i = 0; i < dashCount; i++) {
            const start = i * dashSpan + dashOffset * 0.002
            const end = start + dashSpan * 0.55
            visual.gfx.arc(0, 0, baseRadius, start, end)
            visual.gfx.stroke({ color: 0x06b6d4, width: 2, alpha: alpha * 0.7 })
        }
    }

    private drawStormLaser(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const initialDuration = effect.pulseTimer || 0.15
        const progress = Math.min(1, 1 - (effect.duration / initialDuration))
        const radius = (effect.radius || 120) * 0.55

        visual.base.visible = true
        visual.base.texture = this.bubbleTexture
        visual.base.scale.set((radius * 2) / this.bubbleTexture.width)
        visual.base.tint = 0x38bdf8
        visual.base.alpha = 0.08 + progress * 0.12

        visual.aura.visible = true
        visual.aura.texture = this.noiseTexture
        visual.aura.scale.set((radius * 2.1) / this.noiseTexture.width)
        visual.aura.tint = 0x38bdf8
        visual.aura.alpha = 0.12
        visual.aura.rotation = state.gameTime * 4

        visual.detail.visible = false

        visual.gfx.circle(0, 0, radius * (1 - progress * 0.3))
        visual.gfx.stroke({ color: 0x38bdf8, width: 2, alpha: 0.35 + progress * 0.65 })
        visual.gfx.circle(0, 0, radius * 0.18)
        visual.gfx.stroke({ color: 0x38bdf8, width: 2, alpha: 1 })
    }

    private drawStormHit(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const lifeTime = state.gameTime - effect.creationTime
        const beamDuration = 0.35
        const radius = effect.radius || 120

        visual.base.visible = false
        visual.aura.visible = false
        visual.detail.visible = false

        if (lifeTime >= beamDuration) return

        const beamAlpha = 1 - (lifeTime / beamDuration)
        const beamHeight = 2000
        const beamWidth = radius * 0.9

        visual.gfx.rect(-beamWidth / 2, -beamHeight, beamWidth, beamHeight)
        visual.gfx.fill({ color: 0xffffff, alpha: 0.35 * beamAlpha })

        visual.gfx.moveTo(0, 0)
        visual.gfx.lineTo(0, -beamHeight)
        visual.gfx.stroke({ color: 0xffffff, width: 5, alpha: 0.7 * beamAlpha })

        visual.gfx.moveTo(-radius * 0.35, 0)
        visual.gfx.lineTo(-radius * 0.35, -beamHeight)
        visual.gfx.moveTo(radius * 0.35, 0)
        visual.gfx.lineTo(radius * 0.35, -beamHeight)
        visual.gfx.stroke({ color: 0x38bdf8, width: 1.5, alpha: 0.35 * beamAlpha })
    }

    private drawCrater(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const lifeTime = state.gameTime - effect.creationTime
        const duration = effect.duration
        const radius = effect.radius || 150
        const alpha = Math.max(0, duration > 1 ? 1 : duration)

        visual.base.visible = false
        visual.aura.visible = false
        visual.detail.visible = false

        const seed = effect.id
        for (let i = 0; i < 4; i++) {
            const angle = (i * (Math.PI / 4)) + (seed % 100) * 0.01
            const len = radius * 0.4
            visual.gfx.moveTo(Math.cos(angle) * -len, Math.sin(angle) * -len * 0.6)
            visual.gfx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len * 0.6)
            visual.gfx.stroke({ color: 0x323c50, width: 3, alpha: 0.8 * alpha })
        }

        for (let i = 0; i < 5; i++) {
            const angle = (i * 2.5) + (seed % 50) * 0.1
            const dist = radius * 0.2
            const crackLen = radius * 0.3
            const startX = Math.cos(angle) * dist
            const startY = Math.sin(angle) * dist * 0.6
            visual.gfx.moveTo(startX, startY)
            visual.gfx.lineTo(startX + Math.cos(angle + 0.5) * crackLen, startY + Math.sin(angle + 0.5) * crackLen * 0.6)
            visual.gfx.stroke({ color: 0x323c50, width: 1.5, alpha: 0.8 * alpha })
        }

        const beamDuration = 0.6
        if (lifeTime < beamDuration) {
            const beamAlpha = 1 - (lifeTime / beamDuration)
            const beamHeight = 2000
            const beamWidth = radius * 1.5

            visual.gfx.rect(-beamWidth / 2, -beamHeight, beamWidth, beamHeight)
            visual.gfx.fill({ color: 0xffffff, alpha: 0.45 * beamAlpha })

            visual.gfx.moveTo(0, 0)
            visual.gfx.lineTo(0, -beamHeight)
            visual.gfx.stroke({ color: 0xffffff, width: 6, alpha: 0.8 * beamAlpha })

            visual.gfx.moveTo(-radius * 0.5, 0)
            visual.gfx.lineTo(-radius * 0.5, -beamHeight)
            visual.gfx.moveTo(radius * 0.5, 0)
            visual.gfx.lineTo(radius * 0.5, -beamHeight)
            visual.gfx.stroke({ color: 0x38bdf8, width: 2, alpha: 0.4 * beamAlpha })
        }
    }

    private drawNaniteCloud(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const elapsed = state.gameTime - effect.creationTime
        const baseRadius = effect.radius || 150
        const sprayDuration = 0.4

        visual.base.visible = true
        visual.base.texture = this.bubbleTexture
        visual.base.tint = 0x22c55e
        visual.aura.visible = true
        visual.aura.texture = this.noiseTexture
        visual.aura.tint = 0x4ade80
        visual.detail.visible = false

        if (elapsed < sprayDuration) {
            const owner = effect.ownerId ? (state.players?.[effect.ownerId] || state.player) : state.player
            const px = owner.x
            const py = owner.y
            const sprayProgress = elapsed / sprayDuration
            const sprayLen = Math.hypot(effect.x - px, effect.y - py)
            const currentLen = sprayLen * sprayProgress
            const tipSpread = baseRadius * 0.4 * sprayProgress
            const angle = Math.atan2(effect.y - py, effect.x - px)

            visual.container.position.set(px, py)
            visual.base.visible = false
            visual.aura.visible = false

            visual.gfx.moveTo(0, 0)
            for (let i = 0; i <= 16; i++) {
                const frac = i / 16
                const x = currentLen * frac
                const spread = tipSpread * frac
                const wobble = Math.sin(frac * 10 + state.gameTime * 6 + i) * spread * 0.2
                const pX = Math.cos(angle) * x - Math.sin(angle) * (spread + wobble)
                const pY = Math.sin(angle) * x + Math.cos(angle) * (spread + wobble)
                visual.gfx.lineTo(pX, pY)
            }
            for (let i = 16; i >= 0; i--) {
                const frac = i / 16
                const x = currentLen * frac
                const spread = tipSpread * frac
                const wobble = Math.sin(frac * 8 + state.gameTime * 5 + i * 2) * spread * 0.2
                const pX = Math.cos(angle) * x - Math.sin(angle) * (-spread - wobble)
                const pY = Math.sin(angle) * x + Math.cos(angle) * (-spread - wobble)
                visual.gfx.lineTo(pX, pY)
            }
            visual.gfx.closePath()
            visual.gfx.fill({ color: 0x22c55e, alpha: 0.18 })
            return
        }

        visual.container.position.set(effect.x, effect.y)
        const cloudElapsed = elapsed - sprayDuration
        const totalCloudTime = (effect.duration + elapsed) - sprayDuration
        const dissipateStart = totalCloudTime * 0.5
        const isDissipating = cloudElapsed > dissipateStart

        let expandMult = 1
        let alpha = 0.4
        if (isDissipating) {
            const dissipateProgress = Math.min(1, (cloudElapsed - dissipateStart) / Math.max(0.001, totalCloudTime - dissipateStart))
            expandMult = 1 + dissipateProgress * 1.2
            alpha = 0.4 * (1 - dissipateProgress)
        }

        const currentRadius = baseRadius * expandMult
        visual.base.scale.set((currentRadius * 2) / this.bubbleTexture.width)
        visual.base.alpha = alpha * 0.22
        visual.aura.scale.set((currentRadius * 2.2) / this.noiseTexture.width)
        visual.aura.alpha = alpha * 0.18
        visual.aura.rotation = state.gameTime * 0.15

        for (let a = 0; a < Math.PI * 2; a += 0.25) {
            const wobble = Math.sin(a * 5 + state.gameTime * 3) * currentRadius * 0.06
            const r = currentRadius + wobble
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r
            if (a === 0) visual.gfx.moveTo(x, y)
            else visual.gfx.lineTo(x, y)
        }
        visual.gfx.closePath()
        visual.gfx.stroke({ color: 0x22c55e, width: 2, alpha: alpha * 0.6 })

        for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2 + state.gameTime * 1.5
            const d = currentRadius * (0.2 + Math.sin(i * 5 + state.gameTime * 3) * 0.5)
            const size = 2 + Math.sin(i * 3 + state.gameTime * 8) * 1.5
            visual.gfx.circle(Math.cos(a) * d, Math.sin(a) * d, size)
            visual.gfx.fill({
                color: i % 3 === 0 ? 0x86efac : 0x4ade80,
                alpha: Math.max(0, (0.5 + Math.sin(i + state.gameTime * 10) * 0.3) * (alpha / 0.4)),
            })
        }
    }

    private drawAfkStrike(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const elapsed = state.gameTime - effect.creationTime
        const total = elapsed + effect.duration
        const progress = Math.min(1, elapsed / Math.max(0.001, total))
        const baseRadius = 300

        visual.base.visible = false
        visual.aura.visible = false
        visual.detail.visible = false

        const currentRadius = progress < 0.5
            ? baseRadius * (1 - (progress / 0.5))
            : baseRadius * ((progress - 0.5) / 0.5)

        visual.gfx.circle(0, 0, Math.max(1, currentRadius))
        visual.gfx.stroke({ color: 0x8b0000, width: 4, alpha: 1 })
        visual.gfx.fill({ color: 0x8b0000, alpha: 0.3 * Math.sin(progress * Math.PI) })
        visual.gfx.circle(0, 0, 10)
        visual.gfx.stroke({ color: 0xff0000, width: 1, alpha: 0.5 })
    }

    private drawAfkStrikeHit(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const lifeTime = state.gameTime - effect.creationTime
        const beamDuration = effect.duration
        const radius = effect.radius || 300

        visual.base.visible = false
        visual.aura.visible = false
        visual.detail.visible = false

        if (lifeTime >= beamDuration) return

        const beamAlpha = 1 - (lifeTime / beamDuration)
        const beamHeight = 2000
        const beamWidth = 600
        const coreWidth = 200

        visual.gfx.circle(0, 0, radius)
        visual.gfx.stroke({ color: 0x8b0000, width: 4, alpha: 0.8 * beamAlpha })
        visual.gfx.rect(-beamWidth / 2, -beamHeight, beamWidth, beamHeight)
        visual.gfx.fill({ color: 0xff0000, alpha: 0.4 * beamAlpha })
        visual.gfx.rect(-coreWidth / 2, -beamHeight, coreWidth, beamHeight)
        visual.gfx.fill({ color: 0xffffff, alpha: 0.8 * beamAlpha })
    }

    private drawTemporalFreezeWave(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const elapsed = state.gameTime - effect.creationTime
        const progress = Math.min(1, elapsed / Math.max(0.001, effect.duration))
        const radius = effect.radius * progress
        const alpha = 1 - progress

        visual.base.visible = false
        visual.aura.visible = false
        visual.detail.visible = false

        visual.gfx.circle(0, 0, radius)
        visual.gfx.stroke({ color: 0x22d3ee, width: 4, alpha })
        visual.gfx.circle(0, 0, radius)
        visual.gfx.stroke({ color: 0x22d3ee, width: 20 * (1 - progress), alpha: alpha * 0.3 })
    }

    private drawTemporalBurst(effect: AreaEffect, state: GameState, visual: AreaEffectVisual): void {
        const elapsed = state.gameTime - effect.creationTime
        const progress = Math.min(1, elapsed / Math.max(0.001, effect.duration))
        const radius = effect.radius * progress
        const alpha = 1 - progress

        visual.base.visible = true
        visual.base.texture = this.bubbleTexture
        visual.base.scale.set((Math.max(1, radius) * 2) / this.bubbleTexture.width)
        visual.base.tint = 0x38bdf8
        visual.base.alpha = progress < 0.5 ? (1 - progress * 2) * 0.18 : 0

        visual.aura.visible = false
        visual.detail.visible = false

        visual.gfx.circle(0, 0, radius)
        visual.gfx.stroke({ color: 0x38bdf8, width: 8 * (1 - progress), alpha })

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + state.gameTime * 2
            const d = radius * 0.9
            visual.gfx.moveTo(Math.cos(angle) * d, Math.sin(angle) * d)
            visual.gfx.lineTo(Math.cos(angle) * (d + 20), Math.sin(angle) * (d + 20))
            visual.gfx.stroke({ color: 0x38bdf8, width: 2, alpha })
        }
    }
}
