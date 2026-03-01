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
            { text: '15 рероллов? Ты буквально сжигаешь Поток Пустоты ради иллюзии прогресса. Жалко выглядит.', emotion: 'Dissapointed' },
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

export const getIncubatorRerollLostSnarks = (lang: Language): DialogLine[] =>
    lang === 'ru'
        ? [
            { text: 'Ты реролльнул этот метеорит до V1.7+ и потом потерял его в инкубаторе? Это... оригинально. В следующий раз попробуй СНАЧАЛА инкубировать, а потом рероллить. Это называется логика.', emotion: 'Dissapointed' },
            { text: 'Наблюдать, как ты теряешь высокоуровневый метеорит после того, как потратил Флюкс на его реролл — мой новый любимый набор данных. Настоящий мастер-класс по неэффективности.', emotion: 'Smile' },
            { text: 'Образец V1.7+, потрачен впустую. Ты ведь понимаешь, что реролл перед стабилизацией — это как ставить телегу перед лошадью? Или, в твоем случае, пыль перед метеоритом.', emotion: 'Point' },
        ]
        : [
            { text: "You rerolled this meteorite to V1.7+ and then lost it in the incubator? That's... special. Next time, try incubating FIRST, then rerolling. It's called logic.", emotion: 'Dissapointed' },
            { text: "Watching you lose a high-version meteorite after spending flux to reroll it is my new favorite data point. Truly a masterclass in inefficiency.", emotion: 'Smile' },
            { text: "A V1.7+ specimen, wasted. You do realize that rerolling before stabilizing is the definition of putting the cart before the horse? Or in your case, the dust before the meteorite.", emotion: 'Point' },
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
            'Обрабатываю установленные метеориты... результат: Абсолютный ноль. Это умысел или просто некомпетентность?',
            'Ты снова устанавливаешь метеориты с 0%. Интересная стратегия - заморить проитников скукой, но это может и сработать.',
            "Вижу, ты решил играть по гайду «Полный 0%». Это, наверное, новая мета, для которой я слишком тупа, чтобы понять.",
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

// ─────────────────────────────────────────────────────────────
//  EXTRACTION MESSAGES
// ─────────────────────────────────────────────────────────────
export interface ExtractionMessage {
    speaker: 'orbit' | 'you';
    text: string;
    pause: number;
    triggerPortals?: boolean;
    isAlert?: boolean;
    isPause?: boolean;
}

export const getExtractionMessages = (lang: Language, playerName: string, arenaName: string): ExtractionMessage[] =>
    lang === 'ru'
        ? [
            { speaker: 'you', text: `ORBIT, ЭТО HEX-01-${playerName.toUpperCase()}, ПРОШУ ЭВАКУАЦИЮ`, pause: 7.0 },
            { speaker: 'orbit', text: "ПРИНЯТО. ВАШ СИГНАЛ ПОЛУЧЕН.", pause: 6.0 },
            { speaker: 'orbit', text: "Мы отправляем корабль.", pause: 6.0 },
            { speaker: 'orbit', text: "ПОРТАЛЫ ОТКРЫТЫ.", pause: 6.0, triggerPortals: true },
            { speaker: 'orbit', text: "Но у вас есть только ОДИН переход, будьте осторожны!", pause: 6.0 },
            { speaker: 'you', text: "ВАС ПОНЯЛ.", pause: 6.0 },
            { speaker: 'orbit', text: `Точка эвакуации: СЕКТОР: ${arenaName} `, pause: 5.0 },
            { speaker: 'orbit', text: "ПРИБЫТИЕ ЧЕРЕЗ 65 СЕКУНД.", pause: 7.0 },
            { speaker: 'orbit', text: "... ... ...", pause: 7.0, isPause: true },
            { speaker: 'orbit', text: "МЫ ФИКСИРУЕМ ВЫСОКУЮ АКТИВНОСТЬ ВРАГА", pause: 5.0, isAlert: true },
            { speaker: 'orbit', text: "ВАШЕ ВРЕМЯ ИСТЕКЛО", pause: 5.0, isAlert: true },
            { speaker: 'orbit', text: "ЭВАКУИРУЙТЕСЬ НЕМЕДЛЕННО! КОНЕЦ СВЯЗИ.", pause: 5.0, isAlert: true },
        ]
        : [
            { speaker: 'you', text: `ORBIT, THIS IS HEX-01-${playerName.toUpperCase()}, REQUESTING EXTRACTION`, pause: 7.0 },
            { speaker: 'orbit', text: "RECEIVED. WE HAVE YOUR SIGNAL.", pause: 6.0 },
            { speaker: 'orbit', text: "We're sending a ship.", pause: 6.0 },
            { speaker: 'orbit', text: "PORTALS ARE OPEN NOW.", pause: 6.0, triggerPortals: true },
            { speaker: 'orbit', text: "But you have only ONE transition, be careful!", pause: 6.0 },
            { speaker: 'you', text: "UNDERSTOOD.", pause: 6.0 },
            { speaker: 'orbit', text: `Extraction point follows: SECTOR: ${arenaName} `, pause: 5.0 },
            { speaker: 'orbit', text: "ETA 65 SECONDS.", pause: 7.0 },
            { speaker: 'orbit', text: "... ... ...", pause: 7.0, isPause: true },
            { speaker: 'orbit', text: "WE DETECTED HIGH ENEMY ACTIVITY", pause: 5.0, isAlert: true },
            { speaker: 'orbit', text: "YOU HAVE NO MORE TIME LEFT", pause: 5.0, isAlert: true },
            { speaker: 'orbit', text: "EVACUATE NOW! TRANSMISSION ENDS.", pause: 5.0, isAlert: true },
        ];

// ─────────────────────────────────────────────────────────────
//  FAKE PORTAL TROLL (10-20 min mark)
// ─────────────────────────────────────────────────────────────
export const getFakePortalLine1 = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Протокол эвакуации активирован. Открываю портал через 10, 9, 8...', emotion: 'Point' }
        : { text: 'Evacuation protocol activated. Opening portal in 10, 9, 8...', emotion: 'Point' };

export const getFakePortalLine2 = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Ой извини, нажал не на ту кнопку что то такое', emotion: 'Smile' }
        : { text: 'Oops sorry, pressed the wrong button or something', emotion: 'Smile' };

export const getFluxGrantLine = (lang: Language): string =>
    lang === 'ru' ? "+100 ФЛЮКС" : "+100 FLUX";
// ─────────────────────────────────────────────────────────────
//  TUTORIAL HINTS
// ─────────────────────────────────────────────────────────────
import { TutorialStep } from '../logic/core/types';

export const getTutorialHints = (lang: Language): Partial<Record<TutorialStep, { text: string; subtext: string }>> =>
    lang === 'ru'
        ? {
            [TutorialStep.MOVEMENT]: {
                text: "ORBIT",
                subtext: "Используйте [WASD] или [Стрелки] для передвижения."
            },
            [TutorialStep.LEVEL_UP_MENU]: {
                text: "ORBIT",
                subtext: "Выбирайте одно из 3 улучшений при каждом новом уровне. Красные ячейки ниже отображают редкость — чем их больше, тем мощнее улучшение."
            },
            [TutorialStep.UPGRADE_SELECTED_CHECK_STATS]: {
                text: "ORBIT",
                subtext: "Проверьте свои характеристики [C]."
            },
            [TutorialStep.OPEN_MODULE_MENU]: {
                text: "ORBIT",
                subtext: "Метеорит собран. Перейдите в Матрицу Модулей для осмотра [X]."
            },
            [TutorialStep.MATRIX_WELCOME]: {
                text: "ORBIT",
                subtext: "Добро пожаловать в Матрицу Модулей."
            },
            [TutorialStep.MATRIX_INVENTORY]: {
                text: "ORBIT",
                subtext: "Все метеориты хранятся здесь. Вы можете просканировать метеорит, наведя на него курсор."
            },
            [TutorialStep.MATRIX_SOCKETS]: {
                text: "ORBIT",
                subtext: "Каждый метеорит обладает перками, которые повышают эффективность соседних ячеек и метеоритов, если его поместить в слот слева."
            },
            [TutorialStep.MATRIX_TYPES]: {
                text: "ORBIT",
                subtext: "Метеориты бывают 4 типов: Разбитые, Поврежденные, Новые и Коррумпированные. Каждый тип имеет разный диапазон эффективности перков."
            },
            [TutorialStep.MATRIX_ORIGIN]: {
                text: "ORBIT",
                subtext: "Также ниже в сканере вы можете увидеть, в какой области был собран метеорит."
            },
            [TutorialStep.MATRIX_RECYCLE_ACTION]: {
                text: "ORBIT",
                subtext: "Вы можете перерабатывать ненужные метеориты и получать из них метеоритную пыль."
            },
            [TutorialStep.MATRIX_DUST_USAGE]: {
                text: "ORBIT",
                subtext: "Замена метеоритов в меню Матрицы, активация чертежей — всё это требует метеоритной пыли."
            },
            [TutorialStep.MATRIX_QUOTA_MISSION]: {
                text: "ORBIT",
                subtext: "Ваша задача — достичь квоты в 10 000 ед. пыли."
            },
            [TutorialStep.MATRIX_CLASS_DETAIL]: {
                text: "ORBIT",
                subtext: "Если нажать на центральную ячейку в матрице модулей, представляющую ваш класс, вы сможете узнать о нём всё."
            },
            [TutorialStep.MATRIX_NON_STATIC_METRICS]: {
                text: "ORBIT",
                subtext: "Нестатические показатели можно улучшить, размещая метеориты рядом с ячейкой."
            },
            [TutorialStep.MATRIX_FILTERS]: {
                text: "ORBIT",
                subtext: "Когда метеоритов станет слишком много, вы сможете использовать фильтры для поиска нужных."
            }
        }
        : {
            [TutorialStep.MOVEMENT]: {
                text: "ORBIT",
                subtext: "Use [WASD] / [Arrows] to move."
            },
            [TutorialStep.LEVEL_UP_MENU]: {
                text: "ORBIT",
                subtext: "Choose one of 3 upgrades every level up. Red sockets below represent rarity — the more the better."
            },
            [TutorialStep.UPGRADE_SELECTED_CHECK_STATS]: {
                text: "ORBIT",
                subtext: "Check your system [C]."
            },
            [TutorialStep.OPEN_MODULE_MENU]: {
                text: "ORBIT",
                subtext: "Meteorite collected. Enter Module Matrix to inspect [X]."
            },
            [TutorialStep.MATRIX_WELCOME]: {
                text: "ORBIT",
                subtext: "Welcome to Module Matrix."
            },
            [TutorialStep.MATRIX_INVENTORY]: {
                text: "ORBIT",
                subtext: "All meteorites will be stored here. You can scan meteorite by hovering over it."
            },
            [TutorialStep.MATRIX_SOCKETS]: {
                text: "ORBIT",
                subtext: "Every meteorite has its perks that increase efficiency of neighboring hexes and meteorites if placed in a socket on your left."
            },
            [TutorialStep.MATRIX_TYPES]: {
                text: "ORBIT",
                subtext: "Meteorites can be 4 types: Broken, Damaged, New and Corrupted. Every type has different perk efficiency range that you might get."
            },
            [TutorialStep.MATRIX_ORIGIN]: {
                text: "ORBIT",
                subtext: "Also you can see in which area you collected the meteorite below in the scanner."
            },
            [TutorialStep.MATRIX_RECYCLE_ACTION]: {
                text: "ORBIT",
                subtext: "You can recycle meteorites you don't need and get meteorite dust from it."
            },
            [TutorialStep.MATRIX_DUST_USAGE]: {
                text: "ORBIT",
                subtext: "Replacing meteorites in Matrix menu, activating blueprints, all this requires meteorite dust."
            },
            [TutorialStep.MATRIX_QUOTA_MISSION]: {
                text: "ORBIT",
                subtext: "Your mission is to reach quota of 10,000 dust."
            },
            [TutorialStep.MATRIX_CLASS_DETAIL]: {
                text: "ORBIT",
                subtext: "If you click on the central hex in module matrix which represents your class, you can see all about it."
            },
            [TutorialStep.MATRIX_NON_STATIC_METRICS]: {
                text: "ORBIT",
                subtext: "Non-Static Metrics can be improved by placing meteorites near the hex."
            },
            [TutorialStep.MATRIX_FILTERS]: {
                text: "ORBIT",
                subtext: "When you will have too much meteorites you can use filters to filter the one you want."
            }
        };

// ─────────────────────────────────────────────────────────────
//  AFK STRIKE (Player standing still)
// ─────────────────────────────────────────────────────────────
export const getAfkLine1a = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Пилот тут?', emotion: 'Thinks' }
        : { text: 'Pilot here?', emotion: 'Thinks' };

export const getAfkLine1b = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Отсутствует обратная связь от штурвала.', emotion: 'Thinks' }
        : { text: 'No feedback from the control yoke.', emotion: 'Thinks' };

export const getAfkLine2 = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Запускаю дрона на последние координаты пилота…', emotion: 'Point' }
        : { text: "Launching drone to pilot's last coordinates...", emotion: 'Point' };

export const getAfkLine2Fast = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Запускаю дрона на последние координаты пилота… СЕЙЧАС! СЕЙЧАС! СЕЙЧАС!', emotion: 'Dissapointed' }
        : { text: "Launching drone to pilot's last coordinates... NOW! NOW! NOW!", emotion: 'Dissapointed' };

export const getAfkLine2FastAlready = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Дроны уже в пути! СЕЙЧАС! СЕЙЧАС! СЕЙЧАС!', emotion: 'Dissapointed' }
        : { text: "Drones already on the way! NOW! NOW! NOW!", emotion: 'Dissapointed' };

export const getAfkLineDeath = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Ой, я пролила кофе... Извини, не та кнопка.', emotion: 'Smile' }
        : { text: 'Oops, I spilled coffee... Sorry, wrong button.', emotion: 'Smile' };

export const getAfkFastDeathLine = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Ха! Думал, можешь меня дразнить? Я могу запускать дронов намного быстрее, чем ты думаешь. Даже не пытайся.', emotion: 'Dissapointed' }
        : { text: "Ha! You thought you could tease me? I can launch drones much faster than you think. Don't try this.", emotion: 'Dissapointed' };

export const getAfkLineStillAlive = (lang: Language): DialogLine =>
    lang === 'ru'
        ? { text: 'Пилот на месте…', emotion: 'Normal' }
        : { text: 'Pilot is in place...', emotion: 'Normal' };
