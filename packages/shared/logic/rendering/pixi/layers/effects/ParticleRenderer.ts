import { Container, ParticleContainer, Sprite, Texture } from 'pixi.js'
import type { Particle } from '../../../../core/Types'
import { ObjectPool } from '../../../../core/ObjectPool'
import type { AtlasParticleShape } from '../../SpriteAtlasGenerator'

const MAX_RENDERED_PARTICLES = 10000

type EffectAtlas = {
    getParticleTexture(shape: AtlasParticleShape): Texture
}

function isShard(p: Particle): boolean {
    return p.type === 'shard'
}

function getParticleShape(type: Particle['type']): AtlasParticleShape {
    switch (type) {
        case 'shard': return 'shard'
        case 'vapor': return 'vapor'
        case 'bubble': return 'bubble'
        case 'void': return 'void'
        case 'shockwave': return 'shockwave'
        case 'shockwave_circle': return 'shockwave_circle'
        default: return 'spark'
    }
}

function hexToNum(color: string | number | undefined, fallback = 0xffffff): number {
    if (typeof color === 'number' && Number.isFinite(color)) return color
    if (!color || typeof color !== 'string') return fallback

    const normalized = color.trim()
    if (normalized.startsWith('#')) {
        const parsed = Number.parseInt(normalized.slice(1), 16)
        return Number.isFinite(parsed) ? parsed : fallback
    }

    const parsed = Number.parseInt(normalized, 16)
    return Number.isFinite(parsed) ? parsed : fallback
}

export class ParticleRenderer {
    readonly container: Container

    private particleContainer: ParticleContainer
    private spritePool: ObjectPool<Sprite>
    private activeSprites: Sprite[] = []
    private atlas: EffectAtlas

    constructor(atlas: EffectAtlas) {
        this.atlas = atlas
        this.container = new Container()

        this.particleContainer = new ParticleContainer({
            dynamicProperties: {
                position: true,
                vertex: true,
                color: true,
                rotation: true,
            },
        })

        const sparkTex = atlas.getParticleTexture('spark')
        this.spritePool = new ObjectPool<Sprite>(
            () => {
                const sprite = new Sprite(sparkTex)
                sprite.anchor.set(0.5)
                return sprite
            },
            sprite => {
                sprite.alpha = 1
                sprite.tint = 0xffffff
                sprite.scale.set(1)
                sprite.rotation = 0
                sprite.visible = true
            },
        )

        this.container.addChild(this.particleContainer)
    }

    update(particles: Particle[], gameTime: number): void {
        let spriteIndex = 0

        for (const particle of particles) {
            if (spriteIndex >= MAX_RENDERED_PARTICLES) continue
            if (spriteIndex >= this.activeSprites.length) {
                const sprite = this.spritePool.acquire()
                this.particleContainer.addChild(sprite)
                this.activeSprites.push(sprite)
            }
            this.updateParticleSprite(this.activeSprites[spriteIndex++], particle, gameTime)
        }

        while (spriteIndex < this.activeSprites.length) {
            const sprite = this.activeSprites.pop()!
            this.particleContainer.removeChild(sprite)
            this.spritePool.release(sprite)
        }
    }

    destroy(): void {
        this.container.destroy({ children: true })
        this.activeSprites.length = 0
    }

    private updateParticleSprite(sprite: Sprite, particle: Particle, gameTime: number): void {
        const shape = getParticleShape(particle.type)
        const texture = this.atlas.getParticleTexture(shape)
        if (sprite.texture !== texture) sprite.texture = texture
        if (particle.type === 'shockwave') {
            const angle = Math.atan2(particle.vy, particle.vx)
            sprite.position.set(
                particle.x - Math.cos(angle) * particle.size * 0.5,
                particle.y - Math.sin(angle) * particle.size * 0.5,
            )
        } else {
            sprite.position.set(particle.x, particle.y)
        }
        sprite.scale.set(this.getParticleScale(particle, texture))
        sprite.tint = hexToNum(particle.color, 0xffffff)
        sprite.alpha = this.getParticleAlpha(particle)
        sprite.rotation = this.getParticleRotation(particle, gameTime)
    }

    private getParticleScale(particle: Particle, texture: Texture): number {
        if (particle.type === 'bubble') {
            const maxLife = particle.maxLife ?? 60
            const progress = 1 - particle.life / maxLife
            const bubbleSize = progress < 0.8
                ? particle.size * (0.4 + (progress / 0.8) * 0.6)
                : particle.size * (1 + ((progress - 0.8) / 0.2) * 0.7)
            return (bubbleSize * 2) / texture.width
        }

        if (particle.type === 'shockwave_circle') {
            const maxLife = particle.maxLife ?? 1
            const progress = 1 - particle.life / maxLife
            return Math.max(0, (particle.size * progress * 2) / texture.width)
        }

        return (particle.size * 2) / texture.width
    }

    private getParticleAlpha(particle: Particle): number {
        if (particle.type === 'bubble') {
            const maxLife = particle.maxLife ?? 60
            const progress = 1 - particle.life / maxLife
            const baseAlpha = particle.alpha ?? 0.5
            if (progress < 0.8) return baseAlpha * (progress / 0.8) * 0.4
            return baseAlpha * (1 - (progress - 0.8) / 0.2) * 0.4
        }

        if (particle.type === 'shockwave') {
            return (particle.alpha ?? 1) * (particle.life < 10 ? particle.life / 10 : 1)
        }

        if (particle.type === 'shockwave_circle') {
            const maxLife = particle.maxLife ?? 1
            return (particle.alpha ?? 1) * (particle.life / maxLife)
        }

        return particle.life < 0.2 ? particle.life * 5 : (particle.alpha ?? 1)
    }

    private getParticleRotation(particle: Particle, gameTime: number): number {
        if (isShard(particle)) return gameTime * 5 + particle.x * 0.1
        if (particle.type === 'shockwave') return Math.atan2(particle.vy, particle.vx)
        return 0
    }
}
