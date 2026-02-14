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
                    // Full state update (rarely used for heavy sync)
                    if (remoteState.enemies) gameState.current.enemies = remoteState.enemies;
                    if (remoteState.gameTime !== undefined) gameState.current.gameTime = remoteState.gameTime;
                }
            },
            onLiteStateUpdate: (liteState: any) => {
                const state = gameState.current;
                if (state.multiplayer.isHost) return;

                // Sync game time
                if (liteState.time !== undefined) state.gameTime = liteState.time;

                // Sync players (lightweight)
                if (liteState.players) {
                    liteState.players.forEach((lp: any) => {
                        if (lp.id === state.multiplayer.myId) {
                            // Local player: only sync critical health if host says so?
                            // For now, trust local movement but sync HP
                            const localP = state.players[lp.id];
                            if (localP) {
                                // Sync HP
                                if (lp.hp !== undefined) localP.curHp = lp.hp;
                                // Optional: Correct position if divergent too much
                                const dist = Math.hypot(localP.x - lp.x, localP.y - lp.y);
                                if (dist > 150) {
                                    localP.x = lp.x;
                                    localP.y = lp.y;
                                }
                            }
                        } else {
                            // Remote player: update position directly (or set target for interpolation)
                            const rp = state.players[lp.id];
                            if (rp) {
                                rp.x = lp.x;
                                rp.y = lp.y;
                                rp.curHp = lp.hp;
                                rp.targetAngle = lp.angle;
                            }
                        }
                    });
                }

                // Sync enemies (lightweight)
                if (liteState.enemies) {
                    // This is a simple 1:1 sync. Better approach: track enemies by ID.
                    const newEnemies: any[] = [];
                    liteState.enemies.forEach((le: any) => {
                        const existing = state.enemies.find(e => e.id === le.id);
                        if (existing) {
                            existing.x = le.x;
                            existing.y = le.y;
                            existing.hp = le.hp;
                            newEnemies.push(existing);
                        } else {
                            // Need to spawn a placeholder enemy?
                            // This is complex because we don't know the type.
                            // For now, let's assume we have them or they'll be added via full sync.
                        }
                    });
                    // state.enemies = newEnemies; // Be careful here, might lose visuals.
                }
            },
            onBulletSpawn: (data: any) => {
                const state = gameState.current;
                if (state.multiplayer.isHost) return;

                // Client-side bullet creation
                const { x, y, angle, dmg, pierce, ownerId, color, isEnemy } = data;
                const spd = isEnemy ? 6 : 14; // Match ProjectileSpawning speeds

                const b: any = {
                    id: Math.random(),
                    ownerId,
                    x, y,
                    vx: Math.cos(angle) * spd,
                    vy: Math.sin(angle) * spd,
                    dmg,
                    pierce,
                    life: isEnemy ? 300 : 140,
                    isEnemy,
                    hits: new Set(),
                    color: color || (isEnemy ? '#FF0000' : '#00FFFF'),
                    size: 4,
                    spawnTime: Date.now()
                };

                if (isEnemy) {
                    state.enemyBullets.push(b);
                } else {
                    state.bullets.push(b);
                }
            },
            onInputUpdate: (id, inputData) => {
                if (id === gameState.current.multiplayer.myId) return;
                const players = gameState.current.players;
                if (players && players[id]) {
                    const p = players[id];
                    (p as any).currentInput = inputData;
                }
            }
        });

        // Loop for broadcasting lightweight state (Host only)
        const intervalId = setInterval(() => {
            if (gameState.current.multiplayer.isHost) {
                const state = gameState.current;

                // Lite player data
                const players = Object.values(state.players).map(p => ({
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    hp: p.curHp,
                    angle: p.targetAngle
                }));

                // Lite enemy data (Limit count to prevent overhead)
                const enemies = state.enemies.slice(0, 80).map(e => ({
                    id: e.id,
                    x: e.x,
                    y: e.y,
                    hp: e.hp
                }));

                networkManager.broadcastLiteState({
                    players,
                    enemies,
                    time: state.gameTime
                });
            }
        }, 33); // ~30Hz is perfect

        return () => {
            clearInterval(intervalId);
            networkManager.setCallbacks({});
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
