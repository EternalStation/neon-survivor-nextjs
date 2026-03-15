import type { Bullet as LegacyBullet } from '../Types'

export interface BulletCore {
    id: number
    ownerId?: string
    x: number
    y: number
    vx: number
    vy: number
    dmg: number
    pierce: number
    life: number
    maxLife?: number
    isEnemy: boolean
    hits: Set<number>
    color?: string
    size: number
}

export interface BulletVisual {
    isCrit?: boolean
    critMult?: number
    trails?: { x: number; y: number }[]
    isVisualOnly?: boolean
    isHyperPulse?: boolean
}

export interface BulletMovement {
    bounceCount?: number
    bounceDmgMult?: number
    bounceSpeedBonus?: number
    insideSandbox?: boolean
    isTrace?: boolean
    spawnTime?: number
    startAngle?: number
    endAngle?: number
    sourceShape?: string
}

export interface BulletStatusEffects {
    slowPercent?: number
    freezeDuration?: number
    burnDamage?: number
}

export type BulletKind =
    | { kind: 'normal' }
    | {
        kind: 'ring'
        ringRadius: number
        ringAmmo: number
        ringVisualIntensity?: number
      }
    | {
        kind: 'nanite'
        naniteTargetId?: number
        isHiveMotherSkill?: boolean
        hiveMotherSpitId?: number
        cloudCenterX?: number
        cloudCenterY?: number
        cloudRadius?: number
        isWobbly?: boolean
      }
    | {
        kind: 'shockwave'
        shockwaveLevel: number
        maxSize: number
        isSingularity: boolean
        isTsunami: boolean
      }
    | {
        kind: 'vortex'
        vortexState: 'orbiting' | 'expanding'
        orbitAngle: number
        orbitDist?: number
      }
    | {
        kind: 'turret'
        turretLevel: number
        turretVariant: 'fire' | 'ice'
        isBomb: boolean
        explodeRadius?: number
      }
    | { kind: 'mist' }

export interface Bullet extends BulletCore {
    kind: BulletKind
    visual: BulletVisual
    movement: BulletMovement
    status: BulletStatusEffects
}

function detectKind(old: LegacyBullet): BulletKind {
    if (old.isShockwaveCircle) {
        return {
            kind: 'shockwave',
            shockwaveLevel: old.shockwaveLevel ?? 1,
            maxSize: old.maxSize ?? 1000,
            isSingularity: old.isSingularity ?? false,
            isTsunami: old.isTsunami ?? false,
        }
    }
    if (old.isRing) {
        return {
            kind: 'ring',
            ringRadius: old.ringRadius ?? 0,
            ringAmmo: old.ringAmmo ?? 0,
            ringVisualIntensity: old.ringVisualIntensity,
        }
    }
    if (old.isNanite) {
        return {
            kind: 'nanite',
            naniteTargetId: old.naniteTargetId,
            isHiveMotherSkill: old.isHiveMotherSkill,
            hiveMotherSpitId: old.hiveMotherSpitId,
            cloudCenterX: old.cloudCenterX,
            cloudCenterY: old.cloudCenterY,
            cloudRadius: old.cloudRadius,
            isWobbly: old.isWobbly,
        }
    }
    if (old.vortexState) {
        return {
            kind: 'vortex',
            vortexState: old.vortexState,
            orbitAngle: old.orbitAngle ?? 0,
            orbitDist: old.orbitDist,
        }
    }
    if (old.isTurretFire) {
        return {
            kind: 'turret',
            turretLevel: old.turretLevel ?? 1,
            turretVariant: old.turretVariant ?? 'fire',
            isBomb: old.isBomb ?? false,
            explodeRadius: old.explodeRadius,
        }
    }
    if (old.isMist) {
        return { kind: 'mist' }
    }
    return { kind: 'normal' }
}

export function toNewBullet(old: LegacyBullet): Bullet {
    return {
        id: old.id,
        ownerId: old.ownerId,
        x: old.x,
        y: old.y,
        vx: old.vx,
        vy: old.vy,
        dmg: old.dmg,
        pierce: old.pierce,
        life: old.life,
        maxLife: old.maxLife,
        isEnemy: old.isEnemy,
        hits: old.hits,
        color: old.color,
        size: old.size,
        kind: detectKind(old),
        visual: {
            isCrit: old.isCrit,
            critMult: old.critMult,
            trails: old.trails,
            isVisualOnly: old.isVisualOnly,
            isHyperPulse: old.isHyperPulse,
        },
        movement: {
            bounceCount: old.bounceCount,
            bounceDmgMult: old.bounceDmgMult,
            bounceSpeedBonus: old.bounceSpeedBonus,
            insideSandbox: old.insideSandbox,
            isTrace: old.isTrace,
            spawnTime: old.spawnTime,
            startAngle: old.startAngle,
            endAngle: old.endAngle,
            sourceShape: old.sourceShape,
        },
        status: {
            slowPercent: old.slowPercent,
            freezeDuration: old.freezeDuration,
            burnDamage: old.burnDamage,
        },
    }
}

export function toLegacyBullet(b: Bullet): LegacyBullet {
    const legacy: LegacyBullet = {
        id: b.id,
        ownerId: b.ownerId,
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy,
        dmg: b.dmg,
        pierce: b.pierce,
        life: b.life,
        maxLife: b.maxLife,
        isEnemy: b.isEnemy,
        hits: b.hits,
        color: b.color,
        size: b.size,
        isCrit: b.visual.isCrit,
        critMult: b.visual.critMult,
        trails: b.visual.trails,
        isVisualOnly: b.visual.isVisualOnly,
        isHyperPulse: b.visual.isHyperPulse,
        bounceCount: b.movement.bounceCount,
        bounceDmgMult: b.movement.bounceDmgMult,
        bounceSpeedBonus: b.movement.bounceSpeedBonus,
        insideSandbox: b.movement.insideSandbox,
        isTrace: b.movement.isTrace,
        spawnTime: b.movement.spawnTime,
        startAngle: b.movement.startAngle,
        endAngle: b.movement.endAngle,
        sourceShape: b.movement.sourceShape,
        slowPercent: b.status.slowPercent,
        freezeDuration: b.status.freezeDuration,
        burnDamage: b.status.burnDamage,
    }

    const k = b.kind
    switch (k.kind) {
        case 'ring':
            legacy.isRing = true
            legacy.ringRadius = k.ringRadius
            legacy.ringAmmo = k.ringAmmo
            legacy.ringVisualIntensity = k.ringVisualIntensity
            break
        case 'nanite':
            legacy.isNanite = true
            legacy.naniteTargetId = k.naniteTargetId
            legacy.isHiveMotherSkill = k.isHiveMotherSkill
            legacy.hiveMotherSpitId = k.hiveMotherSpitId
            legacy.cloudCenterX = k.cloudCenterX
            legacy.cloudCenterY = k.cloudCenterY
            legacy.cloudRadius = k.cloudRadius
            legacy.isWobbly = k.isWobbly
            break
        case 'shockwave':
            legacy.isShockwaveCircle = true
            legacy.shockwaveLevel = k.shockwaveLevel
            legacy.maxSize = k.maxSize
            legacy.isSingularity = k.isSingularity
            legacy.isTsunami = k.isTsunami
            break
        case 'vortex':
            legacy.vortexState = k.vortexState
            legacy.orbitAngle = k.orbitAngle
            legacy.orbitDist = k.orbitDist
            break
        case 'turret':
            legacy.isTurretFire = true
            legacy.turretLevel = k.turretLevel
            legacy.turretVariant = k.turretVariant
            legacy.isBomb = k.isBomb
            legacy.explodeRadius = k.explodeRadius
            break
        case 'mist':
            legacy.isMist = true
            break
        case 'normal':
            break
    }

    return legacy
}
