
import React from 'react';

interface MassRecycleConfirmationModalProps {
    type: 'SELECTED' | 'GHOSTS';
    count: number;
    onCancel: () => void;
    onConfirm: () => void;
}

export const MassRecycleConfirmationModal: React.FC<MassRecycleConfirmationModalProps> = ({ type, count, onCancel, onConfirm }) => {
    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 3000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
            onClick={onCancel}
        >
            <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '2px solid #ef4444',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                minWidth: '320px',
                fontFamily: 'Orbitron, sans-serif'
            }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444', letterSpacing: '1px', textAlign: 'center' }}>
                    MASS RECYCLE {type} UNITS?
                </div>

                <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: '12px', lineHeight: '1.5' }}>
                    You are about to recycle all <span style={{ color: type === 'SELECTED' ? '#3b82f6' : '#ef4444', fontWeight: 900 }}>{type.toLowerCase()}</span> modules.
                    <br />
                    This action cannot be undone.
                </div>

                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                        TOTAL MODULES: <span style={{ color: '#ef4444' }}>({count})</span>
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '5px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '10px', background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid #475569', color: '#fff', borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px'
                        }}
                    >
                        ABORT
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '10px',
                            background: '#ef4444',
                            border: '1px solid #ef4444', color: '#fff',
                            borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
                        }}
                    >
                        CONFIRM RECYCLE
                    </button>
                </div>
            </div>
        </div>
    );
};
