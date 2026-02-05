// API Client for Neon Survivor Backend

const API_URL = '/api';

class ApiClient {
    private token: string | null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('authToken');
        } else {
            this.token = null;
        }
    }

    setToken(token: string | null) {
        this.token = token;
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('authToken', token);
            } else {
                localStorage.removeItem('authToken');
            }
        }
    }

    getToken() {
        return this.token;
    }

    async request(endpoint: string, options: RequestInit = {}) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    // Auth endpoints
    async register(username: string, password: string) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        this.setToken(data.token);
        return data;
    }

    async login(username: string, password: string) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        this.setToken(data.token);
        return data;
    }

    async verifyToken() {
        try {
            return await this.request('/auth/verify');
        } catch {
            this.setToken(null);
            return { valid: false };
        }
    }

    logout() {
        this.setToken(null);
    }

    // Leaderboard endpoints
    async getGlobalLeaderboard(limit = 100, offset = 0) {
        return this.request(`/leaderboard/global?limit=${limit}&offset=${offset}`);
    }

    async getDailyLeaderboard(limit = 100) {
        return this.request(`/leaderboard/daily?limit=${limit}`);
    }

    async getWeeklyLeaderboard(limit = 100) {
        return this.request(`/leaderboard/weekly?limit=${limit}`);
    }

    async getPatchLeaderboard(version: string, limit = 100) {
        return this.request(`/leaderboard/patch/${version}?limit=${limit}`);
    }

    async getPatches() {
        return this.request('/leaderboard/patches');
    }

    async getRunRank(runId: number) {
        return this.request(`/leaderboard/rank/${runId}`);
    }

    // Run endpoints
    async submitRun(runData: {
        score: number;
        survivalTime: number;
        kills: number;
        bossKills: number;
        classUsed: string;
        patchVersion: string;
        damageDealt: number;
        damageTaken: number;
        meteoritesCollected: number;
        portalsUsed: number;
        arenaTimes: Record<number, number>;
        legendaryHexes: any[];
        hexLevelupOrder: any[];
    }) {
        return this.request('/runs', {
            method: 'POST',
            body: JSON.stringify(runData),
        });
    }

    async getMyRuns(limit = 50, offset = 0) {
        return this.request(`/runs/me?limit=${limit}&offset=${offset}`);
    }

    async getMyBestRun() {
        return this.request('/runs/me/best');
    }

    async getMyStats() {
        return this.request('/runs/me/stats');
    }

    async getRun(runId: number) {
        return this.request(`/runs/${runId}`);
    }

    async deleteRun(runId: number) {
        return this.request(`/runs/${runId}`, {
            method: 'DELETE',
        });
    }

    async clearMyRuns() {
        return this.request('/runs/me/all', {
            method: 'DELETE',
        });
    }
}

export const api = new ApiClient();
export default api;
