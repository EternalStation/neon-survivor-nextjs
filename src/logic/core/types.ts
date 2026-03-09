export type Vector = { x: number; y: number };

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    type?: 'shard' | 'spark' | 'shockwave' | 'bubble' | 'vapor' | 'void' | 'shockwave_circle' | 'dust';
    alpha?: number;
    decay?: number;
    maxLife?: number;
    isTsunami?: boolean;
    isSingularity?: boolean;
    startAngle?: number;
    endAngle?: number;
}

export interface FloatingNumber {
    x: number;
    y: number;
    vx: number;
    vy: number;
    value: string;
    color: string;
    backgroundColor?: string;
    life: number;
    maxLife: number;
    isCrit: boolean;
    fontSize?: number;
}


export interface PlayerStats {
    base: number;
    flat: number;
    mult: number;
    hexFlat?: number;
    hexMult?: number;
    hexMult2?: number;
    classMult?: number;
}

export interface ShieldChunk {
    amount: number;
    expiry: number;
    source?: 'kinetic' | 'lifesteal' | 'skill';
}

export interface ActiveSkill {
    type: LegendaryType;
    baseCD: number;
    lastUsed: number;
    duration?: number;
    inUse: boolean;
    keyBind: string;
    icon?: string;
}

export type DamageSource =
    | 'Projectile'
    | 'Kinetic Bolt (LVL 1)'
    | 'Static Bolt'
    | 'Nanite Swarm'
    | 'Shockwave'
    | 'Neural Singularity'
    | 'Kinetic Tsunami'
    | 'Collision'
    | 'Radiation Aura'
    | 'Neutron Star (Aura)'
    | 'Irradiated Mire (Aura)'
    | 'Toxic Puddle (LVL 1)'
    | 'Toxic Puddle (LVL 4)'
    | 'Xeno Alchemist (Puddle)'
    | 'Irradiated Mire (Puddle)'
    | 'Vital Mire (Puddle)'
    | 'Epicenter (LVL 1)'
    | 'Epicenter (LVL 4)'
    | 'Gravitational Harvest'
    | 'Gravity Anchor'
    | 'Gravity Anchor (Explosion)'
    | 'Temporal Monolith'
    | 'Temporal Monolith (Explosion)'
    | 'Shattered Capacitor (Arc)'
    | 'Shattered Capacitor (Bleed)'
    | 'Necro-Kinetic Engine'
    | 'Wall Impact'
    | 'Fire Turret'
    | 'Ice Turret'
    | 'Zombie'
    | 'Crimson Feast (LVL 3)'
    | 'Crimson Feast (LVL 4)'
    | 'Storm of Steel (LVL 4)'
    | 'Shattered Fate (Execute)'
    | 'Shattered Fate (Death Mark)'
    | 'Shattered Fate (Crit)'
    | 'Orbital Vortex'
    | 'Storm Circle'
    | 'Void Singularity'
    | 'Wall Shockwave'
    | 'Malware Wall Bonus'
    | 'Malware Wall damage increase'
    | 'Aegis Rings'
    | 'Other';

export type AreaEffectType = 'puddle' | 'epicenter' | 'blackhole' | 'orbital_strike' | 'crater' | 'glitch_cloud' | 'afk_strike' | 'afk_strike_hit' | 'temporal_burst' | 'temporal_freeze_wave' | 'storm_laser' | 'storm_zone' | 'storm_hit' | 'nanite_cloud';
export interface AreaEffect {
    id: number;
    type: AreaEffectType;
    x: number;
    y: number;
    radius: number;
    duration: number;
    creationTime: number;
    level: number;

    tickTimer?: number;
    casterId?: number;
    pulseTimer?: number;
    dmgMult?: number;

    naniteSpawned?: boolean;
    naniteCount?: number;
    naniteDmg?: number;
    ownerId?: string;
    naniteSpitId?: number;
    facingAngle?: number;
    originX?: number;
    originY?: number;
    isGravityAnchor?: boolean;
    isGravitationalHarvest?: boolean;
    isVitalMire?: boolean;
    hitEnemies?: Set<number>;
}

export interface NaniteGroup {
    count: number;
    dmgPerSecond: number;
    spitId: number;
}

export interface Player {
    id: string;
    x: number;
    y: number;
    size: number;

    currentInput?: {
        keys: Record<string, boolean>;
        vector: { x: number, y: number };
        mouse: { x: number, y: number };
    };

    speed: number;
    spd: PlayerStats;
    dust: number;
    isotopes: number;
    hp: PlayerStats;
    curHp: number;
    dmg: PlayerStats;
    atk: PlayerStats;
    critChance: number;
    critDamage: number;


    damageDealt: number;
    damageTaken: number;
    damageBlocked: number;
    damageBlockedByArmor: number;
    damageBlockedByCollisionReduc: number;
    damageBlockedByProjectileReduc: number;
    damageBlockedByShield: number;
    damageBreakdown: Record<string, number>;
    activeSkillDamageByMinute?: Record<number, number>;
    wallsHit: number;
    upgradesCollected: import('./types').UpgradeChoice[];
    avgHpAccumulator?: number;
    avgHpSampleCount?: number;
    incomingDamageBreakdown?: Record<string, number>;
    healingBreakdown?: Record<string, number>;
    reg: PlayerStats;
    invertedControlsUntil?: number;
    arm: PlayerStats;
    xp_per_kill: PlayerStats;
    xp: { current: number; needed: number };
    level: number;
    lastShot: number;
    multi: number;
    pierce: number;
    droneCount: number;
    lastAngle: number;
    targetAngle: number;
    targetX?: number;
    targetY?: number;
    faceAngle: number;
    knockback: Vector;
    stunnedUntil?: number;
    invincibleUntil?: number;


    shield?: number;
    shieldExpiry?: number;
    shieldChunks?: ShieldChunk[];
    shotAccumulator?: number;
    shotsFired?: number;
    lastDeathMark?: number;
    activeSkills: ActiveSkill[];
    immobilized?: boolean;
    buffs?: {
        puddleRegen?: boolean;
        epicenterShield?: number;
        systemSurge?: { end: number, atk: number, spd: number };
        waveSpeed?: number;
        vitalRecovery?: number;
    };
    playerClass?: import('./classes').PlayerClassId;
    classShotCount?: number;
    lastCosmicStrikeTime?: number;
    lastBlackholeUse?: number;
    stormCircleChargeTime?: number;
    stormCircleCooldownEnd?: number;
    deathCause?: string;
    lastHitDamage?: number;
    lastDamageTime?: number;
    wallHitTimestamps?: number[];
    waveUses?: number;
    lastWallWarningTime?: number;
    tripleWallDamageUntil?: number;
    lastWallHitTime?: number;
    killerHp?: number;
    killerMaxHp?: number;


    dashCooldown?: number;
    dashCooldownMax?: number;
    dashUntil?: number;
    dashVx?: number;
    dashVy?: number;


    voidMarkerActive?: boolean;
    voidMarkerX?: number;
    voidMarkerY?: number;
    voidMarkerVx?: number;
    voidMarkerVy?: number;
    voidMarkerSpawnTime?: number;


    soulDrainMult?: number;
    healingDisabled?: boolean;


    temporalGuardActive?: boolean;
    phaseShiftUntil?: number;
    godColRedBonus?: number;
    godProjRedBonus?: number;
    spawnTimer?: number;


    queuedNanites?: number;
    naniteFrameCounter?: number;
    naniteDoubleDmgUntil?: number;
    lastHiveMotherSkill?: number;

    orbitalVortexUntil?: number;
    lastVortexActivation?: number;


    sandboxActive?: boolean;
    sandboxX?: number;
    sandboxY?: number;
    sandboxUntil?: number;
    sandboxCooldownStart?: number;
    orbitalVortexCooldownEnd?: number;


    kineticBattery?: boolean;
    radCore?: boolean;
    radCoreTick?: number;
    chronoPlating?: boolean;
    lastKineticShockwave?: number;
    kineticShieldTimer?: number;
    cooldownReduction?: number;
    cooldownReductionBonus?: number;
    lastChronoDoubleIndex?: number;
    chronoArmorBonus?: number;

    aigisRings?: Record<number, { count: number; totalDmg: number }>;
    vortexStrength: number;
    kineticTsunamiWaveSouls?: number;
    soulShatterSouls?: number;
    temporalMonolithSouls?: number;
    neutronStarAuraKills?: number;
    chronoDevourerBuffTime?: number;
    lastStormStrike?: number;

    inventory: (import('./types').Meteorite | null)[];
    autoUnsocket?: boolean;
    rerolls: number;
    consumedLegendaries?: string[];
}

export interface ClassMetric {
    label: string;
    value: number;
    unit: string;
    description: string;
    isPercentage: boolean;
    isStatic?: boolean;
    isResonant?: boolean;
}

export interface PlayerClass {
    id: import('./classes').PlayerClassId;
    name: string;
    title: string;
    lore: string;
    description: string;
    characteristics: string[];
    capabilityName: string;
    capabilityDesc: string;
    capabilityMetrics: ClassMetric[];
    stats: {
        hpMult?: number;
        regFlat?: number;
        dmgMult?: number;
        atkMult?: number;
        spdMult?: number;
        xpMult?: number;
        regMult?: number;
        armMult?: number;

        bounceDmgMult?: number;
        bounceSpeedBonus?: number;
        projLifeMult?: number;
        pierce?: number;
    };
    icon: string;
    iconUrl?: string;
    themeColor?: string;
}

export interface Bullet {
    id: number;
    ownerId?: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    dmg: number;
    pierce: number;
    life: number;
    isEnemy: boolean;
    hits: Set<number>;
    color?: string;
    size: number;
    isCrit?: boolean;
    critMult?: number;

    bounceCount?: number;
    isHyperPulse?: boolean;
    vortexState?: 'orbiting' | 'expanding';
    orbitAngle?: number;
    orbitDist?: number;
    spawnTime?: number;
    trails?: { x: number; y: number }[];

    isNanite?: boolean;
    naniteTargetId?: number;
    isWobbly?: boolean;
    isHiveMotherSkill?: boolean;
    hiveMotherSpitId?: number;
    cloudCenterX?: number;
    cloudCenterY?: number;
    cloudRadius?: number;

    bounceDmgMult?: number;
    bounceSpeedBonus?: number;

    isRing?: boolean;
    ringRadius?: number;
    ringVisualIntensity?: number;
    ringAmmo?: number;

    insideSandbox?: boolean;

    isTrace?: boolean;
    slowPercent?: number;
    freezeDuration?: number;
    isMist?: boolean;
    isVisualOnly?: boolean;

    burnDamage?: number;
    isTurretFire?: boolean;
    turretLevel?: number;
    turretVariant?: 'fire' | 'ice';
    isBomb?: boolean;
    explodeRadius?: number;

    isShockwaveCircle?: boolean;
    isSingularity?: boolean;
    isTsunami?: boolean;
    maxSize?: number;
    shockwaveLevel?: number;
    maxLife?: number;
    startAngle?: number;
    endAngle?: number;
    sourceShape?: string;
}

export type ShapeType = 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'glitcher' | 'minion' | 'snitch' | 'hexagon' | 'worm' | 'abomination' | 'orbital_shield' | 'long_drone';

export interface ShapeDef {
    type: ShapeType;
    role: string;
    speedMult: number;
    hpMult: number;
    behavior: 'chase' | 'charge' | 'tank' | 'snipe' | 'summon';
    spawnWeight: number;
    sizeMult: number;
}

export interface PaletteDef {
    name: string;
    id: string;
    colors: [string, string, string];
}

export interface Enemy {
    id: number;
    type: ShapeType | 'boss';
    x: number;
    y: number;
    size: number;
    hp: number;
    maxHp: number;
    spd: number;
    boss: boolean;
    bossType: number;
    bossAttackPattern: number;
    lastAttack: number;
    lastHitTime?: number;
    dead: boolean;
    puddleDmgAcc?: number;
    puddleDmgTimer?: number;


    shape: ShapeType;
    shellStage: number;
    palette: string[];
    fluxState: number;
    eraPalette?: string[];
    pulsePhase: number;
    rotationPhase: number;


    summonState?: number;
    dashState?: number;
    dashAngle?: number;
    timer?: number;
    dodgeDir?: number;


    seen?: boolean;
    spiralAngle?: number;
    spiralRadius?: number;
    reachedRange?: boolean;


    preferredMinDist?: number;
    preferredMaxDist?: number;
    strafeInterval?: number;


    wobblePhase?: number;
    jitterX?: number;
    jitterY?: number;
    glitchPhase?: number;
    crackPhase?: number;
    particleOrbit?: number;
    trails?: { x: number; y: number; alpha: number; rotation: number }[];


    isRare?: boolean;
    rarePhase?: number;
    rareTimer?: number;
    rareIntent?: number;
    rareReal?: boolean;
    canBlock?: boolean;
    invincibleUntil?: number;
    parentId?: number;
    isExecuted?: boolean;


    glitchDecoy?: boolean;
    lastBlink?: number;
    lastDecoy?: number;
    lastLeak?: number;
    longTrail?: { x: number; y: number }[];
    forceTeleport?: boolean;


    voidAmplified?: boolean;
    voidAmpMult?: number;
    untargetable?: boolean;
    phase3AudioTriggered?: boolean;
    spawnedAt?: number;
    spawnGracePeriod?: number;



    charge?: number;


    customCollisionDmg?: number;
    stunOnHit?: boolean;


    xpRewardMult?: number;
    soulRewardMult?: number;
    mergeState?: 'none' | 'warming_up' | 'merging';
    beingConsumedBy?: number;
    mergeId?: string;
    mergeTimer?: number;
    mergeHost?: boolean;
    mergeCooldown?: number;


    isElite?: boolean;
    eliteState?: number;
    originalPalette?: string[];
    lockedTargetX?: number;
    lockedTargetY?: number;



    frozen?: number;
    knockback: { x: number; y: number };
    shieldCd?: number;
    hideCd?: number;
    hideTarget?: Vector | null;
    hideCoverId?: number;
    tacticalMode?: number;
    tacticalTimer?: number;
    laserTick?: number;
    dodgeCooldown?: number;
    lastDodge?: number;
    lastBarrierTime?: number;
    lastCollisionDamage?: number;
    smokeRushEndTime?: number;
    hidingStateEndTime?: number;
    lastWallHit?: number;
    vortexRecoveryUntil?: number;
    lastVortexVelX?: number;
    lastVortexVelY?: number;
    vortexExitInertiaUntil?: number;
    isNeutral?: boolean;
    baseColor?: string;
    spiralDelay?: number;
    isFlanker?: boolean;
    flankAngle?: number;
    flankDistance?: number;
    flankStatus?: number;
    flankTimer?: number;



    minionState?: number;
    orbitAngle?: number;
    orbitDistance?: number;
    lastLaunchTime?: number;
    suicideTimer?: number;
    triggeredLaunchTime?: number;
    angryUntil?: number;
    panicTimer?: number;
    panicCooldown?: number;
    trollTimer?: number;
    trollRush?: boolean;
    minionCount?: number;
    orbitingMinionIds?: number[];
    minionIndex?: number;


    isFriendly?: boolean;
    attackTargetId?: number;


    deathMarkExpiry?: number;
    fearedUntil?: number;
    stunnedUntil?: number;
    temporalMonolithExplosive?: boolean;


    isZombie?: boolean;
    zombieState?: 'dead' | 'rising' | 'active' | 'clinging';
    zombieTimer?: number;
    zombieSpd?: number;
    infected?: boolean;
    zombieTargetId?: number;
    zombieHearts?: number;
    isEnraged?: boolean;
    vx?: number;
    vy?: number;
    distGoal?: number;
    critGlitchUntil?: number;
    slowFactor?: number;
    slowUntil?: number;
    slowPercentVal?: number;
    takenDamageMultiplier?: number;

    isInfected?: boolean;
    infectedUntil?: number;
    infectionDmg?: number;
    infectionAccumulator?: number;
    activeNaniteCount?: number;
    activeNaniteDmg?: number;
    lastSpitHitId?: number;
    naniteGroups?: NaniteGroup[];

    bleedTimer?: number;
    bleedDmg?: number;
    bleedAccumulator?: number;

    burnStack?: number;
    burnTimer?: number;
    isNecroticZombie?: boolean;
    isGhost?: boolean;
    legionId?: string;
    legionLeadId?: number;
    legionSlot?: { x: number; y: number };
    isAssembling?: boolean;
    legionShield?: number;
    maxLegionShield?: number;
    legionReady?: boolean;
    legionCenter?: Vector;
    legionJoinDelay?: number;
    wasInLegion?: boolean;
    hasHitThisBurst?: boolean;


    thorns?: number;
    dashTimer?: number;
    dashLockX?: number;
    dashLockY?: number;
    berserkState?: boolean;
    berserkTimer?: number;
    beamState?: number;
    beamTimer?: number;
    beamX?: number;
    beamY?: number;
    beamAngle?: number;
    soulLinkTargets?: number[];
    soulLinkHostId?: number;
    bossTier?: number;


    cycloneState?: number;
    cycloneTimer?: number;
    shieldsInitialized?: boolean;


    deflectState?: boolean;

    orbitalShields?: number;
    maxOrbitalShields?: number;
    shieldRegenTimer?: number;

    satelliteState?: number;
    satelliteTimer?: number;
    satelliteTargets?: { x: number, y: number }[];

    parasiteLinkActive?: boolean;
    parasiteTimer?: number;
    wormId?: string;
    wormRole?: 'head' | 'segment';
    wormSegmentIndex?: number;
    wormNextId?: number;
    wormPrevId?: number;
    wormHistory?: { x: number, y: number, state?: 'surface' | 'digging' | 'underground' | 'erupting' }[];
    wormBurrowState?: 'surface' | 'digging' | 'underground' | 'erupting';
    wormBurrowTimer?: number;
    wormAIState?: 'stalking' | 'charging';
    wormFlankAngle?: number;
    wormLungeTimer?: number;
    wormLungeActive?: boolean;
    wormOrbitDir?: number;
    wormOrbitRadius?: number;
    wormTrueDamage?: number;
    wormPromotionTimer?: number;
    isAnomaly?: boolean;
    anomalyGeneration?: number;
    bonusBurnPct?: number;
    bonusBurnRadius?: number;
    stage?: number;
    stage2StartTime?: number;
    stage3StartTime?: number;
    minionsSpawned?: boolean;
    anomalyBurnTimer?: number;
    dieOnCollision?: boolean;
    lastPushX?: number;
    lastPushY?: number;


    isLevel3?: boolean;
    isLevel4?: boolean;
    thornsIgnoresArmor?: boolean;
    dementorActive?: boolean;
    dementorX?: number;
    dementorY?: number;
    soulSuckActive?: boolean;
    soulSuckTimer?: number;
    soulSuckUsed?: boolean;
    soulSuckCoreSize?: number;


    phalanxTimer?: number;
    phalanxState?: number;
    phalanxDrones?: string[];
    phalanxAngle?: number;
    isPhalanxDrone?: boolean;
    phalanxDroneAngle?: number;


    crystalPositions?: Vector[];
    crystalState?: number;
    nextAttackCD?: number;
}

export interface Upgrade {
    id: string;
    name: string;
    desc: string;
    icon: string;
    isSpecial?: boolean;
}

export type LegendaryCategory = 'Economic' | 'Combat' | 'Defensive' | 'Fusion';

export type LegendaryType =
    | 'EcoDMG' | 'EcoXP' | 'EcoHP'
    | 'ComLife' | 'ComCrit' | 'ComWave'
    | 'DefPuddle' | 'DefEpi' | 'CombShield'
    | 'hp_per_kill' | 'ats_per_kill' | 'xp_per_kill' | 'dmg_per_kill' | 'reg_per_kill'
    | 'shockwave' | 'shield_passive' | 'dash_boost' | 'lifesteal' | 'orbital_strike' | 'drone_overdrive'
    | 'KineticBattery' | 'RadiationCore' | 'ChronoPlating' | 'XenoAlchemist' | 'IrradiatedMire' | 'NeuralSingularity' | 'KineticTsunami'
    | 'SoulShatterCore' | 'BloodForgedCapacitor' | 'GravityAnchor' | 'TemporalMonolith' | 'NeutronStar' | 'GravitationalHarvest' | 'ShatteredCapacitor' | 'ChronoDevourer' | 'VitalMire';

export interface LegendaryHex {
    id: string;
    name: string;
    desc: string;
    category: LegendaryCategory;
    categories?: LegendaryCategory[];
    type: LegendaryType;
    level: number;
    killsAtAcquisition: number;
    timeAtAcquisition?: number;
    killsAtLevel?: Record<number, number>;
    timeAtLevel?: Record<number, number>;
    customIcon?: string;
    description?: string;
    lore?: string;
    perks?: string[];
    allPerks?: string[][];
    statBonuses?: Record<string, number>;
    forgedAt?: string[];
}

export interface UpgradeChoice {
    type: Upgrade;
    rarity: Rarity;
    isSpecial?: boolean;
}

export interface Rarity {
    id: string;
    label: string;
    color: string;
    mult: number;
}

export type GameEventType =
    | 'legionnaire_sweep'
    | 'necrotic_surge'
    | 'legion_formation'
    | 'gravity_singularity'
    | 'pincer_maneuver'
    | 'fog_of_war'
    | 'meteor_shower'
    | 'mirror_match'
    | 'thief_rush'
    | 'bullet_hell'
    | 'titans_shadow'
    | 'nano_infection'
    | 'clockwork_arena';

export type POIType = 'overclock' | 'anomaly' | 'turret';

export interface MapPOI {
    id: number;
    type: POIType;
    x: number;
    y: number;
    radius: number;
    arenaId: number;
    active: boolean;
    progress: number;
    activationProgress: number;
    activeDuration: number;
    cooldown: number;
    respawnTimer: number;
    lastUsed: number;

    turretVariant?: 'fire' | 'ice' | 'heal';
    turretUses?: number;
    turretCost?: number;
    lastShot?: number;
    rotation?: number;
    anomalySpawnDelay?: number;
    anomalySpawnTier?: number;

    droneSpawned?: boolean;
    lastBomb?: number;
    lastShotRear?: number;
    lastErrorTime?: number;
}

export interface GameEvent {
    type: GameEventType;
    startTime: number;
    duration: number;
    endTime: number;
    data?: any;
    pendingZombieSpawns?: Array<{ x: number; y: number; shape: ShapeType; spd: number; maxHp: number; size: number; spawnAt: number }>;
}

export interface Ally {
    id: number;
    type: 'heal_drone' | string;
    x: number;
    y: number;
    life: number;
    ownerId: number;
    healPower?: number;
}


export interface GameState {
    player: Player;
    enemies: Enemy[];
    bullets: Bullet[];
    enemyBullets: Bullet[];
    floatingNumbers: FloatingNumber[];
    drones: { a: number; last: number; x: number; y: number }[];
    particles: Particle[];
    allies?: Ally[];
    camera: Vector;
    score: number;
    killCount: number;
    rawKillCount: number;
    bossKills: number;
    gameTime: number;
    meteoritesPickedUp: number;
    portalsUsed: number;
    snitchCaught: number;
    timeInArena: Record<number, number>;
    frameCount: number;
    isPaused: boolean;
    gameOver: boolean;
    nextBossSpawnTime: number;
    playerPosHistory?: { x: number; y: number; timestamp: number }[];
    nextBossId: number;
    rareSpawnCycle: number;
    rareSpawnActive: boolean;
    rareRewardActive?: boolean;
    snitchRewardActive?: boolean;
    spawnTimer: number;
    interactPressed?: boolean;
    unpauseDelay?: number;
    unpauseMode?: 'normal' | 'slow_motion';
    flashIntensity?: number;
    cheatsUsed?: boolean;
    classSkillDamageHistory: number[];
    currentMinuteClassSkillDamage: number;
    lastMinuteMark: number;
    hasPlayedSpawnSound?: boolean;
    bossPresence: number;
    critShake: number;
    smokeBlindTime?: number;
    anomalyBossCount?: number;
    spatialGrid: import('./SpatialGrid').SpatialGrid;
    areaEffects: AreaEffect[];
    activeEvent: GameEvent | null;
    nextEventCheckTime: number;
    directorState?: {
        necroticCycle: number;
        legionCycle: number;
        legionSpawned?: boolean;
        activeLegionId?: string;
    };
    lastLegionWindow?: number;
    pois: MapPOI[];


    currentArena: number;
    lastArena?: number;
    portalsUnlocked: boolean;
    arenaLevels: Record<number, number>;
    portalState: 'closed' | 'warn' | 'open' | 'transferring';
    portalTimer: number;
    portalOpenDuration: number;
    isUpgradeMenuOpen?: boolean;
    shownUpgradeIds?: string[];
    portalBlockedByWorms?: boolean;
    portalBlockedByAbomination?: boolean;
    transferTimer: number;
    nextArenaId: number | null;
    portalOneTimeUse?: boolean;
    runSubmitted?: boolean;


    meteorites: Meteorite[];
    inventory: (Meteorite | null)[];
    incubator: (IncubatedMeteorite | null)[];
    incubatorFuel: number;
    incubatorFuelMax: number;


    showModuleMenu: boolean;
    showStats: boolean;
    showSettings: boolean;
    showLegendarySelection: boolean;
    showBossSkillDetail: boolean;
    showAdminConsole: boolean;
    showCheatPanel: boolean;
    showFeedbackModal: boolean;
    legendaryOptions: LegendaryHex[] | null;
    pendingLegendaryHex: LegendaryHex | null;
    pendingFusionHex?: { hex: LegendaryHex, validHexIndices: number[] } | null;
    upgradingHexIndex: number | null;
    upgradingHexTimer: number;
    unseenMeteorites: number;
    moduleSockets: {
        hexagons: (LegendaryHex | null)[];
        diamonds: (Meteorite | null)[];
        center: PlayerClass | null;
    };
    chassisDetailViewed: boolean;
    lastPlacement: { type: 'diamond' | 'hex', index: number, timestamp: number } | null;

    legionLeads?: Record<string, Enemy>;
    playerName?: string;
    language: import('../../lib/LanguageContext').Language;


    blueprints: (Blueprint | null)[];
    activeBlueprintBuffs: Partial<Record<BlueprintType, number>>;
    activeBlueprintCharges: Partial<Record<BlueprintType, number>>;
    hpRegenBuffMult: number;
    dmgAtkBuffMult: number;
    xpSoulBuffMult: number;
    meteoriteRateBuffMult: number;
    gameSpeedMult: number;
    xpDisabled?: boolean;
    chassisResonanceBonus?: number;


    extractionStatus: 'none' | 'requested' | 'waiting' | 'active' | 'arriving' | 'arrived' | 'departing' | 'complete';
    extractionTimer: number;
    extractionMessageIndex: number;
    extractionMessageTimes?: number[];
    extractionDialogTime?: number;
    extractionTargetArena: number;
    extractionShipPos?: { x: number, y: number };
    extractionStartTime?: number;
    extractionEndTime?: number;
    extractionPowerMult: number;
    extractionSectorLabel?: string;


    tutorial: TutorialState;


    glitcherLastCheckedMinute?: number;
    glitcherScheduledSpawnTime?: number;


    wormLastCheckedMinute?: number;
    wormScheduledSpawnTime?: number;


    pendingLevelUps: number;
    levelUpTimer: number;
    pendingBossKills: number;
    bossKillTimer: number;
    pendingZaps?: Array<{ targetIds: number[]; dmg: number; nextZapTime: number; currentIndex: number; sourcePos: { x: number, y: number }, applyBleed?: boolean, applyStun?: boolean, history: { x1: number; y1: number; x2: number; y2: number }[], travelProgress?: number, isHunting?: boolean, color?: string }>;


    firstMeteoriteSpawned?: boolean;


    gameMode: 'single' | 'multiplayer';
    players: Record<string, Player>;
    multiplayer: {
        active: boolean;
        isHost: boolean;
        myId: string;
        peerIds: string[];
    };
    readyStatus: Record<string, boolean>;
    sharedXp: number;


    assistant: {
        message: string | null;
        emotion: 'Normal' | 'Dissapointed' | 'Point' | 'Smile' | 'Thinks';
        queue: string[];
        timer: number;
        history: {
            upgradePicks: Record<string, number>;
            deaths: number;
            totalDamageTaken: number;
            totalSurvivalTime: number;
            lastOneTrickWarningTime?: number;
            lastWallWarningTime?: number;
            classStreak?: number;
            lastClassId?: string;
            curseIntensity?: number;
        };
    };
    keybinds: import('../utils/Keybinds').Keybinds;
}

export type MeteoriteRarity = 'anomalous' | 'radiant' | 'abyss' | 'eternal' | 'divine' | 'singularity';
export const RARITY_ORDER: MeteoriteRarity[] = ['anomalous', 'radiant', 'abyss', 'eternal', 'divine', 'singularity'];
export type MeteoriteQuality = 'Broken' | 'Damaged' | 'New';

export interface MeteoritePerk {
    id: string;
    description: string;
    value: number;
    range: { min: number, max: number };
}

export interface Meteorite {
    id: number;
    type?: 'void_flux' | 'dust_pile' | 'vital_spark';
    amount?: number;
    x: number;
    y: number;
    rarity: MeteoriteRarity;
    quality: MeteoriteQuality;
    visualIndex: number;
    vx: number;
    vy: number;
    magnetized: boolean;
    isNew?: boolean;
    discoveredIn: string;
    perks: MeteoritePerk[];
    spawnedAt: number;
    recalibrationCount?: number;
    stats: {
        coreSurge?: number;
        neighbor?: number;
        hex?: number;
        found?: number;
        pair?: number;
        connected?: number;
        sector?: number;
        arena?: number;
    };
    incubatorBoost?: number;
    instability?: number;
    version?: number;
    blueprintBoosted?: boolean;
    isCorrupted?: boolean;
    targetPlayer?: any;
    isBlueprint?: boolean;
    blueprintType?: BlueprintType;
    name?: string;
    status?: 'locked' | 'ready' | 'active' | 'broken' | 'researching';
    researched?: boolean;
    researchFinishTime?: number;
    researchRemainingTime?: number;
    researchDuration?: number;
}

export interface IncubatedMeteorite extends Meteorite {
    insertedAt: number;
    growthTicks: number;
    instability: number;
    isRuined?: boolean;
}

export type BlueprintType =
    | 'METEOR_SHOWER'
    | 'NEURAL_OVERCLOCK'
    | 'STASIS_FIELD'
    | 'PERK_RESONANCE'
    | 'ARENA_SURGE'
    | 'QUANTUM_SCRAPPER'
    | 'MATRIX_OVERDRIVE'
    | 'TEMPORAL_GUARD'
    | 'DIMENSIONAL_GATE'
    | 'SECTOR_UPGRADE_ECO'
    | 'SECTOR_UPGRADE_COM'
    | 'SECTOR_UPGRADE_DEF';

export interface Blueprint {
    id: number;
    type: BlueprintType;
    name: string;
    serial: string;
    desc: string;
    cost: number;
    duration: number;
    isBlueprint: boolean;
    researched: boolean;
    status: 'locked' | 'ready' | 'active' | 'broken' | 'researching';
    discoveredIn?: string;
    researchRemainingTime?: number;
    researchFinishTime?: number;
    researchDuration?: number;
}

export enum TutorialStep {
    MOVEMENT = 0,
    COMBAT = 1,
    KILL_ENEMY = 2,
    LEVEL_UP_MENU = 3,
    UPGRADE_SELECTED_CHECK_STATS = 4,

    COLLECT_METEORITE = 5,
    OPEN_MODULE_MENU = 6,


    MATRIX_WELCOME = 10,
    MATRIX_INVENTORY = 11,
    MATRIX_SOCKETS = 12,
    MATRIX_TYPES = 13,
    MATRIX_ORIGIN = 14,
    MATRIX_RECYCLE_ACTION = 15,
    MATRIX_DUST_USAGE = 16,
    MATRIX_QUOTA_MISSION = 17,
    MATRIX_CLASS_DETAIL = 18,
    MATRIX_NON_STATIC_METRICS = 19,
    MATRIX_FILTERS = 20,

    COMPLETE = 99
}

export interface TutorialState {
    currentStep: TutorialStep;
    isActive: boolean;
    stepTimer: number;
    completedSteps: TutorialStep[];


    pressedKeys: Set<string>;
    hasMoved: boolean;
    hasKilled: boolean;
    hasCollectedMeteorite: boolean;
    hasOpenedModules: boolean;
    hasOpenedStats: boolean;
}
