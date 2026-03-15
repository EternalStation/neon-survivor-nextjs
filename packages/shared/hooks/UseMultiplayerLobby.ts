import { useState, useEffect, useRef } from 'react';
import { networkManager } from '../logic/networking/NetworkManager';

export interface LobbyState {
    myId: string;
    isHost: boolean;
    connectedPeers: string[];
    readyStatus: Record<string, boolean>;
    selectedClasses: Record<string, string>;
    gameStarted: boolean;
}

export function useMultiplayerLobby() {
    const [lobbyState, setLobbyState] = useState<LobbyState>({
        myId: '',
        isHost: false,
        connectedPeers: [],
        readyStatus: {},
        selectedClasses: {},
        gameStarted: false
    });

    const lobbyStateRef = useRef(lobbyState);
    lobbyStateRef.current = lobbyState;

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        networkManager.setCallbacks({
            onPlayerJoin: (id, name) => {
                console.log(`Player ${name} (${id}) joined!`);
                setLobbyState(prev => ({
                    ...prev,
                    connectedPeers: [...prev.connectedPeers, id],
                    readyStatus: { ...prev.readyStatus, [id]: false }
                }));

                // Send my (Host) state to the new player
                const currentState = lobbyStateRef.current;
                const myClass = currentState.selectedClasses[currentState.myId];
                if (myClass) {
                    networkManager.sendTo(id, {
                        type: 'CLASS_SELECT',
                        payload: { id: currentState.myId, classId: myClass }
                    });
                }
                const myReady = currentState.readyStatus[currentState.myId];
                if (myReady !== undefined) {
                    networkManager.sendTo(id, {
                        type: 'READY_STATUS',
                        payload: { id: currentState.myId, ready: myReady }
                    });
                }
            },
            onReadyUpdate: (id, ready) => {
                setLobbyState(prev => ({
                    ...prev,
                    readyStatus: { ...prev.readyStatus, [id]: ready }
                }));
            },
            onClassUpdate: (id, classId) => {
                setLobbyState(prev => ({
                    ...prev,
                    selectedClasses: { ...prev.selectedClasses, [id]: classId }
                }));
            },
            onStartGame: (startTime) => {
                console.log('Game Starting!');
                setLobbyState(prev => ({ ...prev, gameStarted: true }));
            }
        });

        // Cleanup on unmount? Maybe not if we want to persist connection
        // return () => networkManager.cleanup();
    }, []);

    const hostGame = async () => {
        try {
            const id = await networkManager.initialize(true, (id) => {
                setLobbyState(prev => ({ ...prev, myId: id, isHost: true }));
            });
            return id;
        } catch (e: any) {
            setError(e.message);
            return null;
        }
    };

    const joinGame = async (peerId: string) => {
        try {
            const id = await networkManager.initialize(false, (id) => {
                setLobbyState(prev => ({ ...prev, myId: id, isHost: false }));
            });
            await networkManager.connectToPeer(peerId);

            // Manually add Host to connected peers immediately so they show up in UI
            setLobbyState(prev => ({
                ...prev,
                connectedPeers: [peerId],
                readyStatus: { ...prev.readyStatus, [peerId]: false }
            }));

            // Verify connection is truly ready? verify by sending
            networkManager.sendTo(peerId, { type: 'JOIN_REQUEST', payload: { name: 'Player' } });
        } catch (e: any) {
            setError(e.message);
        }
    };

    const toggleReady = () => {
        const newStatus = !lobbyState.readyStatus[lobbyState.myId];
        setLobbyState(prev => ({
            ...prev,
            readyStatus: { ...prev.readyStatus, [lobbyState.myId]: newStatus }
        }));
        networkManager.sendReadyStatus(newStatus);
    };

    const selectClass = (classId: string) => {
        setLobbyState(prev => ({
            ...prev,
            selectedClasses: { ...prev.selectedClasses, [lobbyState.myId]: classId }
        }));
        networkManager.sendClassSelection(classId);
    };

    const startGame = () => {
        if (!lobbyState.isHost) return;
        const allReady = lobbyState.connectedPeers.every(p => lobbyState.readyStatus[p]) && lobbyState.readyStatus[lobbyState.myId];

        // For testing, let host start even if alone, but normally check allReady
        // if (!allReady) return; 

        const startTime = Date.now() + 1000; // 1s delay
        networkManager.broadcast({ type: 'START_GAME', payload: { startTime } });
        setLobbyState(prev => ({ ...prev, gameStarted: true }));
    };

    return {
        lobbyState,
        error,
        hostGame,
        joinGame,
        toggleReady,
        selectClass,
        startGame
    };
}
