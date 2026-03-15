import { Assets, Texture } from 'pixi.js'
import type { Application } from 'pixi.js'
import { SpriteAtlasGenerator } from './SpriteAtlasGenerator'
import { PLAYER_CLASSES } from '../../core/Classes'
import type { AtlasBulletEffect, AtlasEnemyShape, AtlasParticleShape, AtlasPlayerAura } from './SpriteAtlasGenerator'
import type { PlayerClassId } from '../../core/Classes'

const textureCache = new Map<string, Texture>()

export class PixiAssetLoader {
    private atlasGenerator = new SpriteAtlasGenerator()

    async loadAtlas(url: string): Promise<void> {
        if (Assets.cache.has(url)) return
        await Assets.load(url)
    }

    async loadTexture(url: string): Promise<Texture> {
        const cached = textureCache.get(url)
        if (cached) return cached
        const texture = await Assets.load<Texture>(url)
        textureCache.set(url, texture)
        return texture
    }

    getTexture(alias: string): Texture {
        const cached = textureCache.get(alias)
        if (cached) return cached
        const texture = Texture.from(alias)
        textureCache.set(alias, texture)
        return texture
    }

    async initSpriteAtlas(app: Application): Promise<void> {
        const playerThemeMap = Object.fromEntries(
            PLAYER_CLASSES.map(playerClass => [playerClass.id, playerClass.themeColor ?? '#22d3ee'])
        ) as Record<PlayerClassId, string>
        const iconEntries = await Promise.all(
            PLAYER_CLASSES.map(async playerClass => {
                if (!playerClass.iconUrl) return [playerClass.id, Texture.EMPTY] as const
                try {
                    const texture = await this.loadTexture(playerClass.iconUrl)
                    return [playerClass.id, texture] as const
                } catch {
                    return [playerClass.id, Texture.EMPTY] as const
                }
            })
        )

        try {
            this.atlasGenerator.generate(app, {
                iconTextures: Object.fromEntries(iconEntries) as Partial<Record<PlayerClassId, Texture>>,
                playerThemes: playerThemeMap,
            })
        } catch (error) {
            console.warn('Sprite atlas generation failed, falling back to default textures.', error)
            this.atlasGenerator.destroyAll()
        }
    }

    getEnemyTexture(shape: AtlasEnemyShape): Texture {
        return this.atlasGenerator.getEnemyTexture(shape)
    }

    getBulletTexture(size: number): Texture {
        return this.atlasGenerator.getBulletTexture(size)
    }

    getParticleTexture(shape: AtlasParticleShape): Texture {
        return this.atlasGenerator.getParticleTexture(shape)
    }

    getBulletEffectTexture(effect: AtlasBulletEffect): Texture {
        return this.atlasGenerator.getBulletEffectTexture(effect)
    }

    getPlayerBodyTexture(playerClass: PlayerClassId): Texture {
        return this.atlasGenerator.getPlayerBodyTexture(playerClass)
    }

    getPlayerAuraTexture(variant: AtlasPlayerAura): Texture {
        return this.atlasGenerator.getPlayerAuraTexture(variant)
    }

    getPlayerSocketTexture(): Texture {
        return this.atlasGenerator.getPlayerSocketTexture()
    }

    destroyAll(): void {
        for (const tex of textureCache.values()) {
            tex.destroy(true)
        }
        textureCache.clear()
        this.atlasGenerator.destroyAll()
    }
}
