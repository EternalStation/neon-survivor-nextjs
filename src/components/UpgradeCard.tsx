import React, { useEffect, useState } from 'react';
import type { UpgradeChoice, GameState, PlayerStats } from '../logic/core/Types';
import { BASE_UPGRADE_VALUES } from '../logic/core/Constants';
import { calcStat } from '../logic/utils/MathUtils';
import { formatLargeNumber } from '../utils/Format';
import { getIcon } from './UpgradeIcons';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/uiTranslations';
import '../styles/UpgradeMenu.css';

interface UpgradeCardProps {
    choice: UpgradeChoice;
    index: number;
    isSelected: boolean;
    onSelect: (choice: UpgradeChoice) => void;
    onHover: (index: number) => void;
    isSelecting: boolean;
    gameState: GameState;
}


const RARITY_COLORS: Record<string, string> = {
    scrap: '#7FFF00',
    anomalous: '#00C0C0',
    quantum: '#00FFFF',
    astral: '#7B68EE',
    radiant: '#FFD700',
    abyss: '#8B0000',
    eternal: '#B8860B',
    divine: '#FFFFFF',
    singularity: '#E942FF',
};

const RARITY_ORDER = ['scrap', 'anomalous', 'quantum', 'astral', 'radiant', 'abyss', 'eternal', 'divine', 'singularity'];

export const UpgradeCard: React.FC<UpgradeCardProps> = ({ choice: c, index, isSelected, onSelect, onHover, gameState }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    let rId = c.rarity?.id || 'quantum';

    if (!RARITY_COLORS[rId]) rId = 'quantum';

    let baseColor = RARITY_COLORS[rId] || '#00FFFF';

    const id = c.type?.id || 'unknown';
    const rawName = t.upgradeTypes[id as keyof typeof t.upgradeTypes] || c.type?.name || 'UNKNOWN';
    const displayName = rawName.replace('Multiplier', 'MULTP');
    const label = t.upgradeRarities[rId as keyof typeof t.upgradeRarities] || c.rarity?.label || 'QUANTUM';


    const rarityIndex = RARITY_ORDER.indexOf(rId);
    const filledSockets = rarityIndex === -1 ? 1 : Math.min(rarityIndex + 1, 9);
    const UNIFORM_SOCKET_COLOR = '#DC143C';


    let valStr = '';
    let finalIncreaseStr = '';

    if (!c.isSpecial && c.type && c.rarity && gameState) {
        const id = c.type.id || '';
        const baseVal = BASE_UPGRADE_VALUES[id] || 0;
        const mult = c.rarity.mult || 1;
        const val = Math.round(baseVal * mult);
        valStr = id.endsWith('_m') ? `+${val}%` : `+${val}`;


        const p = gameState.player;
        let stat: PlayerStats | null = null;
        let arenaMult = 1;
        let unit = '';

        if (id.startsWith('hp_')) { stat = p.hp; arenaMult = gameState.hpRegenBuffMult || 1; unit = t.units.hp; }
        else if (id.startsWith('dmg_')) { stat = p.dmg; arenaMult = gameState.dmgAtkBuffMult || 1; unit = t.units.dmg; }
        else if (id.startsWith('reg_')) { stat = p.reg; arenaMult = gameState.hpRegenBuffMult || 1; unit = t.units.reg; }
        else if (id.startsWith('arm_')) { stat = p.arm; arenaMult = 1; unit = t.units.arm; }
        else if (id.startsWith('xp_')) { stat = p.xp_per_kill as unknown as PlayerStats; arenaMult = gameState.xpSoulBuffMult || 1; unit = t.units.xp; }
        else if (id === 'atk_s') { stat = p.atk; arenaMult = gameState.dmgAtkBuffMult || 1; unit = t.units.atk; }

        if (stat) {
            const currentVal = calcStat(stat, arenaMult);

            const tempStat = { ...stat };
            if (id.endsWith('_m')) tempStat.mult = (tempStat.mult || 0) + val;
            else tempStat.flat = (tempStat.flat || 0) + val;

            const newVal = calcStat(tempStat, arenaMult);
            const diff = newVal - currentVal;

            if (diff !== 0) {
                if (id === 'atk_s') {
                    const currentSPS = Math.max(0.1, (2.64 * Math.log(currentVal / 100) - 1.25));
                    const newSPS = Math.max(0.1, (2.64 * Math.log(newVal / 100) - 1.25));
                    const spsDiff = newSPS - currentSPS;
                    finalIncreaseStr = `(+${spsDiff.toFixed(2)} ${t.units.sps})`;
                } else {

                    const formattedDiff = formatLargeNumber(diff);
                    finalIncreaseStr = `(+${formattedDiff} ${unit})`;
                }
            }
        }
    }

    const handleClick = () => {
        onSelect(c);
    };


    const [sparks, setSparks] = useState<{ id: number, tx: string, ty: string }[]>([]);

    useEffect(() => {
        if (isSelected) {
            const newSparks = Array.from({ length: 8 }).map((_, i) => ({
                id: i,
                tx: `${(Math.random() - 0.5) * 150}px`,
                ty: `${(Math.random() - 0.5) * 150}px`
            }));
            setSparks(newSparks);

            const timer = setTimeout(() => setSparks([]), 1000);
            return () => clearTimeout(timer);
        }
    }, [isSelected]);

    return (
        <div
            className={`upgrade-card card-${rId} ${isSelected ? 'active active-tutorial-target' : 'idle'}`}
            onMouseEnter={() => onHover(index)}
            onClick={handleClick}
            style={{
                ['--card-glow' as any]: baseColor,
                borderColor: baseColor
            }}
        >

            <div className="card-bg-effect" />


            {sparks.map(s => (
                <div key={s.id} className="spark" style={{
                    top: '50%', left: '50%', position: 'absolute',
                    width: 4, height: 4, background: baseColor, borderRadius: '50%',
                    transform: `translate(${s.tx}, ${s.ty})`, transition: 'transform 0.5s ease-out, opacity 0.5s', opacity: 0,
                    zIndex: 30
                }} />
            ))}

            <div className="card-content-stack">
                <div className="icon-badge-center" style={{
                    borderColor: 'transparent',
                    boxShadow: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: baseColor
                }}>
                    <div style={{ transform: 'scale(1.5)' }}>
                        {c.type ? getIcon(c.type.icon, baseColor) : null}
                    </div>
                </div>

                <div className="card-title-center">
                    {displayName}
                </div>

                <div className="card-value-center" style={{ color: baseColor, textShadow: `0 0 10px ${baseColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{valStr}</span>
                    {finalIncreaseStr && (
                        <span style={{
                            fontSize: '11px',
                            opacity: 0.8,
                            marginTop: '0px',
                            fontWeight: 'normal',
                            textShadow: 'none',
                            letterSpacing: '0px'
                        }}>
                            {finalIncreaseStr}
                        </span>
                    )}
                </div>



                <div className="card-footer-group rarity-sockets" style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                }}>
                    <div className="rarity-label-bottom" style={{ color: baseColor }}>
                        {label}
                    </div>

                    <div className="card-crystal-bar">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="gem-socket-diamond" style={{
                                borderColor: i < filledSockets ? UNIFORM_SOCKET_COLOR : '#333'
                            }}>
                                {i < filledSockets && (
                                    <div className="gem-filled-diamond" style={{
                                        backgroundColor: UNIFORM_SOCKET_COLOR,
                                        boxShadow: `0 0 5px ${UNIFORM_SOCKET_COLOR}`
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
