import React, { useState, useEffect } from 'react';
import { api } from '@/api/Client';
import './FeedbackModal.css';

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

function getStatusClassName(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized === 'fixed' || normalized === 'implemented') return 'fixed';
    if (normalized === 'rejected') return 'rejected';
    if (normalized === 'considered') return 'considered';
    if (normalized === 'reviewed') return 'reviewed';
    return 'default';
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
        } catch (error) {
            console.error("Failed to submit", error);
            const errMessage = error instanceof Error ? error.message : 'Unknown error';
            setErrorMsg('Failed to submit: ' + errMessage);
        }
        setLoading(false);
    };

    return (
        <div className="feedback-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal">
                <button onClick={onClose} className="feedback-close-btn">
                    &times;
                </button>

                <h2 className="feedback-title">
                    Feedback & Bug Reports
                </h2>

                <div className="feedback-tabs">
                    <button
                        onClick={() => setTab('submit')}
                        className={`feedback-tab-btn${tab === 'submit' ? ' active' : ''}`}
                    >
                        Submit Feedback
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        className={`feedback-tab-btn${tab === 'history' ? ' active' : ''}`}
                    >
                        My Reports
                    </button>
                </div>

                {tab === 'submit' && (
                    <div className="feedback-form">
                        <div>
                            <label className="feedback-radio-label">
                                <input
                                    type="radio" name="type" checked={type === 'bug'}
                                    onChange={() => setType('bug')}
                                    className="feedback-radio-input"
                                />
                                Report a Bug
                            </label>
                            <label>
                                <input
                                    type="radio" name="type" checked={type === 'suggestion'}
                                    onChange={() => setType('suggestion')}
                                    className="feedback-radio-input"
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
                            className="feedback-textarea"
                        />
                        <div className={`feedback-char-count${message.length >= 500 ? ' limit-reached' : ''}`}>
                            {message.length} / 500
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !message.trim()}
                            className="feedback-submit-btn"
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>
                        {submitSuccess && (
                            <div className="feedback-success">
                                Feedback submitted successfully!
                            </div>
                        )}
                        {errorMsg && (
                            <div className="feedback-error">
                                {errorMsg}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="feedback-history">
                        {loading && <div className="feedback-loading">Loading...</div>}
                        {!loading && feedbacks.length === 0 && (
                            <div className="feedback-empty">
                                No feedbacks submitted yet.
                            </div>
                        )}
                        {!loading && feedbacks.map(f => (
                            <div key={f.id} className="feedback-item">
                                <div className="feedback-item-header">
                                    <div className="feedback-type-label">
                                        <span className={`feedback-type ${f.type}`}>
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
                                    <span className={`feedback-status ${getStatusClassName(f.status)}`}>
                                        {f.status}
                                    </span>
                                </div>
                                <div className="feedback-message">
                                    {f.message}
                                </div>
                                <div className="feedback-date">
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
