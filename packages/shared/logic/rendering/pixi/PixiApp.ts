import { Application, Container } from 'pixi.js'
import type { Language } from '../../../lib/LanguageContext'
import type { GameState } from '../../core/Types'
import { PixiAssetLoader } from './PixiAssetLoader'
import { BackgroundLayer } from './layers/BackgroundLayer'
import { ProjectileLayer } from './layers/ProjectileLayer'
import { EntityLayer } from './layers/EntityLayer'
import { PlayerLayer } from './layers/PlayerLayer'
import { EffectLayer } from './layers/EffectLayer'
import { BossLayer } from './layers/BossLayer'
import { UILayer } from './layers/UILayer'
import { initializeFloatingNumberFonts } from './layers/effects/FloatingNumberRenderer'

export class PixiApp {
    app?: Application
    worldContainer!: Container
    uiContainer!: Container
    private assets!: PixiAssetLoader
    private backgroundLayer!: BackgroundLayer
    private projectileLayer!: ProjectileLayer
    private entityLayer!: EntityLayer
    private playerLayer!: PlayerLayer
    private effectLayer!: EffectLayer
    private bossLayer!: BossLayer
    private uiLayer!: UILayer
    private initialized = false
    private destroyed = false
    private renderErrored = false
    private layerErrors = new Set<string>()

    async init(canvas: HTMLCanvasElement): Promise<void> {
        if (this.destroyed) return

        const app = new Application()
        await app.init({
            canvas,
            resizeTo: window,
            antialias: false,
            backgroundColor: 0x020617,
            powerPreference: 'high-performance',
            preference: 'webgl',
        })

        if (this.destroyed) {
            const pixiInternals = app as Application & {
                _cancelResize?: (() => void) | null
                resizeTo?: EventTarget | null
                renderer?: {
                    resizeTo?: EventTarget | null
                    _cancelResize?: (() => void) | null
                }
            }
            pixiInternals.resizeTo = null
            pixiInternals._cancelResize ??= () => {}
            if (pixiInternals.renderer) {
                pixiInternals.renderer.resizeTo = null
                pixiInternals.renderer._cancelResize ??= () => {}
            }
            if (pixiInternals.renderer) {
                app.destroy(false, { children: false })
            }
            return
        }

        this.app = app
        this.patchPixiRenderers(app)

        this.worldContainer = new Container()
        this.uiContainer = new Container()
        ;(app.stage as Container & { label?: string | null }).label ??= 'root-stage'
        ;(this.worldContainer as Container & { label?: string | null }).label ??= 'world-layer'
        ;(this.uiContainer as Container & { label?: string | null }).label ??= 'ui-layer'
        app.stage.addChild(this.worldContainer)
        app.stage.addChild(this.uiContainer)

        this.assets = new PixiAssetLoader()
        await this.assets.initSpriteAtlas(this.app)
        initializeFloatingNumberFonts()

        this.backgroundLayer = new BackgroundLayer()
        this.projectileLayer = new ProjectileLayer(this.assets)
        this.entityLayer = new EntityLayer(this.assets)
        this.playerLayer = new PlayerLayer(this.assets)
        this.effectLayer = new EffectLayer(this.assets)
        this.bossLayer = new BossLayer(app)
        this.uiLayer = new UILayer(app)

        this.worldContainer.addChild(this.backgroundLayer.container)
        this.worldContainer.addChild(this.effectLayer.container)
        this.worldContainer.addChild(this.projectileLayer.container)
        this.worldContainer.addChild(this.entityLayer.container)
        this.worldContainer.addChild(this.playerLayer.container)
        this.worldContainer.addChild(this.bossLayer.container)
        this.uiContainer.addChild(this.uiLayer.container)

        this.initialized = true
    }

    updateCamera(x: number, y: number, zoom: number): void {
        this.worldContainer.position.set(
            this.app.screen.width / 2 - x * zoom,
            this.app.screen.height / 2 - y * zoom
        )
        this.worldContainer.scale.set(zoom)
    }

    render(state: GameState, _language: Language): void {
        if (!this.initialized || this.renderErrored) return

        try {
            const screenWidth = this.app!.screen.width
            const screenHeight = this.app!.screen.height
            const zoom = 0.58

            this.updateCamera(state.camera.x, state.camera.y, zoom)
            this.runLayerUpdate('background', () => this.backgroundLayer.update(state, screenWidth, screenHeight))
            this.runLayerUpdate('effects', () => this.effectLayer.update(state, screenWidth, screenHeight))
            this.runLayerUpdate('projectiles', () => this.projectileLayer.update(state, screenWidth, screenHeight))
            this.runLayerUpdate('entities', () => this.entityLayer.update(state, screenWidth, screenHeight))
            this.runLayerUpdate('player', () => this.playerLayer.update(state, screenWidth, screenHeight))
            this.runLayerUpdate('bosses', () => this.bossLayer.update(state, screenWidth, screenHeight))
            this.runLayerUpdate('ui', () => this.uiLayer.update(state, screenWidth, screenHeight))
            this.app!.render()
        } catch (error) {
            this.renderErrored = true
            console.warn('Pixi frame render failed, disabling further Pixi renders for this session.', error)
        }
    }

    private runLayerUpdate(name: string, update: () => void): void {
        try {
            update()
            if (this.layerErrors.delete(name)) {
                console.info(`Pixi layer recovered: ${name}`)
            }
        } catch (error) {
            if (!this.layerErrors.has(name)) {
                this.layerErrors.add(name)
                console.warn(`Pixi layer update failed: ${name}`, error)
            }
        }
    }

    private patchPixiRenderers(app: Application): void {
        const pixiApp = app as Application & {
            render: (...args: unknown[]) => void
            __neonPatchedRender?: boolean
        }
        const renderer = app.renderer as typeof app.renderer & {
            render: (...args: unknown[]) => void
            __neonPatchedRender?: boolean
        }

        if (renderer && !renderer.__neonPatchedRender) {
            const originalRendererRender = renderer.render.bind(renderer)
            renderer.render = (...args: unknown[]) => {
                try {
                    return originalRendererRender(...args)
                } catch (error) {
                    if (isNullSplitPixiError(error)) {
                        console.warn('Suppressed Pixi renderer null.split error.', error)
                        return
                    }
                    throw error
                }
            }
            renderer.__neonPatchedRender = true
        }

        if (!pixiApp.__neonPatchedRender) {
            const originalAppRender = pixiApp.render.bind(pixiApp)
            pixiApp.render = (...args: unknown[]) => {
                try {
                    return originalAppRender(...args)
                } catch (error) {
                    if (isNullSplitPixiError(error)) {
                        console.warn('Suppressed Pixi app null.split error.', error)
                        return
                    }
                    throw error
                }
            }
            pixiApp.__neonPatchedRender = true
        }
    }

    destroy(): void {
        if (this.destroyed) return
        this.destroyed = true

        if (this.initialized) {
            this.backgroundLayer.destroy()
            this.projectileLayer.destroy()
            this.entityLayer.destroy()
            this.playerLayer.destroy()
            this.effectLayer.destroy()
            this.bossLayer.destroy()
            this.uiLayer.destroy()
            this.assets.destroyAll()
            this.initialized = false
        }

        const app = this.app as (Application & {
            _cancelResize?: (() => void) | null
            resizeTo?: EventTarget | null
            renderer?: {
                resizeTo?: EventTarget | null
                _cancelResize?: (() => void) | null
            }
        }) | undefined

        if (!app) return

        const pixiInternals = app as any
        const rendererInternals = app.renderer as typeof app.renderer | undefined

        pixiInternals.resizeTo = null
        pixiInternals._cancelResize ??= () => {}
        if (rendererInternals) {
            rendererInternals.resizeTo = null
            rendererInternals._cancelResize ??= () => {}
            app.destroy(false, { children: false })
        }

        this.app = undefined
    }
}

function isNullSplitPixiError(error: unknown): boolean {
    return error instanceof TypeError && error.message.includes("Cannot read properties of null (reading 'split')")
}
