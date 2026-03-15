import { Container, Graphics, Rectangle, RenderTexture, Sprite, Texture } from 'pixi.js'
import type { Application } from 'pixi.js'
import type { PlayerClassId } from '../../core/Classes'

export type AtlasEnemyShape =
    | 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon'
    | 'hexagon' | 'snitch' | 'minion' | 'elite_minion' | 'long_drone' | 'glitcher'

export type AtlasParticleShape =
    | 'shard' | 'spark' | 'bubble' | 'vapor' | 'void' | 'shockwave' | 'shockwave_circle'

export type AtlasPlayerAura = 'radiation' | 'mire' | 'neutron'

export type AtlasBulletEffect = 'ring' | 'mist' | 'nanite'

const ENEMY_SHAPES: AtlasEnemyShape[] = [
    'circle', 'triangle', 'square', 'diamond', 'pentagon',
    'hexagon', 'snitch', 'minion', 'elite_minion', 'long_drone', 'glitcher',
]

const PARTICLE_SHAPES: AtlasParticleShape[] = [
    'shard', 'spark', 'bubble', 'vapor', 'void', 'shockwave', 'shockwave_circle',
]

const PLAYER_AURAS: AtlasPlayerAura[] = ['radiation', 'mire', 'neutron']

const ATLAS_WIDTH = 2048
const SLOT_PADDING = 8
const ENEMY_TEXTURE_SIZE = 128
const ENEMY_RADIUS = Math.floor(ENEMY_TEXTURE_SIZE * 0.28)
const BODY_TEXTURE_SIZE = 128
const BODY_TEXTURE_RADIUS = 38
const SOCKET_TEXTURE_SIZE = 72
const SOCKET_TEXTURE_RADIUS = 18
const AURA_TEXTURE_SIZE = 512
const PARTICLE_TEXTURE_SIZE = 24
const COMPLEX_PARTICLE_TEXTURE_SIZE = 96
const PARTICLE_RADIUS = Math.floor(PARTICLE_TEXTURE_SIZE * 0.4)
const EFFECT_TEXTURE_SIZE = 128
const BULLET_RADII = [4, 6, 8, 12, 16, 24, 32]

type AtlasEntry = {
    key: string
    width: number
    height: number
    build: () => Container | Graphics
}

type PackedEntry = AtlasEntry & {
    x: number
    y: number
}

type AtlasBuildInput = {
    iconTextures: Partial<Record<PlayerClassId, Texture>>
    playerThemes: Record<PlayerClassId, string>
}

export class SpriteAtlasGenerator {
    private enemyTextures = new Map<AtlasEnemyShape, Texture>()
    private bulletTextures = new Map<number, Texture>()
    private bulletEffectTextures = new Map<AtlasBulletEffect, Texture>()
    private particleTextures = new Map<AtlasParticleShape, Texture>()
    private playerBodyTextures = new Map<PlayerClassId, Texture>()
    private playerAuraTextures = new Map<AtlasPlayerAura, Texture>()
    private socketTexture: Texture = Texture.WHITE
    private atlasTexture: RenderTexture | null = null
    private generated = false

    generate(app: Application, input: AtlasBuildInput): void {
        if (this.generated) return

        const entries = [
            ...this.createEnemyEntries(),
            ...this.createBulletEntries(),
            ...this.createParticleEntries(),
            ...this.createPlayerEntries(input),
        ]
        const packed = packAtlas(entries)
        const atlasHeight = nextPowerOfTwo(packed.reduce((maxY, entry) => Math.max(maxY, entry.y + entry.height + SLOT_PADDING), 0))

        const atlasTexture = RenderTexture.create({
            width: ATLAS_WIDTH,
            height: atlasHeight,
        })
        ;(atlasTexture.source as { label?: string | null }).label ??= 'sprite-atlas'

        for (let index = 0; index < packed.length; index++) {
            const entry = packed[index]
            const displayObject = entry.build()
            displayObject.position.set(entry.x, entry.y)
            ;(displayObject as Container & { label?: string | null }).label ??= entry.key

            app.renderer.render({
                container: displayObject,
                target: atlasTexture,
                clear: index === 0,
            })
            displayObject.destroy({ children: true })
        }

        this.atlasTexture = atlasTexture
        this.registerTextures()
        this.generated = true
    }

    getEnemyTexture(shape: AtlasEnemyShape): Texture {
        return this.enemyTextures.get(shape) ?? Texture.WHITE
    }

    getBulletTexture(size: number): Texture {
        let best: Texture | undefined
        let bestDiff = Infinity

        for (const [radius, texture] of this.bulletTextures) {
            const diff = Math.abs(radius - size)
            if (diff < bestDiff) {
                bestDiff = diff
                best = texture
            }
        }

        return best ?? Texture.WHITE
    }

    getBulletEffectTexture(effect: AtlasBulletEffect): Texture {
        return this.bulletEffectTextures.get(effect) ?? Texture.WHITE
    }

    getParticleTexture(shape: AtlasParticleShape): Texture {
        return this.particleTextures.get(shape) ?? Texture.WHITE
    }

    getPlayerBodyTexture(playerClass: PlayerClassId): Texture {
        return this.playerBodyTextures.get(playerClass) ?? Texture.WHITE
    }

    getPlayerAuraTexture(variant: AtlasPlayerAura): Texture {
        return this.playerAuraTextures.get(variant) ?? Texture.WHITE
    }

    getPlayerSocketTexture(): Texture {
        return this.socketTexture
    }

    destroyAll(): void {
        destroyTextureMap(this.enemyTextures)
        destroyTextureMap(this.bulletTextures)
        destroyTextureMap(this.bulletEffectTextures)
        destroyTextureMap(this.particleTextures)
        destroyTextureMap(this.playerBodyTextures)
        destroyTextureMap(this.playerAuraTextures)
        if (this.socketTexture !== Texture.WHITE) this.socketTexture.destroy()
        this.socketTexture = Texture.WHITE
        this.atlasTexture?.destroy(true)
        this.atlasTexture = null
        this.generated = false
    }

    private createEnemyEntries(): AtlasEntry[] {
        return ENEMY_SHAPES.map(shape => ({
            key: `enemy:${shape}`,
            width: ENEMY_TEXTURE_SIZE,
            height: ENEMY_TEXTURE_SIZE,
            build: () => {
                const gfx = new Graphics()
                const center = ENEMY_TEXTURE_SIZE / 2
                buildEnemyShape(gfx, shape, center, center, ENEMY_RADIUS)
                gfx.fill({ color: 0xffffff })
                return gfx
            },
        }))
    }

    private createBulletEntries(): AtlasEntry[] {
        const entries: AtlasEntry[] = BULLET_RADII.map(radius => {
            const size = (radius + 2) * 2
            const center = size / 2

            return {
                key: `bullet:${radius}`,
                width: size,
                height: size,
                build: () => {
                    const gfx = new Graphics()
                    gfx.circle(center, center, radius)
                    gfx.fill({ color: 0xffffff })
                    return gfx
                },
            }
        })

        entries.push({
            key: 'bullet-effect:ring',
            width: EFFECT_TEXTURE_SIZE,
            height: EFFECT_TEXTURE_SIZE,
            build: () => {
                const gfx = new Graphics()
                const center = EFFECT_TEXTURE_SIZE / 2
                const radius = EFFECT_TEXTURE_SIZE * 0.38
                gfx.circle(center, center, radius)
                gfx.stroke({ color: 0xffffff, width: 5, alpha: 1 })
                gfx.circle(center, center, radius - 8)
                gfx.stroke({ color: 0xffffff, width: 2, alpha: 0.35 })
                gfx.circle(center, center, radius + 12)
                gfx.fill({ color: 0xffffff, alpha: 0.08 })
                return gfx
            },
        })
        entries.push({
            key: 'bullet-effect:mist',
            width: EFFECT_TEXTURE_SIZE,
            height: EFFECT_TEXTURE_SIZE,
            build: () => {
                const gfx = new Graphics()
                const center = EFFECT_TEXTURE_SIZE / 2
                for (let i = 4; i >= 1; i--) {
                    gfx.circle(center, center, center * (0.22 + i * 0.15))
                    gfx.fill({ color: 0xffffff, alpha: 0.06 + i * 0.03 })
                }
                return gfx
            },
        })
        entries.push({
            key: 'bullet-effect:nanite',
            width: EFFECT_TEXTURE_SIZE,
            height: EFFECT_TEXTURE_SIZE,
            build: () => {
                const gfx = new Graphics()
                const center = EFFECT_TEXTURE_SIZE / 2
                const offsets = [
                    { x: -22, y: -6 },
                    { x: -10, y: 18 },
                    { x: 8, y: -18 },
                    { x: 26, y: 6 },
                    { x: 0, y: 26 },
                    { x: 16, y: 20 },
                ]

                gfx.circle(center, center, 34)
                gfx.fill({ color: 0xffffff, alpha: 0.08 })
                for (const offset of offsets) {
                    gfx.rect(center + offset.x - 3, center + offset.y - 3, 6, 6)
                    gfx.fill({ color: 0xffffff, alpha: 0.9 })
                }
                gfx.circle(center, center, 3)
                gfx.fill({ color: 0xffffff })
                return gfx
            },
        })

        return entries
    }

    private createParticleEntries(): AtlasEntry[] {
        return PARTICLE_SHAPES.map(shape => ({
            key: `particle:${shape}`,
            width: shape === 'shockwave' || shape === 'shockwave_circle'
                ? COMPLEX_PARTICLE_TEXTURE_SIZE
                : PARTICLE_TEXTURE_SIZE,
            height: shape === 'shockwave' || shape === 'shockwave_circle'
                ? COMPLEX_PARTICLE_TEXTURE_SIZE
                : PARTICLE_TEXTURE_SIZE,
            build: () => buildParticleDisplay(shape),
        }))
    }

    private createPlayerEntries(input: AtlasBuildInput): AtlasEntry[] {
        const entries: AtlasEntry[] = []

        for (const [playerClass, theme] of Object.entries(input.playerThemes) as Array<[PlayerClassId, string]>) {
            entries.push({
                key: `player-body:${playerClass}`,
                width: BODY_TEXTURE_SIZE,
                height: BODY_TEXTURE_SIZE,
                build: () => buildPlayerBodyDisplay(
                    theme,
                    input.iconTextures[playerClass],
                ),
            })
        }

        entries.push({
            key: 'player-socket',
            width: SOCKET_TEXTURE_SIZE,
            height: SOCKET_TEXTURE_SIZE,
            build: () => {
                const gfx = new Graphics()
                buildHex(gfx, SOCKET_TEXTURE_SIZE / 2, SOCKET_TEXTURE_SIZE / 2, SOCKET_TEXTURE_RADIUS)
                gfx.fill({ color: 0xffffff })
                return gfx
            },
        })

        for (const variant of PLAYER_AURAS) {
            entries.push({
                key: `player-aura:${variant}`,
                width: AURA_TEXTURE_SIZE,
                height: AURA_TEXTURE_SIZE,
                build: () => buildAuraDisplay(variant),
            })
        }

        return entries
    }

    private registerTextures(): void {
        if (!this.atlasTexture) return

        for (const shape of ENEMY_SHAPES) {
            this.enemyTextures.set(shape, this.createSubTexture(`enemy:${shape}`))
        }

        for (const radius of BULLET_RADII) {
            this.bulletTextures.set(radius, this.createSubTexture(`bullet:${radius}`))
        }

        this.bulletEffectTextures.set('ring', this.createSubTexture('bullet-effect:ring'))
        this.bulletEffectTextures.set('mist', this.createSubTexture('bullet-effect:mist'))
        this.bulletEffectTextures.set('nanite', this.createSubTexture('bullet-effect:nanite'))

        for (const shape of PARTICLE_SHAPES) {
            this.particleTextures.set(shape, this.createSubTexture(`particle:${shape}`))
        }

        const playerClassIds = ['malware', 'eventhorizon', 'stormstrike', 'aigis', 'hivemother'] as const
        for (const playerClass of playerClassIds) {
            this.playerBodyTextures.set(playerClass, this.createSubTexture(`player-body:${playerClass}`))
        }

        this.socketTexture = this.createSubTexture('player-socket')

        for (const variant of PLAYER_AURAS) {
            this.playerAuraTextures.set(variant, this.createSubTexture(`player-aura:${variant}`))
        }
    }

    private createSubTexture(key: string): Texture {
        if (!this.atlasTexture) return Texture.WHITE

        const frame = atlasFrames.get(key)
        if (!frame) return Texture.WHITE

        return new Texture({
            source: this.atlasTexture.source,
            frame: new Rectangle(frame.x, frame.y, frame.width, frame.height),
        })
    }
}

const atlasFrames = new Map<string, Rectangle>()

function packAtlas(entries: AtlasEntry[]): PackedEntry[] {
    atlasFrames.clear()

    let x = SLOT_PADDING
    let y = SLOT_PADDING
    let rowHeight = 0
    const packed: PackedEntry[] = []

    for (const entry of entries) {
        if (x + entry.width + SLOT_PADDING > ATLAS_WIDTH) {
            x = SLOT_PADDING
            y += rowHeight + SLOT_PADDING
            rowHeight = 0
        }

        const packedEntry: PackedEntry = { ...entry, x, y }
        packed.push(packedEntry)
        atlasFrames.set(entry.key, new Rectangle(x, y, entry.width, entry.height))

        x += entry.width + SLOT_PADDING
        rowHeight = Math.max(rowHeight, entry.height)
    }

    return packed
}

function buildParticleDisplay(shape: AtlasParticleShape): Graphics {
    const gfx = new Graphics()

    if (shape === 'shockwave') {
        const center = COMPLEX_PARTICLE_TEXTURE_SIZE / 2
        const radius = COMPLEX_PARTICLE_TEXTURE_SIZE * 0.28
        gfx.arc(center, center, radius, -0.7, 0.7)
        gfx.stroke({ color: 0xffffff, width: 10, alpha: 0.3 })
        gfx.arc(center, center, radius, -0.7, 0.7)
        gfx.stroke({ color: 0xffffff, width: 3, alpha: 1 })
        gfx.arc(center, center, radius * 0.85, -0.6, 0.6)
        gfx.stroke({ color: 0xffffff, width: 1.5, alpha: 0.6 })
        return gfx
    }

    if (shape === 'shockwave_circle') {
        const center = COMPLEX_PARTICLE_TEXTURE_SIZE / 2
        const radius = COMPLEX_PARTICLE_TEXTURE_SIZE * 0.34
        gfx.circle(center, center, radius)
        gfx.stroke({ color: 0xffffff, width: 18, alpha: 0.28 })
        gfx.circle(center, center, radius)
        gfx.stroke({ color: 0xffffff, width: 3, alpha: 1 })
        gfx.circle(center, center, radius * 0.6)
        gfx.stroke({ color: 0xffffff, width: 2, alpha: 0.25 })
        return gfx
    }

    const center = PARTICLE_TEXTURE_SIZE / 2
    if (shape === 'void') {
        gfx.circle(center, center, PARTICLE_RADIUS)
        gfx.fill({ color: 0xffffff })
        gfx.circle(center, center, PARTICLE_RADIUS - 2)
        gfx.fill({ color: 0x000000 })
        return gfx
    }

    buildParticleShape(gfx, shape, center, center, PARTICLE_RADIUS)
    gfx.fill({ color: 0xffffff })
    return gfx
}

function buildPlayerBodyDisplay(theme: string, iconTexture?: Texture): Container {
    const container = new Container()
    const gfx = new Graphics()
    buildHex(gfx, BODY_TEXTURE_SIZE / 2, BODY_TEXTURE_SIZE / 2, BODY_TEXTURE_RADIUS)
    gfx.fill({ color: 0x020617 })
    gfx.stroke({ color: hexToNum(theme), width: 6 })
    container.addChild(gfx)

    if (iconTexture && (iconTexture.width > 1 || iconTexture.height > 1)) {
        const icon = new Sprite(iconTexture)
        icon.anchor.set(0.5)
        icon.position.set(BODY_TEXTURE_SIZE / 2, BODY_TEXTURE_SIZE / 2)
        icon.alpha = 0.8
        icon.scale.set((BODY_TEXTURE_RADIUS * 0.78 * 2) / Math.max(iconTexture.width, iconTexture.height))
        container.addChild(icon)
    }

    return container
}

function buildAuraDisplay(variant: AtlasPlayerAura): Graphics {
    const gfx = new Graphics()
    const center = AURA_TEXTURE_SIZE / 2
    const stops = getAuraStops(variant)

    for (let index = stops.length - 1; index >= 0; index--) {
        const stop = stops[index]
        gfx.circle(center, center, center * stop.radius)
        gfx.fill({ color: stop.color, alpha: stop.alpha })
    }

    return gfx
}

function buildEnemyShape(gfx: Graphics, shape: AtlasEnemyShape, cx: number, cy: number, r: number): void {
    switch (shape) {
        case 'circle':
        case 'glitcher':
            gfx.circle(cx, cy, r)
            break
        case 'snitch':
            gfx.circle(cx, cy, r * 0.7)
            break
        case 'triangle':
            gfx.moveTo(cx, cy - r)
            gfx.lineTo(cx + r * 0.866, cy + r * 0.5)
            gfx.lineTo(cx - r * 0.866, cy + r * 0.5)
            gfx.closePath()
            break
        case 'square':
            gfx.rect(cx - r, cy - r, r * 2, r * 2)
            break
        case 'diamond':
            gfx.moveTo(cx, cy - r * 1.3)
            gfx.lineTo(cx + r, cy)
            gfx.lineTo(cx, cy + r * 1.3)
            gfx.lineTo(cx - r, cy)
            gfx.closePath()
            break
        case 'hexagon':
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI / 3) - Math.PI / 2
                const x = cx + Math.cos(angle) * r
                const y = cy + Math.sin(angle) * r
                if (i === 0) gfx.moveTo(x, y)
                else gfx.lineTo(x, y)
            }
            gfx.closePath()
            break
        case 'pentagon':
            for (let i = 0; i < 5; i++) {
                const angle = (i * 2 * Math.PI / 5) - Math.PI / 2
                const x = cx + Math.cos(angle) * r
                const y = cy + Math.sin(angle) * r
                if (i === 0) gfx.moveTo(x, y)
                else gfx.lineTo(x, y)
            }
            gfx.closePath()
            break
        case 'minion':
        case 'elite_minion':
            gfx.moveTo(cx + r * 1.2, cy)
            gfx.lineTo(cx - r * 0.6, cy - r * 0.8)
            gfx.lineTo(cx - r * 0.3, cy)
            gfx.lineTo(cx - r * 0.6, cy + r * 0.8)
            gfx.closePath()
            break
        case 'long_drone':
            gfx.moveTo(cx + r * 1.5, cy)
            gfx.lineTo(cx - r * 0.5, cy - r * 0.7)
            gfx.lineTo(cx - r * 1.0, cy)
            gfx.lineTo(cx - r * 0.5, cy + r * 0.7)
            gfx.closePath()
            break
    }
}

function buildParticleShape(gfx: Graphics, shape: AtlasParticleShape, cx: number, cy: number, r: number): void {
    switch (shape) {
        case 'spark':
        case 'bubble':
        case 'vapor':
            gfx.circle(cx, cy, r)
            break
        case 'shard':
            gfx.moveTo(cx, cy - r)
            gfx.lineTo(cx + r * 0.3, cy)
            gfx.lineTo(cx, cy + r)
            gfx.lineTo(cx - r * 0.3, cy)
            gfx.closePath()
            break
    }
}

function buildHex(gfx: Graphics, cx: number, cy: number, radius: number): void {
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        const x = cx + radius * Math.cos(angle)
        const y = cy + radius * Math.sin(angle)
        if (i === 0) gfx.moveTo(x, y)
        else gfx.lineTo(x, y)
    }
    gfx.closePath()
}

function getAuraStops(variant: AtlasPlayerAura): Array<{ radius: number; color: number; alpha: number }> {
    switch (variant) {
        case 'neutron':
            return [
                { radius: 1.0, color: 0xfacc15, alpha: 0.0 },
                { radius: 0.62, color: 0xa3e635, alpha: 0.09 },
                { radius: 0.16, color: 0xfacc15, alpha: 0.16 },
            ]
        case 'mire':
            return [
                { radius: 1.0, color: 0x06b6d4, alpha: 0.0 },
                { radius: 0.62, color: 0x16a34a, alpha: 0.09 },
                { radius: 0.16, color: 0x22c55e, alpha: 0.16 },
            ]
        default:
            return [
                { radius: 1.0, color: 0x06b6d4, alpha: 0.0 },
                { radius: 0.62, color: 0x22c55e, alpha: 0.09 },
                { radius: 0.16, color: 0xa3e635, alpha: 0.16 },
            ]
    }
}

function destroyTextureMap<T>(textures: Map<T, Texture>): void {
    for (const texture of textures.values()) texture.destroy()
    textures.clear()
}

function hexToNum(value: string): number {
    return Number.parseInt(value.replace('#', ''), 16)
}

function nextPowerOfTwo(value: number): number {
    let result = 1
    while (result < value) result <<= 1
    return result
}
