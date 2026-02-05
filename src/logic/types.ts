export type Vector = { x: number; y: number };

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
    type?: 'shard' | 'spark' | 'shockwave' | 'bubble' | 'vapor' | 'void';
    alpha?: number;
    decay?: number;
}

export interface FloatingNumber {
    x: number;
    y: number;
    vx: number;
    vy: number;
    value: string;
    color: string;
    life: number;
    maxLife: number;
    isCrit: boolean;
}


export interface PlayerStats {
    base: number;
    flat: number;
    mult: number;
    hexFlat?: number;
    hexMult?: number;
}

export interface ShieldChunk {
    amount: number;
    expiry: number;
}

export interface ActiveSkill {
    type: LegendaryType;
    cooldownMax: number;
    cooldown: number;
    duration?: number;
    inUse: boolean;
    keyBind: string; // '1', '2', '3', '4', '5'
    icon?: string;
}

export interface AreaEffect {
    id: number;
    type: 'puddle' | 'epicenter' | 'blackhole' | 'orbital_strike' | 'crater';
    x: number;
    y: number;
    radius: number;
    duration: number; // remaining time in frames or ms? Let's use seconds/frames logic. Usually ms based on gameTime.
    creationTime: number;
    level: number;
    // Puddle props
    tickTimer?: number;
    // Epicenter props
    casterId?: number; // Player ID?
    pulseTimer?: number;
}

export interface Player {
    x: number;
    y: number;
    size: number;
    speed: number;
    dust: number;
    hp: PlayerStats;
    curHp: number;
    dmg: PlayerStats;
    atk: PlayerStats; // Cooldown in ms (lower is faster)
    // Stats Tracking
    damageDealt: number;
    damageTaken: number;
    damageBlocked: number;
    damageBlockedByArmor: number;
    damageBlockedByCollisionReduc: number;
    damageBlockedByProjectileReduc: number;
    damageBlockedByShield: number;
    wallsHit: number;
    upgradesCollected: import('./types').UpgradeChoice[]; // Full objects for stat tracking
    reg: PlayerStats;
    arm: PlayerStats;
    xp_per_kill: { base: number; flat: number; mult: number };
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
    stunnedUntil?: number; // Timestamp when stun ends
    invincibleUntil?: number; // Timestamp for invincibility (e.g. Ninja Smoke)

    // New Legendary Props
    shield?: number; // @deprecated: Use shieldChunks
    shieldExpiry?: number; // @deprecated: Use shieldChunks
    shieldChunks?: ShieldChunk[];
    shotsFired?: number;
    lastDeathMark?: number;
    activeSkills: ActiveSkill[];
    immobilized?: boolean; // For Epicenter self-root
    buffs?: {
        puddleRegen?: boolean; // Lvl 3 puddle buff
        epicenterShield?: number; // Lvl 3 epicenter shield
        systemSurge?: { end: number, atk: number, spd: number }; // General surge buff for Storm-Strike or others
    };
    playerClass?: import('./classes').PlayerClassId;
    classShotCount?: number; // For Storm-Strike Hyper-Pulse
    lastCosmicStrikeTime?: number; // For Cosmic Beam class tracking
    blackholeCooldown?: number; // Timestamp when next blackhole can be created (Event Horizon)
    deathCause?: string; // Reason for game over
}

export interface ClassMetric {
    label: string;
    value: number;
    unit: string;
    description: string;
    isPercentage: boolean;
    isStatic?: boolean;
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
        // Malware-Prime Specifics
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
    x: number;
    y: number;
    vx: number;
    vy: number;
    dmg: number;
    pierce: number; // Penetration count
    life: number;
    isEnemy: boolean;
    hits: Set<number>; // Enemy IDs hit
    color?: string;
    size: number;
    isCrit?: boolean;
    critMult?: number;
    // New Class Modifiers
    bounceCount?: number;
    isHyperPulse?: boolean;
    vortexState?: 'orbiting' | 'expanding';
    orbitAngle?: number;
    orbitDist?: number;
    spawnTime?: number;
    trails?: { x: number; y: number }[];
    // Nanite Swarm
    isNanite?: boolean;
    naniteTargetId?: number;
    // Malware Props
    bounceDmgMult?: number;
    bounceSpeedBonus?: number;
}

export type ShapeType = 'circle' | 'triangle' | 'square' | 'diamond' | 'pentagon' | 'minion' | 'snitch';

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
    colors: [string, string, string]; // Core, Inner, Outer
}

export interface Enemy {
    id: number;
    type: ShapeType | 'boss'; // Changed from generic string
    x: number;
    y: number;
    size: number;
    hp: number;
    maxHp: number;
    spd: number;
    boss: boolean;
    bossType: number; // Shape index for legendary upgrades
    bossAttackPattern: number; // 0 = Spread Shot, 1 = Tracking Snipe
    lastAttack: number;
    dead: boolean;
    isExecuted?: boolean;

    // New Progression Props
    shape: ShapeType;
    shellStage: number; // 0, 1, 2 (Core, Inner, Outer)
    palette: string[]; // [Core, Inner, Outer]
    fluxState: number; // 0: Containment, 1: Active, 2: Overload
    eraPalette?: string[]; // Base era colors [Bright, Med, Dark]
    pulsePhase: number; // 0-1 for breathing animation
    rotationPhase: number; // For slow rotation

    // AI States
    summonState?: number; // 0: moving, 1: wait, 2: cast
    dashState?: number; // 0: normal, 1: dash
    dashAngle?: number; // Angle of the dash
    timer?: number; // General purpose timer
    dodgeDir?: number; // -1 or 1 for Dodge

    // New Props for Refinements
    seen?: boolean; // Has been seen by camera? (Pentagon)
    spiralAngle?: number; // For Minion Black hole movement
    spiralRadius?: number; // For Minion Black hole movement
    reachedRange?: boolean; // For Pentagon AI (track if 700 range reached)

    // Diamond Logic
    preferredMinDist?: number;
    preferredMaxDist?: number;
    strafeInterval?: number;

    // Boss Visual Effects
    wobblePhase?: number; // For wobble animation
    jitterX?: number; // Jitter offset X
    jitterY?: number; // Jitter offset Y
    glitchPhase?: number; // For glitch effects
    crackPhase?: number; // For crack animations
    particleOrbit?: number; // For orbiting particles (Pentagon)
    trails?: { x: number; y: number; alpha: number; rotation: number }[]; // After-images

    // Rare Enemy "Quantum Frame" Props
    isRare?: boolean;
    rarePhase?: number; // 0=Passive, 1=Alert, 2=Panic
    rareTimer?: number; // Phase duration tracker
    rareIntent?: number; // Counter for player intent
    rareReal?: boolean; // True if real, False if decoy
    canBlock?: boolean; // For Phase 2 defense (replaces blockedShots boolean flag logic)
    invincibleUntil?: number; // Timestamp for invincibility (Phase 3 start)
    parentId?: number; // For decoys to know their master
    teleported?: boolean; // Flag for Phase 2 entry
    longTrail?: { x: number; y: number }[]; // Long paint trail

    // Event Horizon Blackhole Effects
    voidAmplified?: boolean; // Is enemy in blackhole vortex?
    voidAmpMult?: number; // Damage amplification multiplier
    untargetable?: boolean; // If true, player bullets won't home in on it
    phase3AudioTriggered?: boolean; // Flag for Phase 3 Audio Trigger
    spawnedAt?: number; // GameTime when spawned

    // Snitch AI Props
    // Snitch AI Props
    charge?: number; // For Snitch Phase 2 Charge Mechanic

    // Custom Collision Props
    customCollisionDmg?: number; // If set, overrides standard 15% damage
    stunOnHit?: boolean; // If true, stuns player on collision

    // XP Reward
    xpRewardMult?: number; // Multiplier for XP gain (overrides isElite check if present)
    soulRewardMult?: number; // Multiplier for souls (kill count) gain
    mergeState?: 'none' | 'warming_up' | 'merging';
    mergeId?: string; // Group ID for merging cluster
    mergeTimer?: number; // Timestamp when merge completes
    mergeHost?: boolean; // Is this the "host" that becomes elite?
    mergeCooldown?: number; // Cooldown timestamp before can merge again (after failed merge)

    // Elite Properties
    isElite?: boolean;
    eliteState?: number; // For elite skills (0=Ready, 1=Active...)
    originalPalette?: string[]; // Store original palette before ability color changes
    lockedTargetX?: number; // For Circle Elite bull charge - locked player X position
    lockedTargetY?: number; // For Circle Elite bull charge - locked player Y position


    // Physics / Status
    frozen?: number; // Timer for frozen state
    knockback: { x: number; y: number }; // Knockback vector
    shieldCd?: number; // For Snitch bullet stoppers (barrels)
    hideCd?: number; // Cooldown for hiding behind enemies
    hideTarget?: Vector | null; // Persist target for CD alignment
    hideCoverId?: number; // ID of the enemy we are currently hiding behind
    tacticalMode?: number; // 0 = Hide, 1 = Avoid
    tacticalTimer?: number; // Timestamp for mode switching
    laserTick?: number; // Timestamp for last laser damage tick (Diamond Elite)
    dodgeCooldown?: number; // Escape dash timer for diamonds
    lastDodge?: number; // Last escape dash timestamp (cooldown tracking)
    lastBarrierTime?: number; // Timestamp when Barrels (Shields) were last used
    lastCollisionDamage?: number; // Timestamp for last collision damage dealt to player
    smokeRushEndTime?: number; // Timestamp when smoke rush ends
    hidingStateEndTime?: number; // Timestamp when hiding behavior ends
    lastWallHit?: number; // Cooldown for boss wall collision damage
    isNeutral?: boolean; // If true, ignored by auto-aim (e.g. Barrels)
    baseColor?: string; // Immutable spawn color for projectiles
    spiralDelay?: number; // Delay in seconds before starting spiral motion (Minions)


    // Minion / Pentagon Guard Props
    minionState?: number; // 0=Orbit, 1=Attack
    orbitAngle?: number;
    orbitDistance?: number;
    lastLaunchTime?: number; // Mother's launch throttle
    suicideTimer?: number; // Mother's delayed explosion
    triggeredLaunchTime?: number; // Timestamp of proximity trigger
    angryUntil?: number; // End time for "Angry" red visual
    panicTimer?: number; // Speed boost duration for Real Snitch escape
    panicCooldown?: number; // Cooldown for panic escape
    trollTimer?: number; // Stop duration for Fake Snitch
    trollRush?: boolean; // If true, Fake Snitch is suicide rushing wall

    // Friendly Zombie Props
    isFriendly?: boolean;
    attackTargetId?: number;

    // Status Effects
    deathMarkExpiry?: number;
    fearedUntil?: number;

    // Friendly Zombie Props (Refined)
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
    slowFactor?: number; // 0-1 (e.g. 0.3 = 30% slow)
    takenDamageMultiplier?: number; // e.g. 1.2 = +20% dmg taken
    // Hive-Mother Infection
    isInfected?: boolean;
    infectedUntil?: number;
    infectionDmg?: number;
    infectionAccumulator?: number;
    isNecroticZombie?: boolean;
    legionId?: string;
    legionLeadId?: number;
    legionSlot?: { x: number; y: number }; // Index in the grid (e.g. 0-4, 0-3 for 20 enemies)
    isAssembling?: boolean; // Invisible/Invincible during formation
    legionShield?: number; // Shared shield value (stored on each member for simplicity or just on lead)
    maxLegionShield?: number; // Max shield for the bar indicator
    legionReady?: boolean; // True when formation is complete and shield activates
    legionCenter?: Vector; // The center of the formation where it builds up
    legionJoinDelay?: number; // Delay in frames before this unit starts joining the legion
    wasInLegion?: boolean; // Prevent re-joining or merging after being in a legion
    hasHitThisBurst?: boolean; // For one-time burst abilities (like Diamond Elite Laser)

    // Level 2 Boss Mechanics (10min+)
    thorns?: number; // % damage return (0-1)
    dashTimer?: number; // Cooldown/State timer for Circle Boss
    dashLockX?: number; // Locked target X
    dashLockY?: number; // Locked target Y
    berserkState?: boolean; // Triangle Boss Berserk
    berserkTimer?: number;
    beamState?: number; // 0=Cd, 1=Charge, 2=Fire
    beamTimer?: number; // Timer for states
    beamX?: number; // Baked target X
    beamY?: number; // Baked target Y
    beamAngle?: number;
    soulLinkTargets?: number[]; // IDs of linked enemies (Pentagon)
    soulLinkHostId?: number; // ID of the boss linking this enemy
    bossTier?: number; // 0=Auto (Time based), 1=Tier 1 (Normal), 2=Tier 2 (Enhanced), 3=Tier 3 (Ascended)

    // Level 3 Boss Mechanics (20min+)
    cycloneState?: number; // 0=Idle, 1=Spinning (Circle)
    cycloneTimer?: number;
    shieldsInitialized?: boolean; // Square Boss - tracks if initial shields have been spawned


    deflectState?: boolean; // Triangle Spin/Deflect

    orbitalShields?: number; // Current active shields (Square)
    maxOrbitalShields?: number;
    shieldRegenTimer?: number;

    satelliteState?: number; // 0=Idle, 1=Charge, 2=Fire (Diamond)
    satelliteTimer?: number;
    satelliteTargets?: { x: number, y: number }[]; // Locked zones

    parasiteLinkActive?: boolean; // Pentagon Link
    parasiteTimer?: number;
}

export interface Upgrade {
    id: string;
    name: string;
    desc: string;
    icon: string;
    isSpecial?: boolean;
}

export type LegendaryCategory = 'Economic' | 'Combat' | 'Defensive';

export type LegendaryType =
    | 'EcoDMG' | 'EcoXP' | 'EcoHP'
    | 'ComLife' | 'ComCrit' | 'ComWave'
    | 'DefPuddle' | 'DefEpi' | 'CombShield'
    | 'hp_per_kill' | 'ats_per_kill' | 'xp_per_kill' | 'dmg_per_kill' | 'reg_per_kill'
    | 'shockwave' | 'shield_passive' | 'dash_boost' | 'lifesteal' | 'orbital_strike' | 'drone_overdrive';

export interface LegendaryHex {
    id: string;
    name: string;
    desc: string;
    category: LegendaryCategory;
    type: LegendaryType;
    level: number;
    killsAtAcquisition: number;
    timeAtAcquisition?: number;
    killsAtLevel?: Record<number, number>; // Track killCount when each level was unlocked
    timeAtLevel?: Record<number, number>; // Track gameTime when each level was unlocked
    customIcon?: string;
    description?: string;
    lore?: string;
    perks?: string[];
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
    | 'solar_emp'
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

export interface GameEvent {
    type: GameEventType;
    startTime: number;
    duration: number; // in seconds
    endTime: number;
    data?: any; // Event specific storage (e.g. original values to restore)
    pendingZombieSpawns?: Array<{ x: number; y: number; shape: ShapeType; spd: number; maxHp: number; size: number; spawnAt: number }>;
}

export interface GameState {
    player: Player;
    enemies: Enemy[];
    bullets: Bullet[];
    enemyBullets: Bullet[];
    floatingNumbers: FloatingNumber[];
    drones: { a: number; last: number; x: number; y: number }[];
    particles: Particle[];
    camera: Vector;
    score: number;
    killCount: number; // Dedicated kill counter
    bossKills: number; // Track boss kills separately
    gameTime: number;
    meteoritesPickedUp: number;
    portalsUsed: number;
    snitchCaught: number;
    timeInArena: Record<number, number>; // ArenaId -> Seconds
    frameCount: number; // For throttling particle effects
    isPaused: boolean;
    gameOver: boolean;
    nextBossSpawnTime: number;
    playerPosHistory?: { x: number; y: number; timestamp: number }[]; // Last 60 positions for laser prediction
    nextBossId: number; // To track waves
    rareSpawnCycle: number; // Index of rare spawn cycle
    rareSpawnActive: boolean; // Is a rare enemy currently alive?
    rareRewardActive?: boolean; // Flag to show "Increased Rarity" text on next level up
    spawnTimer: number; // For start/restart animation
    unpauseDelay?: number; // Grace period after closing menus
    hasPlayedSpawnSound?: boolean;
    bossPresence: number; // 0 to 1 smooth transition for boss effects
    critShake: number; // Screenshake intensity from crits
    smokeBlindTime?: number; // Timestamp for full-screen white fog effect
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
    lastLegionWindow?: number; // Track which 10m window last had a legion event


    // Portal / Multiverse Props
    currentArena: number; // ID of the arena the player is currently in
    portalState: 'closed' | 'warn' | 'open' | 'transferring';
    portalTimer: number; // Cycles every 4 minutes (240s)
    portalOpenDuration: number; // 10s
    transferTimer: number; // 3s delay during teleport
    nextArenaId: number | null; // Destination
    runSubmitted?: boolean;

    // Inventory System
    meteoriteDust: number; // Currency from recycling
    meteorites: Meteorite[]; // Dropped items in the world
    inventory: (Meteorite | null)[];  // Collected items (30 slots)

    // Module Menu System
    showModuleMenu: boolean;
    showStats: boolean; // Synced from React State
    showSettings: boolean; // Synced from React State
    showLegendarySelection: boolean;
    showBossSkillDetail: boolean;
    legendaryOptions: LegendaryHex[] | null;
    pendingLegendaryHex: LegendaryHex | null; // Hex waiting to be placed
    upgradingHexIndex: number | null; // For auto-upgrade animation
    upgradingHexTimer: number; // Duration of animation
    unseenMeteorites: number;
    moduleSockets: {
        hexagons: (LegendaryHex | null)[];   // 6 outer sockets
        diamonds: (Meteorite | null)[];       // 6 inner sockets
        center: PlayerClass | null; // Center slot for class
    };
    chassisDetailViewed: boolean;
    // Frame-based caches (Not persistent)
    legionLeads?: Record<string, Enemy>;
}

export type MeteoriteRarity = 'scrap' | 'anomalous' | 'quantum' | 'astral' | 'radiant' | 'void' | 'eternal' | 'divine' | 'singularity';
export type MeteoriteQuality = 'Broken' | 'Damaged' | 'New';

export interface MeteoritePerk {
    id: string;
    description: string;
    value: number;
    range: { min: number, max: number };
}

export interface Meteorite {
    id: number;
    x: number;
    y: number;
    rarity: MeteoriteRarity;
    quality: MeteoriteQuality;
    visualIndex: number; // 1-7
    vx: number;
    vy: number;
    magnetized: boolean; // Is it being pulled to player?
    isNew?: boolean; // track if player has seen this meteorite
    discoveredIn: string; // The arena where it was found
    perks: MeteoritePerk[];
    spawnedAt: number; // Timestamp for despawn logic
    stats: {
        coreSurge?: number;
        neighbor?: number;
        hex?: number;
        sameType?: number;
        hexType?: number;
    };
}
