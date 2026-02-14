import type { GameState, Player, PlayerClass } from './types';
import { ARENA_CENTERS, generateMapPOIs } from '../mission/MapLogic';
import { GAME_CONFIG } from './GameConfig';
import { PLAYER_CLASSES } from './classes';

export const createInitialPlayer = (id: string, selectedClass?: PlayerClass, startingArenaId: number = 0): Player => {
    const p: Player = {
        id,
        x: ARENA_CENTERS[startingArenaId]?.x || 0,
        y: ARENA_CENTERS[startingArenaId]?.y || 0,
        size: 10,
        speed: 5.3,
        dust: 0,
        hp: { base: 150, flat: 0, mult: 0 },
        curHp: 150,
        dmg: { base: 60, flat: 0, mult: 0 },
        atk: { base: 300, flat: 0, mult: 0 },
        reg: { base: 1, flat: 0, mult: 0 },
        arm: { base: 0, flat: 0, mult: 0 },
        xp_per_kill: { base: 25, flat: 0, mult: 0 },
        xp: { current: 0, needed: 250 },
        level: 1,
        damageDealt: 0,
        damageTaken: 0,
        damageBlocked: 0,
        damageBlockedByArmor: 0,
        damageBlockedByCollisionReduc: 0,
        damageBlockedByProjectileReduc: 0,
        damageBlockedByShield: 0,
        wallsHit: 0,
        upgradesCollected: [],
        lastShot: 0,
        multi: 1,
        pierce: 0,
        droneCount: 0,
        lastAngle: 0,
        targetAngle: 0,
        faceAngle: 0,
        knockback: { x: 0, y: 0 },
        activeSkills: [],
        playerClass: selectedClass?.id,
        kineticShieldTimer: 0,
        aigisRings: {},
        spawnTimer: GAME_CONFIG.PLAYER.SPAWN_DURATION
    };

    if (selectedClass) {
        // Multiplicative stats (stored as integer percentages, e.g. 25 for +25%)
        if (selectedClass.stats.hpMult) p.hp.mult += selectedClass.stats.hpMult * 100;
        if (selectedClass.stats.dmgMult) p.dmg.mult += selectedClass.stats.dmgMult * 100;
        if (selectedClass.stats.atkMult) p.atk.mult += selectedClass.stats.atkMult * 100;
        if (selectedClass.stats.xpMult) p.xp_per_kill.mult += selectedClass.stats.xpMult * 100;
        if (selectedClass.stats.regMult) p.reg.mult += selectedClass.stats.regMult * 100;
        if (selectedClass.stats.armMult) p.arm.mult += selectedClass.stats.armMult * 100;

        // Flat/Direct stats
        if (selectedClass.stats.spdMult) p.speed *= (1 + selectedClass.stats.spdMult);
        if (selectedClass.stats.regFlat) p.reg.flat += selectedClass.stats.regFlat;

        // Custom start conditions
        if (selectedClass.id === 'malware') {
            p.pierce = 1; // Malware starts with 1 pierce (hits 2 enemies)
        }
    }

    // Finalize HP using unified calcStat logic
    const baseMaxHp = p.hp.base * (1 + p.hp.mult / 100);
    if (startingArenaId === 2) {
        p.curHp = baseMaxHp * 1.2; // Match Defence Hex +20% buff
    } else {
        p.curHp = baseMaxHp;
    }

    return p;
};

import { SpatialGrid } from './SpatialGrid';

export const createInitialGameState = (selectedClass?: PlayerClass, startingArenaId: number = 0, tutorialEnabled: boolean = true, gameMode: 'single' | 'multiplayer' = 'single', multiplayerConfig: any = null): GameState => {
    const myId = multiplayerConfig?.myId || 'player1';
    const player = createInitialPlayer(myId, selectedClass, startingArenaId);

    // Multiplayer Spawn Separation:
    // If we are a guest (implied by having peerIds or not being host, but simpler: check index in peer list?)
    // Actually, createInitialGameState runs on EACH client for their OWN player initially.
    // Host will then sync everyone.
    // BUT, to avoid overlap before sync, let's offset based on whether we are host or not.
    if (multiplayerConfig?.active && !multiplayerConfig.isHost) {
        player.x += 500; // Guest spawns 500px to the right
    }

    // In multiplayer, players map includes me. In single, it's just me.
    const players: Record<string, Player> = { [myId]: player };

    // Initialize Peers (if we are Host or even Guest knowing about them)
    if (multiplayerConfig?.active && multiplayerConfig.peerIds) {
        multiplayerConfig.peerIds.forEach((peerId: string, index: number) => {
            // Avoid duplicating self if peerIds includes me (it shouldn't usually, but safety first)
            if (peerId === myId) return;

            const peerClassId = multiplayerConfig.selectedClasses?.[peerId];
            const peerClass = PLAYER_CLASSES.find(c => c.id === peerClassId);

            const peerPlayer = createInitialPlayer(peerId, peerClass, startingArenaId);

            // Offset logic for peers
            // Player 1 (Host) @ 0
            // Player 2 @ +500
            peerPlayer.x += 500 * (index + 1);

            players[peerId] = peerPlayer;
        });
    }

    // Apply classes if we can resolve them? 
    // For this immediate fix, we rely on the fact that `selectedClass` arg was for ME.
    // We really should look up peer classes.
    // Let's trust that the visual syncing happens or we add a TODO to fix peer stats.

    return {
        gameMode,
        player, // Keep local player ref for convenience
        players,
        multiplayer: {
            active: gameMode === 'multiplayer',
            isHost: multiplayerConfig?.isHost || false,
            myId,
            peerIds: multiplayerConfig?.peerIds || []
        },
        readyStatus: {},
        sharedXp: 0,

        enemies: [],
        bullets: [],
        enemyBullets: [],
        floatingNumbers: [],
        drones: [],
        particles: [],
        areaEffects: [],
        camera: {
            x: ARENA_CENTERS[startingArenaId]?.x || 0,
            y: ARENA_CENTERS[startingArenaId]?.y || 0
        },
        score: 0,
        killCount: 0,
        rawKillCount: 0,
        bossKills: 0,
        gameTime: 0,
        meteoritesPickedUp: 0,
        portalsUsed: 0,
        snitchCaught: 0,
        timeInArena: { 0: 0, 1: 0, 2: 0 },
        arenaLevels: { 0: 0, 1: 0, 2: 0 }, // Initialize levels
        frameCount: 0,
        isPaused: false,
        gameOver: false,
        nextBossSpawnTime: 120, // 2 minutes
        nextBossId: 0,
        rareSpawnCycle: 0,
        rareSpawnActive: false,
        spawnTimer: GAME_CONFIG.PLAYER.SPAWN_DURATION,
        unpauseDelay: 0,
        hasPlayedSpawnSound: false,
        bossPresence: 0,
        critShake: 0,
        spatialGrid: new SpatialGrid(250), // 250px cells
        activeEvent: null,
        nextEventCheckTime: 60, // First check at 1 minute
        directorState: { necroticCycle: -1, legionCycle: -1 },
        pois: generateMapPOIs(),

        // Portal / Arena Defaults
        currentArena: startingArenaId,
        lastArena: startingArenaId,
        portalsUnlocked: false, // Default to locked
        portalState: 'closed',
        portalTimer: 240, // 240s = 4 minutes (Cycle)
        portalOpenDuration: 10, // 10 seconds open
        transferTimer: 0,
        nextArenaId: null,
        portalOneTimeUse: false,

        // Inventory Defaults
        meteorites: [],
        inventory: Array(320).fill(null), // 320 slots (10 reserved + 310 storage)

        // Module Menu Defaults
        showModuleMenu: false,
        showStats: false,
        showSettings: false,
        showLegendarySelection: false,
        showBossSkillDetail: false,
        legendaryOptions: null,
        pendingLegendaryHex: null,
        upgradingHexIndex: null,
        upgradingHexTimer: 0,
        unseenMeteorites: 0,
        moduleSockets: {
            hexagons: Array(6).fill(null),
            diamonds: Array(12).fill(null),
            center: selectedClass || null
        },
        chassisDetailViewed: false,
        legionLeads: {},
        playerName: '',

        // Blueprint System Defaults
        blueprints: Array(10).fill(null),
        activeBlueprintBuffs: {},
        activeBlueprintCharges: {},
        hpRegenBuffMult: 1.0,
        dmgAtkBuffMult: 1.0,
        xpSoulBuffMult: 1.0,

        // Extraction System
        extractionStatus: 'none',
        extractionTimer: 0,
        extractionMessageIndex: -1,
        extractionMessageTimes: [],
        extractionDialogTime: 0,
        extractionTargetArena: 0,
        extractionPowerMult: 1.0,

        // UI Delays
        pendingLevelUps: 0,
        levelUpTimer: 0,
        pendingBossKills: 0,
        bossKillTimer: 0,

        tutorial: {
            currentStep: 0, // TutorialStep.MOVEMENT (Avoiding circular dependency if enum not imported, but it is valid TS to use enum if imported or just 0)
            isActive: tutorialEnabled && gameMode === 'single', // Disable tutorial in multiplayer
            stepTimer: 0,
            completedSteps: [],
            pressedKeys: new Set(),
            hasMoved: false,
            hasKilled: false,
            hasCollectedMeteorite: false,
            hasOpenedModules: false,
            hasOpenedStats: false
        },
        firstMeteoriteSpawned: false
    };
};
