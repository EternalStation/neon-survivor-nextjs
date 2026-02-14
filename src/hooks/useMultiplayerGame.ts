import { useEffect, useRef } from 'react';
import { GameState } from '../logic/core/types';
import { networkManager } from '../logic/networking/NetworkManager';

export function useMultiplayerGame(gameState: React.MutableRefObject<GameState>, gameStarted: boolean) {
    const lastBroadcastTime = useRef(0);

    useEffect(() => {
        if (!gameStarted) return;

        // Set up network callbacks for in-game events
        networkManager.setCallbacks({
            onStateUpdate: (remoteState: Partial<GameState>) => {
                if (!gameState.current.multiplayer.isHost) {
                    // Merge state from host
                    // TODO: add lerping/interpolation for smooth movement
                    // For now, hard sync crucial data
                    if (remoteState.players) {
                        // Preserve currentInput for prediction
                        if (gameState.current.players) {
                            Object.keys(remoteState.players).forEach(pid => {
                                const oldP = gameState.current.players[pid];
                                if (oldP && (oldP as any).currentInput && remoteState.players && remoteState.players[pid]) {
                                    (remoteState.players[pid] as any).currentInput = (oldP as any).currentInput;
                                }
                            });
                        }

                        gameState.current.players = remoteState.players;

                        // Update local player ref to match what host says (optional, or trust local prediction)
                        const myId = gameState.current.multiplayer.myId;
                        if (remoteState.players[myId]) {
                            // Simple reconciliation: Trust host for HP/stats, maybe keep local pos for smoothness?
                            // For MVP: snap to host
                            Object.assign(gameState.current.player, remoteState.players[myId]);
                        }
                    }
                    if (remoteState.enemies) gameState.current.enemies = remoteState.enemies;
                    if (remoteState.bullets) gameState.current.bullets = remoteState.bullets;
                    // ... sync other entities

                    // Sync Global timers/state
                    if (remoteState.gameTime) gameState.current.gameTime = remoteState.gameTime;
                    // ... etc
                }
            },
            onInputUpdate: (id, inputData) => {
                // Determine which player this is for
                // If it's for ME, ignore it (I know my own input)
                if (id === gameState.current.multiplayer.myId) return;

                const players = gameState.current.players;
                if (players && players[id]) {
                    (players[id] as any).currentInput = inputData;
                }
            }
        });

        // Loop for broadcasting state (Host only) or sending input (Guest only)
        const intervalId = setInterval(() => {
            if (gameState.current.multiplayer.isHost) {
                // Broadcast state at say 20Hz
                // Optimize: Only send deltas
                networkManager.broadcastState({
                    players: gameState.current.players,
                    enemies: gameState.current.enemies,
                    bullets: gameState.current.bullets,
                    gameTime: gameState.current.gameTime
                    // ... minimal set
                });
            } else {
                // Send Input to host
                // We'll need access to current input from useGameInput... 
                // Alternatively, useGameInput calls NetworkManager directly? 
                // Or we poll local input here?
            }
        }, 50); // 20 updates per second

        return () => {
            clearInterval(intervalId);
            networkManager.setCallbacks({}); // clear
        };
    }, [gameStarted]);

    // Function to call from useGameLoop to send inputs
    const sendInputToHost = (keys: any, vector: any, mouse: any) => {
        if (!gameState.current.multiplayer.isHost && gameState.current.multiplayer.active) {
            networkManager.sendInput(keys, vector, mouse);
        }
    };

    return {
        sendInputToHost
    };
}
