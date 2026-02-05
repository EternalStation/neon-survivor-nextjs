import { useState } from 'react';
import api from '../api/client';
import './AuthScreen.css';

interface AuthScreenProps {
    onAuthSuccess: (username: string) => void;
    onSkip?: () => void;
}

export default function AuthScreen({ onAuthSuccess, onSkip }: AuthScreenProps) {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const response = await api.login(username, password);
                onAuthSuccess(response.player.username);
            } else {
                const response = await api.register(username, password);
                onAuthSuccess(response.player.username);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-screen">
            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="auth-title">NEON SURVIVOR</h1>
                    <p className="auth-subtitle">Join the Leaderboard</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => setMode('login')}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => setMode('register')}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            minLength={3}
                            maxLength={50}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            minLength={6}
                            required
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
                    </button>
                </form>

                {onSkip && (
                    <button className="auth-skip" onClick={onSkip}>
                        Play as Guest (No Leaderboard)
                    </button>
                )}

                <div className="auth-info">
                    <p>
                        {mode === 'login'
                            ? "Don't have an account? Click Register above."
                            : 'Already have an account? Click Login above.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
