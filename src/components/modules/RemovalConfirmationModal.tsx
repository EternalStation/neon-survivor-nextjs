import React, { useState } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';

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
    onConfirm: (dontAskAgain: boolean) => void;
}

export const RemovalConfirmationModal: React.FC<RemovalConfirmationModalProps> = ({ candidate, dust, cost, onCancel, onConfirm }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);

    const isCorrupted = candidate.item?.quality === 'Corrupted' || candidate.item?.isCorrupted;
    const [dontAskAgain, setDontAskAgain] = useState(false);

    const mt = {
        titleReplace: language === 'ru' ? 'ЗАМЕНА МОДУЛЯ' : 'REPLACE MODULE',
        titleUnsocket: language === 'ru' ? 'ИЗВЛЕЧЕНИЕ МОДУЛЯ' : 'EXTRACT MODULE',
        bodyReplace: language === 'ru' ? 'Вы уверены, что хотите заменить этот модуль?' : 'Are you sure you want to replace this module?',
        bodyUnsocket: language === 'ru' ? 'Вы уверены, что хотите извлечь этот модуль?' : 'Are you sure you want to extract this module?',
        corruptedWarning: language === 'ru' ? '(ИСКАЖЕННЫЙ ОСКОЛОК УДВАИВАЕТ ЦЕНУ)' : '(CORRUPTED MODULE COSTS EXTRA)',
        costLabel: language === 'ru' ? 'СТОИМОСТЬ:' : 'COST:',
        dontAskAgain: language === 'ru' ? 'Больше не спрашивать' : 'Don\'t ask again',
        btnCancel: language === 'ru' ? 'ОТМЕНА' : 'CANCEL',
        btnReplace: language === 'ru' ? 'ЗАМЕНИТЬ' : 'REPLACE',
        btnExtract: language === 'ru' ? 'ИЗВЛЕЧЬ' : 'EXTRACT',
        btnNoDust: language === 'ru' ? 'НЕТ ДАСТА' : 'NO DUST'
    };

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
                minWidth: '340px'
            }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
            >
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444', letterSpacing: '1px' }}>
                    {candidate.replaceWith ? mt.titleReplace : mt.titleUnsocket}
                </div>
                <div style={{ color: '#94a3b8', textAlign: 'center', fontSize: '12px' }}>
                    {candidate.replaceWith ? mt.bodyReplace : mt.bodyUnsocket}
                </div>
                {isCorrupted && (
                    <div style={{ color: '#a855f7', textAlign: 'center', fontSize: '11px', fontWeight: 800 }}>
                        {mt.corruptedWarning}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', borderRadius: '4px' }}>
                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>{mt.costLabel} {cost}</span>
                    <img src="/assets/Icons/MeteoriteDust.png" alt="Dust" style={{ width: '20px', height: '20px' }} />
                </div>

                {!candidate.replaceWith && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                        <input
                            type="checkbox"
                            id="dontAskAgain"
                            checked={dontAskAgain}
                            onChange={(e) => setDontAskAgain(e.target.checked)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#ef4444' }}
                        />
                        <label htmlFor="dontAskAgain" style={{ color: '#94a3b8', fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}>
                            {mt.dontAskAgain}
                        </label>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '5px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '10px', background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid #475569', color: '#fff', borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '12px', fontFamily: 'Orbitron, sans-serif'
                        }}
                    >
                        {mt.btnCancel}
                    </button>
                    <button
                        onClick={() => onConfirm(dontAskAgain)}
                        disabled={dust < cost}
                        style={{
                            flex: 1, padding: '10px',
                            background: dust >= cost ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
                            border: '1px solid #ef4444', color: dust >= cost ? '#fff' : '#fecaca',
                            borderRadius: '4px', cursor: dust >= cost ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold', fontSize: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            fontFamily: 'Orbitron, sans-serif'
                        }}
                    >
                        {dust >= cost
                            ? (candidate.replaceWith ? mt.btnReplace : mt.btnExtract)
                            : mt.btnNoDust}
                    </button>
                </div>
            </div>
        </div>
    );
};
