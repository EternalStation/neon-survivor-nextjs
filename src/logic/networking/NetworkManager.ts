import Peer, { DataConnection } from 'peerjs';
import { GameState, Player } from '../core/types';

export type NetworkMessage =
    | { type: 'JOIN_REQUEST'; payload: { name: string } }
    | { type: 'JOIN_ACCEPT'; payload: { state: Partial<GameState>; peerIds: string[] } }
    | { type: 'STATE_UPDATE'; payload: Partial<GameState> }
    | {
        type: 'LITE_STATE_UPDATE'; payload: {
            players?: Array<{ id: string, x: number, y: number, hp: number, angle: number }>,
            enemies?: Array<{ id: number, x: number, y: number, hp: number }>,
            time: number
        }
    }
    | {
        type: 'BULLET_SPAWN'; payload: {
            x: number, y: number, angle: number, dmg: number, pierce: number, ownerId: string, color?: string, isEnemy: boolean
        }
    }
    | { type: 'INPUT_UPDATE'; payload: { id: string; keys: Record<string, boolean>; vector: { x: number; y: number }; mouse: { x: number; y: number } } }
    | { type: 'READY_STATUS'; payload: { id: string; ready: boolean } }
    | { type: 'START_GAME'; payload: { startTime: number } }
    | { type: 'UPGRADE_SELECT'; payload: { id: string; upgradeId: string } }
    | { type: 'CLASS_SELECT'; payload: { id: string; classId: string } }
    | { type: 'MODULE_ENTER'; payload: { id: string } }
    | { type: 'MODULE_EXIT'; payload: { id: string } };

export class NetworkManager {
    private peer: Peer | null = null;
    private connections: Record<string, DataConnection> = {};
    private myId: string = '';
    private isHost: boolean = false;
    private onStateUpdate: ((state: Partial<GameState>) => void) | null = null;
    private onInputUpdate: ((id: string, data: any) => void) | null = null;
    private onLiteStateUpdate: ((data: any) => void) | null = null;
    private onBulletSpawn: ((data: any) => void) | null = null;
    private onPlayerJoin: ((id: string, name: string) => void) | null = null;
    private onReadyUpdate: ((id: string, ready: boolean) => void) | null = null;
    private onClassUpdate: ((id: string, classId: string) => void) | null = null;
    private onStartGame: ((startTime: number) => void) | null = null;

    constructor() { }

    public initialize(isHost: boolean, onIdAssigned: (id: string) => void): Promise<string> {
        this.isHost = isHost;
        return new Promise((resolve, reject) => {
            this.peer = new Peer(); // Auto-generate ID (or pass one if we want persistent IDs)

            this.peer.on('open', (id) => {
                this.myId = id;
                onIdAssigned(id);
                console.log('My Peer ID is: ' + id);
                resolve(id);
            });

            this.peer.on('connection', (conn) => {
                this.handleConnection(conn);
            });

            this.peer.on('error', (err) => {
                console.error('PeerJS Error:', err);
                reject(err);
            });
        });
    }

    public connectToPeer(peerId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.peer) {
                reject(new Error('Peer not initialized'));
                return;
            }
            const conn = this.peer.connect(peerId);

            conn.on('open', () => {
                console.log('Connected to: ' + conn.peer);
                this.connections[conn.peer] = conn;
                this.handleConnection(conn); // Set up other listeners
                resolve();
            });

            conn.on('error', (err) => {
                reject(err);
            });
        });
    }

    private handleConnection(conn: DataConnection): void {
        // Remove the 'open' listener from here since we handle it in connectToPeer or it's already open
        if (conn.open && !this.connections[conn.peer]) {
            this.connections[conn.peer] = conn;
        }

        // Ensure we don't double-bind if called multiple times, but for now standard logic:
        // We only call handleConnection for incoming connections or after open for outgoing.

        // For incoming connections (not initiated by us via connectToPeer), we need to listen to open
        if (!conn.open) {
            conn.on('open', () => {
                console.log('Connected to: ' + conn.peer);
                this.connections[conn.peer] = conn;
            });
        }


        conn.on('data', (data: any) => {
            this.handleMessage(conn.peer, data);
        });

        conn.on('close', () => {
            console.log('Connection closed: ' + conn.peer);
            delete this.connections[conn.peer];
            // Handle disconnect logic (pause game?)
        });
    }

    private handleMessage(senderId: string, msg: NetworkMessage): void {
        switch (msg.type) {
            case 'JOIN_REQUEST':
                if (this.isHost && this.onPlayerJoin) {
                    this.onPlayerJoin(senderId, msg.payload.name);
                    // Automatically accept for now
                    this.sendTo(senderId, {
                        type: 'JOIN_ACCEPT',
                        payload: {
                            state: {}, // TODO: Send actual initial state
                            peerIds: Object.keys(this.connections)
                        }
                    });
                }
                break;
            case 'JOIN_ACCEPT':
                console.log('Joined game active!');
                // Initialize local state based on host
                break;
            case 'STATE_UPDATE':
                if (this.onStateUpdate) this.onStateUpdate(msg.payload);
                break;
            case 'LITE_STATE_UPDATE':
                if (this.onLiteStateUpdate) this.onLiteStateUpdate(msg.payload);
                break;
            case 'BULLET_SPAWN':
                if (this.onBulletSpawn) this.onBulletSpawn(msg.payload);
                break;
            case 'INPUT_UPDATE':
                if (this.onInputUpdate) this.onInputUpdate(msg.payload.id, msg.payload);
                // IF HOST: Relay to others
                if (this.isHost) {
                    this.broadcastExcept(senderId, msg);
                }
                break;
            case 'READY_STATUS':
                if (this.onReadyUpdate) this.onReadyUpdate(msg.payload.id, msg.payload.ready);
                break;
            case 'CLASS_SELECT':
                if (this.onClassUpdate) this.onClassUpdate(msg.payload.id, msg.payload.classId);
                break;
            case 'START_GAME':
                if (this.onStartGame) this.onStartGame(msg.payload.startTime);
                break;
        }
    }

    public sendInput(keys: Record<string, boolean>, vector: { x: number, y: number }, mouse: { x: number, y: number }): void {
        this.broadcast({
            type: 'INPUT_UPDATE',
            payload: { id: this.myId, keys, vector, mouse }
        });
    }

    public sendReadyStatus(ready: boolean): void {
        this.broadcast({
            type: 'READY_STATUS',
            payload: { id: this.myId, ready }
        });
    }

    public sendClassSelection(classId: string): void {
        this.broadcast({
            type: 'CLASS_SELECT',
            payload: { id: this.myId, classId }
        });
    }

    public broadcastState(state: Partial<GameState>): void {
        if (!this.isHost) return; // Only host broadcasts state
        this.broadcast({
            type: 'STATE_UPDATE',
            payload: state
        });
    }

    public broadcastLiteState(payload: any): void {
        if (!this.isHost) return;
        this.broadcast({
            type: 'LITE_STATE_UPDATE',
            payload
        });
    }

    public broadcastBulletSpawn(payload: {
        x: number, y: number, angle: number, dmg: number, pierce: number, ownerId: string, color?: string, isEnemy: boolean
    }): void {
        if (!this.isHost) return;
        this.broadcast({
            type: 'BULLET_SPAWN',
            payload
        });
    }

    public broadcast(msg: NetworkMessage): void {
        Object.values(this.connections).forEach(conn => {
            if (conn.open) conn.send(msg);
        });
    }

    public sendTo(peerId: string, msg: NetworkMessage): void {
        const conn = this.connections[peerId];
        if (conn && conn.open) conn.send(msg);
    }

    public broadcastExcept(excludeId: string, msg: NetworkMessage): void {
        Object.keys(this.connections).forEach(id => {
            if (id !== excludeId) {
                const conn = this.connections[id];
                if (conn.open) conn.send(msg);
            }
        });
    }

    public setCallbacks(callbacks: {
        onStateUpdate?: (state: Partial<GameState>) => void;
        onLiteStateUpdate?: (data: any) => void;
        onBulletSpawn?: (data: any) => void;
        onInputUpdate?: (id: string, data: any) => void;
        onPlayerJoin?: (id: string, name: string) => void;
        onReadyUpdate?: (id: string, ready: boolean) => void;
        onClassUpdate?: (id: string, classId: string) => void;
        onStartGame?: (startTime: number) => void;
    }) {
        this.onStateUpdate = callbacks.onStateUpdate || null;
        this.onLiteStateUpdate = callbacks.onLiteStateUpdate || null;
        this.onBulletSpawn = callbacks.onBulletSpawn || null;
        this.onInputUpdate = callbacks.onInputUpdate || null;
        this.onPlayerJoin = callbacks.onPlayerJoin || null;
        this.onReadyUpdate = callbacks.onReadyUpdate || null;
        this.onClassUpdate = callbacks.onClassUpdate || null;
        this.onStartGame = callbacks.onStartGame || null;
    }

    public cleanup(): void {
        this.peer?.destroy();
        this.peer = null;
        this.connections = {};
    }
}

export const networkManager = new NetworkManager();
