import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

interface Feedback {
    id: number;
    type: string;
    message: string;
    status: string;
    created_at: string;
}

interface FeedbackModalProps {
    onClose: () => void;
    username: string;
}

export function FeedbackModal({ onClose, username }: FeedbackModalProps) {
    const [tab, setTab] = useState<'submit' | 'history'>('submit');
    const [type, setType] = useState<'bug' | 'suggestion'>('bug');
    const [message, setMessage] = useState('');
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (tab === 'history') {
            loadHistory();
        }
    }, [tab]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await api.getMyFeedbacks(username);
            setFeedbacks(data);
        } catch (error) {
            console.error("Failed to load feedbacks", error);
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!message.trim() || message.length > 500) return;
        setLoading(true);
        setErrorMsg('');
        try {
            await api.submitFeedback(type, message);
            setSubmitSuccess(true);
            setMessage('');
            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (error: any) {
            console.error("Failed to submit", error);
            setErrorMsg('Failed to submit: ' + (error.message || 'Unknown error'));
        }
        setLoading(false);
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto'
        }} onClick={(e) => e.stopPropagation()}>
            <div style={{
                width: '600px', background: '#111', border: '1px solid #333',
                borderRadius: '8px', padding: '24px', color: '#fff',
                fontFamily: `'Rajdhani', sans-serif`, position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'transparent', border: 'none', color: '#888',
                        fontSize: '24px', cursor: 'pointer'
                    }}
                >
                    &times;
                </button>

                <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#00f3ff', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                    Feedback & Bug Reports
                </h2>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button
                        onClick={() => setTab('submit')}
                        style={{
                            flex: 1, padding: '10px', background: tab === 'submit' ? '#222' : 'transparent',
                            border: `1px solid ${tab === 'submit' ? '#00f3ff' : '#333'}`,
                            color: tab === 'submit' ? '#00f3ff' : '#888',
                            cursor: 'pointer', borderRadius: '4px'
                        }}
                    >
                        Submit Feedback
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        style={{
                            flex: 1, padding: '10px', background: tab === 'history' ? '#222' : 'transparent',
                            border: `1px solid ${tab === 'history' ? '#00f3ff' : '#333'}`,
                            color: tab === 'history' ? '#00f3ff' : '#888',
                            cursor: 'pointer', borderRadius: '4px'
                        }}
                    >
                        My Reports
                    </button>
                </div>

                {tab === 'submit' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ marginRight: '15px' }}>
                                <input
                                    type="radio" name="type" checked={type === 'bug'}
                                    onChange={() => setType('bug')}
                                    style={{ marginRight: '5px' }}
                                />
                                Report a Bug
                            </label>
                            <label>
                                <input
                                    type="radio" name="type" checked={type === 'suggestion'}
                                    onChange={() => setType('suggestion')}
                                    style={{ marginRight: '5px' }}
                                />
                                Submit an Idea
                            </label>
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            autoFocus
                            placeholder="Describe your bug or idea here (max 500 characters)..."
                            maxLength={500}
                            style={{
                                width: '100%', height: '150px', padding: '10px',
                                background: '#1a1a1a', border: '1px solid #333',
                                color: '#eee', borderRadius: '4px', resize: 'none',
                                fontFamily: `'Rajdhani', sans-serif`, fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '12px', color: message.length >= 500 ? '#ff4444' : '#888' }}>
                            {message.length} / 500
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !message.trim()}
                            style={{
                                padding: '12px', background: '#00f3ff', color: '#000',
                                border: 'none', borderRadius: '4px', fontWeight: 'bold',
                                fontSize: '16px', cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                                opacity: loading || !message.trim() ? 0.5 : 1
                            }}
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                        {submitSuccess && (
                            <div style={{ color: '#00ff00', textAlign: 'center', marginTop: '10px' }}>
                                Feedback submitted successfully!
                            </div>
                        )}
                        {errorMsg && (
                            <div style={{ color: '#ff4444', textAlign: 'center', marginTop: '10px' }}>
                                {errorMsg}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {loading && <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>}
                        {!loading && feedbacks.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                                No feedbacks submitted yet.
                            </div>
                        )}
                        {!loading && feedbacks.map(f => (
                            <div key={f.id} style={{
                                padding: '15px', background: '#1a1a1a', border: '1px solid #333',
                                marginBottom: '10px', borderRadius: '4px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            color: f.type === 'bug' ? '#ff4444' : '#00ff00',
                                            fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px'
                                        }}>
                                            {f.type}
                                        </span>
                                        {f.type === 'bug' && (
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ff4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="m8 2 1.88 1.88" />
                                                <path d="M14.12 3.88 16 2" />
                                                <path d="M9 7.13v-1a3 3 0 1 1 6 0v1" />
                                                <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
                                                <path d="m19 17-3-2" />
                                                <path d="m5 17 3-2" />
                                                <path d="m19 7-3 2" />
                                                <path d="m5 7 3 2" />
                                                <path d="m19 12-3 2" />
                                                <path d="m5 12 3 2" />
                                            </svg>
                                        )}
                                    </div>
                                    <span style={{
                                        color: f.status === 'Fixed' || f.status === 'Implemented' ? '#00ff00' :
                                            f.status === 'Rejected' ? '#ff4444' :
                                                f.status === 'Considered' ? '#00f3ff' :
                                                    f.status === 'Reviewed' ? '#ffaa00' : '#888',
                                        fontSize: '14px', fontWeight: 'bold'
                                    }}>
                                        {f.status}
                                    </span>
                                </div>
                                <div style={{ color: '#ccc', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                    {f.message}
                                </div>
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '10px', textAlign: 'right' }}>
                                    {new Date(f.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
