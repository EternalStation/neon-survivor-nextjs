import type { Application, Container } from 'pixi.js'
import type { GameState } from '../../../core/Types'
import { ScreenEffectRenderer } from './effects/ScreenEffectRenderer'

export class UILayer {
    container: Container

    private screenEffects: ScreenEffectRenderer

    constructor(app: Application) {
        this.screenEffects = new ScreenEffectRenderer(app)
        this.container = this.screenEffects.container
    }

    update(state: GameState, screenWidth: number, screenHeight: number): void {
        this.screenEffects.update(state, screenWidth, screenHeight)
    }

    destroy(): void {
        this.screenEffects.destroy()
    }
}
