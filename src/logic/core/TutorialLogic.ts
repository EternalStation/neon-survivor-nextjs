import { GameState, TutorialStep } from './types';

// Configuration for Hints (Hints for steps 10+ are handled inside ModuleMenu overlay)
export const TUTORIAL_HINTS: Partial<Record<TutorialStep, { text: string; subtext: string }>> = {
    [TutorialStep.MOVEMENT]: {
        text: "MOVEMENT",
        subtext: "WASD / [↑↓←→]"
    },
    [TutorialStep.KILL_ENEMY]: {
        text: "LVL UP",
        subtext: "ELIMINATE THREATS TO INSTALL PROTOCOLS"
    },
    [TutorialStep.LEVEL_UP_MENU]: {
        text: "INSTALL PROTOCOLS",
        subtext: "USE [A/D] OR [ARROWS] TO NAVIGATE, [SPACE] TO SELECT"
    },
    [TutorialStep.UPGRADE_SELECTED_CHECK_STATS]: {
        text: "STATS",
        subtext: "PRESS [C] TO ACCESS STATS"
    },
    [TutorialStep.COLLECT_METEORITE]: {
        text: "RESOURCE DETECTED",
        subtext: ""
    },
    [TutorialStep.OPEN_MODULE_MENU]: {
        text: "HARDWARE ACQUIRED",
        subtext: "PRESS [TAB] OR [M] TO ACCESS MODULE MATRIX"
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
            // Phase 1: Tell him to press C
            // Phase 2: Once inside C, explain diagram and stats
            // Phase 3: Wait until C is closed
            if (tutorial.hasOpenedStats) {
                // He opened it. Now we wait for him to close it.
                if (!gameState.showStats && tutorial.stepTimer > 8.0) { // Give them at least 8s to look at stats
                    advanceStep(gameState, TutorialStep.COLLECT_METEORITE);
                }
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

        // --- MATRIX TOUR STEPS (Time/Interaction based) ---
        case TutorialStep.MATRIX_INVENTORY:
            // "Show him his meteorites and tell here you will store all..."
            if (tutorial.stepTimer > 4.0) advanceStep(gameState, TutorialStep.MATRIX_SCAN);
            break;

        case TutorialStep.MATRIX_SCAN:
            // "Show scan menu and tell by hovering..."
            if (tutorial.stepTimer > 5.0) advanceStep(gameState, TutorialStep.MATRIX_FILTERS);
            break;

        case TutorialStep.MATRIX_FILTERS:
            // "Highlight filters..."
            if (tutorial.stepTimer > 5.0) advanceStep(gameState, TutorialStep.MATRIX_RECYCLE);
            break;

        case TutorialStep.MATRIX_RECYCLE:
            // "Show recycle button..."
            if (tutorial.stepTimer > 5.0) advanceStep(gameState, TutorialStep.MATRIX_SOCKETS);
            break;

        case TutorialStep.MATRIX_SOCKETS:
            // "Highlight sockets..."
            if (tutorial.stepTimer > 6.0) advanceStep(gameState, TutorialStep.MATRIX_CLASS_DETAIL);
            break;

        case TutorialStep.MATRIX_CLASS_DETAIL:
            // "Highlight class icon..."
            if (tutorial.stepTimer > 6.0) advanceStep(gameState, TutorialStep.MATRIX_QUOTA);
            break;

        case TutorialStep.MATRIX_QUOTA:
            // "Show quota..."
            if (tutorial.stepTimer > 6.0) {
                advanceStep(gameState, TutorialStep.COMPLETE);
            }
            break;
    }
};

const advanceStep = (gameState: GameState, nextStep: TutorialStep) => {
    gameState.tutorial.completedSteps.push(gameState.tutorial.currentStep);
    gameState.tutorial.currentStep = nextStep;
    gameState.tutorial.stepTimer = 0;
};
