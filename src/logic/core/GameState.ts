import type { GameState, Player, PlayerClass } from './Types';
import { ARENA_CENTERS, generateMapPOIs } from '../mission/MapLogic';
import { GAME_CONFIG } from './GameConfig';
import { PLAYER_CLASSES } from './Classes';
import { calcStat } from '../utils/MathUtils';
import { relocateTurretsToArena } from '../mission/TurretLogic';


export const createInitialPlayer = (id: string, selectedClass?: PlayerClass, startingArenaId: number = 0): Player => {
    const p: Player = {
        id,
        x: ARENA_CENTERS[startingArenaId]?.x || 0,
        y: ARENA_CENTERS[startingArenaId]?.y || 0,
        size: 10,
        speed: 6.5,
        dust: 0,
        isotopes: 0,
        hp: { base: 150, flat: 0, mult: 0, classMult: 0 },
        curHp: 150,
        dmg: { base: 60, flat: 0, mult: 0, classMult: 0 },
        atk: { base: 300, flat: 0, mult: 0, classMult: 0 },
        critChance: 0,
        critDamage: 0,
        spd: { base: 6.5, flat: 0, mult: 0, classMult: 0 },

        reg: { base: 1, flat: 0, mult: 0, classMult: 0 },
        arm: { base: 0, flat: 0, mult: 0, classMult: 0 },
        xp_per_kill: { base: 25, flat: 0, mult: 0, classMult: 0 },
        xp: { current: 0, needed: 369 },
        level: 1,
        damageDealt: 0,
        damageTaken: 0,
        damageBlocked: 0,
        damageBlockedByArmor: 0,
        damageBlockedByCollisionReduc: 0,
        damageBlockedByProjectileReduc: 0,
        damageBlockedByShield: 0,
        damageBreakdown: {},
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
        vortexStrength: 1.0,
        spawnTimer: GAME_CONFIG.PLAYER.SPAWN_DURATION,
        inventory: Array(30).fill(null),
        rerolls: 3
    };

    if (selectedClass) {


        if (selectedClass.stats.hpMult) p.hp.classMult = selectedClass.stats.hpMult * 100;
        if (selectedClass.stats.dmgMult) p.dmg.classMult = selectedClass.stats.dmgMult * 100;
        if (selectedClass.stats.atkMult) p.atk.classMult = selectedClass.stats.atkMult * 100;
        if (selectedClass.stats.xpMult) p.xp_per_kill.classMult = selectedClass.stats.xpMult * 100;
        if (selectedClass.stats.regMult) p.reg.classMult = selectedClass.stats.regMult * 100;
        if (selectedClass.stats.armMult) p.arm.classMult = selectedClass.stats.armMult * 100;
        if (selectedClass.stats.spdMult) p.spd.classMult = selectedClass.stats.spdMult * 100;


        if (selectedClass.stats.regFlat) p.reg.flat += selectedClass.stats.regFlat;


        if (selectedClass.id === 'malware') {
            p.pierce = 1;
        }
    }


    const initialMaxHp = calcStat(p.hp);
    p.curHp = initialMaxHp;

    return p;
};

import { getKeybinds } from '../utils/Keybinds';
import { SpatialGrid } from './SpatialGrid';

export const createInitialGameState = (selectedClass?: PlayerClass, startingArenaId: number = 0, tutorialEnabled: boolean = true, gameMode: 'single' | 'multiplayer' = 'single', multiplayerConfig: any = null): GameState => {
    const myId = multiplayerConfig?.myId || 'player1';
    const player = createInitialPlayer(myId, selectedClass, startingArenaId);






    if (multiplayerConfig?.active && !multiplayerConfig.isHost) {
        player.x += 500;
    }


    const players: Record<string, Player> = { [myId]: player };


    if (multiplayerConfig?.active && multiplayerConfig.peerIds) {
        multiplayerConfig.peerIds.forEach((peerId: string, index: number) => {

            if (peerId === myId) return;

            const peerClassId = multiplayerConfig.selectedClasses?.[peerId];
            const peerClass = PLAYER_CLASSES.find(c => c.id === peerClassId);

            const peerPlayer = createInitialPlayer(peerId, peerClass, startingArenaId);




            peerPlayer.x += 500 * (index + 1);

            players[peerId] = peerPlayer;
        });
    }






    const state: GameState = {
        gameMode,
        player: players[myId],
        players,
        language: 'en',
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
        allies: [],
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
        arenaLevels: { 0: 0, 1: 0, 2: 0 },
        frameCount: 0,
        isPaused: false,
        gameOver: false,
        nextBossSpawnTime: 105,
        nextBossId: 0,
        rareSpawnCycle: 0,
        rareSpawnActive: false,
        spawnTimer: GAME_CONFIG.PLAYER.SPAWN_DURATION,
        unpauseDelay: 0,
        unpauseMode: 'normal',
        flashIntensity: 0,
        hasPlayedSpawnSound: false,
        bossPresence: 0,
        critShake: 0,
        classSkillDamageHistory: [],
        currentMinuteClassSkillDamage: 0,
        lastMinuteMark: 0,
        spatialGrid: new SpatialGrid(250),
        activeEvent: null,
        nextEventCheckTime: 60,
        directorState: { necroticCycle: -1, legionCycle: -1 },
        pois: generateMapPOIs(),


        currentArena: startingArenaId,
        lastArena: startingArenaId,
        portalsUnlocked: false,
        portalState: 'closed',
        portalTimer: 240,
        portalOpenDuration: 10,
        transferTimer: 0,
        nextArenaId: null,
        portalOneTimeUse: false,


        meteorites: [],
        inventory: Array(319).fill(null),
        incubator: Array(3).fill(null),
        incubatorFuel: 0,
        incubatorFuelMax: 30,


        showModuleMenu: false,
        showStats: false,
        showSettings: false,
        showLegendarySelection: false,
        showBossSkillDetail: false,
        showAdminConsole: false,
        showCheatPanel: false,
        showFeedbackModal: false,
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


        blueprints: Array(10).fill(null),
        activeBlueprintBuffs: {},
        activeBlueprintCharges: {},
        hpRegenBuffMult: 1.0,
        dmgAtkBuffMult: 1.0,
        xpSoulBuffMult: 1.0,
        meteoriteRateBuffMult: 1.0,
        gameSpeedMult: parseFloat(typeof localStorage !== 'undefined' ? (localStorage.getItem('gameSpeedMult') || '1.2') : '1.2'),


        extractionStatus: 'none',
        extractionTimer: 0,
        extractionMessageIndex: -1,
        extractionMessageTimes: [],
        extractionDialogTime: 0,
        extractionTargetArena: 0,
        extractionPowerMult: 1.0,
        anomalyBossCount: 0,


        pendingLevelUps: 0,
        levelUpTimer: 0,
        pendingBossKills: 0,
        bossKillTimer: 0,

        tutorial: {
            currentStep: 0,
            isActive: tutorialEnabled && gameMode === 'single',
            stepTimer: 0,
            completedSteps: [],
            pressedKeys: new Set(),
            hasMoved: false,
            hasKilled: false,
            hasCollectedMeteorite: false,
            hasOpenedModules: false,
            hasOpenedStats: false
        },
        firstMeteoriteSpawned: false,
        lastPlacement: null,
        shownUpgradeIds: [],


        assistant: {
            message: null,
            emotion: 'Normal',
            queue: [],
            timer: 0,
            history: {
                upgradePicks: {},
                deaths: 0,
                totalDamageTaken: 0,
                totalSurvivalTime: 0
            }
        },
        keybinds: getKeybinds()
    };


    relocateTurretsToArena(state, startingArenaId);

    return state;
};
