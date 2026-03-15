import { Container, Texture } from 'pixi.js'
import type { GameState } from '../../../core/Types'
import type { Viewport } from '../../ViewportCulling'
import type { AtlasParticleShape } from '../SpriteAtlasGenerator'
import { AreaEffectRenderer } from './effects/AreaEffectRenderer'
import { FloatingNumberRenderer } from './effects/FloatingNumberRenderer'
import { ParticleRenderer } from './effects/ParticleRenderer'

const VIEWPORT_SCALE = 0.58

type EffectAtlas = {
    getParticleTexture(shape: AtlasParticleShape): Texture
}

type EffectCamera = {
    x: number
    y: number
}

function buildEffectViewport(camera: EffectCamera, screenWidth?: number, screenHeight?: number): Viewport | null {
    if (!screenWidth || !screenHeight) return null

    const width = screenWidth / VIEWPORT_SCALE
    const height = screenHeight / VIEWPORT_SCALE

    return {
        x: camera.x,
        y: camera.y,
        halfW: width / 2,
        halfH: height / 2,
    }
}

export class EffectLayer {
    container: Container

    private areaRenderer: AreaEffectRenderer
    private particleRenderer: ParticleRenderer
    private floatingNumberRenderer: FloatingNumberRenderer

    constructor(atlas: EffectAtlas) {
        this.container = new Container()

        this.areaRenderer = new AreaEffectRenderer({
            bubbleTexture: atlas.getParticleTexture('bubble'),
            voidTexture: atlas.getParticleTexture('void'),
            noiseTexture: atlas.getParticleTexture('vapor'),
        })
        this.particleRenderer = new ParticleRenderer(atlas)
        this.floatingNumberRenderer = new FloatingNumberRenderer()

        this.container.addChild(this.areaRenderer.container)
        this.container.addChild(this.particleRenderer.container)
        this.container.addChild(this.floatingNumberRenderer.container)
    }

    update(state: GameState, screenWidth?: number, screenHeight?: number): void {
        const viewport = buildEffectViewport(state.camera, screenWidth, screenHeight)

        this.areaRenderer.update(state, viewport)
        this.particleRenderer.update(state.particles, state.gameTime)
        this.floatingNumberRenderer.update(state.floatingNumbers, viewport)
    }

    destroy(): void {
        this.areaRenderer.destroy()
        this.particleRenderer.destroy()
        this.floatingNumberRenderer.destroy()
        this.container.destroy()
    }
}
