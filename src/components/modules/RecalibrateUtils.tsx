import React from 'react';
import { Meteorite, GameState } from '../../logic/core/Types';
import { getSpinPools } from './ModuleUtils';
import { UI_TRANSLATIONS } from '../../lib/UiTranslations';

export const getHighlightColor = (word: string, rarityColor: string) => {
    const w = word.toUpperCase();
    if (w.includes('01') || w.includes('SECTOR-01') || w.includes('СЕКТОР-01')) return '#e9d5ff';
    if (w.includes('02') || w.includes('SECTOR-02') || w.includes('СЕКТОР-02')) return '#c084fc';
    if (w.includes('03') || w.includes('SECTOR-03') || w.includes('СЕКТОР-03')) return '#a855f7';
    if (w.includes('ECONOMIC') || w.includes('ЭКОНОМИЧ')) return '#fbbf24';
    if (w.includes('COMBAT') || w.includes('БОЕВ')) return '#ef4444';
    if (w.includes('DEFENCE') || w.includes('ЗАЩИТН') || w.includes('ОБОРОНИТ')) return '#3b82f6';
    if (w.includes('EXIS') || w.includes('ЭКЗИС')) return '#d946ef';
    if (w.includes('APEX') || w.includes('ПРЕДЕЛ')) return '#fb923c';
    if (w.includes('BASTION') || w.includes('БАСТИОН')) return '#22d3ee';
    if (w.includes('NEW') || w.includes('НОВЫЙ')) return '#ffffff';
    if (w.includes('DAMAGED') || w.includes('ПОВРЕЖДЕН')) return '#cbd5e1';
    if (w.includes('BROKEN') || w.includes('СЛОМАН')) return '#94a3b8';
    if (w.startsWith('(X')) return '#fb923c';
    return rarityColor;
};

export const formatPerkDescription = (text: string, language: 'en' | 'ru', t: any) => {
    const tr = t.recalibrate;
    const isRu = language === 'ru';
    const mTrans = t.meteorites;
    let processedPerk = text;

    const getForgeName = (code: string) => {
        if (isRu) {
            if (code === 'Eco') return 'ЭКЗИС';
            if (code === 'Com') return 'ПРЕДЕЛ';
            if (code === 'Def') return 'БАСТИОН';
        } else {
            if (code === 'Eco') return 'EXIS';
            if (code === 'Com') return 'APEX';
            if (code === 'Def') return 'BASTION';
        }
        return code;
    };

    const getQualityName = (q: string) => {
        if (isRu) {
            if (q.toLowerCase() === 'damaged') return tr.qualities.dam;
            if (q.toLowerCase() === 'broken') return tr.qualities.bro;
            if (q.toLowerCase() === 'new') return tr.qualities.new;
        }
        return q;
    };

    processedPerk = processedPerk.replace(/(\s*(?:&|and|& connects|connects|and connects)\s+)?(neighboring|secondary neighboring) a (Damaged|Broken|New) Meteorite(?:\.|\s+)?(?:\(?& connects|connects|and connects\)?)\s+[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\(]?(Eco|Com|Def)[\]\)]?( Hexes| Hex| ⬡| ⬢|)/gi, (match, conj, pref, q, p1, p2) => {
        const status = getQualityName(q);
        const f1 = getForgeName(p1);
        const f2 = getForgeName(p2);
        if (isRu) {
            const prefixStr = pref.toLowerCase().includes('secondary') ? 'вторичное соседство' : 'соседствует';
            return `${prefixStr} с ${status} метеоритом и усиляет кузню ${f1} и ${f2}`;
        } else {
            const prefixStr = conj ? pref.toLowerCase() : (pref.charAt(0).toUpperCase() + pref.toLowerCase().slice(1));
            return `${conj || ''}${prefixStr} a ${q} Meteorite. Empowering Forge ${f1} and ${f2}`;
        }
    });

    processedPerk = processedPerk.replace(/Located in Sector-(\d+)(?:\.|\s+)?(?:\(?& connects|connects|and connects\)?)\s+[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\()\]?(Eco|Com|Def)[\]\)]?( Hexes| Hex| ⬡| ⬢|)/gi, (match, sec, p1, p2) => {
        const f1 = getForgeName(p1);
        const f2 = getForgeName(p2);
        if (isRu) return `Находится в Сектор-${sec} и усиляет кузню ${f1} и ${f2}`;
        return `Located in Sector-${sec}. Empowering Forge ${f1} and ${f2}`;
    });

    processedPerk = processedPerk.replace(/Located in Sector-(\d+)(?:\.|\s+)?(?:neighboring|&|& connects|connects|and connects) an? [\[\(]?(Eco|Com|Def)[\]\)]?( Hex| ⬡| ⬢|)/gi, (match, sec, p1) => {
        const forge = getForgeName(p1);
        if (isRu) return `Находится в Сектор-${sec} и усиляет кузню ${forge}`;
        return `Located in Sector-${sec} and empowering Forge ${forge}`;
    });

    processedPerk = processedPerk.replace(/(\s*(?:&|and)\s+)?(& connects|connects|Connects|and connects|& neighboring|neighboring|Neighboring) (an? [\[\(]?(Eco|Com|Def)[\]\)]? (Hex|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]? & [\[\(]?(Eco|Com|Def)[\]\)]? (Hexes|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]? (Hexes|⬡|⬢)|[\[\(]?(Eco|Com|Def)[\]\)]?)/gi, (match, conj, verb, rest, p1, h1, p2, p3, h2, p4, h3, p5) => {
        const f1Code = p1 || p2 || p4 || p5;
        const f2Code = p3;
        const forge1 = getForgeName(f1Code);
        const verbLower = verb.toLowerCase();

        if (verbLower.includes('neighbor')) {
            const prefix = conj ? 'neighboring' : 'Neighboring';
            if (f2Code) {
                const forge2 = getForgeName(f2Code);
                if (isRu) return `соседствует с кузней ${forge1} и ${forge2}`;
                return `${conj || ''}${prefix} Forge ${forge1} and ${forge2}`;
            }
            if (isRu) return `соседствует с кузней ${forge1}`;
            return `${conj || ''}${prefix} Forge ${forge1}`;
        }

        if (f2Code) {
            const forge2 = getForgeName(f2Code);
            if (isRu) return `и усиляет кузню ${forge1} и ${forge2}`;
            return `Empowering Forge ${forge1} and ${forge2}`;
        }
        if (isRu) return `и усиляет кузню ${forge1}`;
        const prefix = (conj || match.toLowerCase().includes('and') || processedPerk.toLowerCase().includes('located in sector')) ? 'and empowering' : 'Empowering';
        return `${prefix} Forge ${forge1}`;
    });

    processedPerk = processedPerk.replace(/(\s*(?:&|and)\s+)?(neighboring|secondary neighboring) a (Damaged|Broken|New) Meteorite/gi, (match, conj, pref, q) => {
        const status = getQualityName(q);
        if (isRu) {
            const prefixStr = pref.toLowerCase().includes('secondary') ? 'вторичное соседство' : 'соседствует';
            return `${prefixStr} с ${status} метеоритом`;
        }
        const prefixStr = conj ? pref.toLowerCase() : (pref.charAt(0).toUpperCase() + pref.toLowerCase().slice(1));
        return `${conj || ''}${prefixStr} a ${q} Meteorite`;
    });

    processedPerk = processedPerk.replace(/found in (Economic|Combat|Defence) Arena/gi, (match, a) => {
        if (isRu) {
            const arena = a.toLowerCase().includes('eco') ? mTrans.stats.economicArena : a.toLowerCase().includes('com') ? mTrans.stats.combatArena : mTrans.stats.defenceArena;
            return `найден в ${arena}`;
        }
        return `found in ${a} Arena`;
    });

    if (isRu) {
        processedPerk = processedPerk
            .replace(/Located in Sector-(\d+)/gi, 'Находится в Сектор-$1')
            .replace(/located in Sector-(\d+)/gi, 'найден в Сектор-$1')
            .replace(/Sector-(\d+)/gi, 'Сектор-$1')
            .replace(/Broken Meteorite/gi, `${tr.qualities.bro} метеорит`)
            .replace(/Damaged Meteorite/gi, `${tr.qualities.dam} метеорит`)
            .replace(/New Meteorite/gi, `${tr.qualities.new} метеорит`)
            .replace(/\bLocated in\b/gi, 'Находится в')
            .replace(/\band\b/gi, 'и')
            .replace(/&/g, 'и')
            .replace(/\bEco\b/gi, 'Экзис')
            .replace(/\bCom\b/gi, 'Предел')
            .replace(/\bDef\b/gi, 'Бастион');
        processedPerk = processedPerk.replace(/(Сектор-\d+)\s+усиляет/gi, '$1 и усиляет');
        processedPerk = processedPerk.replace(/(Сектор-\d+|метеоритом|метеорит)\.?[\s\u00A0]*(и\s+)?(усиляет|Усиляет|найден|соседствует|вторичное)/gi, (match, obj, hasAnd, verb) => {
            const v = verb.toLowerCase();
            let joinVerb = v;
            if (v.includes('усиляет')) joinVerb = 'усиляет';
            else if (v.includes('соседствует')) joinVerb = 'соседствует';
            else if (v.includes('вторичное')) joinVerb = 'вторичное соседство';
            else joinVerb = 'найден';
            return `${obj} и ${joinVerb}`;
        });
        processedPerk = processedPerk.replace(/\.[\s\u00A0]+и усиляет/g, ' и усиляет').replace(/\.[\s\u00A0]+усиляет/g, ' и усиляет');
    } else {
        processedPerk = processedPerk
            .replace(/Sector-01/gi, mTrans.stats.sector01)
            .replace(/Sector-02/gi, mTrans.stats.sector02)
            .replace(/Sector-03/gi, mTrans.stats.sector03)
            .replace(/\bEco\b/gi, 'Exis')
            .replace(/\bCom\b/gi, 'Apex')
            .replace(/\bDef\b/gi, 'Bastion')
            .replace(/&/g, 'and');
        processedPerk = processedPerk.replace(/((?:Sector-\d+|SECTOR-\d+)|Meteorite)\s+(found)/gi, '$1 and $2')
            .replace(/Located in ((?:Sector-\d+|SECTOR-\d+))\s+and/gi, 'Located in $1 and');
    }

    processedPerk = processedPerk.trim();
    if (processedPerk.length > 0) {
        processedPerk = processedPerk.replace(/\. neighboring/g, '. Neighboring');
        processedPerk = processedPerk.charAt(0).toUpperCase() + processedPerk.slice(1);
    }
    return processedPerk;
};

export const applyHighlighting = (text: string, t: any, rarityColor: string) => {
    const mTrans = t.meteorites;
    const tr = t.recalibrate;
    const keywords = [
        mTrans.stats.sector01, mTrans.stats.sector02, mTrans.stats.sector03,
        mTrans.stats.economicArena, mTrans.stats.combatArena, mTrans.stats.defenceArena,
        'Exis', 'Apex', 'Bastion',
        'Экзис', 'Предел', 'Бастион',
        'НОВЫЙ', 'ПОВРЕЖДЕН', 'СЛОМАН', 'ИСКАЖЕН',
        'Sector-01', 'Sector-02', 'Sector-03',
        'Damaged', 'Broken', 'New',
        'СЕКТОР-01', 'СЕКТОР-02', 'СЕКТОР-03',
        '(x2)', '(x3)', '(x4)', '(x5)', '(x6)'
    ];

    const regex = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return text.split(regex).filter(Boolean).map((part, i) => {
        const isKeyword = keywords.some(k => new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i').test(part));
        if (isKeyword) {
            const color = getHighlightColor(part, rarityColor);
            return (
                <span key={i} style={{
                    display: 'inline-block',
                    padding: '0px 5px',
                    borderRadius: '3px',
                    fontSize: '8px',
                    fontWeight: 900,
                    fontStyle: 'normal',
                    letterSpacing: '0.5px',
                    verticalAlign: 'middle',
                    margin: '0 1px',
                    lineHeight: '14px',
                    color: color,
                    background: `${color}18`,
                    border: `1px solid ${color}55`,
                    boxShadow: `0 0 8px ${color}22`,
                }}>{part.toUpperCase()}</span>
            );
        }
        return <span key={i}>{part}</span>;
    });
};

export const SpinningWord: React.FC<{ target: string, isSpinning: boolean, language: 'en' | 'ru', pool?: string[], chipColor?: string }> = ({ target, isSpinning, language, pool: poolProp, chipColor = '#60a5fa' }) => {
    const [current, setCurrent] = React.useState(target);

    React.useEffect(() => {
        if (!isSpinning) {
            setCurrent(target);
            return;
        }

        const localizedPools = getSpinPools(language);
        let pool: string[];
        if (poolProp && poolProp.length > 0) {
            pool = poolProp;
        } else if (localizedPools.Sector.includes(target)) pool = localizedPools.Sector;
        else if (localizedPools.Arena.includes(target)) pool = localizedPools.Arena;
        else if (localizedPools.Legendary.includes(target)) pool = localizedPools.Legendary;
        else if (localizedPools.Quality.includes(target)) pool = localizedPools.Quality;
        else pool = [target];

        const interval = setInterval(() => {
            setCurrent(pool[Math.floor(Math.random() * pool.length)]);
        }, 60);

        return () => clearInterval(interval);
    }, [isSpinning, target, poolProp, language]);

    const localizedPools = getSpinPools(language);
    const allPoolItems = poolProp && poolProp.length > 0 ? poolProp : (
        localizedPools.Sector.includes(target) ? localizedPools.Sector :
            localizedPools.Arena.includes(target) ? localizedPools.Arena :
                localizedPools.Legendary.includes(target) ? localizedPools.Legendary :
                    localizedPools.Quality.includes(target) ? localizedPools.Quality : [target]
    );
    const longestStringInPool = [...allPoolItems].sort((a, b) => b.length - a.length)[0] || target;

    return (
        <span style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1px 6px',
            margin: '0 2px',
            background: `${chipColor}18`,
            border: `1px solid ${chipColor}55`,
            borderRadius: '4px',
            color: chipColor,
            fontWeight: 900,
            fontSize: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            textAlign: 'center',
            boxShadow: `0 0 10px ${chipColor}33`,
            verticalAlign: 'middle',
            animation: isSpinning ? 'pulse-fast 0.1s infinite alternate' : 'none',
            overflow: 'hidden'
        }}>
            <span style={{ visibility: 'hidden', whiteSpace: 'nowrap' }}>{longestStringInPool}</span>
            <span style={{ position: 'absolute', whiteSpace: 'nowrap' }}>{current}</span>
        </span>
    );
};

export const SpinningNumber: React.FC<{ min: number, max: number, isSpinning: boolean }> = ({ min, max, isSpinning }) => {
    const [current, setCurrent] = React.useState(max);

    React.useEffect(() => {
        if (!isSpinning) return;

        const interval = setInterval(() => {
            const rangeSpan = Math.max(1, max - min);
            const randomVal = min + Math.floor(Math.random() * (rangeSpan + 1));
            setCurrent(randomVal);
        }, 30);

        return () => clearInterval(interval);
    }, [isSpinning, min, max]);

    return (
        <span style={{
            animation: isSpinning ? 'pulse-fast 0.05s infinite alternate' : 'none',
            display: 'inline-block',
            filter: isSpinning ? 'blur(0.5px)' : 'none'
        }}>
            {current}%
        </span>
    );
};

interface AutoLockPanelProps {
    tr: any;
    filter: any;
    lvl: number;
    config: any;
    updateFilter: (lvl: number, updates: any) => void;
}

export const AutoLockPanel: React.FC<AutoLockPanelProps> = ({ tr, filter, lvl, config, updateFilter }) => (
    <div
        className="auto-lock-panel"
        onClick={e => e.stopPropagation()}
        style={{
            marginTop: '8px',
            padding: '8px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'fadeIn 0.2s ease-out'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <div style={{
                width: '6px', height: '6px',
                background: '#3b82f6',
                borderRadius: '50%',
                boxShadow: '0 0 10px #3b82f6'
            }} />
            <span style={{ fontSize: '8px', color: '#60a5fa', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>{tr.autoLockActive}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '6px', color: '#64748b', fontWeight: 900 }}>{config.t1Label}</span>
                <select
                    value={filter.thing1}
                    onChange={e => updateFilter(lvl, { thing1: e.target.value })}
                    style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#fff',
                        fontSize: '7px',
                        borderRadius: '2px',
                        padding: '2px',
                        outline: 'none'
                    }}
                >
                    {config.t1Opts.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '6px', color: '#64748b', fontWeight: 900 }}>{config.t2Label}</span>
                <select
                    value={filter.thing2}
                    onChange={e => updateFilter(lvl, { thing2: e.target.value })}
                    style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#fff',
                        fontSize: '7px',
                        borderRadius: '2px',
                        padding: '2px',
                        outline: 'none',
                        cursor: 'pointer'
                    }}
                >
                    {config.t2Opts.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        </div>
    </div>
);
export const RecalibrateStyles = () => (
    <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; box-shadow: 0 0 10px currentColor; }
            50% { opacity: 1; box-shadow: 0 0 20px currentColor; }
        }

        @keyframes panel-appear {
            from { opacity: 0; transform: scale(1.02) translateY(5px); filter: blur(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
        }

        @keyframes pulse-fast {
            from { opacity: 0.5; filter: blur(0px); }
            to { opacity: 1; filter: blur(1px); }
        }

        @keyframes flash-red {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes reroll-pulse {
            from { box-shadow: 0 0 10px rgba(168, 85, 247, 0.25), inset 0 0 8px rgba(168, 85, 247, 0.05); border-color: rgba(168, 85, 247, 0.4); }
            to { box-shadow: 0 0 28px rgba(168, 85, 247, 0.6), inset 0 0 16px rgba(168, 85, 247, 0.15); border-color: rgba(168, 85, 247, 0.9); }
        }
    `}</style>
);
