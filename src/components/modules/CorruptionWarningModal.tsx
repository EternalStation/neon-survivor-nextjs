
import React from 'react';

interface CorruptionWarningModalProps {
    onCancel: () => void;
    onConfirm: () => void;
}

export const CorruptionWarningModal: React.FC<CorruptionWarningModalProps> = ({ onCancel, onConfirm }) => {
    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
            onClick={onCancel}
        >
            <div style={{
                background: 'rgba(15, 23, 42, 0.98)',
                border: '2px solid #a855f7',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 0 50px rgba(168, 85, 247, 0.5)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                maxWidth: '400px',
                textAlign: 'center'
            }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#a855f7', letterSpacing: '2px', textShadow: '0 0 10px #a855f7' }}>
                    CORRUPTION WARNING
                </div>

                <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>
                    This module is <span style={{ color: '#a855f7', fontWeight: 900 }}>CORRUPTED</span>.
                    Once slotted, removal is still possible, but it costs <span style={{ color: '#ef4444', fontWeight: 900 }}>3x DUST</span> to extract.
                </div>

                <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                    Extreme power, extreme extraction cost.
                </div>

                <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '10px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid #475569', color: '#fff', borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                    >
                        ABORT
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '12px',
                            background: '#a855f7',
                            border: '1px solid #a855f7', color: '#fff',
                            borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '13px',
                            boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.6)')}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.3)')}
                    >
                        INTEGRATE
                    </button>
                </div>
            </div>
        </div>
    );
};
