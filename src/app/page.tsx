'use client';

import { useRef, useEffect, useState } from 'react';
import { GameCanvas } from '@/components/GameCanvas';
import { HUD } from '@/components/HUD';
import { StatsMenu } from '@/components/StatsMenu';
import { SettingsMenu } from '@/components/SettingsMenu';
import { MainMenu } from '@/components/MainMenu';
import { DeathScreen } from '@/components/DeathScreen';
import { MobileControls } from '@/components/MobileControls';
import { FeedbackModal } from '@/components/hud/FeedbackModal';
import { AdminConsole } from '@/components/hud/AdminConsole';
import { CheatPanel } from '@/components/hud/CheatPanel';

import AuthScreen from '@/components/AuthScreen';
import Leaderboard from '@/components/Leaderboard';
import { ModuleMenu } from '@/components/ModuleMenu';
import { LegendarySelectionMenu } from '@/components/LegendarySelectionMenu';
import { ClassSelection } from '@/components/ClassSelection';
import { LobbyScreen } from '@/components/LobbyScreen';
import { AssistantOverlay } from '@/components/hud/AssistantOverlay';
import { type PlayerClass } from '@/logic/core/types';
import { PLAYER_CLASSES } from '@/logic/core/classes';

import { useGameLoop } from '@/hooks/useGame';
import { useWindowScale } from '@/hooks/useWindowScale';
import { startBGM } from '@/logic/audio/AudioLogic';
import api from '@/api/client';
import '@/styles/menu_additions.css';
import { LanguageProvider } from '@/lib/LanguageContext';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [showMultiplayerLobby, setShowMultiplayerLobby] = useState(false);
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

  useEffect(() => {
    if (gameStarted && !hook.showStats && !hook.showSettings && !hook.showModuleMenu && !selectingClass && !showLeaderboard && !hook.showFeedbackModal && !hook.showAdminConsole && !hook.showCheatPanel) {
      appRef.current?.focus();
    }
  }, [gameStarted, hook.showStats, hook.showSettings, hook.showModuleMenu, selectingClass, showLeaderboard, hook.showFeedbackModal, hook.showAdminConsole, hook.showCheatPanel, hook]);

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

  const handleStartMultiplayer = () => {
    setShowMultiplayerLobby(true);
  };

  const handleMultiplayerGameStart = (mode: 'multiplayer', config: any, classId: string) => {
    const cls = PLAYER_CLASSES.find(c => c.id === classId);
    setShowMultiplayerLobby(false);
    setGameStarted(true);
    // @ts-ignore
    hook.restartGame(cls, 0, username, false, 'multiplayer', config);
  };

  const handleClassSelect = (cls: PlayerClass, tutorialEnabled: boolean) => {
    setSelectedClass(cls);
    setSelectingClass(false);

    // Track Class Streak for Orbit
    const historyRaw = localStorage.getItem('orbit_class_history');
    let history = historyRaw ? JSON.parse(historyRaw) : { lastClassId: '', streak: 0 };

    if (history.lastClassId === cls.id) {
      history.streak++;
    } else {
      history.streak = 1;
      history.lastClassId = cls.id;
    }
    localStorage.setItem('orbit_class_history', JSON.stringify(history));

    // Prepare streak trigger (will fire after game loop starts)
    if (history.streak >= 3) {
      setTimeout(() => {
        hook.triggerClassStreak(history.streak, cls.name);
      }, 3000);
    }

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
    <LanguageProvider>
      <div
        ref={appRef}
        style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', outline: 'none', background: '#000' }}
        tabIndex={0}
        onClick={(e) => {
          // Don't steal focus if clicking an interactive element
          const target = e.target as HTMLElement;
          const isInteractive = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.closest('button');
          if (!isInteractive && !hook.showFeedbackModal && !hook.showAdminConsole && !hook.showCheatPanel) {
            e.currentTarget.focus();
          }
        }}
      >

        {!gameStarted && !selectingClass && !showMultiplayerLobby && (
          <MainMenu
            onStart={handleStart}
            onStartMultiplayer={handleStartMultiplayer}
            onShowLeaderboard={() => setShowLeaderboard(true)}
            username={username}
            onLogout={handleLogout}
          />
        )}

        {showMultiplayerLobby && (
          <LobbyScreen
            onStartGame={handleMultiplayerGameStart}
            onBack={() => setShowMultiplayerLobby(false)}
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
                      onUpgradeReroll={hook.handleUpgradeReroll}
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
                      onSkipTime={hook.skipTime}
                      onTriggerPortal={hook.triggerPortal}
                      onFeedback={() => hook.setShowFeedbackModal(true)}
                    />

                    {isMobile && !hook.gameOver && (
                      <MobileControls
                        onInput={hook.handleJoystickInput}
                        isInverted={!!(hook.gameState.player.invertedControlsUntil && hook.gameState.gameTime < hook.gameState.player.invertedControlsUntil)}
                      />
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
                    onIncubatorUpdate={hook.updateIncubatorSlot}
                    onRecycle={hook.recycleMeteorite}
                    spendDust={hook.spendDust}
                    onViewChassisDetail={hook.onViewChassisDetail}
                  />
                </div>
              </div>

              {/* Global Orbit Assistant */}
              <AssistantOverlay
                isVisible={!!hook.gameState.assistant.message}
                message={hook.gameState.assistant.message || ""}
                emotion={hook.gameState.assistant.emotion}
              />

              {/* Full-Screen Modals (Cover entire viewport) */}
              {hook.showSettings && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20000, pointerEvents: 'auto' }}>
                  <SettingsMenu
                    onClose={() => hook.setShowSettings(false)}
                    onRestart={handleRestart}
                    onQuit={handleQuit}
                    onFeedback={() => {
                      hook.setShowSettings(false);
                      hook.setShowFeedbackModal(true);
                    }}
                    gameSpeedMult={hook.gameSpeedMult}
                    onGameSpeedChange={hook.setGameSpeedMult}
                  />
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
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 15000 }}>
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

              {hook.showFeedbackModal && (
                <FeedbackModal
                  onClose={() => hook.setShowFeedbackModal(false)}
                  username={username}
                />
              )}

              {hook.showAdminConsole && (
                <AdminConsole
                  onClose={() => hook.setShowAdminConsole(false)}
                />
              )}

              {hook.showCheatPanel && (
                <CheatPanel
                  onClose={() => hook.setShowCheatPanel(false)}
                />
              )}

              {/* Global Tutorial Layer - Rendered last to be on top of EVERYTHING */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10000 }}>
                <HUD
                  gameState={hook.gameState}
                  upgradeChoices={hook.upgradeChoices}
                  onUpgradeSelect={hook.handleUpgradeSelect}
                  onUpgradeReroll={hook.handleUpgradeReroll}
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
                  onSkipTime={hook.skipTime}
                  onTriggerPortal={hook.triggerPortal}
                  onFeedback={() => { }} // No-op for tutorial layer
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
    </LanguageProvider>
  );
}
