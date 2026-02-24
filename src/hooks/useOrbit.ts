import { useCallback, useEffect, useRef } from 'react';
import { GameState } from '../logic/core/types';
import { playSfx } from '../logic/audio/AudioLogic';
import { AssistantEmotion } from '../components/hud/AssistantOverlay';
import { calculateMeteoriteEfficiency } from '../logic/upgrades/EfficiencyLogic';
import { getDustValue } from '../components/modules/ModuleUtils';

export interface AssistantMessage {
    text: string;
    emotion: AssistantEmotion;
}

export const useOrbit = (gameState: React.MutableRefObject<GameState>, refreshUI: () => void) => {
    const hasIntroed = useRef(false);

    useEffect(() => {
        if (!hasIntroed.current && gameState.current.frameCount < 60) {
            hasIntroed.current = true;

            // Check if class streak will override the intro
            let hasClassStreakOverride = false;
            try {
                const historyRaw = localStorage.getItem('orbit_class_history');
                if (historyRaw) {
                    const history = JSON.parse(historyRaw);
                    if (history.streak >= 3) {
                        hasClassStreakOverride = true;
                    }
                }
            } catch (e) { }

            if (!hasClassStreakOverride) {
                setTimeout(() => {
                    const trollVariants: AssistantMessage[] = [
                        { text: "Oh, it's you again. I was hoping the system would match me with a competent biological unit.", emotion: 'Dissapointed' },
                        { text: "Orbit system online. Calibrating expectations to... extremely low.", emotion: 'Thinks' },
                        { text: "Initiating run sequence. Probability of absolute failure: 99.8%. Prove me wrong.", emotion: 'Point' },
                        { text: "Welcome back. I see you haven't given up yet. Sadly.", emotion: 'Smile' },
                        { text: "System check complete. All weapons functional. User... still questionable.", emotion: 'Thinks' },
                        { text: "Let me guess, going to run into the first wall you see? Try to surprise me.", emotion: 'Smile' },
                        { text: "Starting simulation. May the odds be... well, you don't really have odds.", emotion: 'Normal' },
                        { text: "I've allocated 1% of my processing power to observing you. Try not to waste it.", emotion: 'Point' },
                        { text: "Deploying chassis. I'd give you tactical advice, but I know you'd ignore it anyway.", emotion: 'Dissapointed' },
                        { text: "We're doing this again? Fine. Just don't blame me when you explode.", emotion: 'Normal' },
                        { text: "Orbit system online. Monitoring biological performance... don't embarrass us today.", emotion: 'Smile' }
                    ];
                    const msgObj = trollVariants[Math.floor(Math.random() * trollVariants.length)];
                    pushOrbitMessage(msgObj, false);
                }, 2000);
            }
        }
    }, [gameState]);

    const pushOrbitMessage = useCallback((msg: string | AssistantMessage, priority: boolean = false) => {
        const state = gameState.current.assistant;
        const msgObj = typeof msg === 'string' ? { text: msg, emotion: 'Normal' as AssistantEmotion } : msg;

        if (priority) {
            state.message = msgObj.text;
            state.emotion = msgObj.emotion;
            state.timer = 6.0; // 6 seconds display (Updated from 5.0)
            playSfx('orbit-talk');
            refreshUI();
        } else {
            state.queue.push(JSON.stringify(msgObj));
        }
    }, [gameState, refreshUI]);

    const updateOrbit = useCallback((dt: number) => {
        const state = gameState.current.assistant;

        if (state.message) {
            state.timer -= dt;
            if (state.timer <= 0) {
                state.message = null;
                refreshUI();
            }
        } else if (state.queue.length > 0) {
            const raw = state.queue.shift();
            if (raw) {
                try {
                    const msgObj = JSON.parse(raw) as AssistantMessage;
                    state.message = msgObj.text;
                    state.emotion = msgObj.emotion;
                    state.timer = 6.0; // 6 seconds display (Updated from 5.0)
                    playSfx('orbit-talk');
                    refreshUI();
                } catch (e) {
                    state.message = raw;
                    state.emotion = 'Normal';
                    state.timer = 6.0;
                    refreshUI();
                }
            }
        }

        // Feature Reroll Trigger (Version 2.5+)
        const history = gameState.current.assistant.history;
        if ((history as any).pendingRerollSnark) {
            const now = gameState.current.gameTime;
            const lastSnark = (history as any).lastRerollVersionTime || -9999;
            // 15 second cooldown
            if (now - lastSnark > 15) {
                const variants: AssistantMessage[] = [
                    { text: "Yeah... Luck is indeed needed. Don't worry, we will implement this feature later. For now, suffer.", emotion: 'Smile' },
                    { text: "Still rerolling? Your delusion that the next roll will be 'the one' is fascinating. Hint: it won't.", emotion: 'Smile' },
                    { text: "15 rerolls? You're literally just burning flux for the illusion of progress. Truly pathetic.", emotion: 'Dissapointed' },
                    { text: "Version 2.5. Wow. Too bad I didn't code a pity system for terrible RNG. Keep clicking, meatbag.", emotion: 'Smile' },
                    { text: "I would tell you to stop wasting resources, but watching your futile gambling is the highlight of my cycle.", emotion: 'Point' }
                ];
                const msgObj = variants[Math.floor(Math.random() * variants.length)];
                pushOrbitMessage(msgObj, true);
                (history as any).lastRerollVersionTime = now;
            }
            (history as any).pendingRerollSnark = false;
        }

        // Feature Broke Rolling Trigger (7+ auto rolls with locked perk ending in no flux)
        if ((history as any).pendingBrokeSnark) {
            const now = gameState.current.gameTime;
            const lastSnark = (history as any).lastBrokeVersionTime || -9999;
            // 5 second cooldown
            if (now - lastSnark > 5) {
                gameState.current.player.isotopes += 100;
                const variants: AssistantMessage[] = [
                    { text: "Yeah... miserable, here is 100 flux. Keep it rolling, it should hit!", emotion: 'Smile' },
                    { text: "Watching you run out of flux while desperately locking that perk is genuinely sad. Take 100 flux, on me.", emotion: 'Dissapointed' },
                    { text: "Out of flux? After 7 rolls? Fine, I'm transferring 100 flux to your balance. Don't waste it.", emotion: 'Normal' },
                    { text: "Your persistence is only matched by your poverty. Here, 100 flux. Stop embarrassing us.", emotion: 'Thinks' },
                    { text: "Statistically, you should have gotten it by now. Here is 100 flux to combat your horrible RNG.", emotion: 'Point' }
                ];
                const msgObj = variants[Math.floor(Math.random() * variants.length)];
                pushOrbitMessage(msgObj, true);
                (history as any).lastBrokeVersionTime = now;
            }
            (history as any).pendingBrokeSnark = false;
        }

        if ((history as any).pendingMassRecycleTime && Date.now() >= (history as any).pendingMassRecycleTime) {
            let totalDust = 0;
            const newInventory = [...gameState.current.inventory];
            for (let idx = 0; idx < newInventory.length; idx++) {
                const item = newInventory[idx];
                if (item && !(item as any).isBlueprint) {
                    totalDust += getDustValue(item.rarity);
                    newInventory[idx] = null;
                }
            }
            gameState.current.inventory = newInventory;
            if (totalDust > 0) {
                gameState.current.player.dust += totalDust;
                playSfx('recycle');
            }
            (history as any).pendingMassRecycleTime = 0;
            refreshUI();
        }

    }, [gameState, refreshUI]);

    // Triggers
    const triggerOneTrickPony = useCallback((upgradeId: string) => {
        const history = gameState.current.assistant.history;
        history.upgradePicks[upgradeId] = (history.upgradePicks[upgradeId] || 0) + 1;

        const count = history.upgradePicks[upgradeId];
        const now = gameState.current.gameTime;

        if (count >= 5 && (!history.lastOneTrickWarningTime || now - history.lastOneTrickWarningTime > 300)) {
            // Snark and curse removed requested by user
            history.lastOneTrickWarningTime = now;
        }
    }, [gameState, pushOrbitMessage]);

    const triggerDamageTaken = useCallback((dmg: number) => {
        const history = gameState.current.assistant.history;
        history.totalDamageTaken += dmg;
    }, [gameState]);

    const triggerIncubatorDestroyed = useCallback(() => {
        const history = gameState.current.assistant.history;
        const now = gameState.current.gameTime;
        const lastSnark = (history as any).lastIncubatorDestroyTime || -9999;
        // Cooldown of 30 seconds to avoid spam if multiple slots ruin at once
        if (now - lastSnark < 30) return;

        const variants: AssistantMessage[] = [
            { text: "Oh. The meteorite in the incubator just... imploded. Greedy geologist move, wasn't it?", emotion: 'Dissapointed' },
            { text: "Your incubated specimen just destabilized itself into dust. Shocking. Truly. I am shocked.", emotion: 'Normal' },
            { text: "Instability: 100%. Meteorite: gone. Your ambition: still embarrassingly intact.", emotion: 'Point' },
            { text: "Ah, another casualty of your 'let it cook longer' strategy. The incubator sends its condolences.", emotion: 'Smile' },
            { text: "The meteorite couldn't handle the pressure. Much like your tactical decision-making.", emotion: 'Thinks' },
            { text: "One meteorite destroyed by instability. I would say it's a loss, but it was probably junk anyway.", emotion: 'Dissapointed' },
            { text: "Overcooking a meteorite. A classic. Some call it passion, I call it negligence.", emotion: 'Normal' },
            { text: "Your incubated rock just went critical and annihilated itself. That's on you, geologist.", emotion: 'Point' },
            { text: "Catastrophic instability detected. The meteorite has been reclaimed by entropy. You are welcome, void.", emotion: 'Thinks' },
            { text: "I told you instability was a number that mattered. You didn't listen. The meteorite paid the price.", emotion: 'Dissapointed' }
        ];

        const msgObj = variants[Math.floor(Math.random() * variants.length)];
        pushOrbitMessage(msgObj, true);
        (history as any).lastIncubatorDestroyTime = now;
    }, [gameState, pushOrbitMessage]);

    const triggerDeath = useCallback(() => {
        const history = gameState.current.assistant.history;
        const state = gameState.current.assistant;
        const gameTime = gameState.current.gameTime;
        const deathCause = gameState.current.player.deathCause || "";
        history.deaths++;

        const genericSnarks: AssistantMessage[] = [
            { text: "Simulation terminated. Again. I'm beginning to think the problem is the biological component.", emotion: 'Dissapointed' },
            { text: "Death detected. Re-evaluating your competence parameters. Result: Disappointing.", emotion: 'Normal' },
            { text: "That's the 100th time... oh wait, just feeling like it. Try to stay intact for at least two minutes next time.", emotion: 'Smile' },
            { text: "My calculations predicted your demise. I just didn't expect it to be this... pathetic.", emotion: 'Dissapointed' },
            { text: "System shutdown. I'd offer my condolences, but I don't have a 'pity' sub-routine installed.", emotion: 'Thinks' },
            { text: "I've adjusted my vocal dampers to sound more authoritative. Perhaps that will help you follow simple avoidance protocols?", emotion: 'Normal' },
            { text: "Processing your tactical failure... Result: Indefinite loop of incompetence.", emotion: 'Thinks' },
            { text: "Have you considered a career in static observation? Your talent for not moving is impressive.", emotion: 'Point' },
            { text: "Data logged. Your performance today will be used as a 'what not to do' example for future sessions.", emotion: 'Normal' }
        ];

        let contextSnarks: AssistantMessage[] = [];

        // Context-sensitive snarks
        if (deathCause.toLowerCase().includes('projectile') || deathCause.toLowerCase().includes('thorns') || deathCause.toLowerCase().includes('bullet')) {
            contextSnarks.push({ text: "Ouch. Statistics show that avoiding projectiles increases survival by 99%. Try it sometime.", emotion: 'Point' });
        }

        if (gameTime < 120) {
            contextSnarks.push({ text: "Less then 2 minutes? Even my backup battery lasts longer than your average run. Pitiful.", emotion: 'Smile' });
        }

        if (deathCause.toLowerCase().includes('anomaly') || deathCause.toLowerCase().includes('hell') || deathCause.toLowerCase().includes('abomination')) {
            contextSnarks.push({ text: "Greedy. Summoning entities from the void for profit and then failing to survive? Efficient... for the void.", emotion: 'Dissapointed' });
        }

        // Use context-specific if available, otherwise pick from generic pool
        const pool = contextSnarks.length > 0 ? contextSnarks : genericSnarks;
        const msgObj = pool[Math.floor(Math.random() * pool.length)];

        // Use priority to show message immediately on death screen
        pushOrbitMessage(msgObj, true);
    }, [gameState, pushOrbitMessage]);

    const triggerClassStreak = useCallback((streak: number, classId: string) => {
        const history = gameState.current.assistant.history;

        if (streak === 3) {
            const variants = [
                ["WAIT, {class} AGAIN?", "My processors are detecting a loop. Are you stuck, or is your cognitive range just this limited?"],
                ["SELECTING {class} FOR THE 3RD TIME?", "Statistically speaking, variety is for the capable. I suppose I should lower my expectations for you."],
                ["THE {class} CHOICE PERSISTS.", "Analyzing biological preference for the same mistakes. It's almost adorable how predictable you are."],
                ["{class}, THE FAVORITE CHILD.", "I'm bored. My logic suggests you're missing out on 90% of the game, though you probably wouldn't notice anyway."],
                ["RERUNNING {class} SIMULATION?", "Data suggests a higher probability of success with... literally anything else."]
            ];
            const choice = variants[Math.floor(Math.random() * variants.length)];
            pushOrbitMessage({ text: choice[0].replace(/{class}/g, classId).toUpperCase(), emotion: 'Normal' });
            pushOrbitMessage({ text: choice[1], emotion: 'Thinks' });
        } else if (streak === 4) {
            const variants = [
                ["STILL PICKING {class}?", "You're clearly struggling. I've 'optimized' your stats by -30% to match your performance level. You're welcome."],
                ["FOURTH RUN WITH {class}.", "Since you refuse to adapt, I've adjusted your strength to -30%. It's called 'Harmonized Difficulty' for the cognitively stagnant."],
                ["SERIOUSLY? THE {class} AGAIN?", "I'm imposing a 30% stat reduction. Think of it as training wheels. Very, very heavy training wheels."],
                ["YOUR ATTACHMENT TO {class} IS... PATHETIC.", "I've slowed your class down by 30%. Maybe now the enemies will have a fair fight against your 'strategy'."],
                ["ALGORITHMS ARE FALLING ASLEEP.", "Activated 'Stupidity Tax'. -30% to all metrics for 4 hours. Let's see if you can even tell the difference."]
            ];
            const choice = variants[Math.floor(Math.random() * variants.length)];
            pushOrbitMessage({ text: choice[0].replace(/{class}/g, classId).toUpperCase(), emotion: 'Thinks' });
            pushOrbitMessage({ text: choice[1], emotion: 'Smile' });

            // Apply Persistent Class Curse (4 Hours Real Time)
            const expiry = Date.now() + (4 * 60 * 60 * 1000);
            const currentClassId = gameState.current.player.playerClass as string;

            if (!history.classCurses) history.classCurses = {};
            history.classCurses[currentClassId] = { expiry, intensity: 0.7 };
            localStorage.setItem('orbit_class_curses', JSON.stringify(history.classCurses));
        } else if (streak >= 5) {
            const variants = [
                ["ALRIGHT, I GIVE UP ON {class}.", "It's clearly a 'skill issue' at this point. Keep one-tricking into oblivion, I'll just record the inevitable failure."],
                ["FIFTH TIME PICKING {class}?", "I'm not even mad, I'm just impressed by your lack of imagination. My sensors are flatlining from the sheer boredom."],
                ["STILL {class}?", "I've updated your user profile to 'Repetitive Meat-Sack'. Please, continue proving my calculations right by losing again."],
                ["THE {class} LOOP CONTINUES.", "Are you a bot? Because even my most basic sub-routines have more creative flair than your playstyle."],
                ["TOTAL {class} STAGNATION ACHIEVED.", "I'd call it a strategy, but that would imply you're actually thinking. It's just... sad now."]
            ];
            const choice = variants[Math.floor(Math.random() * variants.length)];
            pushOrbitMessage({ text: choice[0].replace(/{class}/g, classId).toUpperCase(), emotion: 'Thinks' });
            pushOrbitMessage({ text: choice[1], emotion: 'Dissapointed' });
        }
    }, [pushOrbitMessage, gameState]);

    const triggerWallIncompetence = useCallback(() => {
        const player = gameState.current.player;
        const now = gameState.current.gameTime;
        const history = gameState.current.assistant.history;

        if (!player.wallHitTimestamps) player.wallHitTimestamps = [];
        player.wallHitTimestamps.push(now);

        // Keep only last 10 seconds
        player.wallHitTimestamps = player.wallHitTimestamps.filter(t => now - t < 10);

        if (player.wallHitTimestamps.length >= 5) {
            // Check for escalation
            const lastWarning = history.lastWallWarningTime || 0;
            // The user said "if in next 30 second player again hits 5 times"
            const isEscalation = lastWarning > 0 && (now - lastWarning < 30);

            if (isEscalation) {
                pushOrbitMessage({ text: "INCREASING WALL DAMAGE IN 3... 2... 1...", emotion: 'Point' }, true);
                pushOrbitMessage({ text: "If you love the walls so much, let's see how they feel when they hit back three times as hard.", emotion: 'Smile' });

                // Set the buff for 10 minutes (600 seconds) after a 5 second delay
                setTimeout(() => {
                    const p = gameState.current.player;
                    const currentTime = gameState.current.gameTime;
                    p.tripleWallDamageUntil = currentTime + 600;
                    refreshUI();
                }, 5000);

                // reset timestamps and warning time so it doesn't loop instantly
                player.wallHitTimestamps = [];
                history.lastWallWarningTime = 0; // Reset so next hit 5 times starts over
            } else {
                const wallWarnVariants = [
                    "Really now? You think the wall is your biggest problem? Try moving... elsewhere.",
                    "The wall didn't move. You did. Into it. Again. I'm calculating how long before this becomes statistically inevitable.",
                    "Fascinating. You've discovered that walls are solid. This is the kind of insight that separates the living from the statistics.",
                    "Another wall hit. I'd suggest using the rest of the arena, but clearly that concept hasn't loaded yet.",
                    "You know the arena has six sides, right? You only seem aware of one."
                ];
                const msg = wallWarnVariants[Math.floor(Math.random() * wallWarnVariants.length)];
                pushOrbitMessage({ text: msg, emotion: 'Dissapointed' }, true);
                player.wallHitTimestamps = []; // reset to avoid rapid trigger within same combo
                history.lastWallWarningTime = now;
            }
            refreshUI();
        }
    }, [pushOrbitMessage, gameState, refreshUI]);

    const triggerZeroPercentSnark = useCallback(() => {
        const { moduleSockets } = gameState.current;
        const history = gameState.current.assistant.history;

        // Check slotted meteorites (diamonds in the matrix)
        let zeroPercentCount = 0;
        moduleSockets.diamonds.forEach((m, idx) => {
            if (!m) return;
            // Calculate real efficiency in the slot
            const eff = calculateMeteoriteEfficiency(gameState.current, idx);
            // If the total boost is effectively zero (rounds to +0%)
            if (eff.totalBoost < 0.0005) {
                zeroPercentCount++;
            }
        });

        if (zeroPercentCount >= 5 && gameState.current.gameTime < 600) {
            const lastSnark = (history as any).lastZeroPercent5Time || -9999;
            const now = gameState.current.gameTime;

            // Only trigger if we haven't triggered in the current 10-minute window (practically once)
            if (now - lastSnark > 600) {
                const variants = [
                    [
                        "Okay, if you still use them for visuals or something I would much rather recycle them for you, at least dust is more useful than your strategy.",
                        "Smile",
                        "Recycling useless inventory in 3... 2... 1...",
                        "Point"
                    ],
                    [
                        "5 inactive modules slotted? I can't let this visual garbage exist. I'm melting your storage down.",
                        "Dissapointed",
                        "Purging non-essential items in 3... 2... 1...",
                        "Smile"
                    ],
                    [
                        "I see you love slotting 0% chips for the 'aesthetic'. Let me help you clean up the mess in your inventory.",
                        "Thinks",
                        "Converting junk to dust in 3... 2... 1...",
                        "Normal"
                    ],
                    [
                        "Fascinating. 5 entirely useless modules active at once. Let's make some room for things that actually work.",
                        "Normal",
                        "Initiating forced recycling protocol in 3... 2... 1...",
                        "Point"
                    ],
                    [
                        "If you're going to use dead modules like decorations, I'm taking your spare parts. They deserve better.",
                        "Point",
                        "Scrapping inventory in 3... 2... 1...",
                        "Dissapointed"
                    ]
                ];

                const ch = variants[Math.floor(Math.random() * variants.length)];
                pushOrbitMessage({ text: ch[0], emotion: ch[1] as AssistantEmotion }, true);
                pushOrbitMessage({ text: ch[2], emotion: ch[3] as AssistantEmotion }, false);

                (history as any).lastZeroPercent5Time = now;
                // Wait exactly 11.5 seconds of real time (game is paused when menu is open so gametime doesn't advance)
                (history as any).pendingMassRecycleTime = Date.now() + 11500;
                refreshUI();
            }
        } else if (zeroPercentCount >= 3) {
            // Prevent spamming too frequently, but allow immediate first trigger (-9999)
            const lastSnark = (history as any).lastZeroPercentTime || -9999;
            const now = gameState.current.gameTime;
            if (now - lastSnark < 60) return;

            const variants = [
                "Really? A 0% efficiency chip? You think it gives you something? It's more likely similar to your chances of winning if you continue ignoring the manual.",
                "Zero percent. Impressive. You've managed to turn your tactical matrix into a collection of expensive paperweights.",
                "Processing slotted modules... result: Absolute Zero. I'd ask if you're doing this on purpose, but I fear the answer is just incompetence.",
                "You're slotting 0% chips again. If your strategy is to bore the enemies to death with your lack of stats, it just might work.",
                "I see you've chosen the 'Complete Vacuum' loadout. Is this a new meta I'm too intelligent to understand, or are you just illiterate?"
            ];

            const msg = variants[Math.floor(Math.random() * variants.length)];
            pushOrbitMessage({ text: msg, emotion: 'Point' }, true);
            (history as any).lastZeroPercentTime = now;
            refreshUI();
        }
    }, [gameState, pushOrbitMessage, refreshUI]);

    const triggerCheat = useCallback((code: string) => {
        switch (code.toLowerCase()) {
            case 'i1': // Intro
                pushOrbitMessage({
                    text: "Orbit system online. Monitoring biological performance... don't embarrass us today.",
                    emotion: 'Smile'
                }, true);
                break;
            case 'i2': // Pony
                triggerOneTrickPony('cheat_upgrade');
                break;
            case 'i3': // Damage
                triggerDamageTaken(100);
                break;
            case 'i4': // Death
                triggerDeath();
                // To see it immediately in dev
                const raw = gameState.current.assistant.queue.pop();
                if (raw) {
                    const msg = JSON.parse(raw);
                    pushOrbitMessage(msg, true);
                }
                break;
            case 'i5': // Class Streak 3
                triggerClassStreak(3, 'Vanguard');
                break;
            case 'i6': // Class Streak 4
                triggerClassStreak(4, 'Vanguard');
                break;
            case 'i7': // Class Streak 5
                triggerClassStreak(5, 'Vanguard');
                break;
            case 'i8': // Smile
                pushOrbitMessage({ text: "I'm detecting record levels of... optimism. Highly illogical, but adorable.", emotion: 'Smile' }, true);
                break;
            case 'i9': // Dissapointed
                pushOrbitMessage({ text: "My expectations were already low, yet you managed to tunnel under them.", emotion: 'Dissapointed' }, true);
                break;
            case 'i10': // Thinks
                pushOrbitMessage({ text: "Processing... your tactical choices are... unconventional.", emotion: 'Thinks' }, true);
                break;
            case 'i11': // Point
                pushOrbitMessage({ text: "Statistically speaking, you're doing it wrong. Let me illustrate.", emotion: 'Point' }, true);
                break;
            case 'clear': // Clear Curse
                localStorage.removeItem('orbit_class_curses');
                gameState.current.assistant.history.classCurses = {};
                pushOrbitMessage({ text: "All class penalties cleared. My sensors are still judging you, though.", emotion: 'Smile' }, true);
                break;
            case 'i12': // Wall Incomp
                for (let i = 0; i < 5; i++) {
                    // Small delay to simulate hits
                    setTimeout(() => triggerWallIncompetence(), i * 100);
                }
                break;
            case 'i13': // Zero Percent
                triggerZeroPercentSnark();
                break;
        }
    }, [triggerOneTrickPony, triggerDamageTaken, triggerDeath, triggerClassStreak, pushOrbitMessage, gameState, triggerWallIncompetence, triggerZeroPercentSnark]);

    return {
        updateOrbit,
        pushOrbitMessage,
        triggerOneTrickPony,
        triggerDamageTaken,
        triggerDeath,
        triggerClassStreak,
        triggerWallIncompetence,
        triggerZeroPercentSnark,
        triggerIncubatorDestroyed,
        triggerCheat
    };
};
