import { useEffect, useRef } from 'react';
import { GameState } from '../logic/core/Types';
import { networkManager } from '../logic/networking/NetworkManager';
import { PALETTES } from '../logic/core/Constants';
import { createInitialPlayer } from '../logic/core/GameState';

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
                            // Remote player: update position directly (or create if missing)
                            let rp = state.players[lp.id];
                            if (!rp) {
                                // Create missing remote player so they become visible
                                rp = createInitialPlayer(lp.id);
                                state.players[lp.id] = rp;
                            }
                            rp.x = lp.x;
                            rp.y = lp.y;
                            rp.curHp = lp.hp;
                            rp.targetAngle = lp.angle;
                        }
                    });
                }

                // Sync enemies (lightweight)
                if (liteState.enemies) {
                    const state = gameState.current;
                    const activeIds = new Set(liteState.enemies.map((le: any) => le.id));

                    liteState.enemies.forEach((le: any) => {
                        const existing = state.enemies.find(e => e.id === le.id);
                        if (existing) {
                            // Interpolate for smoothness
                            existing.x += (le.x - existing.x) * 0.5;
                            existing.y += (le.y - existing.y) * 0.5;
                            existing.hp = le.hp;
                        } else {
                            // Spawn new enemy proxy
                            // Note: We don't know the exact type, so we use a default shape.
                            // The host will eventually send a full STATE_UPDATE with correct types.
                            state.enemies.push({
                                id: le.id,
                                x: le.x,
                                y: le.y,
                                hp: le.hp,
                                maxHp: le.hp,
                                type: 'circle',
                                shape: 'circle',
                                size: 20,
                                spd: 0,
                                boss: false,
                                dead: false,
                                knockback: { x: 0, y: 0 },
                                palette: PALETTES[0].colors,
                                pulsePhase: 0,
                                rotationPhase: 0
                            } as any);
                        }
                    });

                    // Remove enemies that are no longer active according to host
                    state.enemies = state.enemies.filter(e => activeIds.has(e.id) || e.boss);
                }
            },
            onBulletSpawn: (data: any) => {
                const state = gameState.current;
                if (state.multiplayer.isHost) return;

                // Ignore bullets spawned by ME (they are already predicted locally)
                if (data.ownerId === state.multiplayer.myId) return;

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
