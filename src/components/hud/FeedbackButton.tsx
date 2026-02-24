import React from 'react';

interface FeedbackButtonProps {
    onClick: () => void;
}

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
    return (
        <button
            onClick={onClick}
            style={{
                position: 'absolute',
                top: '20px',
                right: '250px',
                zIndex: 45,
                padding: '8px 16px',
                background: 'rgba(20, 20, 30, 0.8)',
                border: '1px solid #00f3ff',
                borderRadius: '4px',
                color: '#00f3ff',
                fontFamily: `'Rajdhani', sans-serif`,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 243, 255, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 243, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(20, 20, 30, 0.8)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 243, 255, 0.2)';
            }}
        >
            Feedback
        </button>
    );
}
