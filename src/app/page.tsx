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
import { ArenaSelection } from '@/components/ArenaSelection';
import { type PlayerClass } from '@/logic/types';

import { useGameLoop } from '@/hooks/useGame';
import { useWindowScale } from '@/hooks/useWindowScale';
import { startBGM } from '@/logic/AudioLogic';
import api from '@/api/client';
import '@/styles/menu_additions.css';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectingClass, setSelectingClass] = useState(false);
  const [selectingArena, setSelectingArena] = useState(false);
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
    if (gameStarted && !hook.showStats && !hook.showSettings && !hook.showModuleMenu && !selectingClass && !selectingArena && !showLeaderboard) {
      appRef.current?.focus();
    }
  }, [gameStarted, hook.showStats, hook.showSettings, hook.showModuleMenu, selectingClass, selectingArena, showLeaderboard, hook]);

  // Reset logic when quitting to main menu
  const handleQuit = () => {
    hook.setShowSettings(false);
    setGameStarted(false);
    setSelectingClass(false);
    setSelectingArena(false);
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

  const handleClassSelect = (cls: PlayerClass) => {
    setSelectedClass(cls);
    setSelectingClass(false);
    setSelectingArena(true);
  };

  const handleArenaSelect = (arenaId: number) => {
    startBGM(arenaId);
    setSelectingArena(false);
    setGameStarted(true);
    if (selectedClass) {
      hook.restartGame(selectedClass, arenaId, username);
    }
  };

  const handleRestart = () => {
    hook.restartGame();
    setGameStarted(false);
    setSelectingClass(true);
    setSelectingArena(false);
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

      {!gameStarted && !selectingClass && !selectingArena && (
        <MainMenu
          onStart={handleStart}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          username={username}
          onLogout={handleLogout}
        />
      )}
      {selectingClass && <ClassSelection onSelect={handleClassSelect} />}
      {selectingArena && <ArenaSelection onSelect={handleArenaSelect} />}

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
                />

                {isMobile && !hook.gameOver && (
                  <MobileControls onInput={hook.handleJoystickInput} />
                )}
              </div>
            )}

            {hook.showStats && <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}><StatsMenu gameState={hook.gameState} /></div>}

            {hook.showSettings && (
              <>
                <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                  <SettingsMenu onClose={() => hook.setShowSettings(false)} onRestart={handleRestart} onQuit={handleQuit} />
                </div>
                <AudioWidget />
              </>
            )}

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

            {hook.showLegendarySelection && hook.gameState.legendaryOptions && (
              <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                <LegendarySelectionMenu
                  options={hook.gameState.legendaryOptions}
                  onSelect={hook.handleLegendarySelect}
                />
              </div>
            )}

            {hook.gameOver && (
              <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
                <DeathScreen
                  stats={{
                    time: hook.gameState.gameTime,
                    kills: hook.gameState.killCount,
                    bosses: hook.gameState.bossKills,
                    level: hook.gameState.player.level,
                  }}
                  gameState={hook.gameState}
                  onRestart={handleRestart}
                  onQuit={handleQuit}
                  onShowLeaderboard={() => setShowLeaderboard(true)}
                />
              </div>
            )}
          </div>

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

        </>
      )}

      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} currentUsername={username} />
      )}
    </div>
  );
}
