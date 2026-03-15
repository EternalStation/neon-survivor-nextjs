import type { Language } from '../../lib/LanguageContext'
import type { GameState } from '../core/Types'
import type { PixiApp } from './pixi/PixiApp'

export function renderGame(
    pixiApp: PixiApp,
    state: GameState,
    language: Language = 'en',
): void {
    const DAMAGE_FLASH_CD = 1.5

    if ((window as { _lastRenderedPlayerHp?: number })._lastRenderedPlayerHp !== undefined) {
        if (state.player.curHp < (window as { _lastRenderedPlayerHp?: number })._lastRenderedPlayerHp!) {
            const lastDmg = state.player.lastDamageTime ?? -999
            if (state.gameTime - lastDmg >= DAMAGE_FLASH_CD) {
                state.player.lastDamageTime = state.gameTime
            }
        }
    }

    ;(window as { _lastRenderedPlayerHp?: number })._lastRenderedPlayerHp = state.player.curHp
    pixiApp.render(state, language)
}
