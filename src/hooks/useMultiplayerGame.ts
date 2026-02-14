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
                    // For client: Trust host for most data, but preserve local prediction for own player
                    const myId = gameState.current.multiplayer.myId;

                    if (remoteState.players) {
                        // Preserve currentInput and local position for smoother client-side prediction
                        if (gameState.current.players) {
                            Object.keys(remoteState.players).forEach(pid => {
                                const oldP = gameState.current.players[pid];
                                const newP = remoteState.players![pid];

                                if (oldP && newP) {
                                    // Preserve currentInput for all players
                                    if ((oldP as any).currentInput) {
                                        (newP as any).currentInput = (oldP as any).currentInput;
                                    }

                                    // For local player: preserve position for client-side prediction
                                    // but sync critical stats like HP, spawnTimer, etc.
                                    if (pid === myId) {
                                        const localX = oldP.x;
                                        const localY = oldP.y;
                                        const localKnockback = oldP.knockback;
                                        const localSpawnTimer = oldP.spawnTimer;

                                        // Sync everything from host
                                        Object.assign(oldP, newP);

                                        // But keep local position and spawnTimer for smoother movement
                                        // Only override if difference is large (desync correction)
                                        const posDiff = Math.hypot(localX - newP.x, localY - newP.y);
                                        if (posDiff < 100) {
                                            oldP.x = localX;
                                            oldP.y = localY;
                                            oldP.knockback = localKnockback;
                                        }

                                        // Keep local spawnTimer to ensure smooth spawn animation
                                        if (localSpawnTimer !== undefined && localSpawnTimer < (newP.spawnTimer || 0)) {
                                            oldP.spawnTimer = localSpawnTimer;
                                        }
                                    } else {
                                        // For remote players, just update the reference
                                        gameState.current.players[pid] = newP;
                                    }
                                } else if (newP) {
                                    // New player joined
                                    gameState.current.players[pid] = newP;
                                }
                            });
                        } else {
                            // First time receiving players
                            gameState.current.players = remoteState.players;
                        }

                        // Update local player ref to match the players map
                        if (gameState.current.players[myId]) {
                            gameState.current.player = gameState.current.players[myId];
                        }
                    }
                    if (remoteState.enemies) gameState.current.enemies = remoteState.enemies;
                    if (remoteState.bullets) gameState.current.bullets = remoteState.bullets;
                    // ... sync other entities

                    // Sync Global timers/state
                    if (remoteState.gameTime !== undefined) gameState.current.gameTime = remoteState.gameTime;
                    // ... etc
                }
            },
            onInputUpdate: (id, inputData) => {
                // Determine which player this is for
                // If it's for ME, ignore it (I know my own input)
                if (id === gameState.current.multiplayer.myId) return;

                const players = gameState.current.players;
                if (players && players[id]) {
                    const p = players[id];
                    // Defensive: Ensure currentInput exists as a place to store it
                    (p as any).currentInput = inputData;
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
