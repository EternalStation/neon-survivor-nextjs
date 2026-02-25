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

            // UpgradeMenu
            voidTechDetected: 'VOID TECHNOLOGY DETECTED',
            selectSystemUpgrade: 'SELECT SYSTEM UPGRADE',
            rerollUpgrades: 'REROLL UPGRADES',
            anomalyTerminated: 'ANOMALY TERMINATED: RARITY CHANCE INCREASED',

            // AssistantOverlay
            orbitAssistant: 'Orbit Assistant',

            // BossStatus
            bossNames: {
                square: 'THE FORTRESS',
                circle: 'THE JUGGERNAUT',
                triangle: 'THE BLADE',
                diamond: 'THE MARKSMAN',
                pentagon: 'THE OVERMIND'
            },
            bossSkills: {
                square: {
                    name: 'THORNS',
                    desc: 'Hardened shell reflects 3% of incoming damage back to the player. Reduced by Armor.'
                },
                pentagon: {
                    name: 'SOUL LINK',
                    desc: 'Links minions to the hive mind. Contact with linked targets deals 30% HP damage but destroys the target and damages the Boss. Shared HP pool.'
                },
                circle: {
                    name: 'BERSERK RUSH',
                    desc: 'Initiates a high-velocity dash towards the player, dealing 30% Max HP damage on impact.'
                },
                triangle: {
                    name: 'BLADE SPIN',
                    desc: 'Spins violently during dash phases, increasing movement speed and generating a jagged yellow aura.'
                },
                diamond: {
                    name: 'HYPER BEAM',
                    desc: 'Fires a high-intensity laser burst. LVL 1 is reduced by Armor. LVL 2 PIERCES ALL ARMOR.'
                }
            },
            bossSkillsL3: {
                square: {
                    name: 'ORBITAL PLATING',
                    desc: 'Deploys 3 localized shield generators that grant invulnerability. Shields must be destroyed to damage the boss. Regenerates every 15s.'
                },
                pentagon: {
                    name: 'PARASITIC LINK',
                    desc: ' Tethers to the player if close, draining 3% Max HP per second to heal the boss. moved > 800px away to break.'
                },
                circle: {
                    name: 'CYCLONE PULL',
                    desc: 'Generates a massive vacuum that pulls the player and projectiles towards the boss. 10s Cooldown.'
                },
                triangle: {
                    name: 'DEFLECTION FIELD',
                    desc: 'While spinning, deflects 50% of incoming projectiles in random directions.'
                },
                diamond: {
                    name: 'SATELLITE STRIKE',
                    desc: 'Marks 3 zones around the player and strikes them with orbital beams after a short delay. Deals 3% Boss HP damage.'
                }
            },
            bossSkillsL4: {
                square: {
                    name: 'TITAN PLATING',
                    desc: 'Reinforced spikes reflect 5% of incoming damage back to the player. REPEL DAMAGE IGNORES ALL ARMOR.'
                },
                circle: {
                    name: 'SOUL DEVOURER',
                    desc: 'Freezes in place to "Suck" your souls. Impact scales from 0 to 50% suppression over 5 seconds while boss is invincible. Stolen power only returns when the boss is destroyed.'
                },
                triangle: {
                    name: 'MORTALITY CURSE',
                    desc: 'Extinguishes the spark of life. DISABLES ALL REGENERATION AND LIFESTEAL globally while the boss is alive.'
                },
                diamond: {
                    name: 'CONVERGENCE ZONE',
                    desc: 'Fires dual sweeping lasers that close in from 45 degrees. Stay in the center to survive.'
                },
                pentagon: {
                    name: 'HIVEMIND PHALANX',
                    desc: 'Tactical Command: Summons a wall of invincible drones to sweep the arena. Blast the drones to transfer damage back to the Boss.'
                }
            },
            bossSkillsL5: {
                diamond: {
                    name: 'CRYSTAL FENCE',
                    desc: 'Places 5 resonance crystals around the player that form a deadly electric fence. Touching the fence deals 1% Boss HP damage every 5 frames.'
                }
            },
            bossWord: 'ANOMALY',
            bossLvl: 'LVL',
            bossHp: 'HP',
            bossStage: 'STAGE',
            bossDismiss: '[ DISMISS ]',
            bossResumePrompt: 'PRESS ESC OR CLICK ANYWHERE TO RESUME',

            // PlayerStatus
            channeling: 'CHANNELING',
            skill: 'SKILL',
            neuralOverclockActive: 'Neural Overclock Active',

            // Other HUD components
            orbitSpeaking: 'ORBIT SPEAKING',
            pressSpaceToContinue: 'PRESS [SPACE] TO CONTINUE ►',
            feedback: 'Feedback'
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
            defBuff: 'Макс. HP и Реген',
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

            // UpgradeMenu
            voidTechDetected: 'ОБНАРУЖЕНА ТЕХНОЛОГИЯ БЕЗДНЫ',
            selectSystemUpgrade: 'ВЫБЕРИТЕ УЛУЧШЕНИЕ СИСТЕМЫ',
            rerollUpgrades: 'СМЕНИТЬ УЛУЧШЕНИЯ',
            anomalyTerminated: 'АНОМАЛИЯ УСТРАНЕНА: ШАНС РЕДКОСТИ УВЕЛИЧЕН',

            // AssistantOverlay
            orbitAssistant: 'Ассистент Орбит',

            // BossStatus
            bossNames: {
                square: 'КРЕПОСТЬ',
                circle: 'ДЖАГГЕРНАУТ',
                triangle: 'КЛИНОК',
                diamond: 'СТРЕЛОК',
                pentagon: 'РАЗУМ РОЯ'
            },
            bossSkills: {
                square: {
                    name: 'ШИПЫ',
                    desc: 'Прочный панцирь отражает 3% получаемого урона обратно в игрока. Снижается Броней.'
                },
                pentagon: {
                    name: 'СВЯЗЬ ДУШ',
                    desc: 'Связывает миньонов с разумом роя. Контакт со связанными целями наносит 30% урона от здоровья, но уничтожает цель и наносит урон Боссу. Общий запас здоровья.'
                },
                circle: {
                    name: 'РЫВОК БЕРСЕРКА',
                    desc: 'Совершает высокоскоростной рывок к игроку, нанося 30% урона от Макс. HP при столкновении.'
                },
                triangle: {
                    name: 'ВРАЩЕНИЕ КЛИНКА',
                    desc: 'Яростно вращается во время фаз рывка, увеличивая скорость передвижения и создавая заостренную желтую ауру.'
                },
                diamond: {
                    name: 'ГИПЕРЛУЧ',
                    desc: 'Выпускает мощный лазерный импульс. УР 1 снижается Броней. УР 2 ПРОБИВАЕТ ЛЮБУЮ БРОНЮ.'
                }
            },
            bossSkillsL3: {
                square: {
                    name: 'ОРБИТАЛЬНАЯ ОБШИВКА',
                    desc: 'Размещает 3 локальных генератора щита, дающих неуязвимость. Щиты нужно уничтожить, чтобы наносить урон боссу. Восстанавливаются каждые 15 сек.'
                },
                pentagon: {
                    name: 'ПАРАЗИТИЧЕСКАЯ СВЯЗЬ',
                    desc: ' Привязывается к игроку на близком расстоянии, вытягивая 3% Макс. HP в секунду для лечения босса. Отойдите более чем на 800px, чтобы разорвать.'
                },
                circle: {
                    name: 'ТЯГА ЦИКЛОНА',
                    desc: 'Создает массивный вакуум, который притягивает игрока и снаряды к боссу. Перезарядка 10 сек.'
                },
                triangle: {
                    name: 'ОТРАЖАЮЩЕЕ ПОЛЕ',
                    desc: 'Во время вращения отражает 50% летящих снарядов в случайных направлениях.'
                },
                diamond: {
                    name: 'СПУТНИКОВЫЙ УДАР',
                    desc: 'Помечает 3 зоны вокруг игрока и наносит по ним удар орбитальными лучами после небольшой задержки. Наносит урон в размере 3% HP Босса.'
                }
            },
            bossSkillsL4: {
                square: {
                    name: 'ТИТАНОВАЯ ОБШИВКА',
                    desc: 'Усиленные шипы отражают 5% получаемого урона обратно в игрока. ОТРАЖЕННЫЙ УРОН ИГНОРИРУЕТ ЛЮБУЮ БРОНЮ.'
                },
                circle: {
                    name: 'ПОЖИРАТЕЛЬ ДУШ',
                    desc: 'Застывает на месте, чтобы «Высасывать» ваши души. Воздействие масштабируется от 0 до 50% подавления в течение 5 секунд, пока босс неуязвим. Украденная сила возвращается только после уничтожения босса.'
                },
                triangle: {
                    name: 'ПРОКЛЯТИЕ СМЕРТНОСТИ',
                    desc: 'Гасит искру жизни. ОТКЛЮЧАЕТ ЛЮБУЮ РЕГЕНЕРАЦИЮ И ВАМПИРИЗМ глобально, пока босс жив.'
                },
                diamond: {
                    name: 'ЗОНА КОНВЕРГЕНЦИИ',
                    desc: 'Стреляет двумя подметающими лазерами, приближающимися под углом 45 градусов. Оставайтесь в центре, чтобы выжить.'
                },
                pentagon: {
                    name: 'ФАЛАНГА РАЗУМА РОЯ',
                    desc: 'Тактическое Командование: Призывает стену неуязвимых дронов для зачистки арены. Уничтожайте дронов, чтобы перенаправить урон обратно Боссу.'
                }
            },
            bossSkillsL5: {
                diamond: {
                    name: 'КРИСТАЛЛИЧЕСКОЕ ОГРАЖДЕНИЕ',
                    desc: 'Размещает 5 резонансных кристаллов вокруг игрока, которые образуют смертоносный электрический забор. Прикосновение к забору наносит урон в размере 1% HP Босса каждые 5 кадров.'
                }
            },
            bossWord: 'АНОМАЛИЯ',
            bossLvl: 'УР',
            bossHp: 'ОЗ',
            bossStage: 'СТАДИЯ',
            bossDismiss: '[ ЗАКРЫТЬ ]',
            bossResumePrompt: 'НАЖМИТЕ ESC ИЛИ КЛИКНИТЕ В ЛЮБОМ МЕСТЕ ДЛЯ ПРОДОЛЖЕНИЯ',

            // PlayerStatus
            channeling: 'ПРИМЕНЕНИЕ',
            skill: 'НАВЫК',
            neuralOverclockActive: 'Нейронный Разгон Активен',

            // Other HUD components
            orbitSpeaking: 'ОРБИТ ГОВОРИТ',
            pressSpaceToContinue: 'НАЖМИТЕ [ПРОБЕЛ] ДЛЯ ПРОДОЛЖЕНИЯ ►',
            feedback: 'Отзыв'
        }
    }
};

export const getUiTranslation = (lang: Language) => UI_TRANSLATIONS[lang] || UI_TRANSLATIONS['en'];
