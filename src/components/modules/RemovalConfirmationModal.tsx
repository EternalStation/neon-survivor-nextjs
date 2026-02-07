
import React from 'react';

interface RemovalCandidate {
    index: number;
    item: any;
    replaceWith?: { item: any, source: string, index: number };
}

interface RemovalConfirmationModalProps {
    candidate: RemovalCandidate;
    dust: number;
    cost: number;
    onCancel: () => void;
    onConfirm: () => void;
}

export const RemovalConfirmationModal: React.FC<RemovalConfirmationModalProps> = ({ candidate, dust, cost, onCancel, onConfirm }) => {
    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 2500,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
            onClick={onCancel} // Click outside to cancel
        >
            <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '2px solid #ef4444',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                minWidth: '300px'
            }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
            >
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444', letterSpacing: '1px' }}>
                    {candidate.replaceWith ? 'REPLACE MODULE?' : 'UNSOCKET MODULE?'}
                </div>
                <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: '12px' }}>
                    {candidate.replaceWith
                        ? 'Replacing this module will move the current one to your inventory.'
                        : 'Removing this module requires energy to safely extract.'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', borderRadius: '4px' }}>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>COST: {cost}</span>
                    <img src="/assets/Icons/MeteoriteDust.png" alt="Dust" style={{ width: '20px', height: '20px' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '5px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '10px', background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid #475569', color: '#fff', borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '12px'
                        }}
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={dust < cost}
                        style={{
                            flex: 1, padding: '10px',
                            background: dust >= cost ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                            border: '1px solid #ef4444', color: dust >= cost ? '#fff' : '#fecaca',
                            borderRadius: '4px', cursor: dust >= cost ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold', fontSize: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                        }}
                    >
                        {dust >= cost
                            ? (candidate.replaceWith ? 'REPLACE' : 'EXTRACT')
                            : 'NO DUST'}
                    </button>
                </div>
            </div>
        </div>
    );
};
