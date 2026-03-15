import { BitmapFont, BitmapText, Container, Graphics } from 'pixi.js'
import type { FloatingNumber } from '../../../../core/Types'
import { ObjectPool } from '../../../../core/ObjectPool'
import { isVisible } from '../../../ViewportCulling'
import type { Viewport } from '../../../ViewportCulling'

const EFFECT_FONT = 'EffectNumbers'
const EFFECT_FONT_CRIT = 'EffectNumbersCrit'
const EFFECT_FONT_ALERT = 'EffectNumbersAlert'
const FLOATING_NUMBERS_ENABLED = false

type FloatingTextVisual = {
    container: Container
    background: Graphics
    text: BitmapText
}

const EFFECT_FONT_CHARS = [
    ['0', '9'],
    ['A', 'Z'],
    ['a', 'z'],
    ' +-.,:;%!?()[]/\\\\\'"&*#@=_',
]

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

function getFloatingNumberKey(fn: FloatingNumber, index: number): string {
    return `${fn.value}:${fn.x.toFixed(1)}:${fn.y.toFixed(1)}:${index}`
}

export class FloatingNumberRenderer {
    readonly container: Container

    private floatingTextPool: ObjectPool<FloatingTextVisual>
    private activeFloating: FloatingTextVisual[] = []

    constructor() {
        this.container = new Container()
        this.floatingTextPool = new ObjectPool<FloatingTextVisual>(
            () => {
                const container = new Container()
                const background = new Graphics()
                const text = new BitmapText({
                    text: '',
                    style: {
                        fontFamily: EFFECT_FONT,
                        fontSize: 16,
                        fill: 0xffffff,
                        align: 'center',
                    },
                })
                text.anchor = 0.5
                container.addChild(background)
                container.addChild(text)
                return { container, background, text }
            },
            visual => {
                visual.container.visible = true
                visual.container.alpha = 1
                visual.container.rotation = 0
                visual.container.scale.set(1)
                visual.background.clear()
                visual.text.text = ''
                visual.text.tint = 0xffffff
            },
        )
    }

    update(floatingNumbers: FloatingNumber[], viewport: Viewport | null): void {
        if (!FLOATING_NUMBERS_ENABLED) {
            while (this.activeFloating.length > 0) {
                const visual = this.activeFloating.pop()!
                this.container.removeChild(visual.container)
                this.floatingTextPool.release(visual)
            }
            return
        }

        let activeCount = 0

        for (let index = 0; index < floatingNumbers.length; index++) {
            const fn = floatingNumbers[index]
            if (viewport && !isVisible(fn.x, fn.y, 80, viewport)) continue

            if (activeCount >= this.activeFloating.length) {
                const visual = this.floatingTextPool.acquire()
                this.container.addChild(visual.container)
                this.activeFloating.push(visual)
            }

            this.syncFloatingNumber(this.activeFloating[activeCount++], fn, index)
        }

        while (activeCount < this.activeFloating.length) {
            const visual = this.activeFloating.pop()!
            this.container.removeChild(visual.container)
            this.floatingTextPool.release(visual)
        }
    }

    destroy(): void {
        this.container.destroy({ children: true })
        this.activeFloating.length = 0
    }

    private syncFloatingNumber(visual: FloatingTextVisual, fn: FloatingNumber, index: number): void {
        const age = fn.life / fn.maxLife
        const isCombatText = /^[+-]?\d+(?:\.\d+)?[a-zA-Z]?$/.test(fn.value) || fn.value === 'CRIT'

        let fontFamily = EFFECT_FONT
        let scale = 1
        let alpha = Math.min(1, age * 3)
        let tint = hexToNum(fn.color, 0xffffff)
        let fontSize = fn.fontSize || 16

        if (fn.isCrit && isCombatText) {
            fontFamily = EFFECT_FONT_CRIT
            fontSize = fn.fontSize || 24
            scale = 1.2 + Math.sin(age * Math.PI) * 0.3
            tint = 0xef4444
        } else if (fn.isCrit) {
            fontFamily = EFFECT_FONT_ALERT
            fontSize = fn.fontSize || 22
            scale = age > 0.8 ? 1 + (age - 0.8) : 1
            alpha = Math.min(1, age * 5)
        }

        visual.container.label = getFloatingNumberKey(fn, index)
        visual.container.position.set(fn.x, fn.y)
        visual.container.scale.set(scale)
        visual.container.alpha = alpha

        visual.text.text = fn.value
        visual.text.style.fontFamily = fontFamily
        visual.text.style.fontSize = fontSize
        visual.text.tint = tint

        visual.background.clear()
        if (fn.backgroundColor) {
            const width = visual.text.width + 16
            const height = visual.text.height + 8
            visual.background.roundRect(-width / 2, -height / 2, width, height, 6)
            visual.background.fill({ color: hexToNum(fn.backgroundColor, 0x111827), alpha: 0.75 })
        }
    }
}

let floatingNumberFontsInstalled = false

export function initializeFloatingNumberFonts(): void {
    if (floatingNumberFontsInstalled) return

    BitmapFont.install({
        name: EFFECT_FONT,
        style: {
            fontFamily: 'monospace',
            fontSize: 32,
            fontWeight: '800',
            fill: 0xffffff,
            stroke: { color: 0x000000, width: 4 },
        },
        chars: EFFECT_FONT_CHARS,
        padding: 6,
        resolution: 2,
    })

    BitmapFont.install({
        name: EFFECT_FONT_CRIT,
        style: {
            fontFamily: 'monospace',
            fontSize: 40,
            fontWeight: '900',
            fontStyle: 'italic',
            fill: 0xffffff,
            stroke: { color: 0x450a0a, width: 5 },
        },
        chars: EFFECT_FONT_CHARS,
        padding: 8,
        resolution: 2,
    })

    BitmapFont.install({
        name: EFFECT_FONT_ALERT,
        style: {
            fontFamily: 'monospace',
            fontSize: 36,
            fontWeight: '900',
            fill: 0xffffff,
            stroke: { color: 0x000000, width: 5 },
        },
        chars: EFFECT_FONT_CHARS,
        padding: 8,
        resolution: 2,
    })

    floatingNumberFontsInstalled = true
}
