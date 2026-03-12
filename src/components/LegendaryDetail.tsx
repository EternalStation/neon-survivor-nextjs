import React from 'react';
import type { GameState, LegendaryHex, LegendaryCategory } from '../logic/core/Types';
import { calculateMeteoriteEfficiency } from '../logic/upgrades/EfficiencyLogic';
import { getMeteoriteImage } from './modules/ModuleUtils';
import { getUiTranslation } from '../lib/UiTranslations';
import { useLanguage } from '../lib/LanguageContext';

interface LegendaryDetailProps {
    hex: LegendaryHex;
    gameState: GameState;
    hexIdx: number;
    pending?: boolean;
    placementAlert?: boolean;
}

const CATEGORY_COLORS: Record<LegendaryCategory | 'Merger', string> = {
    Economic: '#fbbf24',
    Combat: '#ef4444',
    Defensive: '#3b82f6',
    Fusion: '#f59e0b',
    Merger: '#10b981'
};

const FORGE_COLORS: Record<LegendaryCategory | 'Merger', string> = {
    Economic: '#d946ef',
    Combat: '#fb923c',
    Defensive: '#4ade80',
    Fusion: '#f59e0b',
    Merger: '#22d3ee'
};

const getLogDerivative = (S: number) => {
    if (S <= 0) return 1.0;
    const b = 0.19899;
    const ln10 = Math.log(10);
    const C = b / ln10;
    if (S <= 100000) {
        return Math.max(0.005, 1 - C * Math.log(S));
    } else {
        return 0.005;
    }
};

const getSoulLvl = (pText: string) => {
    const l = pText.toLowerCase();
    if ((l.includes('dmg') || l.includes('xp') || l.includes('max hp') || l.includes('armor')) && l.includes('per kill') && !l.includes('%') && !l.includes('/sec')) return 1;
    if (l.includes('atc') || l.includes('dust') || l.includes('hp/sec') || l.includes('collision')) return 2;
    if (l.includes('dmg%') || l.includes('dmg %') || l.includes('flux') || l.includes('max hp%') || l.includes('max hp %') || l.includes('projectile')) return 3;
    if (l.includes('xp%') || l.includes('xp %') || l.includes('max hp/sec%') || l.includes('reg%') || l.includes('armor%') || l.includes('armor %')) return 4;
    return 1;
};

export const LegendaryDetail: React.FC<LegendaryDetailProps> = ({ hex, gameState, hexIdx, pending, placementAlert }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language as any);
    const isTsunami = hex.type === 'KineticTsunami';
    const isXeno = hex.type === 'XenoAlchemist';
    const isMire = hex.type === 'IrradiatedMire';
    const isSingularity = hex.type === 'NeuralSingularity';
    const isMerger = isXeno || isMire || isSingularity || isTsunami;

    const color = placementAlert ? '#ef4444' :
        (isXeno ? CATEGORY_COLORS.Merger :
            (isMire ? '#22d3ee' :
                (isSingularity ? '#f59e0b' : CATEGORY_COLORS[hex.category])));

    const forgeColor = isXeno ? FORGE_COLORS.Merger :
        (isMire ? '#22d3ee' :
            (isSingularity ? '#f59e0b' : FORGE_COLORS[hex.category]));

    const bgGlow = placementAlert ? 'rgba(239, 68, 68, 0.15)' :
        (isXeno ? 'rgba(16, 185, 129, 0.1)' :
            (isMire ? 'rgba(34, 211, 238, 0.1)' :
                (isSingularity ? 'rgba(245, 158, 11, 0.1)' : `${color}11`)));

    const connectedDiamondIdxs = pending ? [] : [
        hexIdx,
        (hexIdx + 5) % 6,
        hexIdx + 6,
        ((hexIdx + 5) % 6) + 6
    ];

    const individualBoosts = connectedDiamondIdxs.map(dIdx => {
        const item = gameState.moduleSockets.diamonds[dIdx];
        if (!item) return 0;
        return calculateMeteoriteEfficiency(gameState, dIdx).totalBoost;
    });

    const totalEfficiency = individualBoosts.reduce((acc, b) => acc + b, 0);
    const multiplier = 1 + totalEfficiency;

    const getForgeName = (cat: string) => {
        if (cat === 'Economic') return 'EXIS FORGE';
        if (cat === 'Combat') return 'APEX FORGE';
        if (cat === 'Defensive') return 'BASTION FORGE';
        return cat;
    };

    const forgeName = hex.forgedAt && hex.forgedAt.length > 0
        ? hex.forgedAt.map(f => f.toUpperCase()).join(' / ') + (hex.forgedAt.length === 1 ? ' FORGE' : '')
        : getForgeName(hex.category);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: bgGlow,
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '15px'
            }}>
                {placementAlert && (
                    <div style={{
                        fontSize: '10px', color: '#fff', fontWeight: 900, letterSpacing: '2px',
                        padding: '6px 15px', background: '#ef4444', borderRadius: '4px',
                        border: '1px solid #fff', animation: 'shake 0.5s infinite',
                        boxShadow: '0 0 20px #ef4444', textAlign: 'center', marginBottom: '15px'
                    }}>
                        ATTENTION: INSTALL MODULE FIRST
                    </div>
                )}

                {!placementAlert && pending && (
                    <div style={{
                        fontSize: '10px', color: color, fontWeight: 900, letterSpacing: '2px',
                        padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px',
                        border: `1px solid ${color}`, animation: 'pulse-accent 2s infinite',
                        textAlign: 'center', marginBottom: '15px'
                    }}>
                        PENDING INTEGRATION
                    </div>
                )}

                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    marginBottom: '15px', position: 'relative'
                }}>
                    {hex.customIcon ? (
                        <img src={hex.customIcon} alt={hex.name} style={{ width: '72px', height: '72px', objectFit: 'contain' }} />
                    ) : (
                        <span style={{ fontSize: '32px', color: color }}>★</span>
                    )}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', letterSpacing: '1px', textShadow: `0 0 10px ${color}66` }}>
                            {hex.name.toUpperCase()}
                        </div>
                    </div>
                </div>

                {hex.category !== 'Fusion' && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px'
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ fontSize: '7px', color: color, fontWeight: 900, letterSpacing: '2px', marginBottom: '4px', opacity: 0.6 }}>
                                {t.legendary?.systemCapability || 'SYSTEM CAPABILITY'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#fff', lineHeight: '1.4', fontWeight: 600 }}>
                                {hex.lore}
                            </div>
                        </div>
                    </div>
                )}

                {(t.legendaries as any)[hex.type]?.skillDesc && (
                    <div style={{
                        background: 'rgba(34, 211, 238, 0.05)', padding: '10px', borderRadius: '6px',
                        border: '1px solid rgba(34, 211, 238, 0.15)', marginBottom: '10px'
                    }}>
                        <div style={{ fontSize: '7px', color: '#22d3ee', fontWeight: 900, letterSpacing: '2px', marginBottom: '4px' }}>
                            {t.legendary?.skillSpecsHeader || 'ACTIVE SKILL SPECIFICATIONS'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#fff', lineHeight: '1.4', fontWeight: 600 }}>
                            {(() => {
                                let desc = (t.legendaries as any)[hex.type].skillDesc;
                                if (isTsunami) {
                                    const stormHex = gameState.moduleSockets.hexagons.find(h => h?.type === 'KineticTsunami' || h?.type === 'EcoDMG');
                                    const startKills = stormHex?.killsAtLevel?.[1] ?? stormHex?.killsAtAcquisition ?? gameState.killCount;
                                    const stormSouls = Math.max(0, gameState.killCount - startKills);
                                    const dmgBonus = Math.floor(stormSouls / 100);

                                    const waveSouls = gameState.player.kineticTsunamiWaveSouls || 0;
                                    const cdBonus = waveSouls * 0.01 * multiplier;

                                    return `${desc} (Actually: +${dmgBonus}% DMG from ${stormSouls} Storm souls | -${cdBonus.toFixed(2)}s CD from ${waveSouls} Wave souls)`;
                                }
                                if (isSingularity) {
                                    return desc;
                                }
                                return desc;
                            })()}
                        </div>
                    </div>
                )}

                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '4px',
                    background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px'
                }}>
                    <div style={{ fontSize: '7px', color: color, fontWeight: 900, letterSpacing: '2px', marginBottom: '2px', opacity: 0.6 }}>
                        {t.legendary?.augmentationData || 'AUGMENTATION DATA'}
                    </div>
                    {hex.perks && hex.perks.map((p, i) => {
                        if (typeof p !== 'string') return null;
                        let currentLogMultiplier: number | undefined = undefined;

                        if (p.startsWith('GROUP:')) {
                            const groupName = p.replace('GROUP:', '');
                            return (
                                <div key={i} style={{
                                    paddingTop: '2px',
                                    paddingBottom: '2px',
                                    borderBottom: `1px solid ${color}33`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <div style={{ width: '4px', height: '4px', backgroundColor: color, borderRadius: '50%' }} />
                                    <div style={{ fontSize: '9px', fontWeight: 950, color: color, letterSpacing: '1.5px' }}>{groupName}</div>
                                </div>
                            );
                        }

                        if (p.startsWith('[') && p.endsWith(']')) {
                            return (
                                <div key={i} style={{
                                    textAlign: 'center',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    borderRadius: '4px',
                                    padding: '6px',
                                    marginTop: '8px',
                                    marginBottom: '4px'
                                }}>
                                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#10b981', letterSpacing: '2px' }}>{p}</div>
                                </div>
                            );
                        }

                        const soulsMatch = p.match(/\(([\d\.]+) Souls\)/);
                        const levelKills = soulsMatch ? parseFloat(soulsMatch[1]) : 0;

                        const indexPrefixMatch = p.match(/^((LVL|УР|Ур|Lvl)\s*)?\d+\s*[:\.]?\s+/i);
                        const mainPart = indexPrefixMatch ? p.slice(indexPrefixMatch[0].length) : p;

                        const strippedForBase = mainPart.replace(/\([\d\.]+ Souls\)/, '');
                        const baseMatch = strippedForBase.match(/(\d+\.?\d*)/);
                        let baseValue: number | string = baseMatch ? parseFloat(baseMatch[1]) : 0;
                        let hasPercent = mainPart.includes('%');

                        const isRangeMatch = mainPart.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
                        const isRange = isRangeMatch !== null && (mainPart.includes('%') || mainPart.includes('HP'));
                        const isEconomic = ((hex.category === 'Economic' || hex.categories?.includes('Economic') || hex.category === 'Fusion') && (mainPart.toLowerCase().includes('kill') || mainPart.toLowerCase().includes('убий'))) || (hex.type === 'EcoShield' && mainPart.includes('Armor'));
                        const isCurve = hex.type === 'EcoShield' && (mainPart.includes('Collision') || mainPart.includes('Projectile'));

                        let displayValue = "";
                        let cleanLabel = p;
                        let isNumeric = false;
                        const tacticalKeywords = ['DMG', 'HP', 'Armor', 'Lifesteal', 'Crit', 'Slow', 'Taken', 'Resist', 'Range', 'Duration', 'Uptime', 'Regen', 'XP', 'Dust', 'Flux', 'Fear', 'Cooldown', 'Level', 'ATS', 'ATC', 'Souls', 'Execute', 'Урон', 'ОЗ', 'Броня', 'Вампир', 'Крит', 'Замедл', 'Опыт', 'Пыль', 'Поток', 'Страх', 'Перезарядка', 'Уров', 'Душ', 'Казнь'];

                        if (isCurve) {
                            const stacks = levelKills * multiplier;
                            const val = 85 * (Math.pow(stacks, 0.75) / (Math.pow(stacks, 0.75) + 400));
                            displayValue = `+${val.toFixed(1)}%`;
                            isNumeric = true;
                            cleanLabel = mainPart.replace(/[+-]?\d+\.?\d*%?\s*/i, '').trim();
                        } else if (isRange) {
                            const matches = mainPart.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
                            if (matches) {
                                const low = parseFloat(matches[1]);
                                const high = parseFloat(matches[2]);
                                (baseValue as any) = `${low.toFixed(0)}-${high.toFixed(0)}%`;
                                const finalLow = (low * multiplier).toFixed(1);
                                const finalHigh = (high * multiplier).toFixed(1);
                                displayValue = `[${finalLow}-${finalHigh}%]`;
                                isNumeric = true;
                                cleanLabel = mainPart.replace(/(\d+\.?\d*)-(\d+\.?\d*)%?/, '').trim();
                            }
                        } else if (isEconomic) {
                            const soulLvl = getSoulLvl(mainPart);
                            const kl = hex.killsAtLevel || { [1]: hex.killsAtAcquisition };
                            const startKills = kl[soulLvl] ?? hex.killsAtAcquisition ?? gameState.killCount;
                            const souls = Math.max(0, gameState.killCount - startKills);
                            const soulBonus = souls * (gameState.player.soulDrainMult ?? 1.0);
                            const logDeriv = getLogDerivative(soulBonus);
                            const soulDrainMult = gameState.player.soulDrainMult ?? 1.0;
                            const logMultiplier = logDeriv * soulDrainMult;

                            const flexibleBaseValue = (baseValue as number) * logMultiplier;
                            const growthPerKill = flexibleBaseValue * multiplier;

                            baseValue = `${flexibleBaseValue.toFixed(4)}${hasPercent ? '%' : ''}`;
                            displayValue = `+${growthPerKill.toFixed(4)}${hasPercent ? '%' : ''}`;

                            currentLogMultiplier = logMultiplier;

                            isNumeric = true;
                            cleanLabel = mainPart.replace(/[+-]?\d+\.?\d*%?\s*/i, '').trim();
                        } else {
                            const hasTimeOrPct = mainPart.match(/\d+\.?\d*(s|%)/i);
                            if ((baseValue as number) > 0 && (hasPercent || hasTimeOrPct || tacticalKeywords.some(k => mainPart.toLowerCase().includes(k.toLowerCase())))) {
                                const amplified = (baseValue as number) * multiplier;
                                const hasSeconds = mainPart.match(/\d+\.?\d*s\b/i);
                                const suffix = hasPercent ? '%' : (hasSeconds ? 's' : '');
                                displayValue = `${hasPercent ? '+' : ''}${amplified.toFixed(1)}${suffix}`;
                                isNumeric = true;
                                cleanLabel = mainPart.replace(/[+-]?\d+\.?\d*%?s?\s*/i, '').trim();

                                if (multiplier > 1) {
                                    cleanLabel = cleanLabel.replace(/(\d+\.?\d*)(s|%)(?!\s*(XP|Souls|kills|убий|ОПЫТ))/gi, (match, val, suff) => {
                                        const amp = parseFloat(val) * multiplier;
                                        return `${amp.toFixed(2)}${suff}`;
                                    });

                                    if (soulsMatch) {
                                        const rawSouls = parseFloat(soulsMatch[1]);
                                        const effectiveSouls = rawSouls * multiplier;
                                        cleanLabel = cleanLabel.replace(/\([\d\.]+ Souls\)/, `(${rawSouls.toFixed(0)} x ${(multiplier * 100).toFixed(0)}% = ${effectiveSouls.toFixed(1)})`);
                                    }
                                }
                            }
                        }

                        if (mainPart.toLowerCase().includes('activation') || mainPart.toLowerCase().includes('использовани')) {
                            if (mainPart.includes('DMG') || mainPart.includes('урона')) {
                                const uses = gameState.player.waveUses || 0;
                                const totalValue = uses * (baseValue as number) * multiplier;
                                let finalLabel = mainPart.replace(/\(used\)/i, '').replace(/\(использовано\)/i, '').replace(/\(использ\)/i, '').trim();
                                finalLabel = finalLabel.replace(/^[+-]?\d+\.?\d*%?\s*/, '').trim();

                                cleanLabel = `${finalLabel} [${uses} Uses]`;
                                displayValue = `+${totalValue.toFixed(1)}%`;
                                isNumeric = true;
                            }
                        }

                        if (isSingularity && (mainPart.toLowerCase().includes('fear') || mainPart.toLowerCase().includes('страх')) && (mainPart.toLowerCase().includes('500xp') || mainPart.toLowerCase().includes('500 опыт'))) {
                            const xpStat = gameState.player.xp_per_kill;
                            const totalXpPerKill = Math.floor((xpStat.base || 0) + (xpStat.flat || 0));
                            const actualFear = (Math.floor(totalXpPerKill / 500) * 0.1) * multiplier;
                            displayValue = `+${actualFear.toFixed(1)}s`;
                            cleanLabel = mainPart.replace(/[+-]?\d+\.?\d*s?/, '').trim();
                            isNumeric = true;
                        }

                        if (indexPrefixMatch) {
                            cleanLabel = cleanLabel.replace(indexPrefixMatch[0], '').trim();
                        }

                        let isStatic = false;
                        if (p.includes('(STATIC)')) {
                            isStatic = true;
                            cleanLabel = cleanLabel.replace('(STATIC)', '').trim();
                        }
                        if (hex.type === 'DefPlatting' || hex.type === 'TemporalMonolith' || hex.type === 'ChronoDevourer') {
                            const lowerP = p.toLowerCase();
                            const isLvl1 = lowerP.includes('10% of all dmg dealt');
                            const isLvl2 = lowerP.includes('400px zone');
                            const isLvl3 = (lowerP.includes('cooldown') || lowerP.includes('перезарядки')) && (lowerP.includes('every minute') || lowerP.includes('каждую минуту'));
                            const isLvl4 = lowerP.includes('increases your hp/sec %') || lowerP.includes('регенерацию');
                            const isMonolithCD = lowerP.includes('recovery speed');

                            if (isLvl1) {
                                baseValue = 10;
                                isNumeric = true;
                                hasPercent = true;
                                isStatic = false;
                                displayValue = `${(10 * multiplier).toFixed(1)}%`;
                                cleanLabel = mainPart.replace(/10%?\s*/i, '').trim();
                            } else if (isLvl2) {
                                baseValue = "400px";
                                isNumeric = true;
                                isStatic = true;
                                displayValue = "400px";
                                cleanLabel = mainPart.replace(/400\s*(pxl|px)?\s*/i, '').trim();
                            } else if (isLvl4) {
                                const armorStats = gameState.player.arm;
                                const totalArmor = armorStats ? (armorStats.base + (armorStats.flat || 0) + (armorStats.hexFlat || 0)) * (1 + ((armorStats.mult || 0) + (armorStats.hexMult2 || 0) + (armorStats.hexMult || 0)) / 100) : 0;
                                const actualAmount = totalArmor * 0.01 * multiplier;

                                baseValue = 1;
                                isNumeric = true;
                                hasPercent = true;
                                isStatic = false;
                                displayValue = `+${actualAmount.toFixed(1)}%`;
                                cleanLabel = mainPart.replace(/1%?\s*/i, '').trim();
                                if (!cleanLabel.toLowerCase().includes('actual')) {
                                    cleanLabel = `${cleanLabel} (${actualAmount.toFixed(1)}% actual)`;
                                }
                            } else if (isLvl3) {
                                const startTime = hex.timeAtLevel?.[3] ?? gameState.gameTime;
                                const elapsed = gameState.gameTime - startTime;
                                const minutes = Math.floor(elapsed / 60);
                                const accumulatedCDR = minutes * 0.25 * multiplier;

                                const cdrLabel = cleanLabel.includes('Cooldown') ? 'Cooldown Reduction' : 'Снижение перезарядки';
                                cleanLabel = `${cdrLabel} [${accumulatedCDR.toFixed(1)}% accumulated]`;
                                baseValue = 0.25;
                                hasPercent = true;
                                isNumeric = true;
                                displayValue = `+${(0.25 * multiplier).toFixed(1)}% / min`;
                            } else if (isMonolithCD) {
                                baseValue = 20;
                                isNumeric = true;
                                hasPercent = true;
                                isStatic = false;
                                displayValue = `+${(20 * multiplier).toFixed(1)}%`;
                                cleanLabel = mainPart.replace(/20%?\s*/i, '').trim();
                            }
                        }

                        if (hex.type === 'DefBattery' || hex.type === 'BloodForgedCapacitor') {
                            const lowerP = p.toLowerCase();
                            if (lowerP.includes('cooldown') || lowerP.includes('перезарядки')) {
                                const startTime = hex.timeAtLevel?.[4] ?? gameState.gameTime;
                                const elapsed = gameState.gameTime - startTime;
                                const minutes = Math.floor(elapsed / 60);
                                const accumulatedCDR = minutes * 0.25 * multiplier;

                                cleanLabel = `${cleanLabel} [${accumulatedCDR.toFixed(1)}% accumulated]`;
                                baseValue = 0.25;
                                hasPercent = true;
                                isNumeric = true;
                                displayValue = `+${(0.25 * multiplier).toFixed(1)}% / min`;
                            }
                        }

                        if (hex.type === 'IrradiatedMire' && (p.includes('666px') || p.includes('Radius') || p.includes('Радиус'))) {
                            isStatic = true;
                            isNumeric = true;
                            baseValue = "666px";
                            displayValue = "666px";
                            cleanLabel = p.includes('Radius') || p.includes('Радиус') ? (cleanLabel.includes('px') ? cleanLabel.replace('666px ', '') : cleanLabel) : cleanLabel;
                        }

                        if (isTsunami) {
                            if (mainPart.includes('every 100 Souls') || mainPart.includes('каждые 100 Душ')) {
                                const stormHex = gameState.moduleSockets.hexagons.find(h => h?.type === 'KineticTsunami' || h?.type === 'EcoDMG');
                                const startKills = stormHex?.killsAtLevel?.[1] ?? stormHex?.killsAtAcquisition ?? gameState.killCount;
                                const stormSouls = Math.max(0, gameState.killCount - startKills);
                                const bonus = Math.floor(stormSouls / 100);
                                cleanLabel += ` (Actually +${bonus}%)`;
                            }
                            if (mainPart.includes('harvested by Wave') || mainPart.includes('собранную Волной')) {
                                const harvestedSouls = gameState.player.kineticTsunamiWaveSouls || 0;
                                cleanLabel += ` (${harvestedSouls} Souls)`;
                            }
                        }

                        if (isSingularity) {
                            const lowerPart = mainPart.toLowerCase();
                            if (lowerPart.includes('cooldown') || lowerPart.includes('перезарядки')) {
                                const curLVL = gameState.player.level || 0;
                                const bonus = (curLVL * 0.02) * multiplier;
                                cleanLabel += ` (${bonus.toFixed(2)}s actual based on lvl ${curLVL})`;
                            }
                            if (lowerPart.includes('fear') || lowerPart.includes('страха')) {
                                const xpStat = gameState.player.xp_per_kill;
                                const totalXpPerKill = Math.floor((xpStat.base || 0) + (xpStat.flat || 0));
                                const bonus = (Math.floor(totalXpPerKill / 500) * 0.1) * multiplier;
                                cleanLabel += ` (${bonus.toFixed(1)}s actual)`;
                            }
                        }

                        return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                        <span style={{ fontSize: isNumeric && typeof baseValue === 'string' && (baseValue as string).includes('-') ? '10px' : '11px', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
                                            {isNumeric ? (typeof baseValue === 'string' ? baseValue : `${baseValue}${hasPercent ? '%' : (p.match(/\d+\.?\d*s\b/) ? 's' : '')}`) : ''}
                                        </span>
                                        <span style={{ fontSize: hex.type === 'ComRadiation' && cleanLabel.includes('DPS') ? '7px' : '8px', color: isNumeric ? '#64748b' : '#fff', fontWeight: 700, textTransform: 'uppercase' }}>{cleanLabel}</span>
                                    </div>
                                    {isNumeric && !isStatic && (
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', gap: '4px' }}>
                                            {currentLogMultiplier !== undefined && (
                                                <>
                                                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>{currentLogMultiplier.toFixed(3)}x</span>
                                                    <span style={{ fontSize: '10px', color: color, opacity: 0.3 }}>|</span>
                                                </>
                                            )}
                                            <span style={{ fontSize: '8px', color: '#475569' }}>×</span>
                                            <span style={{ fontSize: '9px', color: color, fontWeight: 900 }}>{multiplier.toFixed(2)}</span>
                                            <span style={{ fontSize: '10px', color: color, opacity: 0.5 }}>|</span>
                                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 900 }}>{displayValue}</span>
                                        </div>
                                    )}
                                    {isNumeric && isStatic && (
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', gap: '6px' }}>
                                            <span style={{ fontSize: '7px', color: '#94a3b8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>STATIC</span>
                                            <span style={{ fontSize: '10px', color: color, opacity: 0.5 }}>|</span>
                                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 900 }}>{displayValue}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{
                padding: '12px 15px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 900, letterSpacing: '1px' }}>
                        {t.matrix.legendaryDetail.forgeOrigin.toUpperCase()}
                    </span>
                    <span style={{
                        color: forgeColor,
                        fontSize: '11px',
                        fontWeight: 950,
                        letterSpacing: '0.5px',
                        background: `${forgeColor}15`,
                        padding: '1px 6px',
                        borderRadius: '2px',
                        border: `1px solid ${forgeColor}44`,
                        textTransform: 'uppercase'
                    }}>
                        {forgeName}
                    </span>
                </div>
            </div>

            {
                pending && (
                    <div style={{
                        fontSize: '9px', color: color, fontWeight: 900,
                        textAlign: 'center', animation: 'pulse-accent 1s infinite alternate',
                        padding: '12px 10px', letterSpacing: '1px',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(5px)',
                        boxShadow: '0 -4px 15px rgba(0,0,0,0.3)'
                    }}>
                        ◄ SELECT AN OPEN HEX SOCKET IN THE MATRIX ►
                    </div>
                )
            }

            <style>{`
                @keyframes sweep {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes pulse-accent {
                    0% { opacity: 0.5; text-shadow: 0 0 0px ${color}; }
                    100% { opacity: 1; text-shadow: 0 0 10px ${color}; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `}</style>
        </div >
    );
};
