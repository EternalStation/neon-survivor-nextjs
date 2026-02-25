import { Language } from './LanguageContext';

export const UI_TRANSLATIONS = {
    en: {
        // Main Menu
        mainMenu: {
            enterVoid: 'ENTER VOID',
            multiplayerVoid: 'MULTIPLAYER VOID',
            leaderboard: 'LEADERBOARD',
            settings: 'SETTINGS',
            database: 'DATABASE',
            disconnect: 'DISCONNECT',
            pilotName: 'PILOT NAME',
            archiveTitle: 'VOID NEXUS - ARCHIVE',
            close: 'CLOSE [ESC]',
            ver: 'VER:'
        },
        // Settings Menu
        settings: {
            systemPaused: 'SYSTEM PAUSED',
            systemSettings: 'SYSTEM SETTINGS',
            audio: 'AUDIO',
            controls: 'CONTROLS',
            language: 'LANGUAGE',
            musicAmplitude: 'MUSIC AMPLITUDE',
            sfxAmplitude: 'SFX AMPLITUDE',
            displayLanguage: 'DISPLAY LANGUAGE',
            orbitAssistantLanguage: 'ORBIT ASSISTANT LANGUAGE',
            languageNote: 'ℹ️ LANGUAGE AFFECTS ORBIT ASSISTANT DIALOGUE.\nCHANGES TAKE EFFECT ON THE NEXT ORBIT MESSAGE.',
            resumeMission: 'RESUME MISSION',
            backToMenu: 'BACK TO MENU',
            initiateRestart: 'INITIATE RESTART',
            abortToMenu: 'ABORT TO MENU',

            // Keybinds Content
            keybinds: {
                title: 'CONTROLS',
                movement: 'MOVEMENT',
                skills: 'SKILLS',
                system: 'SYSTEM',
                statsMenu: 'Stats Menu',
                matrixModule: 'Matrix Module',
                activatePortal: 'Activate Portal',
                skill1: 'Skill 1',
                skill2: 'Skill 2',
                skill3: 'Skill 3',
                skill4: 'Skill 4',
                skill5: 'Skill 5',
                skill6: 'Skill 6',
                keyAssigned: '⚠ KEY ALREADY ASSIGNED'
            }
        },
        // HUD
        hud: {
            ghostHorde: 'GHOST HORDE',
            legionIncoming: 'LEGION INCOMING',
            xp: 'XP',
            extractionPointIdentified: 'EXTRACTION POINT IDENTIFIED',
            unknown: 'UNKNOWN',
            coord: 'COORD',
            exactCoordPending: 'Exact coordinates: pending...',

            // TopLeftPanel
            lvl: 'LVL',
            evacuationRage: 'EVACUATION RAGE',
            hostiles: 'HOSTILES',
            ecoArena: 'Economic Arena',
            ecoBuff1: 'XP & Soul Yield',
            ecoBuff2: '+30% Meteorite rate',
            comArena: 'Combat Arena',
            comBuff: 'DMG & Atk Spd',
            defArena: 'Defence Arena',
            defBuff: 'Max HP & Regen',
            meteorShowerSuffix: 'Meteorite drop increased by 50%',
            stasisFieldSuffix: '-20% Enemy Speed',
            arenaSurgeSuffix: 'Arena modifiers increased by 100%',
            perkResonanceSuffix: '+2% for each perk on found meteorites',
            neuralOverclockSuffix: 'Cooldown reduced by 30%',
            temporalGuardSuffix: 'Block lethal hit',
            matrixOverdriveSuffix: 'Socketed meteorites efficiency +15%',
            quantumScrapperBuff: '25% chance to double dust on recycle',
            overclockTitle: 'OVERCLOCK',
            overclockBuff: 'XP +100% | SPAWN +100%',
            penalty: 'PENALTY',
            strengthPenalty: 'STRENGTH',
            wallImpact: 'WALL IMPACT',
            wallDamageTaken: '3x WALL DAMAGE TAKEN',
            decryption: 'DECRYPTION:',
            engineDisabled: 'ENGINE DISABLED',

            // BottomRightPanel
            active: 'ACTIVE',
            blocked: 'BLOCKED',
            locked: 'LOCKED',
            dust: 'DUST',
            full: 'FULL',

            // AlertPanel
            anomalyDetected: 'ANOMALY DETECTED:',
            intruderAlert: 'INTRUDER ALERT',
            searchSurroundings: 'SEARCH SURROUNDINGS',
            riftOpening: 'DIMENSIONAL RIFT OPENING',
            tMinus: 'T-MINUS',
            portalClosing: 'PORTAL CLOSING',
            portalActive: 'PORTAL ACTIVE',
            closingIn: 'CLOSING IN',
            portalsBlocked: 'PORTALS BLOCKED BY WORMS',
            bossWord: 'ANOMALY',
            bossLvl: 'LVL',
            bossHp: 'HP',
            bossStage: 'STAGE',
            bossDismiss: '[ DISMISS ]',
            bossResumePrompt: 'PRESS ESC OR CLICK ANYWHERE TO RESUME',

            // UpgradeMenu
            voidTechDetected: 'VOID TECHNOLOGY DETECTED',
            selectSystemUpgrade: 'SELECT SYSTEM UPGRADE',
            rerollUpgrades: 'REROLL UPGRADES',
            anomalyTerminated: 'ANOMALY TERMINATED: RARITY CHANCE INCREASED',
            orbitAssistant: 'ORBIT ASSISTANT',
            feedback: 'FEEDBACK',
            channeling: 'CHANNELING',
            skill: 'SKILL',
            neuralOverclockActive: 'Neural Overclock Active',
            orbitSpeaking: 'ORBIT',
            pressSpaceToContinue: 'PRESS [SPACE] TO CONTINUE'
        },
        bosses: {
            names: {
                square: 'THE FORTRESS',
                circle: 'THE JUGGERNAUT',
                triangle: 'THE BLADE',
                diamond: 'THE MARKSMAN',
                pentagon: 'THE OVERMIND'
            },
            skills: {
                thorns: { name: 'THORNS', desc: 'Hardened shell reflects 3% of incoming damage back to the player. Reduced by Armor.' },
                soulLink: { name: 'SOUL LINK', desc: 'Links minions to the hive mind. Contact with linked targets deals 30% HP damage but destroys the target and damages the Boss. Shared HP pool.' },
                berserkRush: { name: 'BERSERK RUSH', desc: 'Initiates a high-velocity dash towards the player, dealing 30% Max HP damage on impact.' },
                bladeSpin: { name: 'BLADE SPIN', desc: 'Spins violently during dash phases, increasing movement speed and generating a jagged yellow aura.' },
                hyperBeam: { name: 'HYPER BEAM', desc: 'Fires a high-intensity laser burst. LVL 1 is reduced by Armor. LVL 2 PIERCES ALL ARMOR.' },
                orbitalPlating: { name: 'ORBITAL PLATING', desc: 'Deploys 3 localized shield generators that grant invulnerability. Shields must be destroyed to damage the boss. Regenerates every 15s.' },
                parasiticLink: { name: 'PARASITIC LINK', desc: ' Tethers to the player if close, draining 3% Max HP per second to heal the boss. moved > 800px away to break.' },
                cyclonePull: { name: 'CYCLONE PULL', desc: 'Generates a massive vacuum that pulls the player and projectiles towards the boss. 10s Cooldown.' },
                deflectionField: { name: 'DEFLECTION FIELD', desc: 'While spinning, deflects 50% of incoming projectiles in random directions.' },
                satelliteStrike: { name: 'SATELLITE STRIKE', desc: 'Marks 3 zones around the player and strikes them with orbital beams after a short delay. Deals 3% Boss HP damage.' },
                titanPlating: { name: 'TITAN PLATING', desc: 'Reinforced spikes reflect 5% of incoming damage back to the player. REPEL DAMAGE IGNORES ALL ARMOR.' },
                soulDevourer: { name: 'SOUL DEVOURER', desc: 'Freezes in place to "Suck" your souls. Impact scales from 0 to 50% suppression over 5 seconds while boss is invincible. Stolen power only returns when the boss is destroyed.' },
                mortalityCurse: { name: 'MORTALITY CURSE', desc: 'Extinguishes the spark of life. DISABLES ALL REGENERATION AND LIFESTEAL globally while the boss is alive.' },
                convergenceZone: { name: 'CONVERGENCE ZONE', desc: 'Fires dual sweeping lasers that close in from 45 degrees. Stay in the center to survive.' },
                hivemindPhalanx: { name: 'HIVEMIND PHALANX', desc: 'Tactical Command: Summons a wall of invincible drones to sweep the arena. Blast the drones to transfer damage back to the Boss.' },
                crystalFence: { name: 'CRYSTAL FENCE', desc: 'Places 5 resonance crystals around the player that form a deadly electric fence. Touching the fence deals 1% Boss HP damage every 5 frames.' }
            }
        },
        classSelection: {
            selectClass: 'SELECT CLASS',
            enableTutorialHints: 'ENABLE TUTORIAL HINTS',
            coreCapability: 'CORE CAPABILITY',
            pierce: 'PIERCE',
            reading1: "Oh. You're still here. Reading, presumably. Either that or the loading screen scarred you emotionally. Both are valid.",
            reading2: "Sixty seconds on a class selection screen. Impressive. Most pilots just pick whatever looks shiny and die in the first thirty seconds.",
            reading3: "Still deciding? The enemies are spawning in real time, you know. Hypothetically. But also sort of literally.",
            reading4: "You've read all the descriptions, haven't you. You might be the first pilot in recorded history to do so. I'm noting this in your file.",
            reading5: "A minute of deliberation. You know, most pilots die before they even understand what their class does. You're already ahead. Depressingly low bar, but still.",
            classes: {
                malware: {
                    name: "Malware",
                    title: "THE GLITCHED SOVEREIGN",
                    capabilityName: "QUANTUM FRAGMENTATION",
                    capabilityDesc: "Manual Targeting. Projectiles have 150% of default range, +1 Piercing, and ricochet off all surfaces infinitely. Each bounce gains 20% Damage and 5% Speed.",
                    characteristics: [
                        'Manual Targeting System',
                        'Quantum Ricochet Rounds'
                    ],
                    metrics: [
                        { label: 'RANGE', description: 'Base projectile range multiplier' },
                        { label: 'DMG/WALL', description: 'Damage gain per bounce' },
                        { label: 'SPD/WALL', description: 'Speed gain per bounce' }
                    ]
                },
                eventhorizon: {
                    name: "Void",
                    title: "THE VOID WEAVER",
                    capabilityName: "Void Singularity",
                    capabilityDesc: "Spawns a 400px void for 3s with 10s CD. Slowly absorbs enemies in the center. Elites take 25% and Bosses take 10% Max HP per second.",
                    characteristics: [
                        'Crowd control specialist',
                        'Heavy defensive plating',
                        'AoE vacuum effect on hit'
                    ],
                    metrics: [
                        { label: 'Singularity Radius', description: 'Static radius' },
                        { label: 'Pull Strength', description: 'Base pull force' },
                        { label: 'Duration', description: 'Static duration' },
                        { label: 'Elite DMG', description: 'Max HP per second' },
                        { label: 'Boss DMG', description: 'Max HP per second' }
                    ]
                },
                stormstrike: {
                    name: "Ray",
                    title: "THE THUNDER ENGINE",
                    capabilityName: "Orbital Strike",
                    capabilityDesc: "Every 8 seconds, a massive vertical laser beam strikes a random enemy, dealing 150% AOE damage in a 100px radius.",
                    characteristics: [
                        'Slow-firing heavy ordnance',
                        'Massive AOE orbital strikes'
                    ],
                    metrics: [
                        { label: 'Frequency', description: 'Static cooldown (Every 8s)' },
                        { label: 'Strike DMG', description: 'Damage multiplier' },
                        { label: 'AOE', description: 'Strike radius' }
                    ]
                },
                aigis: {
                    name: "Vortex",
                    title: "THE GOLDEN BASTION",
                    capabilityName: "Magnetic Vortex",
                    capabilityDesc: "Projectiles orbit the player in a ring until they hit an enemy. Chance to create up to 4 orbits.",
                    characteristics: [
                        'Short-range defensive perimeter',
                        'Delay-based burst patterns',
                        'Enhanced vitality systems'
                    ],
                    metrics: [
                        { label: 'Ring II', description: 'Chance for 2nd Layer' },
                        { label: 'Ring III', description: 'Chance for 3rd Layer' },
                        { label: 'Ring IV', description: 'Chance for 4th Layer' }
                    ]
                },
                hivemother: {
                    name: "Hive-Mother",
                    title: "THE SWARM OVERLORD",
                    capabilityName: "Nanite Swarm",
                    capabilityDesc: "On hit, bullets dissolve into nanites that deal continuous damage until death. On death, the nanite jumps to the next host within 400px.",
                    characteristics: [
                        'Damage-over-time specialist',
                        'Organic growth scaling',
                        'Viral spread mechanics'
                    ],
                    metrics: [
                        { label: 'Infection Rate', description: '' },
                        { label: 'Swarm DMG / sec', description: '' },
                        { label: 'Jump Range', description: 'Static jump distance' }
                    ]
                }
            }
        },
        chassisDetail: {
            primaryAugmentation: 'PRIMARY AUGMENTATION',
            tacticalCharacteristics: 'TACTICAL CHARACTERISTICS',
            resonanceSynergy: 'RESONANCE SYNERGY',
            totalOctaveResonance: 'TOTAL OCTAVE RESONANCE',
            performanceMetrics: 'PERFORMANCE METRICS',
            baseModifiers: 'BASE MODIFIERS',
            static: 'STATIC:',
            stats: {
                maxHp: 'MAX HP',
                hpRegen: 'HP REGEN',
                damage: 'DAMAGE',
                attackSpeed: 'ATTACK SPEED',
                armor: 'ARMOR',
                expGain: 'EXP GAIN',
                moveSpeed: 'MOVE SPEED',
                vision: 'VISION',
                luck: 'LUCK',
                magnet: 'MAGNET',
                wallDmg: 'WALL DMG',
                pierce: 'PIERCE',
                killCount: 'TOTAL KILLS',
                timeSurvived: 'TIME'
            }
        },
        upgradeTypes: {
            dmg_f: 'Damage',
            dmg_m: 'Damage Multiplier',
            atk_s: 'Attack Speed',
            hp_f: 'Max Health',
            hp_m: 'Health Multiplier',
            reg_f: 'Health Regen',
            reg_m: 'Regen Multiplier',
            xp_f: 'Exp Per Kill',
            xp_m: 'Exp Multiplier',
            arm_f: 'Armor',
            arm_m: 'Armor Multiplier',
            unknown: 'UNKNOWN'
        },
        upgradeRarities: {
            scrap: 'SCRAP',
            anomalous: 'ANOMALOUS',
            quantum: 'QUANTUM',
            astral: 'ASTRAL',
            radiant: 'RADIANT',
            abyss: 'ABYSS',
            eternal: 'ETERNAL',
            divine: 'DIVINE',
            singularity: 'SINGULARITY'
        },
        meteorites: {
            rarities: {
                anomalous: 'ANOMALOUS METEORITE',
                radiant: 'RADIANT STAR',
                void: 'VOID CATALYST',
                abyss: 'VOID CATALYST',
                eternal: 'ETERNAL CORE',
                divine: 'DIVINE ESSENCE',
                singularity: 'SINGULARITY POINT'
            },
            stats: {
                activePower: 'ACTIVE POWER:',
                unplaced: '(UNPLACED)',
                corruptedEject: 'CORRUPTED [EJECT: 3X DUST]',
                augmentationProtocols: 'Augmentation Protocols',
                typeLabel: 'TYPE:',
                new: 'NEW',
                broken: 'BROKEN',
                damaged: 'DAMAGED',
                corrupted: 'CORRUPTED',
                foundInLabel: 'FOUND IN:',
                economicArena: 'Economic Arena',
                combatArena: 'Combat Arena',
                defenceArena: 'Defence Arena',
                sector01: 'Sector-01',
                sector02: 'Sector-02',
                sector03: 'Sector-03',
                incubLabel: 'INCUB:',
                harmV: 'HARM-V',
                coreX: 'CORE-X'
            },
            perkNames: {
                lvl1: '1st Perk',
                lvl2: '2nd Perk',
                lvl3: '3rd Perk',
                lvl4: '4th Perk',
                lvl5: '5th Perk',
                lvl6: '6th Perk'
            }
        },
        statsMenu: {
            tabs: {
                system: 'SYSTEM',
                threat: 'THREAT'
            },
            headers: {
                system: 'SYSTEM DIAGNOSTICS',
                threat: 'THREAT PROGRESSION'
            },
            labels: {
                health: 'Health',
                regeneration: 'Regeneration',
                damage: 'Damage',
                attackSpeed: 'Attack Speed',
                armor: 'Armor',
                movementSpeed: 'Movement Speed',
                cooldownReduction: 'Cooldown Reduction',
                collisionReduction: 'Collision Reduction',
                projectileReduction: 'Projectile Reduction',
                lifesteal: 'Lifesteal',
                xpGain: 'XP Gain per kill',
                meteoriteChance: 'Meteorite Drop Chance',
                pierce: 'Pierce'
            },
            threat: {
                hpGrowth: 'Enemy Health Growth',
                spawnRateGrowth: 'Enemy Spawn Rate Growth',
                currentHp: 'CURRENT HP',
                unitsSec: 'UNITS / SEC',
                analysis: 'Real-time Threat Analysis',
                nextBossHp: 'Next Boss Health',
                collisionDmg: 'Collision Damage'
            },
            radar: {
                dps: 'DPS',
                arm: 'ARM',
                exp: 'EXP',
                hp: 'HP',
                reg: 'REG'
            },
            footer: 'PRESS [{key}] TO CLOSE'
        },
        recalibrate: {
            enhancementStation: 'ENHANCEMENT STATION',
            systemReady: 'SYSTEM READY // LOADED UNIT:',
            eject: 'EJECT',
            repair: 'REPAIR',
            integrityMax: 'INTEGRITY MAX',
            hardwareArray: 'HARDWARE ARRAY',
            autoLockActive: 'AUTO-LOCK ACTIVE',
            stopAutoRoll: 'STOP AUTO-ROLL',
            autoReroll: 'AUTO-REROLL',
            rerollPerks: 'REROLL PERKS',
            rerollRange: 'REROLL RANGE',
            seeksFilter: 'SEEKS FILTER',
            costPlus50: 'COST +50%',
            corruptedUnit: 'CORRUPTED UNIT',
            integrityStatus: 'INTEGRITY STATUS',
            version: 'V',
            incubLabel: 'INCUB:',
            incubCostNote: '1% = +1 Reroll Cost',
            roll: 'ROLL',
            unit: 'UNIT',
            moduleTitle: 'RECALIBRATION MODULE',
            all: 'All',
            sectors: {
                s1: 'Sector-01',
                s2: 'Sector-02',
                s3: 'Sector-03'
            },
            arenas: {
                eco: 'Eco Arena',
                com: 'Combat Arena',
                def: 'Defence Arena'
            },
            legendary: {
                eco: 'Eco Legendary',
                com: 'Com Legendary',
                def: 'Def Legendary'
            },
            qualities: {
                bro: 'Broken',
                dam: 'Damaged',
                new: 'New',
                cor: 'Corrupted'
            },
            combos: {
                eco_eco: 'Eco-Eco',
                eco_com: 'Eco-Com',
                eco_def: 'Eco-Def',
                com_com: 'Com-Com',
                com_def: 'Com-Def',
                def_def: 'Def-Def'
            },
            filterLabels: {
                sector: 'SECTOR',
                connected: 'CONNECTED',
                neighbor: 'NEIGHBOR',
                foundIn: 'FOUND IN',
                pair: 'PAIR'
            }
        },
        units: {
            hp: 'HP',
            dmg: 'DMG',
            reg: 'REG',
            arm: 'ARM',
            xp: 'XP',
            atk: 'ATK',
            sps: 'S/S'
        },
        incubator: {
            title: 'INCUBATOR',
            growth: 'GROWTH',
            fuel: 'FUEL',
            inst: 'INST',
            instability: 'INSTABILITY',
            boost: 'BOOST',
            empty: 'EMPTY',
            ruined: 'RUINED',
            offline: 'OFFLINE: NO FUEL',
            loadFuel: 'LOAD',
            notEnoughFuel: 'NOT ENOUGH VOID FLUX',
            notEnoughDust: 'NOT ENOUGH DUST',
            criticalFailure: 'CRITICAL FAILURE',
            destructed: 'DESTRUCTED',
            stable: 'STABLE',
            warning: 'WARNING',
            critical: 'CRITICAL'
        },
        activation: {
            title: 'ACTIVATION SEQUENCE',
            dustRequired: 'DUST REQUIRED',
            waitingSignal: 'WAITING SIGNAL REQUIRED FOR EVACUATION',
            extract: 'EXTRACT',
            initProtocol: 'INITIATING PROTOCOL',
            deployed: 'DEPLOYED',
            encrypted: 'ENCRYPTED',
            alreadyActive: 'ALREADY ACTIVE',
            close: 'CLOSE',
            deploy: 'DEPLOY'
        },
        matrix: {
            safeSlots: 'SAFE SLOTS',
            safeSlotsSub: '(PROTECTED FROM BULK RECYCLING)',
            storage: 'STORAGE',
            storageSlots: '(300 SLOTS)',
            recycle: 'RECYCLE',
            selected: 'SELECTED',
            ghosts: 'GHOSTS',
            filterType: 'TYPE',
            filterRarity: 'RARITY',
            filterFoundIn: 'FOUND IN',
            filterThreshold: 'THRESHOLD',
            filterSector: 'SECTOR',
            filterConnected: 'CONNECTED',
            filterNeighbor: 'NEIGHBOR',
            filterArena: 'ARENA',
            filterPair: 'PAIR',
            bpDecrypting: 'DECRYPTING',
            bpReady: 'READY',
            bpEncrypted: 'ENCRYPTED',
            bpActive: 'ACTIVE',
            bpBroken: 'BROKEN',
            dust: 'DUST',
            flux: 'VOID FLUX',
            fluxSub: 'REROLL CURRENCY',
            sector01: 'SECTOR 01',
            sector02: 'SECTOR 02',
            sector03: 'SECTOR 03',
            ecoArena: 'Economic Arena',
            comArena: 'Combat Arena',
            defArena: 'Defence Arena',
            ecoLeg: 'Eco Legendary Hex',
            comLeg: 'Com Legendary Hex',
            defLeg: 'Def Legendary Hex',
            all: 'ALL',
            sel: 'SEL',
            title: 'MODULE MATRIX',
            synergyText: 'CONSTRUCT SYNERGIES BY SLOTTING METEORITES AND RECOVERED LEGENDARY HEXES',
            perk1: '1ST PERK',
            perk2: '2ND PERK',
            perk3: '3RD PERK',
            perk4: '4TH PERK',
            perk5: '5TH PERK',
            perk6: '6TH PERK',
            comboEcoEco: 'Eco-Eco',
            comboEcoCom: 'Eco-Com',
            comboEcoDef: 'Eco-Def',
            comboComCom: 'Com-Com',
            comboComDef: 'Com-Def',
            comboDefDef: 'Def-Def',
            evacuationGoal: '{amount} / 10,000 DUST',
            initiateEvacuation: 'INITIATE EVACUATION',
            arrivalIn: 'ARRIVAL IN',
            secureLZ: 'SECURE THE LZ',
            shipLanded: 'SHIP LANDED',
            goTo: 'GO TO',
            landingZone: 'LANDING ZONE',
            departing: 'DEPARTING...',
            waitingSignalShort: 'WAITING SIGNAL',
            viewBestiary: 'VIEW BESTIARY ►',
            backToMatrix: '◄ BACK TO MATRIX'
        },
        render: {
            ritual: 'RITUAL',
            syncing: 'ACTIVATING',
            synchronization: 'SYNCHRONIZATION',
            activating: 'ACTIVATING',
            recharging: 'RECHARGING',
            active: 'ACTIVE',
            level: 'LVL',
            repair: 'REPAIR',
            dust: 'DUST',
            overheat: 'OVERHEAT',
            dormant: 'DORMANT',
            sec: 's'
        }
    },
    ru: {
        // Main Menu
        mainMenu: {
            enterVoid: 'ВОЙТИ В ПУСТОТУ',
            multiplayerVoid: 'ОНЛАЙН ПУСТОТА',
            leaderboard: 'РЕЙТИНГ',
            settings: 'НАСТРОЙКИ',
            database: 'БАЗА ДАННЫХ',
            disconnect: 'ОТКЛЮЧИТЬСЯ',
            pilotName: 'ИМЯ ПИЛОТА',
            archiveTitle: 'VOID NEXUS - АРХИВ',
            close: 'ЗАКРЫТЬ [ESC]',
            ver: 'ВЕР:'
        },
        // Settings Menu
        settings: {
            systemPaused: 'СИСТЕМА ПРИОСТАНОВЛЕНА',
            systemSettings: 'СИСТЕМНЫЕ НАСТРОЙКИ',
            audio: 'АУДИО',
            controls: 'УПРАВЛЕНИЕ',
            language: 'ЯЗЫК',
            musicAmplitude: 'ГРОМКОСТЬ МУЗЫКИ',
            sfxAmplitude: 'ГРОМКОСТЬ ЭФФЕКТОВ',
            displayLanguage: 'ЯЗЫК ИНТЕРФЕЙСА',
            orbitAssistantLanguage: 'ЯЗЫК АССИСТЕНТА ORBIT',
            languageNote: 'ℹ️ ЯЗЫК ВЛИЯЕТ НА ДИАЛОГИ АССИСТЕНТА ORBIT.\nИЗМЕНЕНИЯ ВСТУПЯТ В СИЛУ ПРИ СЛЕДУЮЩЕМ СООБЩЕНИИ.',
            resumeMission: 'ПРОДОЛЖИТЬ МИССИЮ',
            backToMenu: 'В ГЛАВНОЕ МЕНЮ',
            initiateRestart: 'НАЧАТЬ ЗАНОВО',
            abortToMenu: 'ПРЕРВАТЬ МИССИЮ',

            // Keybinds Content
            keybinds: {
                title: 'УПРАВЛЕНИЕ',
                movement: 'ДВИЖЕНИЕ',
                skills: 'НАВЫКИ',
                system: 'СИСТЕМА',
                statsMenu: 'Меню Характеристик',
                matrixModule: 'Модуль Матрицы',
                activatePortal: 'Активировать Портал',
                skill1: 'Навык 1',
                skill2: 'Навык 2',
                skill3: 'Навык 3',
                skill4: 'Навык 4',
                skill5: 'Навык 5',
                skill6: 'Навык 6',
                keyAssigned: '⚠ КЛАВИША УЖЕ НАЗНАЧЕНА'
            }
        },
        // HUD
        hud: {
            ghostHorde: 'ОРДА ПРИЗРАКОВ',
            legionIncoming: 'ПРИБЛИЖЕНИЕ ЛЕГИОНА',
            xp: 'ОПЫТ',
            extractionPointIdentified: 'КООРДИНАТЫ ЭВАКУАЦИИ ПОЛУЧЕНЫ',
            unknown: 'НЕИЗВЕСТНО',
            coord: 'КООРД',
            exactCoordPending: 'Точные координаты: вычисляются...',

            // TopLeftPanel
            lvl: 'УР',
            evacuationRage: 'ЯРОСТЬ ЭВАКУАЦИИ',
            hostiles: 'ВРАГИ',
            ecoArena: 'Экономическая Арена',
            ecoBuff1: 'Опыт и Души',
            ecoBuff2: '+30% шанс на Метеорит',
            comArena: 'Боевая Арена',
            comBuff: 'Урон и Скор. Атаки',
            defArena: 'Защитная Арена',
            defBuff: 'Здоровье и Реген',
            meteorShowerSuffix: 'Шанс метеорита увеличен на 50%',
            stasisFieldSuffix: '-20% к скорости врагов',
            arenaSurgeSuffix: 'Модификаторы арен усилены на 100%',
            perkResonanceSuffix: '+2% за каждый перк на найденных метеоритах',
            neuralOverclockSuffix: 'Перезарядка уменьшена на 30%',
            temporalGuardSuffix: 'Блокирует смертельный удар',
            matrixOverdriveSuffix: 'Эффективность вставленных метеоритов +15%',
            quantumScrapperBuff: '25% шанс удвоить пыль при переработке',
            overclockTitle: 'РАЗГОН',
            overclockBuff: 'ОПЫТ +100% | ВРАГИ +100%',
            penalty: 'ШТРАФ',
            strengthPenalty: 'К СИЛЕ',
            wallImpact: 'СТОЛКНОВЕНИЕ СО СТЕНОЙ',
            wallDamageTaken: 'УРОН ОТ СТЕН Х3',
            decryption: 'ДЕШИФРОВКА:',
            engineDisabled: 'ДВИГАТЕЛЬ ОТКЛЮЧЁН',

            // BottomRightPanel
            active: 'АКТИВЕН',
            blocked: 'ЗАБЛОКИРОВАН',
            locked: 'ЗАКРЫТ',
            dust: 'ПЫЛЬ',
            full: 'ПОЛОН',

            // AlertPanel
            anomalyDetected: 'АНОМАЛИЯ:',
            intruderAlert: 'ВТОРЖЕНИЕ В СЕКТОР',
            searchSurroundings: 'ОСМОТРИТЕСЬ ВОКРУГ',
            riftOpening: 'ОТКРЫТИЕ РАЗЛОМА',
            tMinus: 'Т-МИНУС',
            portalClosing: 'ПОРТАЛ ЗАКРЫВАЕТСЯ',
            portalActive: 'ПОРТАЛ АКТИВЕН',
            closingIn: 'ЗАКРЫТИЕ ЧЕРЕЗ',
            portalsBlocked: 'ПОРТАЛЫ ЗАБЛОКИРОВАНЫ ЧЕРВЯМИ',
            bossWord: 'АНОМАЛИЯ',
            bossLvl: 'УР',
            bossHp: 'ЗДОРОВЬЕ',
            bossStage: 'СТАДИЯ',
            bossDismiss: '[ ЗАКРЫТЬ ]',
            bossResumePrompt: 'НАЖМИТЕ ESC ИЛИ КЛИКНИТЕ В ЛЮБОМ МЕСТЕ ДЛЯ ПРОДОЛЖЕНИЯ',

            // UpgradeMenu
            voidTechDetected: 'ОБНАРУЖЕНА ТЕХНОЛОГИЯ БЕЗДНЫ',
            selectSystemUpgrade: 'ВЫБЕРИТЕ УЛУЧШЕНИЕ СИСТЕМЫ',
            rerollUpgrades: 'СМЕНИТЬ УЛУЧШЕНИЯ',
            anomalyTerminated: 'АНОМАЛИЯ УСТРАНЕНА: ШАНС РЕДКОСТИ УВЕЛИЧЕН',
            orbitAssistant: 'АССИСТЕНТ ORBIT',
            feedback: 'ОТЗЫВ',
            orbitSpeaking: 'ORBIT',
            pressSpaceToContinue: 'НАЖМИТЕ [ПРОБЕЛ] ДЛЯ ПРОДОЛЖЕНИЯ',

            // PlayerStatus
            channeling: 'ПРИМЕНЕНИЕ',
            skill: 'НАВЫК',
            neuralOverclockActive: 'Нейронный Разгон Активен'
        },
        bosses: {
            names: {
                square: 'КРЕПОСТЬ',
                circle: 'ДЖАГГЕРНАУТ',
                triangle: 'КЛИНОК',
                diamond: 'СТРЕЛОК',
                pentagon: 'ВЕРХОВНЫЙ РАЗУМ'
            },
            skills: {
                thorns: { name: 'ШИПЫ', desc: 'Закаленный панцирь отражает 3% входящего урона обратно игроку. Снижается броней.' },
                soulLink: { name: 'СВЯЗЬ ДУШ', desc: 'Связывает миньонов с общим разумом. Контакт с целями наносит 30% урона здоровью, но уничтожает цель и ранит босса.' },
                berserkRush: { name: 'БЕШЕНЫЙ РЫВОК', desc: 'Стремительный рывок к игроку, нанося 30% урона от макс. здоровья при ударе.' },
                bladeSpin: { name: 'ВИХРЬ КЛИНКОВ', desc: 'Яростное вращение во время рывка, повышающее скорость и создающее зазубренную ауру.' },
                hyperBeam: { name: 'ГИПЕРЛУЧ', desc: 'Мощный лазерный залп. УР 1 снижается броней. УР 2 ПРОБИВАЕТ ЛЮБУЮ БРОНЮ.' },
                orbitalPlating: { name: 'ОРБИТАЛЬНАЯ БРОНЯ', desc: 'Размещает 3 генератора щита, дающих неуязвимость. Нужно уничтожить их, чтобы ранить босса.' },
                parasiticLink: { name: 'ПАРАЗИТИЧЕСКАЯ СВЯЗЬ', desc: 'Привязывается к игроку, высасывая 3% макс. здоровья в секунду. Отойдите на 800м, чтобы разорвать.' },
                cyclonePull: { name: 'ПРИТЯЖЕНИЕ ЦИКЛОНА', desc: 'Создает вакуум, притягивающий игрока и снаряды к боссу. Перезарядка 10 сек.' },
                deflectionField: { name: 'ПОЛЕ ОТРАЖЕНИЯ', desc: 'Во время вращения отражает 50% летящих снарядов в случайных направлениях.' },
                satelliteStrike: { name: 'СПУТНИКОВЫЙ УДАР', desc: 'Помечает 3 зоны и бьет орбитальными лучами. Наносит боссу урон в 3% его здоровья.' },
                titanPlating: { name: 'ТИТАНОВАЯ БРОНЯ', desc: 'Усиленные шипы отражают 5% урона обратно игроку. УРОН ИГНОРИРУЕТ ЛЮБУЮ БРОНЮ.' },
                soulDevourer: { name: 'ПОЖИРАТЕЛЬ ДУШ', desc: 'Замирает, чтобы высасывать души. Постепенное подавление до 50% за 5 сек. Сила вернется после смерти босса.' },
                mortalityCurse: { name: 'ПРОКЛЯТИЕ СМЕРТНОСТИ', desc: 'Гасит искру жизни. ОТКЛЮЧАЕТ ВСЮ РЕГЕНЕРАЦИЮ И ВАМПИРИЗМ, пока босс жив.' },
                convergenceZone: { name: 'ЗОНА СХОЖДЕНИЯ', desc: 'Два лазерных луча сходятся под углом 45 градусов. Держитесь центра, чтобы выжить.' },
                hivemindPhalanx: { name: 'ФАЛАНГА РОЯ', desc: 'Призывает стену неуязвимых дронов. Бейте по дронам, чтобы урон переходил боссу.' },
                crystalFence: { name: 'КРИСТАЛЛИЧЕСКАЯ ИЗГОРОДЬ', desc: 'Создает 5 кристаллов, образующих опасную электрическую изгородь. Контакт наносит урон боссу.' }
            }
        },
        classSelection: {
            selectClass: 'ВЫБЕРИТЕ КЛАСС',
            enableTutorialHints: 'ВКЛЮЧИТЬ ПОДСКАЗКИ',
            coreCapability: 'БАЗОВАЯ СПОСОБНОСТЬ',
            pierce: 'ПРОБИТИЕ',
            reading1: "О... Вы всё еще здесь. Наверное, читаете. Или экран загрузки нанёс вам эмоциональную травму. И то, и другое нормально.",
            reading2: "Впечатляет. Целая минута на экране выбора класса. Большинство пилотов просто берут то, что блестит, и умирают в первые 30 секунд.",
            reading3: "Всё ещё решаете? Враги появляются в реальном времени, знаете ли. Гипотетически. Но также и буквально.",
            reading4: "Вы же прочитали все описания, не так ли? Вы можете стать первым пилотом в истории, сделавшим это. Я отмечу это в вашем личном деле.",
            reading5: "Минута на раздумья. Большинство пилотов умирают, даже не поняв, что делает их класс. Вы уже на шаг впереди. Планка удручающе низка, но всё же.",
            classes: {
                malware: {
                    name: "Малварь",
                    title: "ЗАГЛЮЧИВШИЙ ВЛАСТЕЛИН",
                    capabilityName: "КВАНТОВАЯ ФРАГМЕНТАЦИЯ",
                    capabilityDesc: "Ручное прицеливание. Снаряды имеют 150% базовой дальности, +1 к пробиванию и бесконечно рикошетят от стен. Каждый отскок дает +20% к урону и +5% к скорости.",
                    characteristics: [
                        'Система ручного прицеливания',
                        'Квантовые рикошетящие снаряды'
                    ],
                    metrics: [
                        { label: 'ДАЛЬНОСТЬ', description: 'Множитель базовой дальности снаряда' },
                        { label: 'УРОН/СТЕНА', description: 'Прирост урона за отскок' },
                        { label: 'СКОРОСТЬ/СТЕНА', description: 'Прирост скорости за отскок' }
                    ]
                },
                eventhorizon: {
                    name: "Воид",
                    title: "ТКАЧ ПУСТОТЫ",
                    capabilityName: "Сингулярность Пустоты",
                    capabilityDesc: "Создает пустоту радиусом 400px на 3 сек с перезарядкой 10 сек. Медленно поглощает врагов в центре. Элита получает 25%, а Боссы — 10% от макс. HP в секунду.",
                    characteristics: [
                        'Специалист по контролю толпы',
                        'Тяжелая защитная броня',
                        'Эффект вакуума по области при попадании'
                    ],
                    metrics: [
                        { label: 'Радиус Сингулярности', description: 'Постоянный радиус' },
                        { label: 'Сила Притяжения', description: 'Базовая сила притяжения' },
                        { label: 'Длительность', description: 'Постоянная длительность' },
                        { label: 'Урон по Элите', description: 'От Макс. здоровья в секунду' },
                        { label: 'Урон по Боссу', description: 'От Макс. здоровья в секунду' }
                    ]
                },
                stormstrike: {
                    name: "Луч",
                    title: "ДВИГАТЕЛЬ ГРОМА",
                    capabilityName: "Орбитальный Удар",
                    capabilityDesc: "Каждые 8 секунд мощный вертикальный лазерный луч бьет по случайному врагу, нанося 150% урона по области в радиусе 100px.",
                    characteristics: [
                        'Тяжелое вооружение с низкой скорострельностью',
                        'Массивные орбитальные удары по области'
                    ],
                    metrics: [
                        { label: 'Частота', description: 'Постоянная перезарядка (Каждые 8с)' },
                        { label: 'Урон от Удара', description: 'Множитель урона' },
                        { label: 'Область Удара', description: 'Радиус удара' }
                    ]
                },
                aigis: {
                    name: "Вихрь",
                    title: "ЗОЛОТОЙ БАСТИОН",
                    capabilityName: "Магнитный Вихрь",
                    capabilityDesc: "Снаряды вращаются вокруг игрока кольцом, пока не поразят врага. Шанс создать до 4 орбит.",
                    characteristics: [
                        'Защитный периметр ближнего действия',
                        'Паттерны взрывов с задержкой',
                        'Улучшенные системы живучести'
                    ],
                    metrics: [
                        { label: 'Кольцо II', description: 'Шанс на 2-й слой' },
                        { label: 'Кольцо III', description: 'Шанс на 3-й слой' },
                        { label: 'Кольцо IV', description: 'Шанс на 4-й слой' }
                    ]
                },
                hivemother: {
                    name: "Матерь Роя",
                    title: "ВЛАДЫКА РОЯ",
                    capabilityName: "Рой Нанитов",
                    capabilityDesc: "При попадании пули распадаются на нанитов, наносящих постоянный урон. После смерти нанит перескакивает на следующую цель в радиусе 400px.",
                    characteristics: [
                        'Специалист по периодическому урону',
                        'Органическое масштабирование',
                        'Механика вирусного распространения'
                    ],
                    metrics: [
                        { label: 'Шанс Заражения', description: '' },
                        { label: 'Урон Роя / сек', description: '' },
                        { label: 'Дальность Прыжка', description: 'Постоянная дальность прыжка' }
                    ]
                }
            }
        },
        chassisDetail: {
            primaryAugmentation: 'ГЛАВНОЕ УЛУЧШЕНИЕ',
            tacticalCharacteristics: 'ТАКТИЧЕСКИЕ ХАРАКТЕРИСТИКИ',
            resonanceSynergy: 'РЕЗОНАНСНАЯ СИНЕРГИЯ',
            totalOctaveResonance: 'ОБЩИЙ ОКТАВНЫЙ РЕЗОНАНС',
            performanceMetrics: 'ПОКАЗАТЕЛИ ЭФФЕКТИВНОСТИ',
            baseModifiers: 'БАЗОВЫЕ МОДИФИКАТОРЫ',
            static: 'СТАТИЧНО:',
            stats: {
                maxHp: 'ЗДОРОВЬЕ',
                hpRegen: 'РЕГЕН. ЗДОРОВЬЯ/СЕК',
                damage: 'УРОН',
                attackSpeed: 'СКОРОСТЬ АТАКИ',
                armor: 'БРОНЯ',
                expGain: 'МНОЖ. ОПЫТА',
                moveSpeed: 'СКОРОСТЬ ПЕРЕМЕЩЕНИЯ',
                vision: 'ДАЛЬНОСТЬ ОБЗОРА',
                luck: 'УДАЧА',
                magnet: 'РАДИУС СБОРА',
                wallDmg: 'ОТРАЖЕНИЕ УРОНА',
                pierce: 'ПРОБИТИЕ',
                killCount: 'ВСЕГО УБИТО',
                timeSurvived: 'ВРЕМЯ ВЫЖИВАНИЯ'
            }
        },
        upgradeTypes: {
            dmg_f: 'Урон',
            dmg_m: 'Множ. Урона',
            atk_s: 'Скор. Атаки',
            hp_f: 'Макс. Здоровье',
            hp_m: 'Множ. Здоровья',
            reg_f: 'Реген. Здоровья/сек',
            reg_m: 'Множ. Регена',
            xp_f: 'Опыт за уб.',
            xp_m: 'Множ. Опыта',
            arm_f: 'Броня',
            arm_m: 'Множ. Брони',
            unknown: 'НЕИЗВЕСТНО'
        },
        upgradeRarities: {
            scrap: 'ОБЛОМКИ',
            anomalous: 'АНОМАЛЬНЫЙ',
            quantum: 'КВАНТОВЫЙ',
            astral: 'АСТРАЛЬНЫЙ',
            radiant: 'СИЯЮЩИЙ',
            abyss: 'БЕЗДНА',
            eternal: 'ВЕЧНЫЙ',
            divine: 'БОЖЕСТВЕННЫЙ',
            singularity: 'СИНГУЛЯРНОСТЬ'
        },
        meteorites: {
            rarities: {
                anomalous: 'АНОМАЛЬНЫЙ МЕТЕОРИТ',
                radiant: 'СИЯЮЩАЯ ЗВЕЗДА',
                void: 'КАТАЛИЗАТОР БЕЗДНЫ',
                abyss: 'КАТАЛИЗАТОР БЕЗДНЫ',
                eternal: 'ВЕЧНОЕ ЯДРО',
                divine: 'БОЖЕСТВЕННАЯ СУЩНОСТЬ',
                singularity: 'ТОЧКА СИНГУЛЯРНОСТИ'
            },
            stats: {
                activePower: 'АКТИВНАЯ МОЩЬ:',
                unplaced: '(НЕ УСТАНОВЛЕН)',
                corruptedEject: 'ИСКАЖЕН [ИЗВЛЕЧЬ: 3X ПЫЛИ]',
                augmentationProtocols: 'Протоколы Аугментаций',
                typeLabel: 'ТИП:',
                new: 'НОВЫЙ',
                broken: 'СЛОМАН',
                damaged: 'ПОВРЕЖДЕН',
                corrupted: 'ИСКАЖЕННЫЙ',
                foundInLabel: 'НАЙДЕН В:',
                economicArena: 'Экономическая Арена',
                combatArena: 'Боевая Арена',
                defenceArena: 'Защитная Арена',
                sector01: 'Сектор-01',
                sector02: 'Сектор-02',
                sector03: 'Сектор-03',
                incubLabel: 'ИНКУБ:',
                harmV: 'УРОН-V',
                coreX: 'ЯДРО-X'
            },
            perkNames: {
                lvl1: '1-й Навык',
                lvl2: '2-й Навык',
                lvl3: '3-й Навык',
                lvl4: '4-й Навык',
                lvl5: '5-й Навык',
                lvl6: '6-й Навык'
            }
        },
        statsMenu: {
            tabs: {
                system: 'СИСТЕМА',
                threat: 'УГРОЗА'
            },
            headers: {
                system: 'ДИАГНОСТИКА СИСТЕМЫ',
                threat: 'ПРОГРЕССИЯ УГРОЗЫ'
            },
            labels: {
                health: 'Здоровье',
                regeneration: 'Регенерация',
                damage: 'Урон',
                attackSpeed: 'Скорость атаки',
                armor: 'Броня',
                movementSpeed: 'Скорость перемещения',
                cooldownReduction: 'Снижение перезарядки',
                collisionReduction: 'Снижение урона от столкновений',
                projectileReduction: 'Снижение урона от снарядов',
                lifesteal: 'Вампиризм',
                xpGain: 'Опыт за убийство',
                meteoriteChance: 'Шанс выпадения метеорита',
                pierce: 'Пробитие'
            },
            threat: {
                hpGrowth: 'Рост здоровья врагов',
                spawnRateGrowth: 'Рост частоты появления врагов',
                currentHp: 'ТЕКУЩЕЕ HP',
                unitsSec: 'ЕДИНИЦ / СЕК',
                analysis: 'Анализ угроз в реальном времени',
                nextBossHp: 'Здоровье следующего Босса',
                collisionDmg: 'Урон от столкновения'
            },
            radar: {
                dps: 'УРОН',
                arm: 'БРОН',
                exp: 'ОПЫТ',
                hp: 'ОЗ',
                reg: 'РЕГ'
            },
            footer: 'НАЖМИТЕ [{key}] ЧТОБЫ ЗАКРЫТЬ'
        },
        recalibrate: {
            enhancementStation: 'СТАНЦИЯ УЛУЧШЕНИЯ',
            systemReady: 'СИСТЕМА ГОТОВА // ЗАГРУЖЕН: ',
            eject: 'ИЗВЛЕЧЬ',
            repair: 'РЕМОНТ',
            integrityMax: 'ЦЕЛОСТНОСТЬ МАКС',
            hardwareArray: 'МАССИВ ОБОРУДОВАНИЯ',
            autoLockActive: 'АВТО-ЗАМОК АКТИВЕН',
            stopAutoRoll: 'СТОП АВТО-РОЛЛ',
            autoReroll: 'АВТО-РЕРOЛЛ',
            rerollPerks: 'СБРОС НАВЫКОВ',
            rerollRange: 'СБРОС ЗНАЧЕНИЯ',
            seeksFilter: 'ПОИСК ФИЛЬТРА',
            costPlus50: 'ЦЕНА +50%',
            corruptedUnit: 'ИСКАЖЕННЫЙ МОДУЛЬ',
            integrityStatus: 'СТАТУС ЦЕЛОСТНОСТИ',
            version: 'ВЕР',
            incubLabel: 'ИНКУБ:',
            incubCostNote: '1% = +1 к стоимости реролла',
            roll: 'РОЛЛ',
            unit: 'МОДУЛЬ',
            moduleTitle: 'МОДУЛЬ ПЕРЕКАЛИБРОВКИ',
            all: 'Все',
            sectors: {
                s1: 'Сектор-01',
                s2: 'Сектор-02',
                s3: 'Сектор-03'
            },
            arenas: {
                eco: 'Эко Арена',
                com: 'Боевая Арена',
                def: 'Защитная Арена'
            },
            legendary: {
                eco: 'Эко Лег.',
                com: 'Боевой Лег.',
                def: 'Защ. Лег.'
            },
            qualities: {
                bro: 'Сломан',
                dam: 'Поврежден',
                new: 'Новый',
                cor: 'Искажен'
            },
            combos: {
                eco_eco: 'Эко-Эко',
                eco_com: 'Эко-Бой',
                eco_def: 'Эко-Защ',
                com_com: 'Бой-Бой',
                com_def: 'Бой-Защ',
                def_def: 'Защ-Защ'
            },
            filterLabels: {
                sector: 'СЕКТОР',
                connected: 'СВЯЗЬ',
                neighbor: 'СОСЕД',
                foundIn: 'НАЙДЕНО В',
                pair: 'ПАРА'
            }
        },
        units: {
            hp: 'ОЗ',
            dmg: 'УРОНА',
            reg: 'РЕГЕН',
            arm: 'БРОНИ',
            xp: 'ОПЫТА',
            atk: 'АТК',
            sps: 'В/С'
        },
        incubator: {
            title: 'ИНКУБАТОР',
            growth: 'ПРИРОСТ',
            fuel: 'ТОПЛИВО',
            inst: 'СТАБ',
            instability: 'НЕСТАБИЛЬНОСТЬ',
            boost: 'УСИЛЕНИЕ',
            empty: 'ПУСТО',
            ruined: 'РАЗРУШЕН',
            offline: 'ВЫКЛ: НЕТ ТОПЛИВА',
            loadFuel: 'ЗАГРУЗИТЬ',
            notEnoughFuel: 'НЕДОСТАТОЧНО ПОТОКА',
            notEnoughDust: 'НЕДОСТАТОЧНО ПЫЛИ',
            criticalFailure: 'КРИТИЧЕСКИЙ СБОЙ',
            destructed: 'РАЗРУШЕН',
            stable: 'СТАБИЛЬНО',
            warning: 'ВНИМАНИЕ',
            critical: 'КРИТИЧНО'
        },
        activation: {
            title: 'ПОСЛЕДОВАТЕЛЬНОСТЬ АКТИВАЦИИ',
            dustRequired: 'ПЫЛИ ТРЕБУЕТСЯ',
            waitingSignal: 'ОЖИДАНИЕ СИГНАЛА ДЛЯ ЭВАКУАЦИИ',
            extract: 'ИЗВЛЕЧЬ',
            initProtocol: 'ЗАПУСК ПРОТОКОЛА',
            deployed: 'РАЗВЕРНУТО',
            encrypted: 'ЗАШИФРОВАН',
            alreadyActive: 'УЖЕ АКТИВНО',
            close: 'ЗАКРЫТЬ',
            deploy: 'РАЗВЕРНУТЬ'
        },
        matrix: {
            safeSlots: 'БЕЗОПАСНЫЕ СЛОТЫ',
            safeSlotsSub: '(ЗАЩИТА ОТ МАССОВОЙ ПЕРЕРАБОТКИ)',
            storage: 'ХРАНИЛИЩЕ',
            storageSlots: '(300 СЛОТОВ)',
            recycle: 'ПЕРЕРАБОТКА',
            selected: 'ВЫБРАННЫЕ',
            ghosts: 'ПРИЗРАКИ',
            filterType: 'ТИП',
            filterRarity: 'РЕДКОСТЬ',
            filterFoundIn: 'НАЙДЕНО В',
            filterThreshold: 'ПОРОГ',
            filterSector: 'СЕКТОР',
            filterConnected: 'СВЯЗЬ',
            filterNeighbor: 'СОСЕД',
            filterArena: 'АРЕНА',
            filterPair: 'ПАРА',
            bpDecrypting: 'ДЕШИФРОВКА',
            bpReady: 'ГОТОВ',
            bpEncrypted: 'ЗАШИФРОВАН',
            bpActive: 'АКТИВЕН',
            bpBroken: 'СЛОМАН',
            dust: 'ПЫЛЬ',
            flux: 'ПОТОК ПУСТОТЫ',
            fluxSub: 'ВАЛЮТА ПЕРЕБРОСКА',
            sector01: 'СЕКТОР 01',
            sector02: 'СЕКТОР 02',
            sector03: 'СЕКТОР 03',
            ecoArena: 'Эко Арена',
            comArena: 'Боевая Арена',
            defArena: 'Защитная Арена',
            ecoLeg: 'Эко Легенд. Гекс',
            comLeg: 'Боев. Легенд. Гекс',
            defLeg: 'Защ. Легенд. Гекс',
            all: 'ВСЁ',
            sel: 'ВЫБ',
            title: 'МАТРИЧНЫЙ МОДУЛЬ',
            synergyText: 'СОЗДАВАЙТЕ СИНЕРГИИ, УСТАНАВЛИВАЯ МЕТЕОРИТЫ И ЛЕГЕНДАРНЫЕ ГЕКСЫ',
            perk1: '1-й ПЕРК',
            perk2: '2-й ПЕРК',
            perk3: '3-й ПЕРК',
            perk4: '4-й ПЕРК',
            perk5: '5-й ПЕРК',
            perk6: '6-й ПЕРК',
            comboEcoEco: 'Эко-Эко',
            comboEcoCom: 'Эко-Бой',
            comboEcoDef: 'Эко-Защ',
            comboComCom: 'Бой-Бой',
            comboComDef: 'Бой-Защ',
            comboDefDef: 'Защ-Защ',
            evacuationGoal: '{amount} / 10,000 ПЫЛИ',
            initiateEvacuation: 'НАЧАТЬ ЭВАКУАЦИЮ',
            arrivalIn: 'ПРИБЫТИЕ ЧЕРЕЗ',
            secureLZ: 'ОБЕЗОПАСЬТЕ ЗОНУ',
            shipLanded: 'КОРАБЛЬ ПРИЗЕМЛИЛСЯ',
            goTo: 'ИДИТЕ В',
            landingZone: 'ЗОНУ ПОСАДКИ',
            departing: 'УЛЕТАЕТ...',
            waitingSignalShort: 'ОЖИДАНИЕ СИГНАЛА',
            viewBestiary: 'БЕСТИАРИЙ ►',
            backToMatrix: '◄ К МАТРИЦЕ'
        },
        render: {
            ritual: 'РИТУАЛ',
            syncing: 'АКТИВАЦИЯ',
            synchronization: 'СИНХРОНИЗАЦИЯ',
            activating: 'АКТИВАЦИЯ',
            recharging: 'ЗАРЯДКА',
            active: 'АКТИВНО',
            level: 'УРОВЕНЬ',
            repair: 'ПОЧИНКА',
            dust: 'ПЫЛИ',
            overheat: 'ПЕРЕГРЕВ',
            dormant: 'БЕЗДЕЙСТВИЕ',
            sec: 'сек'
        }
    }
};

export const getUiTranslation = (lang: Language) => UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];
