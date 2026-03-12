
import React from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/UiTranslations';

interface CorruptionWarningModalProps {
    onCancel: () => void;
    onConfirm: () => void;
}

export const CorruptionWarningModal: React.FC<CorruptionWarningModalProps> = ({ onCancel, onConfirm }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);

    const ct = {
        title: language === 'ru' ? 'СИСТЕМА ИСКАЖЕНА' : 'CORRUPTED UNIT DETECTED',
        body1: language === 'ru' ? 'ВНИМАНИЕ: Метеорит имеет статус ' : 'WARNING: The target unit is marked as ',
        body2: language === 'ru' ? 'Извлечение будет стоить ' : 'Extraction or Destruction will cost ',
        costSuffix: language === 'ru' ? ' из-за нестабильности.' : ' due to core instability.',
        footer: language === 'ru' ? 'ПРОДОЛЖИТЕ С ОСТОРОЖНОСТЬЮ. ВСЕ ТРАНЗАКЦИИ ОКОНЧАТЕЛЬНЫ.' : 'PROCEED WITH CAUTION. ALL DUST EXTRACTION TRANSACTIONS ARE FINAL.',
        btnCancel: language === 'ru' ? 'ОТМЕНА' : 'ABORT',
        btnIntegrate: language === 'ru' ? 'ПОДТВЕРДИТЬ' : 'PROCEED'
    };

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
                border: '2px solid #dc2626',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 10px 50px rgba(220, 38, 38, 0.3)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                maxWidth: '400px',
                textAlign: 'center'
            }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#dc2626', letterSpacing: '2px', textShadow: '0 0 10px #dc2626' }}>
                    {ct.title}
                </div>

                <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>
                    {ct.body1}<span style={{ color: '#dc2626', fontWeight: 900 }}>{t.meteorites.stats.corrupted.toUpperCase()}</span>.
                    <br />
                    {ct.body2}<span style={{ color: '#ef4444', fontWeight: 900 }}>{t.meteorites.stats.corruptedEject.split('[')[1]?.split(']')[0]?.replace('TO EXTRACT', '').trim() || 'COSTS X3'}</span>{ct.costSuffix}
                </div>

                <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                    {ct.footer}
                </div>

                <div style={{ display: 'flex', gap: '15px', width: '100%', marginTop: '10px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid #475569', color: '#fff', borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '13px', transition: 'all 0.2s',
                            fontFamily: 'Orbitron, sans-serif'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                    >
                        {ct.btnCancel}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1, padding: '12px',
                            background: '#dc2626',
                            border: '1px solid #dc2626', color: '#fff',
                            borderRadius: '4px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '13px',
                            boxShadow: '0 0 15px rgba(220, 38, 38, 0.3)',
                            transition: 'all 0.2s',
                            fontFamily: 'Orbitron, sans-serif'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.6)')}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 15px rgba(220, 38, 38, 0.3)')}
                    >
                        {ct.btnIntegrate}
                    </button>
                </div>
            </div>
        </div>
    );
};
