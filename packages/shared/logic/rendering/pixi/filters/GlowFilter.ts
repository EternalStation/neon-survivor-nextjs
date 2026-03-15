import { Filter, GlProgram, UniformGroup } from 'pixi.js'

const DEFAULT_VERTEX = `in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;

    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void)
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`

const GLOW_FRAGMENT = `in vec2 vTextureCoord;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform float uStrength;
uniform vec3 uGlowColor;

out vec4 finalColor;

vec4 sampleGlow(vec2 offset)
{
    return texture(uTexture, clamp(vTextureCoord + offset, uInputClamp.xy, uInputClamp.zw));
}

void main(void)
{
    vec4 center = texture(uTexture, vTextureCoord);
    vec2 texel = uInputSize.zw * max(1.0, uStrength);

    vec4 glow = vec4(0.0);
    glow += sampleGlow(vec2( 1.0,  0.0) * texel) * 0.14;
    glow += sampleGlow(vec2(-1.0,  0.0) * texel) * 0.14;
    glow += sampleGlow(vec2( 0.0,  1.0) * texel) * 0.14;
    glow += sampleGlow(vec2( 0.0, -1.0) * texel) * 0.14;
    glow += sampleGlow(vec2( 0.7,  0.7) * texel) * 0.09;
    glow += sampleGlow(vec2(-0.7,  0.7) * texel) * 0.09;
    glow += sampleGlow(vec2( 0.7, -0.7) * texel) * 0.09;
    glow += sampleGlow(vec2(-0.7, -0.7) * texel) * 0.09;
    glow += sampleGlow(vec2( 2.0,  0.0) * texel) * 0.05;
    glow += sampleGlow(vec2(-2.0,  0.0) * texel) * 0.05;
    glow += sampleGlow(vec2( 0.0,  2.0) * texel) * 0.05;
    glow += sampleGlow(vec2( 0.0, -2.0) * texel) * 0.05;
    glow += sampleGlow(vec2( 1.4,  1.4) * texel) * 0.035;
    glow += sampleGlow(vec2(-1.4,  1.4) * texel) * 0.035;
    glow += sampleGlow(vec2( 1.4, -1.4) * texel) * 0.035;
    glow += sampleGlow(vec2(-1.4, -1.4) * texel) * 0.035;

    float outerMask = 1.0 - center.a;
    float glowAlpha = clamp(glow.a * (1.1 + uStrength * 0.12), 0.0, 1.0) * outerMask;
    vec3 glowRgb = glow.rgb * uGlowColor * glowAlpha;

    finalColor = vec4(glowRgb, glowAlpha);
}
`

type GlowUniformData = {
    uStrength: { value: number; type: 'f32' }
    uGlowColor: { value: Float32Array; type: 'vec3<f32>' }
}

type GlowFilterOptions = {
    color?: number | string
    strength?: number
}

export class GlowFilter extends Filter {
    private glowUniforms: UniformGroup<GlowUniformData>

    constructor(options: GlowFilterOptions = {}) {
        const glowUniforms = new UniformGroup<GlowUniformData>({
            uStrength: { value: options.strength ?? 4, type: 'f32' },
            uGlowColor: { value: colorToVec3(options.color ?? 0xffffff), type: 'vec3<f32>' },
        })

        super({
            glProgram: GlProgram.from({
                vertex: DEFAULT_VERTEX,
                fragment: GLOW_FRAGMENT,
                name: 'neon-survivor-glow-filter',
            }),
            resources: {
                glowUniforms,
            },
            padding: Math.max(8, Math.ceil((options.strength ?? 4) * 12)),
            resolution: 1,
        })

        this.glowUniforms = glowUniforms
    }

    get strength(): number {
        return this.glowUniforms.uniforms.uStrength
    }

    set strength(value: number) {
        this.glowUniforms.uniforms.uStrength = value
        this.padding = Math.max(8, Math.ceil(value * 12))
        this.glowUniforms.update()
    }

    set color(value: number | string) {
        this.glowUniforms.uniforms.uGlowColor = colorToVec3(value)
        this.glowUniforms.update()
    }
}

function colorToVec3(color: number | string): Float32Array {
    const value = typeof color === 'string'
        ? Number.parseInt(color.replace('#', ''), 16)
        : color

    return new Float32Array([
        ((value >> 16) & 0xff) / 255,
        ((value >> 8) & 0xff) / 255,
        (value & 0xff) / 255,
    ])
}
