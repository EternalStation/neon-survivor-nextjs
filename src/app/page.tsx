'use client';

import { useRef, useEffect, useState } from 'react';
import { GameCanvas } from '@/components/GameCanvas';
import { HUD } from '@/components/HUD';
import { StatsMenu } from '@/components/StatsMenu';
import { SettingsMenu } from '@/components/SettingsMenu';
import { MainMenu } from '@/components/MainMenu';
import { DeathScreen } from '@/components/DeathScreen';
import { MobileControls } from '@/components/MobileControls';
import { AudioWidget } from '@/components/AudioWidget';
import AuthScreen from '@/components/AuthScreen';
import Leaderboard from '@/components/Leaderboard';
import { ModuleMenu } from '@/components/ModuleMenu';
import { LegendarySelectionMenu } from '@/components/LegendarySelectionMenu';
import { ClassSelection } from '@/components/ClassSelection';
import { type PlayerClass } from '@/logic/core/types';

import { useGameLoop } from '@/hooks/useGame';
import { useWindowScale } from '@/hooks/useWindowScale';
import { startBGM } from '@/logic/audio/AudioLogic';
import api from '@/api/client';
import '@/styles/menu_additions.css';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectingClass, setSelectingClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const hook = useGameLoop(gameStarted);
  const appRef = useRef<HTMLDivElement>(null);

  const { scale, isMobile, isLandscape } = useWindowScale();

  // Check if user is already logged in
  useEffect(() => {
    api.verifyToken().then(result => {
      if (result.valid) {
        setIsAuthenticated(true);
        setUsername(result.user.username);
      }
      setCheckingAuth(false);
    });
  }, []);

  // Auto-focus logic
  useEffect(() => {
    if (gameStarted && !hook.showStats && !hook.showSettings && !hook.showModuleMenu && !selectingClass && !showLeaderboard) {
      appRef.current?.focus();
    }
  }, [gameStarted, hook.showStats, hook.showSettings, hook.showModuleMenu, selectingClass, showLeaderboard, hook]);

  // Reset logic when quitting to main menu
  const handleQuit = () => {
    hook.setShowSettings(false);
    setGameStarted(false);
    setSelectingClass(false);
    hook.restartGame();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUsername('');
  };

  const handleStart = () => {
    setSelectingClass(true);
  };

  const handleClassSelect = (cls: PlayerClass, tutorialEnabled: boolean) => {
    setSelectedClass(cls);
    setSelectingClass(false);

    // Direct Start to Arena 0 (Economic Hex)
    const arenaId = 0;
    startBGM(arenaId);
    setGameStarted(true);

    // Note: We pass 'cls' directly to ensure we use the selected class immediately
    // even if state update is batched.
    hook.restartGame(cls, arenaId, username, tutorialEnabled);
  };

  const handleRestart = () => {
    hook.restartGame(undefined, 0, undefined, false); // No tutorial on quick restart
    setGameStarted(false);
    setSelectingClass(true);
  };

  if (checkingAuth) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0e27', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ffff', fontStyle: 'italic', fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace' }}>
        <div style={{ textAlign: 'center' }}>
          <div>INITIALIZING NEON LINK...</div>
          <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>ESTABLISHING ENCRYPTED CONNECTION</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthSuccess={(name) => {
          setUsername(name);
          setIsAuthenticated(true);
        }}
        onSkip={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div
      ref={appRef}
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', outline: 'none', background: '#000' }}
      tabIndex={0}
      onClick={(e) => e.currentTarget.focus()}
    >

      {!gameStarted && !selectingClass && (
        <MainMenu
          onStart={handleStart}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          username={username}
          onLogout={handleLogout}
        />
      )}
      {selectingClass && <ClassSelection onSelect={handleClassSelect} />}

      {gameStarted && (
        <>
          <GameCanvas hook={hook} />

          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${100 / (scale || 1)}%`,
            height: `${100 / (scale || 1)}%`,
            transform: `scale(${scale || 1})`,
            transformOrigin: 'top left',
            pointerEvents: 'none'
          }}>

            {/* UI Centering & Confinement Layer (For Ultra-Wide Screens) */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '100%',
              height: '100%',
              maxWidth: '1800px',
              transform: 'translateX(-50%)',
              pointerEvents: 'none'
            }}>

              {!hook.showModuleMenu && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                  <HUD
                    gameState={hook.gameState}
                    upgradeChoices={hook.upgradeChoices}
                    onUpgradeSelect={hook.handleUpgradeSelect}
                    gameOver={hook.gameOver}
                    onRestart={handleRestart}
                    bossWarning={hook.bossWarning}
                    fps={hook.fps}
                    onInventoryToggle={hook.toggleModuleMenu}
                    portalError={hook.portalError}
                    portalCost={hook.portalCost}
                    showSkillDetail={hook.showBossSkillDetail}
                    setShowSkillDetail={hook.setShowBossSkillDetail}
                    showStats={hook.showStats}
                    showUpgradeMenu={!!hook.upgradeChoices}
                  />

                  {isMobile && !hook.gameOver && (
                    <MobileControls onInput={hook.handleJoystickInput} />
                  )}
                </div>
              )}

              {hook.showStats && <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}><div style={{ width: '100%', height: '100%', pointerEvents: 'auto', position: 'relative' }}><StatsMenu gameState={hook.gameState} /></div></div>}

              <div style={{ pointerEvents: hook.showModuleMenu ? 'auto' : 'none' }}>
                <ModuleMenu
                  gameState={hook.gameState}
                  isOpen={hook.showModuleMenu}
                  onClose={() => hook.setShowModuleMenu(false)}
                  onSocketUpdate={hook.handleModuleSocketUpdate}
                  onInventoryUpdate={hook.updateInventorySlot}
                  onRecycle={hook.recycleMeteorite}
                  spendDust={hook.spendDust}
                  onViewChassisDetail={hook.onViewChassisDetail}
                />
              </div>
            </div>

            {/* Full-Screen Modals (Cover entire viewport) */}
            {hook.showSettings && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2000 }}>
                <SettingsMenu onClose={() => hook.setShowSettings(false)} onRestart={handleRestart} onQuit={handleQuit} />
                <AudioWidget />
              </div>
            )}

            {hook.showLegendarySelection && hook.gameState.legendaryOptions && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3000 }}>
                <LegendarySelectionMenu
                  options={hook.gameState.legendaryOptions}
                  onSelect={hook.handleLegendarySelect}
                />
              </div>
            )}

            {hook.gameOver && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10000 }}>
                <DeathScreen
                  stats={{
                    time: hook.gameState.gameTime,
                    kills: hook.gameState.killCount,
                    bosses: hook.gameState.bossKills,
                    level: hook.gameState.player.level
                  }}
                  gameState={hook.gameState}
                  onRestart={handleRestart}
                  onQuit={handleQuit}
                  onShowLeaderboard={() => setShowLeaderboard(true)}
                />
              </div>
            )}

            {/* Global Tutorial Layer - Rendered last to be on top of EVERYTHING */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10000 }}>
              <HUD
                gameState={hook.gameState}
                upgradeChoices={hook.upgradeChoices}
                onUpgradeSelect={hook.handleUpgradeSelect}
                gameOver={hook.gameOver}
                onRestart={handleRestart}
                bossWarning={hook.bossWarning}
                fps={hook.fps}
                onInventoryToggle={hook.toggleModuleMenu}
                portalError={hook.portalError}
                portalCost={hook.portalCost}
                showSkillDetail={hook.showBossSkillDetail}
                setShowSkillDetail={hook.setShowBossSkillDetail}
                isTutorialLayerOnly={true}
                showStats={hook.showStats}
                showUpgradeMenu={!!hook.upgradeChoices}
              />
            </div>
          </div>
        </>
      )}

      {isMobile && !isLandscape && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
          background: '#020617', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: '#fff', textAlign: 'center', padding: 20
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: 20 }}>NO SIGNAL</h2>
          <p>INITIATE LANDSCAPE MODE TO ESTABLISH LINK</p>
          <div style={{ width: 60, height: 100, border: '4px solid #3b82f6', borderRadius: 8, marginTop: 40, animation: 'rotate-phone 2s infinite' }}></div>
          <style>{`
                 @keyframes rotate-phone {
                   0% { transform: rotate(0deg); }
                   50% { transform: rotate(90deg); }
                   100% { transform: rotate(90deg); }
                 }
               `}</style>
        </div>
      )}

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} currentUsername={username} />
      )}
    </div>
  );
}
