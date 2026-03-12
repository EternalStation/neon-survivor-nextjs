import React, { useState, useEffect } from 'react';
import { api } from '@/api/Client';

interface Feedback {
    id: number;
    username: string;
    type: string;
    message: string;
    status: string;
    created_at: string;
}

interface AdminConsoleProps {
    onClose: () => void;
}

export function AdminConsole({ onClose }: AdminConsoleProps) {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadFeedbacks();
    }, []);

    const loadFeedbacks = async () => {
        setLoading(true);
        try {
            const data = await api.getAllFeedbacks();
            setFeedbacks(data);
        } catch (error) {
            console.error("Failed to load all feedbacks", error);
        }
        setLoading(false);
    };

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            await api.updateFeedbackStatus(id, newStatus);
            // Optimistic update
            setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 100000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: `'Rajdhani', monospace`, color: '#00ff00', pointerEvents: 'auto'
        }} onClick={(e) => e.stopPropagation()}>
            <div style={{
                width: '80%', height: '80%', background: '#000', border: '1px solid #00ff00',
                borderRadius: '4px', padding: '24px', position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: '1px solid #00ff00', color: '#00ff00',
                        padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit'
                    }}
                >
                    EXIT
                </button>

                <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', textTransform: 'uppercase', borderBottom: '1px solid #00ff00', paddingBottom: '10px' }}>
                    {'>'} ADMIN_CONSOLE :: FEEDBACK_DATABASE
                </h2>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {loading && <div>{'>'} INITIALIZING QUERY...</div>}
                    {!loading && feedbacks.length === 0 && <div>{'>'} NO RECORDS FOUND.</div>}
                    {!loading && feedbacks.map(f => (
                        <div key={f.id} style={{
                            borderBottom: '1px solid #333', padding: '15px 0',
                            display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ color: '#00f3ff', marginRight: '10px' }}>[{f.id}] {f.username}</span>
                                    <span style={{ color: f.type === 'bug' ? '#ff4444' : '#ffff00', textTransform: 'uppercase' }}>{f.type}</span>
                                </div>
                                <div>
                                    <span style={{ color: '#888', fontSize: '12px' }}>{new Date(f.created_at).toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ color: '#fff', fontSize: '14px', whiteSpace: 'pre-wrap', padding: '10px', background: '#111' }}>
                                {f.message}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                                <span style={{ color: '#888' }}>CURRENT STATUS:</span>
                                <span style={{ color: f.status === 'Pending' ? '#ffaa00' : '#00ff00', fontWeight: 'bold' }}>{f.status}</span>

                                <div style={{ flex: 1 }} />

                                <select
                                    value={f.status}
                                    onChange={(e) => updateStatus(f.id, e.target.value)}
                                    style={{
                                        background: '#000', color: '#00ff00', border: '1px solid #00ff00',
                                        padding: '4px', fontFamily: 'inherit', cursor: 'pointer'
                                    }}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Fixed">Fixed</option>
                                    <option value="Implemented">Implemented</option>
                                    <option value="Considered">Considered</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
