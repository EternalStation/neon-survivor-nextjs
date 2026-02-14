import React, { useState, useEffect } from 'react';
import { useMultiplayerLobby } from '../hooks/useMultiplayerLobby'; // Import the hook we just made
import { ClassSelection } from './ClassSelection'; // Reuse class selection if possible
import '../components/Leaderboard.css'; // Reuse some styles

interface LobbyScreenProps {
    onStartGame: (mode: 'multiplayer', config: any, classId: string) => void;
    onBack: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStartGame, onBack }) => {
    const { lobbyState, error, hostGame, joinGame, toggleReady, selectClass, startGame } = useMultiplayerLobby();
    const [joinId, setJoinId] = useState('');
    const [status, setStatus] = useState<'menu' | 'hosting' | 'joining' | 'lobby' | 'class_select'>('menu');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (lobbyState.gameStarted) {
            // Trigger parent start game
            onStartGame('multiplayer', {
                myId: lobbyState.myId,
                isHost: lobbyState.isHost,
                peerIds: lobbyState.connectedPeers,
                selectedClasses: lobbyState.selectedClasses
            }, lobbyState.selectedClasses[lobbyState.myId]);
        }
    }, [lobbyState, onStartGame]);


    if (status === 'class_select') {
        return (
            <ClassSelection onSelect={(cls) => {
                selectClass(cls.id);
                setStatus('lobby');
            }} />
        );
    }

    // Initial Menu
    if (status === 'menu') {
        return (
            <div className="leaderboard-overlay" style={{ background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                <h1 style={{ fontSize: '3rem', color: '#a855f7', textShadow: '0 0 20px #a855f7' }}>MULTIPLAYER VOID</h1>

                <div style={{ display: 'flex', gap: '2rem' }}>
                    <button
                        className="menu-button"
                        style={{ padding: '1rem 3rem', fontSize: '1.5rem' }}
                        onClick={async () => {
                            setStatus('hosting');
                            await hostGame();
                            setStatus('lobby');
                        }}
                    >
                        HOST GAME
                    </button>
                    <button
                        className="menu-button"
                        style={{ padding: '1rem 3rem', fontSize: '1.5rem' }}
                        onClick={() => setStatus('joining')}
                    >
                        JOIN GAME
                    </button>
                </div>

                <button className="menu-button-secondary" onClick={onBack}>BACK</button>
            </div>
        );
    }

    // Join Input
    if (status === 'joining') {
        return (
            <div className="leaderboard-overlay" style={{ background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                <h2>ENTER LOBBY ID</h2>
                <input
                    type="text"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    style={{ padding: '1rem', fontSize: '1.5rem', background: '#111', border: '1px solid #333', color: '#fff', width: '400px', textAlign: 'center' }}
                    placeholder="Paste ID here..."
                />
                <button
                    className="menu-button"
                    onClick={async () => {
                        await joinGame(joinId);
                        setStatus('lobby');
                    }}
                >
                    CONNECT
                </button>
                <button className="menu-button-secondary" onClick={() => setStatus('menu')}>CANCEL</button>
            </div>
        );
    }

    // Lobby UI


    if (status === 'lobby') {
        if (lobbyState.gameStarted) {
            return null;
        }

        return (
            <div className="leaderboard-overlay" style={{ background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px', gap: '2rem' }}>
                <h2 style={{ color: '#fff' }}>LOBBY</h2>

                {lobbyState.isHost && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#222', padding: '1rem', borderRadius: '8px' }}>
                        <span style={{ color: '#888' }}>LOBBY ID:</span>
                        <code style={{ color: '#a855f7', fontSize: '1.2rem' }}>{lobbyState.myId}</code>
                        <button
                            style={{ background: 'transparent', border: '1px solid #444', color: '#fff', cursor: 'pointer', padding: '0.2rem 0.5rem' }}
                            onClick={() => {
                                navigator.clipboard.writeText(lobbyState.myId);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                        >
                            {copied ? 'COPIED!' : 'COPY'}
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '4rem', width: '100%', justifyContent: 'center' }}>
                    {/* Player 1 (Me) */}
                    <div style={{ border: '1px solid #444', padding: '2rem', borderRadius: '12px', width: '300px', background: lobbyState.readyStatus[lobbyState.myId] ? 'rgba(74, 222, 128, 0.1)' : 'rgba(0,0,0,0.5)' }}>
                        <h3 style={{ color: lobbyState.readyStatus[lobbyState.myId] ? '#4ade80' : '#fff' }}>YOU {lobbyState.isHost ? '(HOST)' : ''}</h3>

                        <div style={{ margin: '2rem 0', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #333', flexDirection: 'column' }}>
                            {lobbyState.selectedClasses[lobbyState.myId] ? (
                                <>
                                    <div style={{ color: '#a855f7', fontWeight: 'bold' }}>{lobbyState.selectedClasses[lobbyState.myId].toUpperCase()}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Selected</div>
                                </>
                            ) : (
                                <div style={{ color: '#666' }}>No Class Selected</div>
                            )}
                        </div>

                        <button
                            className="menu-button"
                            style={{
                                width: '100%',
                                marginBottom: '1rem',
                                fontSize: '1rem',
                                padding: '0.8rem'
                            }}
                            onClick={() => setStatus('class_select')}
                            disabled={lobbyState.readyStatus[lobbyState.myId]}
                        >
                            CHANGE CLASS
                        </button>

                        <button
                            className="menu-button"
                            style={{ width: '100%', background: lobbyState.readyStatus[lobbyState.myId] ? '#4ade80' : '#a855f7', color: lobbyState.readyStatus[lobbyState.myId] ? '#000' : '#fff' }}
                            onClick={() => {
                                if (!lobbyState.selectedClasses[lobbyState.myId]) return;
                                toggleReady();
                            }}
                            disabled={!lobbyState.selectedClasses[lobbyState.myId]}
                        >
                            {lobbyState.readyStatus[lobbyState.myId] ? 'READY!' : 'READY UP'}
                        </button>
                    </div>

                    {/* Player 2 (Peer) */}
                    <div style={{ border: '1px solid #444', padding: '2rem', borderRadius: '12px', width: '300px', opacity: lobbyState.connectedPeers.length > 0 ? 1 : 0.5 }}>
                        {lobbyState.connectedPeers.length > 0 ? (
                            <>
                                <h3 style={{ color: lobbyState.readyStatus[lobbyState.connectedPeers[0]] ? '#4ade80' : '#fff' }}>PLAYER 2</h3>
                                <div style={{ margin: '2rem 0', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #333', flexDirection: 'column' }}>
                                    {lobbyState.selectedClasses[lobbyState.connectedPeers[0]] ? (
                                        <>
                                            <div style={{ color: '#a855f7', fontWeight: 'bold' }}>{lobbyState.selectedClasses[lobbyState.connectedPeers[0]].toUpperCase()}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Selected</div>
                                        </>
                                    ) : (
                                        <div style={{ color: '#666' }}>Choosing Class...</div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'center', color: lobbyState.readyStatus[lobbyState.connectedPeers[0]] ? '#4ade80' : '#888' }}>
                                    {lobbyState.readyStatus[lobbyState.connectedPeers[0]] ? 'READY!' : 'WAITING...'}
                                </div>
                            </>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                WAITING FOR PLAYER...
                            </div>
                        )}
                    </div>
                </div>

                {lobbyState.isHost ? (
                    <button
                        className="menu-button"
                        style={{ marginTop: '2rem', opacity: lobbyState.connectedPeers.length > 0 ? 1 : 0.5 }}
                        onClick={startGame}
                    // disabled={lobbyState.connectedPeers.length === 0}
                    >
                        START GAME
                    </button>
                ) : (
                    <div style={{ marginTop: '2rem', color: '#888' }}>Waiting for host to start...</div>
                )}

                {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}

                <button className="menu-button-secondary" style={{ marginTop: '1rem' }} onClick={onBack}>LEAVE LOBBY</button>
            </div>
        );
    }
    return null;
}
