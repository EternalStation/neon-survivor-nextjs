import type { Graphics } from 'pixi.js'
import type { Player } from '../../../../core/Types'

const SHIELD_COLOR = 0x3b82f6

export class ShieldRenderer {
    draw(gfx: Graphics, player: Player, gameTime: number, baseRadius: number): void {
        const totalShield = (player.shieldChunks || []).reduce((sum, chunk) => sum + chunk.amount, 0)
        if (totalShield <= 0) return

        const pulse = 0.8 + Math.sin(gameTime * 6) * 0.2

        gfx.circle(player.x, player.y, baseRadius * (0.98 + pulse * 0.06))
        gfx.fill({ color: SHIELD_COLOR, alpha: 0.08 })

        gfx.circle(player.x, player.y, baseRadius * (1.05 + pulse * 0.08))
        gfx.stroke({ color: SHIELD_COLOR, width: 2, alpha: 0.32 * pulse })

        for (let i = 0; i < 2; i++) {
            const ringProgress = (gameTime * 1.5 + i * 0.5) % 1
            const radius = baseRadius * (1.08 + ringProgress * 0.35)
            gfx.circle(player.x, player.y, radius)
            gfx.stroke({ color: SHIELD_COLOR, width: 1.6, alpha: 0.18 * (1 - ringProgress) * pulse })
        }
    }
}
