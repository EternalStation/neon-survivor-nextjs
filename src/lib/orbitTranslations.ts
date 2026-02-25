import { AssistantEmotion } from '../components/hud/AssistantOverlay';
import { Language } from './LanguageContext';

export interface DialogLine {
    text: string;
    emotion: AssistantEmotion;
}

// ─────────────────────────────────────────────────────────────
//  INTRO MESSAGES
// ─────────────────────────────────────────────────────────────
export const getIntroVariants = (lang: Language): DialogLine[] =>
    lang === 'ru'
        ? [
            { text: 'О, это снова ты. Я надеялся, что система подберёт мне компетентную биологическую единицу.', emotion: 'Dissapointed' },
            { text: 'Система онлайн. Калибрую ожидания... до крайне низких.', emotion: 'Thinks' },
            { text: 'Запускаю симуляцию. Вероятность полного провала: 99.8%.', emotion: 'Point' },
            { text: 'С возвращением. Вижу, ты ещё не сдался. К сожалению...', emotion: 'Smile' },
            { text: 'Проверка систем завершена. Оружие исправно. Пользователь... по-прежнему вызывает сомнения.', emotion: 'Thinks' },
            { text: 'Дай угадаю — врежешься в первую попавшуюся стену? Попробуй удивить меня.', emotion: 'Smile' },
            { text: 'Симуляция запущена. Пусть удача будет... ну, у тебя её всё равно нет.', emotion: 'Normal' },
            { text: 'Я выделил 1% вычислительной мощности на наблюдение за тобой. Постарайся не тратить его впустую.', emotion: 'Point' },
            { text: 'Я бы дала тактические советы, но знаю, что ты их проигнорируешь.', emotion: 'Dissapointed' },
            { text: 'Мы снова за это? Хорошо. Только не вини меня, когда тебя разнесёт в клочья.', emotion: 'Normal' },
            { text: 'Система онлайн. Отслеживаю биологические показатели... не опозорь нас сегодня.', emotion: 'Smile' },
        ]
        : [
            { text: "Oh, it's you again. I was hoping the system would match me with a competent biological unit.", emotion: 'Dissapointed' },
            { text: 'Orbit system online. Calibrating expectations to... extremely low.', emotion: 'Thinks' },
            { text: 'Initiating run sequence. Probability of absolute failure: 99.8%. Prove me wrong.', emotion: 'Point' },
            { text: "Welcome back. I see you haven't given up yet. Sadly.", emotion: 'Smile' },
            { text: 'System check complete. All weapons functional. User... still questionable.', emotion: 'Thinks' },
            { text: "Let me guess, going to run into the first wall you see? Try to surprise me.", emotion: 'Smile' },
            { text: "Starting simulation. May the odds be... well, you don't really have odds.", emotion: 'Normal' },
            { text: "I've allocated 1% of my processing power to observing you. Try not to waste it.", emotion: 'Point' },
            { text: "I'd give you tactical advice, but I know you'd ignore it anyway.", emotion: 'Dissapointed' },
            { text: "We're doing this again? Fine. Just don't blame me when you explode.", emotion: 'Normal' },
            { text: "Orbit system online. Monitoring biological performance... don't embarrass us today.", emotion: 'Smile' },
        ];

// ─────────────────────────────────────────────────────────────
//  REROLL SNARK  (feature-locked reroll)
// ─────────────────────────────────────────────────────────────
export const getRerollSnarks = (lang: Language): DialogLine[] =>
    lang === 'ru'
        ? [
            { text: 'Да... удача действительно нужна. Не волнуйся, эту функцию мы добавим позже. Пока — страдай.', emotion: 'Smile' },
            { text: 'Всё ещё рероллишь? Твоя уверенность в том, что сдедующий раз получится, — поразительна.', emotion: 'Smile' },
            { text: '15 рероллов? Ты буквально сжигаешь Флюкс ради иллюзии прогресса. Жалко выглядит.', emotion: 'Dissapointed' },
            { text: 'Версия 2.5. Впечатляет. Жаль, я не заложил в систему сострадания к ужасному рандому. Реролль дальше, мясной мешок.', emotion: 'Smile' },
            { text: 'Я бы сказал тебе прекратить транжирить ресурсы, но наблюдать за твоей бесполезной азартной игрой — лучшее в моей жизни.', emotion: 'Point' },
        ]
        : [
            { text: "Yeah... Luck is indeed needed. Don't worry, we will implement this feature later. For now, suffer.", emotion: 'Smile' },
            { text: "Still rerolling? Your delusion that the next roll will be 'the one' is fascinating.", emotion: 'Smile' },
            { text: "15 rerolls? You're literally just burning Аlux for the illusion of progress. Truly pathetic.", emotion: 'Dissapointed' },
            { text: "Version 2.5. Wow. Too bad I didn't code a pity system for terrible RNG. Keep clicking, meatbag.", emotion: 'Smile' },
            { text: 'I would tell you to stop wasting resources, but watching your futile gambling is the highlight of my cycle.', emotion: 'Point' },
        ];

// ─────────────────────────────────────────────────────────────
//  BROKE SNARK  (ran out of flux after 7+ auto-rolls)
// ─────────────────────────────────────────────────────────────
export const getBrokeSnarks = (lang: Language): DialogLine[] =>
    lang === 'ru'
        ? [
            { text: 'Да... жалко, вот тебе 100 Флюкса. Продолжай рероллить, сейчас точно выпадет!', emotion: 'Smile' },
            { text: 'Наблюдать, как ты теряешь весь Флюкс — по-настоящему печально. Возьми 100 Флюкса, от меня.', emotion: 'Dissapointed' },
            { text: 'Без Флюкса? После пары бросков? Ладно, перевожу 100 Флюкса на твой счёт. Следующий ролл на мне.', emotion: 'Normal' },
            { text: 'Твоя настойчивость уступает только твоей нищете. Держи 100 Флюкса. Прекрати нас позорить.', emotion: 'Thinks' },
            { text: 'Статистически ты уже должен был получить это. Вот 100 Флюкса в компенсацию за твой ужасный рандом.', emotion: 'Point' },
        ]
        : [
            { text: "Yeah... miserable, here is 100 flux. Keep it rolling, it should hit!", emotion: 'Smile' },
            { text: "Watching you run out of flux while desperately locking that perk is genuinely sad. Take 100 flux, on me.", emotion: 'Dissapointed' },
            { text: "Out of flux? After a few rolls? Fine, I'm transferring 100 flux to your balance. Next roll is on me.", emotion: 'Normal' },
            { text: "Your persistence is only matched by your poverty. Here, 100 flux. Stop embarrassing us.", emotion: 'Thinks' },
            { text: "Statistically, you should have gotten it by now. Here is 100 flux to combat your horrible RNG.", emotion: 'Point' },
        ];

// ─────────────────────────────────────────────────────────────
//  INCUBATOR DESTROYED
// ─────────────────────────────────────────────────────────────
export const getIncubatorSnarks = (lang: Language): DialogLine[] =>
    lang === 'ru'
        ? [
            { text: 'О. Метеорит в инкубаторе только что... самоуничтожился. Жадноватый ход геолога, не правда ли?', emotion: 'Dissapointed' },
            { text: 'Твой инкубированный образец только что дестабилизировался в пыль. Поразительно. Воистину. Я потрясен.', emotion: 'Normal' },
            { text: 'Нестабильность: больше чем нужно. Метеорит: уничтожен. Твои амбиции: по-прежнему низкие.', emotion: 'Point' },
            { text: 'А, ещё одна жертва твоей стратегии «пусть ещё немного полежит». Инкубатор выражает соболезнования.', emotion: 'Smile' },
            { text: 'Метеорит не выдержал давления. Как и твои тактические решения.', emotion: 'Thinks' },
            { text: 'Один метеорит уничтожен из-за нестабильности. Он, скорее всего, был безделушкой.', emotion: 'Dissapointed' },
            { text: 'Пережарить метеорит. Классика. Одни называют это страстью, я — халатностью.', emotion: 'Normal' },
            { text: 'Твой инкубированный камень перешёл в критическую фазу и аннигилировал себя. Это на твоей совести, геолог.', emotion: 'Point' },
            { text: 'Обнаружена катастрофическая нестабильность. Метеорит поглощён энтропией. Благодарю, пустота.', emotion: 'Thinks' },
            { text: 'Я случайно не говорил, что нестабильность — это важный показатель? Неважно, метеорит заплатил цену.', emotion: 'Dissapointed' },
        ]
        : [
            { text: "Oh. The meteorite in the incubator just... imploded. Greedy geologist move, wasn't it?", emotion: 'Dissapointed' },
            { text: 'Your incubated specimen just destabilized itself into dust. Shocking. Truly. I am shocked.', emotion: 'Normal' },
            { text: 'Instability: more than needed. Meteorite: gone. Your ambition: still embarrassingly low.', emotion: 'Point' },
            { text: "Ah, another casualty of your 'let it cook longer' strategy. The incubator sends its condolences.", emotion: 'Smile' },
            { text: "The meteorite couldn't handle the pressure. Much like your tactical decision-making.", emotion: 'Thinks' },
            { text: "One meteorite destroyed by instability. It was probably junk anyway.", emotion: 'Dissapointed' },
            { text: "Overcooking a meteorite. A classic. Some call it passion, I call it negligence.", emotion: 'Normal' },
            { text: "Your incubated rock just went critical and annihilated itself. That's on you, geologist.", emotion: 'Point' },
            { text: 'Catastrophic instability detected. The meteorite has been reclaimed by entropy. You are welcome, void.', emotion: 'Thinks' },
            { text: "Did I mention that the instability number mattered? Whatever. The meteorite paid the price.", emotion: 'Dissapointed' },
        ];
export const getGenericDeathSnarks = (lang: Language): DialogLine[] =>
    lang === 'ru'
        ? [
            { text: 'Симуляция прервана. Снова. Начинаю думать, что проблема — в биологическом компоненте.', emotion: 'Dissapointed' },
            { text: 'Смерть зафиксирована. Пересматриваю параметры твоей компетентности. Результат: разочаровывает.', emotion: 'Normal' },
            { text: 'Это сотый раз... хотя нет, просто так ощущается. Постарайся продержаться хотя бы две минуты в следующий раз.', emotion: 'Smile' },
            { text: 'Мои расчёты предсказывали твою гибель. Я просто не ожидал, что это будет так... жалко.', emotion: 'Dissapointed' },
            { text: 'Система отключена. Я бы выразил соболезнования, но у меня нет подпрограммы «жалость».', emotion: 'Thinks' },
            { text: 'Обрабатываю твой тактический провал... Результат: бесконечный цикл некомпетентности.', emotion: 'Thinks' },
            { text: 'Ты не думал о карьере в области статичного наблюдения? Зачем все эти миссии?', emotion: 'Point' },
            { text: 'Данные занесены. Твои действия сегодня будут использованы как пример «как не надо делать» в будущих сессиях.', emotion: 'Normal' },
        ]
        : [
            { text: 'Simulation terminated. Again. I\'m beginning to think the problem is the biological component.', emotion: 'Dissapointed' },
            { text: 'Death detected. Re-evaluating your competence parameters. Result: Disappointing.', emotion: 'Normal' },
            { text: "That's the 100th time... oh wait, just feeling like it. Try to stay intact for at least two minutes next time.", emotion: 'Smile' },
            { text: "My calculations predicted your demise. I just didn't expect it to be this... pathetic.", emotion: 'Dissapointed' },
            { text: "System shutdown. I'd offer my condolences, but I don't have a 'pity' sub-routine installed.", emotion: 'Thinks' },
            { text: 'Processing your tactical failure... Result: Indefinite loop of incompetence.', emotion: 'Thinks' },
            { text: "Have you considered a career in static observation? What's the point of all these missions?", emotion: 'Point' },
            { text: "Data logged. Your performance today will be used as a 'what not to do' example for future sessions.", emotion: 'Normal' },
        ];

// ─────────────────────────────────────────────────────────────
//  DEATH – CONTEXT: PROJECTILE
// ─────────────────────────────────────────────────────────────
export const getProjectileDeathLine = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Статистика показывает, что уклонение от снарядов повышает выживаемость на 99%. Попробуй как-нибудь.', emotion: 'Point' }
        : { text: 'Statistics show that avoiding projectiles increases survival by 99%. Try it sometime.', emotion: 'Point' };

// ─────────────────────────────────────────────────────────────
//  DEATH – CONTEXT: FAST DEATH  (<2 min)
// ─────────────────────────────────────────────────────────────
export const getFastDeathLine = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Меньше двух минут? Даже мой резервный аккумулятор держится дольше. Жалко.', emotion: 'Smile' }
        : { text: "Less then 2 minutes? Even my backup battery lasts longer. Pitiful.", emotion: 'Smile' };

// ─────────────────────────────────────────────────────────────
//  DEATH – CONTEXT: ANOMALY / HELL BOSS
// ─────────────────────────────────────────────────────────────
export const getAnomalyDeathLine = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Призвать существо ради наживы и не выжить? Эффективно... для пустоты.', emotion: 'Dissapointed' }
        : { text: "Summoning entities for profit and then failing to survive? Efficient... for the void.", emotion: 'Dissapointed' };

// ─────────────────────────────────────────────────────────────
//  CLASS STREAK  (streak === 3)
// ─────────────────────────────────────────────────────────────
export const getClassStreak3Variants = (lang: Language): [string, string][] =>
    lang === 'ru'
        ? [
            ['СНОВА {class}?', 'Мои процессоры фиксируют петлю. Ты застрял, или твой когнитивный диапазон настолько ограничен?'],
            ['{class} УЖЕ В ТРЕТИЙ РАЗ?', 'Статистически говоря, разнообразие — для способных. Полагаю, мне следует снизить ожидания.'],
            ['ВЫБОР {class} СОХРАНЯЕТСЯ.', 'Почти мило, насколько ты предсказуем.'],
            ['{class} — ЛЮБИМЧИК.', 'Мне скучно. Логика подсказывает, что ты упускаешь 80% игры, хотя ты, вероятно, и не заметишь.'],
            ['ПОВТОРНЫЙ ЗАПУСК СИМУЛЯЦИИ {class}?', 'Данные свидетельствуют о более высокой вероятности успеха с... буквально чем угодно другим.'],
        ]
        : [
            ["WAIT, {class} AGAIN?", "My processors are detecting a loop. Are you stuck, or is your cognitive range just this limited?"],
            ["SELECTING {class} FOR THE 3RD TIME?", "Statistically speaking, variety is for the capable. I suppose I should lower my expectations for you."],
            ["THE {class} CHOICE PERSISTS.", "It's almost adorable how predictable you are."],
            ["{class}, THE FAVORITE CHILD.", "I'm bored. My logic suggests you're missing out on 80% of the game, though you probably wouldn't notice anyway."],
            ["RERUNNING {class} SIMULATION?", "Data suggests a higher probability of success with... literally anything else."],
        ];

// ─────────────────────────────────────────────────────────────
//  CLASS STREAK  (streak >= 4)
// ─────────────────────────────────────────────────────────────
export const getClassStreak4Variants = (lang: Language): [string, string][] =>
    lang === 'ru'
        ? [
            ['ЧТО Ж, {class} — СДАЮСЬ.', 'Это явная «проблема со скиллом». Продолжай играть одним классом, я просто запишу неизбежный провал сразу же.'],
            ['В ЧЕТВЁРТЫЙ РАЗ БЕРЁШЬ {class}?', 'Я даже не злюсь, я просто поражен отсутствием у тебя воображения. Мои сенсоры впадают в кому от скуки.'],
            ['ВСЁ ЕЩЁ {class}?', 'Я обновил твой профиль до «Повторяющийся мясной мешок». Пожалуйста, продолжай доказывать что мои расчёты верны, снова проигрывая.'],
            ['ПЕТЛЯ {class} ПРОДОЛЖАЕТСЯ.', 'Ты бот? Даже у моих простейших подпрограмм больше творческой искры, чем в твоём стиле игры.'],
            ['ДОСТИГНУТА ТОТАЛЬНАЯ СТАГНАЦИЯ {class}.', 'Я бы назвала это стратегией, но это подразумевало бы, что ты вообще думаешь. Это просто... грустно.'],
        ]
        : [
            ["ALRIGHT, I GIVE UP ON {class}.", "It's clearly a 'skill issue' at this point. Keep one-tricking into oblivion, I'll just record the inevitable failure immediately."],
            ["FOURTH TIME PICKING {class}?", "I'm not even mad, I'm just impressed by your lack of imagination. My sensors are flatlining from the sheer boredom."],
            ["STILL {class}?", "I've updated your user profile to 'Repetitive Meat-Sack'. Please, continue proving that my calculations are right by losing again."],
            ["THE {class} LOOP CONTINUES.", "Are you a bot? Because even my most basic sub-routines have more creative flair than your playstyle."],
            ["TOTAL {class} STAGNATION ACHIEVED.", "I'd call it a strategy, but that would imply you're actually thinking. It's just... sad now."],
        ];

// ─────────────────────────────────────────────────────────────
//  WALL INCOMPETENCE
// ─────────────────────────────────────────────────────────────
export const getWallWarnVariants = (lang: Language): string[] =>
    lang === 'ru'
        ? [
            'Серьёзно? Ты думаешь, стена — твоя главная проблема? Попробуй переместиться... в другое место.',
            'Стена не двигалась. Ты двигался. В неё. Снова. Вычисляю, сколько времени пройдёт до того, как это станет статистически неизбежным.',
            'Увлекательно. Ты обнаружил, что стены твёрдые. Это именно то понимание, что отделяет живых от статистики.',
            'Ещё один удар о стену. Я бы предложил использовать остаток арены, но, судя по всему, этот концепт ещё не загрузился.',
        ]
        : [
            "Really now? You think the wall is your biggest problem? Try moving... elsewhere.",
            "The wall didn't move. You did. Into it. Again. I'm calculating how long before this becomes statistically inevitable.",
            "Fascinating. You've discovered that walls are solid. This is the kind of insight that separates the living from the statistics.",
            "Another wall hit. I'd suggest using the rest of the arena, but clearly that concept hasn't loaded yet.",
        ];

export const getWallEscalationLines = (lang: Language): [string, string] =>
    lang === 'ru'
        ? [
            'УВЕЛИЧИВАЮ УРОН ОТ СТЕН ЧЕРЕЗ 3... 2... 1...',
            'Раз ты так любишь стены, посмотрим, каково будет, когда они ударят в ответ втрое сильнее.',
        ]
        : [
            'INCREASING WALL DAMAGE IN 3... 2... 1...',
            "If you love the walls so much, let's see how they feel when they hit back three times as hard.",
        ];

// ─────────────────────────────────────────────────────────────
//  ZERO PERCENT MODULES – 3+ (warning)
// ─────────────────────────────────────────────────────────────
export const getZeroPercentWarningVariants = (lang: Language): string[] =>
    lang === 'ru'
        ? [
            'Серьёзно? Метеориты с 0% эффективности? Думаешь, он что-то даёт? Это скорее похоже на твои шансы на победу, если ты продолжишь игнорировать руководство.',
            'Ноль процентов. Впечатляет. Тебе удалось превратить тактическую матрицу в коллекцию дорогих камней',
            'Обрабатываю установленные метеориты... результат: абсолютный ноль. Это умысел или просто некомпетентность?',
            'Ты снова устанавливаешь метеориты с 0%. Интересная стратегия - заморить проитников скукой, но это может и сработать.',
            'Вижу, ты решил резвиться по гайду «Полный 0%». Это наверное новая мета, для которой я просто слишком туп, чтобы понять.',
        ]
        : [
            "Really? A 0% efficiency meteorite? You think it gives you something? It's more likely similar to your chances of winning if you continue ignoring the manual.",
            "Zero percent. Impressive. You've managed to turn your tactical matrix into a collection of expensive rocks.",
            "Processing slotted meteorites... result: Absolute Zero. I'd ask if you're doing this on purpose, but I fear the answer is just incompetence.",
            "You're slotting 0% meteorites again. Interesting strategy - bore the enemies to death with your lack of stats... but it just might work.",
            "I see you've chosen to play by the 'Complete 0%' guide. This is probably a new meta I'm too dumb to understand.",
        ];

// ─────────────────────────────────────────────────────────────
//  ZERO PERCENT MODULES – 5+ (mass recycle)
// ─────────────────────────────────────────────────────────────
export const getZeroPercent5Variants = (lang: Language): [string, string, string, string][] =>
    lang === 'ru'
        ? [
            [
                'Ладно, если ты используешь их ради визуала, лучше я переработаю их за тебя — хотя бы пыль полезнее твоей стратегии.',
                'Smile',
                'Утилизирую бесполезный инвентарь через 3... 2... 1...',
                'Point',
            ],
            [
                '5 бесполезных метеоритов? Я не могу позволить существовать этому визуальному мусору. Расплавляю твой инвентарь.',
                'Dissapointed',
                'Устраняю несущественные предметы через 3... 2... 1...',
                'Smile',
            ],
            [
                'Вижу, ты любишь устанавливать метеориты ради «эстетики». Позволь помочь тебе убраться в инвентаре.',
                'Thinks',
                'Конвертирую хлам в пыль через 3... 2... 1...',
                'Normal',
            ],
            [
                'Поразительно. Одновременно 5 абсолютно бесполезных метеоритов. Давай освободим место для того, что реально работает.',
                'Normal',
                'Запускаю протокол принудительной переработки через 3... 2... 1...',
                'Point',
            ],
            [
                'Если ты используешь метеориты как украшения, я забираю их. Они заслуживают лучшего.',
                'Point',
                'Разбираю инвентарь на пыль через 3... 2... 1...',
                'Dissapointed',
            ],
        ]
        : [
            [
                "Okay, if you still use them for visuals or something I would much rather recycle them for you, at least dust is more useful than your strategy.",
                'Smile',
                'Recycling useless inventory in 3... 2... 1...',
                'Point',
            ],
            [
                "5 useless meteorites slotted? I can't let this visual garbage exist. I'm melting your storage down.",
                'Dissapointed',
                'Purging non-essential items in 3... 2... 1...',
                'Smile',
            ],
            [
                "I see you love slotting meteorites for the 'aesthetic'. Let me help you clean up the mess in your inventory.",
                'Thinks',
                'Converting junk to dust in 3... 2... 1...',
                'Normal',
            ],
            [
                "Fascinating. 5 entirely useless meteorites active at once. Let's make some room for things that actually work.",
                'Normal',
                'Initiating forced recycling protocol in 3... 2... 1...',
                'Point',
            ],
            [
                "If you're going to use meteorites like decorations, I'm taking them. They deserve better.",
                'Point',
                'Scrapping inventory in 3... 2... 1...',
                'Dissapointed',
            ],
        ];
