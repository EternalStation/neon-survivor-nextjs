import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { PLAYER_CLASSES } from '../../../core/Classes'
import { GAME_CONFIG } from '../../../core/GameConfig'
import type { PlayerClassId } from '../../../core/Classes'
import type { GameState, LegendaryHex, Player } from '../../../core/Types'
import { getHexLevel } from '../../../upgrades/LegendaryLogic'
import { PixiAssetLoader } from '../PixiAssetLoader'
import { ShieldRenderer } from './effects/ShieldRenderer'

const CELL_SIZE = 18.1
const CELL_DISTANCE = CELL_SIZE * Math.sqrt(3)
const BASE_BODY_SCALE = (CELL_SIZE * 2.25) / 128
const BASE_SOCKET_SCALE = (CELL_SIZE * 2.2) / 72
const VIEWPORT_SCALE = 0.58

type SocketState = {
    body: Sprite
    icon: Sprite
}

type PlayerState = {
    container: Container
    body: Sprite
    aura: Sprite
    sockets: SocketState[]
}

type AuraVariant = 'radiation' | 'mire' | 'neutron'

type SocketOwner = Player & {
    moduleSockets?: {
        hexagons?: (LegendaryHex | null)[]
    }
}

export class PlayerLayer {
    container: Container
    private auraContainer: Container
    private playerContainer: Container
    private overlayGfx: Graphics
    private assets: PixiAssetLoader
    private players = new Map<string, PlayerState>()
    private shieldRenderer = new ShieldRenderer()

    constructor(assets: PixiAssetLoader) {
        this.assets = assets
        this.container = new Container()
        this.auraContainer = new Container()
        this.playerContainer = new Container()
        this.overlayGfx = new Graphics()

        this.container.addChild(this.auraContainer)
        this.container.addChild(this.playerContainer)
        this.container.addChild(this.overlayGfx)
    }

    update(state: GameState, screenWidth?: number, screenHeight?: number): void {
        const players = state.players ? Object.values(state.players) : [state.player]
        const activeIds = new Set<string>()
        const viewport = buildViewport(state, screenWidth, screenHeight)

        this.overlayGfx.clear()

        for (const player of players) {
            if (viewport && !isVisible(player.x, player.y, 720, viewport)) continue

            activeIds.add(player.id)
            const entry = this.getOrCreatePlayer(player)
            this.syncPlayer(entry, player, state)
            this.shieldRenderer.draw(this.overlayGfx, player, state.gameTime, CELL_DISTANCE + CELL_SIZE * 1.35)
            this.drawStatusEffects(player, state)
        }

        this.prunePlayers(activeIds)
    }

    destroy(): void {
        this.container.destroy({ children: true })
        this.players.clear()
    }

    private getOrCreatePlayer(player: Player): PlayerState {
        let entry = this.players.get(player.id)
        if (entry) return entry

        const container = new Container()
        const aura = new Sprite(this.assets.getPlayerAuraTexture('radiation'))
        aura.anchor.set(0.5)
        aura.blendMode = 'add'
        aura.alpha = 0

        const body = new Sprite(this.assets.getPlayerBodyTexture(player.playerClass ?? 'stormstrike'))
        body.anchor.set(0.5)
        container.addChild(body)

        const sockets: SocketState[] = []
        for (let i = 0; i < 6; i++) {
            const socketBody = new Sprite(this.assets.getPlayerSocketTexture())
            socketBody.anchor.set(0.5)

            const icon = new Sprite(Texture.EMPTY)
            icon.anchor.set(0.5)

            container.addChild(socketBody)
            container.addChild(icon)
            sockets.push({ body: socketBody, icon })
        }
        entry = { container, body, aura, sockets }

        this.auraContainer.addChild(aura)
        this.playerContainer.addChild(container)
        this.players.set(player.id, entry)
        return entry
    }

    private syncPlayer(entry: PlayerState, player: SocketOwner, state: GameState): void {
        const now = state.gameTime
        const ghostAlpha = player.phaseShiftUntil && now < player.phaseShiftUntil
            ? 0.5 + Math.sin(now * 20) * 0.3
            : 1
        const spawnTimer = player.spawnTimer ?? 0
        const theme = getPlayerTheme(player.playerClass)
        const bodyTexture = this.assets.getPlayerBodyTexture(player.playerClass ?? 'stormstrike')

        if (entry.body.texture !== bodyTexture) entry.body.texture = bodyTexture

        entry.container.position.set(player.x, player.y)
        entry.container.alpha = ghostAlpha
        entry.container.rotation = 0
        entry.body.alpha = spawnTimer > 0 ? Math.min(1, (1 - spawnTimer / GAME_CONFIG.PLAYER.SPAWN_DURATION) * 1.8) : 1

        this.syncAura(entry.aura, player, state)

        if (spawnTimer > 0) {
            const duration = GAME_CONFIG.PLAYER.SPAWN_DURATION
            const progress = Math.min(1, Math.max(0, duration - spawnTimer) / (duration * 0.9))
            const ease = 1 - Math.pow(1 - progress, 3)
            const scale = Math.min(1, ease * 1.5)
            const spin = (1 - ease) * Math.PI * 4
            const finalDist = CELL_DISTANCE
            const startDist = finalDist * 5
            const currentDist = startDist - (startDist - finalDist) * ease

            entry.body.scale.set(BASE_BODY_SCALE * scale)
            entry.body.rotation = spin
            this.syncSockets(entry.sockets, player, state, currentDist, Math.min(1, ease * 2), theme)
            return
        }

        entry.body.scale.set(BASE_BODY_SCALE)
        entry.body.rotation = 0
        this.syncSockets(entry.sockets, player, state, CELL_DISTANCE, ghostAlpha, theme)
    }

    private syncAura(sprite: Sprite, player: Player, state: GameState): void {
        const radLevel = getHexLevel(state, 'ComRadiation')
        const mireLevel = getHexLevel(state, 'IrradiatedMire')
        const neutronLevel = getHexLevel(state, 'NeutronStar')

        let variant: AuraVariant | null = null
        let radius = 0

        if (neutronLevel >= 1) {
            variant = 'neutron'
            radius = 666
        } else if (mireLevel >= 1) {
            variant = 'mire'
            radius = 666
        } else if (radLevel >= 1) {
            variant = 'radiation'
            radius = 500
        }

        if (!variant || radius <= 0) {
            sprite.visible = false
            return
        }

        const pulse = 0.98 + Math.sin(state.gameTime * 2) * 0.02
        const tex = this.assets.getPlayerAuraTexture(variant)

        if (sprite.texture !== tex) sprite.texture = tex

        sprite.visible = true
        sprite.position.set(player.x, player.y)
        sprite.scale.set((radius * 2 * pulse) / tex.width)
        sprite.alpha = variant === 'neutron' ? 0.95 : 0.9
    }

    private syncSockets(
        sockets: SocketState[],
        player: SocketOwner,
        state: GameState,
        distance: number,
        alpha: number,
        theme: string,
    ): void {
        const hexagons = this.getPlayerHexagons(player, state)

        for (let i = 0; i < sockets.length; i++) {
            const angle = (Math.PI / 3) * i
            const x = distance * Math.cos(angle)
            const y = distance * Math.sin(angle)
            const socket = sockets[i]
            const hex = hexagons[i]

            socket.body.position.set(x, y)
            socket.body.scale.set(BASE_SOCKET_SCALE)
            socket.body.alpha = alpha
            socket.body.tint = hexToNum(theme)
            socket.body.visible = true

            if (!hex?.customIcon) {
                socket.icon.visible = false
                continue
            }

            const texture = this.assets.getTexture(hex.customIcon)
            if (socket.icon.texture !== texture) socket.icon.texture = texture

            socket.icon.visible = true
            socket.icon.position.set(x, y)
            socket.icon.scale.set(((CELL_SIZE * 2.0) / Math.max(1, texture.width, texture.height)) * 0.95)
            socket.icon.alpha = Math.min(0.8, alpha * 0.8)
        }
    }

    private drawStatusEffects(player: Player, state: GameState): void {
        const now = state.gameTime

        if (player.orbitalVortexUntil && now < player.orbitalVortexUntil) {
            const radius = GAME_CONFIG.SKILLS.ORBITAL_VORTEX_RADIUS
            const pulse = 0.8 + Math.sin(now * 10) * 0.2

            this.overlayGfx.circle(player.x, player.y, radius)
            this.overlayGfx.fill({ color: 0xf59e0b, alpha: 0.04 })

            for (let i = 0; i < 4; i++) {
                const arcRadius = 100 + i * 40
                const start = now * 3 + (i * Math.PI) / 2
                const end = start + Math.PI
                this.overlayGfx.arc(player.x, player.y, arcRadius, start, end)
                this.overlayGfx.stroke({ color: 0xf59e0b, width: 2, alpha: 0.28 * pulse })
            }
        }

        if (player.stunnedUntil && now < player.stunnedUntil) {
            for (let i = 0; i < 4; i++) {
                const angle = now * 11 + i * (Math.PI / 2)
                const startDist = 15
                const endDist = 28 + (i % 2) * 6
                const midDist = (startDist + endDist) * 0.7
                const sx = player.x + Math.cos(angle) * startDist
                const sy = player.y + Math.sin(angle) * startDist
                const mx = player.x + Math.cos(angle + 0.18) * midDist
                const my = player.y + Math.sin(angle + 0.18) * midDist
                const ex = player.x + Math.cos(angle - 0.12) * endDist
                const ey = player.y + Math.sin(angle - 0.12) * endDist

                this.overlayGfx.moveTo(sx, sy)
                this.overlayGfx.lineTo(mx, my)
                this.overlayGfx.lineTo(ex, ey)
                this.overlayGfx.stroke({ color: 0x00ffff, width: 2, alpha: 0.75 })
            }
        }

        if (player.healingDisabled) {
            const y = player.y - 80
            const pulse = 0.8 + Math.sin(now * 10) * 0.2
            const size = 20

            this.overlayGfx.moveTo(player.x, y + size * 0.7)
            this.overlayGfx.bezierCurveTo(player.x - size, y, player.x - size, y - size, player.x, y - size * 0.3)
            this.overlayGfx.bezierCurveTo(player.x + size, y - size, player.x + size, y, player.x, y + size * 0.7)
            this.overlayGfx.fill({ color: 0x22c55e, alpha: pulse })

            this.overlayGfx.moveTo(player.x - 10, y - 10)
            this.overlayGfx.lineTo(player.x + 10, y + 10)
            this.overlayGfx.moveTo(player.x + 10, y - 10)
            this.overlayGfx.lineTo(player.x - 10, y + 10)
            this.overlayGfx.stroke({ color: 0xef4444, width: 3, alpha: pulse })
        }
    }

    private getPlayerHexagons(player: SocketOwner, state: GameState): (LegendaryHex | null)[] {
        if (player.moduleSockets?.hexagons?.length) return player.moduleSockets.hexagons
        if (player.id === state.player.id) return state.moduleSockets.hexagons
        return []
    }

    private prunePlayers(activeIds: Set<string>): void {
        for (const [id, entry] of this.players) {
            if (activeIds.has(id)) continue
            this.auraContainer.removeChild(entry.aura)
            this.playerContainer.removeChild(entry.container)
            entry.aura.destroy()
            entry.container.destroy({ children: true })
            this.players.delete(id)
        }
    }
}

function getPlayerTheme(playerClass?: PlayerClassId): string {
    return PLAYER_CLASSES.find(item => item.id === playerClass)?.themeColor ?? '#22d3ee'
}

function hexToNum(value: string): number {
    return Number.parseInt(value.replace('#', ''), 16)
}

function buildViewport(
    state: GameState,
    screenWidth?: number,
    screenHeight?: number,
): { left: number; right: number; top: number; bottom: number } | null {
    if (!screenWidth || !screenHeight) return null

    const halfWidth = screenWidth / (2 * VIEWPORT_SCALE)
    const halfHeight = screenHeight / (2 * VIEWPORT_SCALE)

    return {
        left: state.camera.x - halfWidth,
        right: state.camera.x + halfWidth,
        top: state.camera.y - halfHeight,
        bottom: state.camera.y + halfHeight,
    }
}

function isVisible(
    x: number,
    y: number,
    radius: number,
    viewport: { left: number; right: number; top: number; bottom: number },
): boolean {
    return (
        x + radius >= viewport.left &&
        x - radius <= viewport.right &&
        y + radius >= viewport.top &&
        y - radius <= viewport.bottom
    )
}
