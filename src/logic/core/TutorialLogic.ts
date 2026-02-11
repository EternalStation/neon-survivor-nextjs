import { GameState, TutorialStep } from './types';

// Configuration for Hints (Expanded for Matrix Tour)
export const TUTORIAL_HINTS: Partial<Record<TutorialStep, { text: string; subtext: string }>> = {
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
        subtext: "Meteorites can be 4 types: Broken, Damaged, Pristine and Corrupted. Every type has different perk efficiency range that you might get."
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



export const updateTutorial = (gameState: GameState, dt: number) => {
    const { tutorial, player, inventory } = gameState;

    if (!tutorial.isActive || tutorial.currentStep === TutorialStep.COMPLETE) return;

    tutorial.stepTimer += dt;

    // --- State Trackers ---

    // Movement Tracker (Logic should be called from PlayerLogic ideally, but we can infer from position change for now or just trust the keys passed to useGameLogic... wait, useGameLogic has keys!)
    // We'll update keys in a separate function if needed, or just check player movement.
    // Actually, let's assume `updateTutorial` receives keys or we just check if player moves significantly.
    // Better: let's track distinct WASD keys pressed. 
    // Since we don't have direct access to keys here easily without changing signature, let's fallback to checking if player moves.
    // PROPOSAL: The user wants "clicks at least two keybind like W and S". 
    // We will need to hook into `updatePlayer` or `useGameLogic` to feed key presses.
    // For now, let's assume we can check if player.x/y changes in a specific way? No.
    // Let's rely on `tutorial.pressedKeys` which we will update from `useGameLogic`.

    // Metorite Collection
    if (gameState.meteoritesPickedUp > 0 && !tutorial.hasCollectedMeteorite) {
        tutorial.hasCollectedMeteorite = true;
    }

    // Kill Count
    if (gameState.killCount > 0 && !tutorial.hasKilled) {
        tutorial.hasKilled = true;
    }

    // Opened Menu
    if (gameState.showModuleMenu && !tutorial.hasOpenedModules) {
        tutorial.hasOpenedModules = true;
    }

    // Opened Stats
    if (gameState.showStats && !tutorial.hasOpenedStats) {
        tutorial.hasOpenedStats = true;
    }


    // --- Step Transition Logic ---
    switch (tutorial.currentStep) {
        case TutorialStep.MOVEMENT:
            // Priority: If player opens upgrade menu before moving, jump to level up hint
            if (gameState.isUpgradeMenuOpen || gameState.pendingLevelUps > 0) {
                advanceStep(gameState, TutorialStep.LEVEL_UP_MENU);
                break;
            }
            // Condition: 2 distinct keys pressed OR joystick movement
            if (tutorial.pressedKeys.size >= 2 || tutorial.hasMoved) {
                advanceStep(gameState, TutorialStep.COMBAT); // COMBAT is hidden/internal
            }
            break;


        case TutorialStep.COMBAT:
            // Wait for first kill
            if (tutorial.hasKilled) {
                advanceStep(gameState, TutorialStep.KILL_ENEMY);
            }
            break;

        case TutorialStep.KILL_ENEMY:
            // Show "FILL XP BAR..."
            // User says: "When player kills enemy and meteorite drops..."
            // So we wait for a meteorite drop? Or just for first kill?
            // "When he kills his first enemy no you can show 'FILL XP BAR...'" 
            // AND "When player kills enemy and meteorite drops from it it will appear a text..."

            // If we have a meteor dropped (we can check gameState.meteorites.length > 0 or verify one dropped near player)
            // Let's check if player has SEEN a meteorite (inventory check?). 
            // "Pickup first meteorite" -> show Module Hint.

            // Let's transition to COLLECT_METEORITE if a meteorite exists in the world.
            // Ensure they see this message for at least a few seconds before switching to meteorite hint
            // "Eliminate threats... should disappear as soon as player will get the upgrade menu"
            if (gameState.pendingLevelUps > 0 || (gameState.upgradingHexIndex !== null)) {
                advanceStep(gameState, TutorialStep.LEVEL_UP_MENU);
            }
            break;

        case TutorialStep.LEVEL_UP_MENU:
            // "Show A/D or arrows... Space to select" - handled by hint mapped to this step
            if (gameState.pendingLevelUps === 0 && !gameState.showLegendarySelection && !gameState.isUpgradeMenuOpen) {
                advanceStep(gameState, TutorialStep.UPGRADE_SELECTED_CHECK_STATS);
            }
            break;

        case TutorialStep.UPGRADE_SELECTED_CHECK_STATS:
            // "Analyze performance [C]."
            // Advance when user has opened and then closed the stats menu
            if (tutorial.hasOpenedStats && !gameState.showStats) {
                advanceStep(gameState, TutorialStep.COLLECT_METEORITE);
            }
            break;

        case TutorialStep.COLLECT_METEORITE:
            // "Wait until meteorite will drop from enemy"
            if (tutorial.hasCollectedMeteorite) {
                advanceStep(gameState, TutorialStep.OPEN_MODULE_MENU);
            }
            break;

        case TutorialStep.OPEN_MODULE_MENU:
            if (tutorial.hasOpenedModules) {
                advanceStep(gameState, TutorialStep.MATRIX_INVENTORY);
                tutorial.stepTimer = 0; // Reset for sequence
            }
            break;

        case TutorialStep.MATRIX_WELCOME:
        case TutorialStep.MATRIX_INVENTORY:
        case TutorialStep.MATRIX_SOCKETS:
        case TutorialStep.MATRIX_TYPES:
        case TutorialStep.MATRIX_ORIGIN:
        case TutorialStep.MATRIX_RECYCLE_ACTION:
        case TutorialStep.MATRIX_DUST_USAGE:
        case TutorialStep.MATRIX_QUOTA_MISSION:
        case TutorialStep.MATRIX_CLASS_DETAIL:
        case TutorialStep.MATRIX_NON_STATIC_METRICS:
        case TutorialStep.MATRIX_FILTERS:
            // No auto-advance. Handled by TutorialOverlay buttons.
            break;
    }
};


const advanceStep = (gameState: GameState, nextStep: TutorialStep) => {
    gameState.tutorial.completedSteps.push(gameState.tutorial.currentStep);
    gameState.tutorial.currentStep = nextStep;
    gameState.tutorial.stepTimer = 0;
};
