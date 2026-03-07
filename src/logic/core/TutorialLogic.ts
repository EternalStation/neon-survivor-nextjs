import { GameState, TutorialStep } from './Types';





export const updateTutorial = (gameState: GameState, dt: number) => {
    const { tutorial, player, inventory } = gameState;

    if (!tutorial.isActive || tutorial.currentStep === TutorialStep.COMPLETE) return;

    tutorial.stepTimer += dt;

    

    
    
    
    
    
    
    
    
    

    
    if (gameState.meteoritesPickedUp > 0 && !tutorial.hasCollectedMeteorite) {
        tutorial.hasCollectedMeteorite = true;
    }

    
    if (gameState.killCount > 0 && !tutorial.hasKilled) {
        tutorial.hasKilled = true;
    }

    
    if (gameState.showModuleMenu && !tutorial.hasOpenedModules) {
        tutorial.hasOpenedModules = true;
    }

    
    if (gameState.showStats && !tutorial.hasOpenedStats) {
        tutorial.hasOpenedStats = true;
    }


    
    switch (tutorial.currentStep) {
        case TutorialStep.MOVEMENT:
            
            if (gameState.isUpgradeMenuOpen || gameState.pendingLevelUps > 0) {
                advanceStep(gameState, TutorialStep.LEVEL_UP_MENU);
                break;
            }
            
            if (tutorial.pressedKeys.size >= 2 || tutorial.hasMoved) {
                advanceStep(gameState, TutorialStep.COMBAT); 
            }
            break;


        case TutorialStep.COMBAT:
            
            if (tutorial.hasKilled) {
                advanceStep(gameState, TutorialStep.KILL_ENEMY);
            }
            break;

        case TutorialStep.KILL_ENEMY:
            
            
            
            
            

            
            
            

            
            
            
            if (gameState.pendingLevelUps > 0 || (gameState.upgradingHexIndex !== null)) {
                advanceStep(gameState, TutorialStep.LEVEL_UP_MENU);
            }
            break;

        case TutorialStep.LEVEL_UP_MENU:
            
            if (gameState.pendingLevelUps === 0 && !gameState.showLegendarySelection && !gameState.isUpgradeMenuOpen) {
                advanceStep(gameState, TutorialStep.UPGRADE_SELECTED_CHECK_STATS);
            }
            break;

        case TutorialStep.UPGRADE_SELECTED_CHECK_STATS:
            
            
            if (tutorial.hasOpenedStats && !gameState.showStats) {
                advanceStep(gameState, TutorialStep.COLLECT_METEORITE);
            }
            break;

        case TutorialStep.COLLECT_METEORITE:
            
            if (tutorial.hasCollectedMeteorite) {
                advanceStep(gameState, TutorialStep.OPEN_MODULE_MENU);
            }
            break;

        case TutorialStep.OPEN_MODULE_MENU:
            if (tutorial.hasOpenedModules) {
                advanceStep(gameState, TutorialStep.MATRIX_INVENTORY);
                tutorial.stepTimer = 0; 
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
            
            break;
    }
};


const advanceStep = (gameState: GameState, nextStep: TutorialStep) => {
    gameState.tutorial.completedSteps.push(gameState.tutorial.currentStep);
    gameState.tutorial.currentStep = nextStep;
    gameState.tutorial.stepTimer = 0;
};
