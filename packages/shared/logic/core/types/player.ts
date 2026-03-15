import type { Vector, PlayerStats as PlayerStatField, ShieldChunk, ActiveSkill, UpgradeChoice, Meteorite } from '../Types'
import type { Player as LegacyPlayer } from '../Types'
import type { PlayerClassId } from '../Classes'

export interface PlayerCore {
    id: string
    x: number
    y: number
    size: number
    curHp: number
    playerClass?: PlayerClassId
    level: number
    xp: { current: number; needed: number }
}

export interface PlayerCombatStats {
    hp: PlayerStatField
    dmg: PlayerStatField
    atk: PlayerStatField
    critChance: number
    critDamage: number
    speed: number
    spd: PlayerStatField
    reg: PlayerStatField
    arm: PlayerStatField
    xp_per_kill: PlayerStatField
    pierce: number
    multi: number
    droneCount: number
}

export interface PlayerTracking {
    damageDealt: number
    damageTaken: number
    damageBlocked: number
    damageBlockedByArmor: number
    damageBlockedByCollisionReduc: number
    damageBlockedByProjectileReduc: number
    damageBlockedByShield: number
    damageBreakdown: Record<string, number>
    incomingDamageBreakdown: Record<string, number>
    healingBreakdown: Record<string, number>
    avgHpAccumulator: number
    avgHpSampleCount: number
    activeSkillDamageByMinute?: Record<number, number>
    wallsHit: number
}

export interface PlayerMovement {
    lastAngle: number
    targetAngle: number
    faceAngle: number
    knockback: Vector
    targetX?: number
    targetY?: number
}

export interface PlayerSkills {
    activeSkills: ActiveSkill[]
    lastShot: number
    classShotCount?: number
    shotAccumulator?: number
    shotsFired?: number
    lastDeathMark?: number
    waveUses?: number
    lastCosmicStrikeTime?: number
    lastBlackholeUse?: number
    stormCircleChargeTime?: number
    stormCircleCooldownEnd?: number
    lastStormStrike?: number
    dashCooldown?: number
    dashCooldownMax?: number
    dashUntil?: number
    dashVx?: number
    dashVy?: number
    voidMarkerActive?: boolean
    voidMarkerX?: number
    voidMarkerY?: number
    voidMarkerVx?: number
    voidMarkerVy?: number
    voidMarkerSpawnTime?: number
    queuedNanites?: number
    naniteFrameCounter?: number
    naniteDoubleDmgUntil?: number
    lastHiveMotherSkill?: number
    orbitalVortexUntil?: number
    lastVortexActivation?: number
    orbitalVortexCooldownEnd?: number
    sandboxActive?: boolean
    sandboxX?: number
    sandboxY?: number
    sandboxUntil?: number
    sandboxCooldownStart?: number
    kineticBattery?: boolean
    radCore?: boolean
    radCoreTick?: number
    chronoPlating?: boolean
    lastKineticShockwave?: number
    kineticShieldTimer?: number
    cooldownReduction?: number
    cooldownReductionBonus?: number
    lastChronoDoubleIndex?: number
    chronoArmorBonus?: number
    timeLoopPool?: number
    timeLoopTimer?: number
    stasisTimer?: number
    stasisFieldActive?: boolean
    stasisFieldX?: number
    stasisFieldY?: number
    aigisRings?: Record<number, { count: number; totalDmg: number }>
    vortexStrength: number
    kineticTsunamiWaveSouls?: number
    soulShatterSouls?: number
    temporalMonolithSouls?: number
    neutronStarAuraKills?: number
    chronoDevourerBuffTime?: number
}

export interface PlayerBuffs {
    invincibleUntil?: number
    stunnedUntil?: number
    phaseShiftUntil?: number
    immobilized?: boolean
    healingDisabled?: boolean
    invertedControlsUntil?: number
    temporalGuardActive?: boolean
    spawnTimer?: number
    soulDrainMult?: number
    buffs?: {
        puddleRegen?: boolean
        epicenterShield?: number
        systemSurge?: { end: number; atk: number; spd: number }
        waveSpeed?: number
    }
}

export interface PlayerShields {
    shield?: number
    shieldExpiry?: number
    shieldChunks?: ShieldChunk[]
}

export interface Player extends PlayerCore {
    stats: PlayerCombatStats
    tracking: PlayerTracking
    movement: PlayerMovement
    skills: PlayerSkills
    buffs: PlayerBuffs
    shields: PlayerShields
    inventory: (Meteorite | null)[]
    upgradesCollected: UpgradeChoice[]
    rerolls: number
    dust: number
    isotopes: number
    currentInput?: {
        keys: Record<string, boolean>
        vector: { x: number; y: number }
        mouse: { x: number; y: number }
    }
    deathCause?: string
    lastHitDamage?: number
    lastDamageTime?: number
    wallHitTimestamps?: number[]
    lastWallWarningTime?: number
    tripleWallDamageUntil?: number
    lastWallHitTime?: number
    killerHp?: number
    killerMaxHp?: number
    inRefineryZone?: boolean
    godColRedBonus?: number
    godProjRedBonus?: number
    autoUnsocket?: boolean
    consumedLegendaries?: string[]
}

export function toNewPlayer(old: LegacyPlayer): Player {
    return {
        id: old.id,
        x: old.x,
        y: old.y,
        size: old.size,
        curHp: old.curHp,
        playerClass: old.playerClass,
        level: old.level,
        xp: old.xp,
        stats: {
            hp: old.hp,
            dmg: old.dmg,
            atk: old.atk,
            critChance: old.critChance,
            critDamage: old.critDamage,
            speed: old.speed,
            spd: old.spd,
            reg: old.reg,
            arm: old.arm,
            xp_per_kill: old.xp_per_kill,
            pierce: old.pierce,
            multi: old.multi,
            droneCount: old.droneCount,
        },
        tracking: {
            damageDealt: old.damageDealt,
            damageTaken: old.damageTaken,
            damageBlocked: old.damageBlocked,
            damageBlockedByArmor: old.damageBlockedByArmor,
            damageBlockedByCollisionReduc: old.damageBlockedByCollisionReduc,
            damageBlockedByProjectileReduc: old.damageBlockedByProjectileReduc,
            damageBlockedByShield: old.damageBlockedByShield,
            damageBreakdown: old.damageBreakdown,
            incomingDamageBreakdown: old.incomingDamageBreakdown,
            healingBreakdown: old.healingBreakdown,
            avgHpAccumulator: old.avgHpAccumulator,
            avgHpSampleCount: old.avgHpSampleCount,
            activeSkillDamageByMinute: old.activeSkillDamageByMinute,
            wallsHit: old.wallsHit,
        },
        movement: {
            lastAngle: old.lastAngle,
            targetAngle: old.targetAngle,
            faceAngle: old.faceAngle,
            knockback: old.knockback,
            targetX: old.targetX,
            targetY: old.targetY,
        },
        skills: {
            activeSkills: old.activeSkills,
            lastShot: old.lastShot,
            classShotCount: old.classShotCount,
            shotAccumulator: old.shotAccumulator,
            shotsFired: old.shotsFired,
            lastDeathMark: old.lastDeathMark,
            waveUses: old.waveUses,
            lastCosmicStrikeTime: old.lastCosmicStrikeTime,
            lastBlackholeUse: old.lastBlackholeUse,
            stormCircleChargeTime: old.stormCircleChargeTime,
            stormCircleCooldownEnd: old.stormCircleCooldownEnd,
            lastStormStrike: old.lastStormStrike,
            dashCooldown: old.dashCooldown,
            dashCooldownMax: old.dashCooldownMax,
            dashUntil: old.dashUntil,
            dashVx: old.dashVx,
            dashVy: old.dashVy,
            voidMarkerActive: old.voidMarkerActive,
            voidMarkerX: old.voidMarkerX,
            voidMarkerY: old.voidMarkerY,
            voidMarkerVx: old.voidMarkerVx,
            voidMarkerVy: old.voidMarkerVy,
            voidMarkerSpawnTime: old.voidMarkerSpawnTime,
            queuedNanites: old.queuedNanites,
            naniteFrameCounter: old.naniteFrameCounter,
            naniteDoubleDmgUntil: old.naniteDoubleDmgUntil,
            lastHiveMotherSkill: old.lastHiveMotherSkill,
            orbitalVortexUntil: old.orbitalVortexUntil,
            lastVortexActivation: old.lastVortexActivation,
            orbitalVortexCooldownEnd: old.orbitalVortexCooldownEnd,
            sandboxActive: old.sandboxActive,
            sandboxX: old.sandboxX,
            sandboxY: old.sandboxY,
            sandboxUntil: old.sandboxUntil,
            sandboxCooldownStart: old.sandboxCooldownStart,
            kineticBattery: old.kineticBattery,
            radCore: old.radCore,
            radCoreTick: old.radCoreTick,
            chronoPlating: old.chronoPlating,
            lastKineticShockwave: old.lastKineticShockwave,
            kineticShieldTimer: old.kineticShieldTimer,
            cooldownReduction: old.cooldownReduction,
            cooldownReductionBonus: old.cooldownReductionBonus,
            lastChronoDoubleIndex: old.lastChronoDoubleIndex,
            chronoArmorBonus: old.chronoArmorBonus,
            timeLoopPool: old.timeLoopPool,
            timeLoopTimer: old.timeLoopTimer,
            stasisTimer: old.stasisTimer,
            stasisFieldActive: old.stasisFieldActive,
            stasisFieldX: old.stasisFieldX,
            stasisFieldY: old.stasisFieldY,
            aigisRings: old.aigisRings,
            vortexStrength: old.vortexStrength,
            kineticTsunamiWaveSouls: old.kineticTsunamiWaveSouls,
            soulShatterSouls: old.soulShatterSouls,
            temporalMonolithSouls: old.temporalMonolithSouls,
            neutronStarAuraKills: old.neutronStarAuraKills,
            chronoDevourerBuffTime: old.chronoDevourerBuffTime,
        },
        buffs: {
            invincibleUntil: old.invincibleUntil,
            stunnedUntil: old.stunnedUntil,
            phaseShiftUntil: old.phaseShiftUntil,
            immobilized: old.immobilized,
            healingDisabled: old.healingDisabled,
            invertedControlsUntil: old.invertedControlsUntil,
            temporalGuardActive: old.temporalGuardActive,
            spawnTimer: old.spawnTimer,
            soulDrainMult: old.soulDrainMult,
            buffs: old.buffs,
        },
        shields: {
            shield: old.shield,
            shieldExpiry: old.shieldExpiry,
            shieldChunks: old.shieldChunks,
        },
        inventory: old.inventory,
        upgradesCollected: old.upgradesCollected,
        rerolls: old.rerolls,
        dust: old.dust,
        isotopes: old.isotopes,
        currentInput: old.currentInput,
        deathCause: old.deathCause,
        lastHitDamage: old.lastHitDamage,
        lastDamageTime: old.lastDamageTime,
        wallHitTimestamps: old.wallHitTimestamps,
        lastWallWarningTime: old.lastWallWarningTime,
        tripleWallDamageUntil: old.tripleWallDamageUntil,
        lastWallHitTime: old.lastWallHitTime,
        killerHp: old.killerHp,
        killerMaxHp: old.killerMaxHp,
        inRefineryZone: old.inRefineryZone,
        godColRedBonus: old.godColRedBonus,
        godProjRedBonus: old.godProjRedBonus,
        autoUnsocket: old.autoUnsocket,
        consumedLegendaries: old.consumedLegendaries,
    }
}

export function toLegacyPlayer(p: Player): LegacyPlayer {
    return {
        id: p.id,
        x: p.x,
        y: p.y,
        size: p.size,
        curHp: p.curHp,
        playerClass: p.playerClass,
        level: p.level,
        xp: p.xp,
        hp: p.stats.hp,
        dmg: p.stats.dmg,
        atk: p.stats.atk,
        critChance: p.stats.critChance,
        critDamage: p.stats.critDamage,
        speed: p.stats.speed,
        spd: p.stats.spd,
        reg: p.stats.reg,
        arm: p.stats.arm,
        xp_per_kill: p.stats.xp_per_kill,
        pierce: p.stats.pierce,
        multi: p.stats.multi,
        droneCount: p.stats.droneCount,
        damageDealt: p.tracking.damageDealt,
        damageTaken: p.tracking.damageTaken,
        damageBlocked: p.tracking.damageBlocked,
        damageBlockedByArmor: p.tracking.damageBlockedByArmor,
        damageBlockedByCollisionReduc: p.tracking.damageBlockedByCollisionReduc,
        damageBlockedByProjectileReduc: p.tracking.damageBlockedByProjectileReduc,
        damageBlockedByShield: p.tracking.damageBlockedByShield,
        damageBreakdown: p.tracking.damageBreakdown,
        incomingDamageBreakdown: p.tracking.incomingDamageBreakdown,
        healingBreakdown: p.tracking.healingBreakdown,
        avgHpAccumulator: p.tracking.avgHpAccumulator,
        avgHpSampleCount: p.tracking.avgHpSampleCount,
        activeSkillDamageByMinute: p.tracking.activeSkillDamageByMinute,
        wallsHit: p.tracking.wallsHit,
        lastAngle: p.movement.lastAngle,
        targetAngle: p.movement.targetAngle,
        faceAngle: p.movement.faceAngle,
        knockback: p.movement.knockback,
        targetX: p.movement.targetX,
        targetY: p.movement.targetY,
        activeSkills: p.skills.activeSkills,
        lastShot: p.skills.lastShot,
        classShotCount: p.skills.classShotCount,
        shotAccumulator: p.skills.shotAccumulator,
        shotsFired: p.skills.shotsFired,
        lastDeathMark: p.skills.lastDeathMark,
        waveUses: p.skills.waveUses,
        lastCosmicStrikeTime: p.skills.lastCosmicStrikeTime,
        lastBlackholeUse: p.skills.lastBlackholeUse,
        stormCircleChargeTime: p.skills.stormCircleChargeTime,
        stormCircleCooldownEnd: p.skills.stormCircleCooldownEnd,
        lastStormStrike: p.skills.lastStormStrike,
        dashCooldown: p.skills.dashCooldown,
        dashCooldownMax: p.skills.dashCooldownMax,
        dashUntil: p.skills.dashUntil,
        dashVx: p.skills.dashVx,
        dashVy: p.skills.dashVy,
        voidMarkerActive: p.skills.voidMarkerActive,
        voidMarkerX: p.skills.voidMarkerX,
        voidMarkerY: p.skills.voidMarkerY,
        voidMarkerVx: p.skills.voidMarkerVx,
        voidMarkerVy: p.skills.voidMarkerVy,
        voidMarkerSpawnTime: p.skills.voidMarkerSpawnTime,
        queuedNanites: p.skills.queuedNanites,
        naniteFrameCounter: p.skills.naniteFrameCounter,
        naniteDoubleDmgUntil: p.skills.naniteDoubleDmgUntil,
        lastHiveMotherSkill: p.skills.lastHiveMotherSkill,
        orbitalVortexUntil: p.skills.orbitalVortexUntil,
        lastVortexActivation: p.skills.lastVortexActivation,
        orbitalVortexCooldownEnd: p.skills.orbitalVortexCooldownEnd,
        sandboxActive: p.skills.sandboxActive,
        sandboxX: p.skills.sandboxX,
        sandboxY: p.skills.sandboxY,
        sandboxUntil: p.skills.sandboxUntil,
        sandboxCooldownStart: p.skills.sandboxCooldownStart,
        kineticBattery: p.skills.kineticBattery,
        radCore: p.skills.radCore,
        radCoreTick: p.skills.radCoreTick,
        chronoPlating: p.skills.chronoPlating,
        lastKineticShockwave: p.skills.lastKineticShockwave,
        kineticShieldTimer: p.skills.kineticShieldTimer,
        cooldownReduction: p.skills.cooldownReduction,
        cooldownReductionBonus: p.skills.cooldownReductionBonus,
        lastChronoDoubleIndex: p.skills.lastChronoDoubleIndex,
        chronoArmorBonus: p.skills.chronoArmorBonus,
        timeLoopPool: p.skills.timeLoopPool,
        timeLoopTimer: p.skills.timeLoopTimer,
        stasisTimer: p.skills.stasisTimer,
        stasisFieldActive: p.skills.stasisFieldActive,
        stasisFieldX: p.skills.stasisFieldX,
        stasisFieldY: p.skills.stasisFieldY,
        aigisRings: p.skills.aigisRings,
        vortexStrength: p.skills.vortexStrength,
        kineticTsunamiWaveSouls: p.skills.kineticTsunamiWaveSouls,
        soulShatterSouls: p.skills.soulShatterSouls,
        temporalMonolithSouls: p.skills.temporalMonolithSouls,
        neutronStarAuraKills: p.skills.neutronStarAuraKills,
        chronoDevourerBuffTime: p.skills.chronoDevourerBuffTime,
        invincibleUntil: p.buffs.invincibleUntil,
        stunnedUntil: p.buffs.stunnedUntil,
        phaseShiftUntil: p.buffs.phaseShiftUntil,
        immobilized: p.buffs.immobilized,
        healingDisabled: p.buffs.healingDisabled,
        invertedControlsUntil: p.buffs.invertedControlsUntil,
        temporalGuardActive: p.buffs.temporalGuardActive,
        spawnTimer: p.buffs.spawnTimer,
        soulDrainMult: p.buffs.soulDrainMult,
        buffs: p.buffs.buffs,
        shield: p.shields.shield,
        shieldExpiry: p.shields.shieldExpiry,
        shieldChunks: p.shields.shieldChunks,
        inventory: p.inventory,
        upgradesCollected: p.upgradesCollected,
        rerolls: p.rerolls,
        dust: p.dust,
        isotopes: p.isotopes,
        currentInput: p.currentInput,
        deathCause: p.deathCause,
        lastHitDamage: p.lastHitDamage,
        lastDamageTime: p.lastDamageTime,
        wallHitTimestamps: p.wallHitTimestamps,
        lastWallWarningTime: p.lastWallWarningTime,
        tripleWallDamageUntil: p.tripleWallDamageUntil,
        lastWallHitTime: p.lastWallHitTime,
        killerHp: p.killerHp,
        killerMaxHp: p.killerMaxHp,
        inRefineryZone: p.inRefineryZone,
        godColRedBonus: p.godColRedBonus,
        godProjRedBonus: p.godProjRedBonus,
        autoUnsocket: p.autoUnsocket,
        consumedLegendaries: p.consumedLegendaries,
    }
}
