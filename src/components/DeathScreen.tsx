import React, { useEffect, useState } from 'react';
import { RadarChart } from './RadarChart';
import { DamageRow } from './stats/DamageRow';
import { VitalsAnalysis } from './stats/VitalsAnalysis';
import { getUiTranslation } from '../lib/UiTranslations';
import type { GameState, UpgradeChoice } from '../logic/core/Types';
import { calcStat, getDefenseReduction } from '../logic/utils/MathUtils';
import { calculateLegendaryBonus } from '../logic/upgrades/LegendaryLogic';
import { submitRunToLeaderboard } from '../utils/Leaderboard';
import { formatLargeNumber } from '../utils/Format';
import { useLanguage } from '../lib/LanguageContext';
import { getDamageMapping } from '../utils/DamageMapping';
import { getKeybinds } from '../logic/utils/Keybinds';
import styles from './DeathScreen.module.css';

interface ExtendedWindow extends Window {
    __cheatsUsed?: boolean;
}

type StatColor = 'white' | 'cyan' | 'red' | 'amber' | 'purple' | 'green' | 'pink' | 'lightGreen' | 'blue';
type RankVariant = 'gold' | 'silver' | 'bronze' | 'default' | 'extraction';

interface RarityVars extends React.CSSProperties {
    '--rarity-color': string;
}

const STAT_COLOR_CLASSES: Record<StatColor, string> = {
    white: styles.colorWhite,
    cyan: styles.colorCyan,
    red: styles.colorRed,
    amber: styles.colorAmber,
    purple: styles.colorPurple,
    green: styles.colorGreen,
    pink: styles.colorPink,
    lightGreen: styles.colorLightGreen,
    blue: styles.colorBlue,
};

const RANK_CLASSES: Record<RankVariant, string> = {
    gold: styles.rankGold,
    silver: styles.rankSilver,
    bronze: styles.rankBronze,
    extraction: styles.rankExtraction,
    default: styles.rankDefault,
};

function getRankVariant(rank: number, extractionScreen: boolean): RankVariant {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return extractionScreen ? 'extraction' : 'default';
}

interface FinalStatItemProps {
    label: string;
    value: string | number;
    color?: StatColor;
}

const FinalStatItem: React.FC<FinalStatItemProps> = ({ label, value, color = 'white' }) => (
    <div className={styles.finalStatItem}>
        <span className={styles.finalStatLabel}>{label}</span>
        <span className={`${styles.finalStatValue} ${STAT_COLOR_CLASSES[color]}`}>{value}</span>
    </div>
);

interface StatItemProps {
    label: string;
    value: string | number;
    color?: StatColor;
    subValue?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color = 'white', subValue = '' }) => (
    <div className={styles.statItem}>
        <span className={styles.statLabel}>{label}</span>
        <div className={styles.statValueContainer}>
            <span className={`${styles.statValue} ${STAT_COLOR_CLASSES[color]}`}>{value}</span>
            {subValue && <div className={styles.statSubValue}>{subValue}</div>}
        </div>
    </div>
);

interface DeathScreenProps {
    stats: {
        time: number;
        kills: number;
        bosses: number;
        level: number;
    };
    gameState: GameState;
    onRestart: () => void;
    onQuit: () => void;
    onShowLeaderboard: () => void;
}

export const DeathScreen: React.FC<DeathScreenProps> = ({ stats, gameState, onRestart, onQuit, onShowLeaderboard }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'damage' | 'vitals'>('overview');
    const [rank, setRank] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(true);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [displayStats, setDisplayStats] = useState({
        kills: 0,
        level: 0,
        bosses: 0,
        dust: 0,
        snitch: 0,
        portals: 0,
    });

    useEffect(() => {
        if (gameState.runSubmitted) {
            setIsSubmitting(false);
            return;
        }

        gameState.runSubmitted = true;

        submitRunToLeaderboard(gameState).then(result => {
            if (result.success && result.rank) {
                setRank(result.rank);
            } else if (result.error) {
                setSubmissionError(result.error);
            }
            setIsSubmitting(false);
        });
    }, []);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const code = e.code.toLowerCase();
            if (code === 'tab') {
                e.preventDefault();
            }
            const binds = getKeybinds();
            const leftBind = (binds.moveLeft || 'keya').toLowerCase();
            const rightBind = (binds.moveRight || 'keyd').toLowerCase();

            if (code === leftBind || code === 'arrowleft' || (binds.useDefaultMovement && code === 'keya')) setActiveTab('overview');
            if (code === rightBind || code === 'arrowright' || (binds.useDefaultMovement && code === 'keyd')) setActiveTab('modules');
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    useEffect(() => {
        const duration = 1200;
        const startTime = Date.now();

        const initialKills = stats.kills;
        const initialLevel = stats.level;
        const initialBosses = stats.bosses;
        const initialDust = gameState.player.dust;
        const initialSnitch = gameState.snitchCaught || 0;
        const initialPortals = gameState.portalsUsed || 0;

        const animate = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / duration);
            const ease = 1 - Math.pow(1 - progress, 5);

            setDisplayStats({
                kills: Math.floor(initialKills * ease),
                level: Math.floor(initialLevel * ease),
                bosses: Math.floor(initialBosses * ease),
                dust: Math.floor(initialDust * ease),
                snitch: Math.floor(initialSnitch * ease),
                portals: Math.floor(initialPortals * ease),
            });
            if (progress < 1) requestAnimationFrame(animate);
        };
        animate();
    }, []);

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')} `;
    };

    const armor = calcStat(gameState.player.arm);
    const armRed = (getDefenseReduction(armor) * 100).toFixed(1);

    const colRedRaw = calculateLegendaryBonus(gameState, 'col_red_per_kill');
    const colRed = Math.min(80, colRedRaw).toFixed(1);

    const projRedRaw = calculateLegendaryBonus(gameState, 'proj_red_per_kill');
    const projRed = Math.min(80, projRedRaw).toFixed(1);

    const regen = calcStat(gameState.player.reg).toFixed(1);
    const maxHp = Math.round(calcStat(gameState.player.hp));

    const xpBase = gameState.player.xp_per_kill.base;
    const finalXpPerKill = Math.round(calcStat({
        ...gameState.player.xp_per_kill,
        base: xpBase
    }));

    const upgrades = [...gameState.player.upgradesCollected].sort((a, b) => {
        const tierMap: Record<string, number> = {
            'scrap': 0, 'anomalous': 1, 'quantum': 2, 'astral': 3, 'radiant': 4,
            'abyss': 5, 'eternal': 6, 'divine': 7, 'singularity': 8, 'boss': 9
        };
        const tierA = tierMap[a.rarity.id] || 0;
        const tierB = tierMap[b.rarity.id] || 0;
        return tierA !== tierB ? tierA - tierB : a.type.name.localeCompare(b.type.name);
    });

    const grouped: { choice: UpgradeChoice, count: number }[] = [];
    upgrades.forEach(u => {
        const key = `${u.rarity.id} -${u.type.id} `;
        const existing = grouped.find(g => `${g.choice.rarity.id} -${g.choice.type.id} ` === key);
        if (existing) existing.count++;
        else grouped.push({ choice: u, count: 1 });
    });

    if (gameState.extractionStatus === 'complete') {
        return (
            <div className={styles.extractionContainer}>
                <div className={styles.extractionTitle}>
                    MISSION COMPLETED
                </div>

                {!isSubmitting && rank && (
                    <div className={styles.rankContainer}>
                        <div className={styles.rankLabel}>GLOBAL RANK</div>
                        <div className={`${styles.rankNumber} ${RANK_CLASSES[getRankVariant(rank, true)]}`}>#{rank}</div>
                    </div>
                )}

                <button className={styles.extractionButton} onClick={onQuit}>
                    MAIN MENU
                </button>
            </div>
        );
    }

    const cheatsActive = gameState.cheatsUsed || (typeof window !== 'undefined' && (window as ExtendedWindow).__cheatsUsed);

    return (
        <div className={styles.deathScreen}>
            <div className={styles.actionButtons}>

                <div className={styles.rankingsGroup}>
                    <button className={styles.rankingsBtn} onClick={onShowLeaderboard}>RANKINGS</button>

                    {isSubmitting ? (
                        <div className={styles.uploadingText}>UPLOADING...</div>
                    ) : submissionError === 'CHEATS DETECTED' ? (
                        <div className={styles.cheatsText}>
                            YOU USED CHEATS.<br />RECORD NOT SAVED.
                        </div>
                    ) : submissionError === 'NOT LOGGED IN' ? (
                        <div className={styles.notLoggedInText}>
                            PLEASE LOGIN TO<br />SAVE RECORDS
                        </div>
                    ) : submissionError ? (
                        <div className={styles.submissionErrorText}>
                            {submissionError.toUpperCase()}
                        </div>
                    ) : cheatsActive ? (
                        <div className={styles.cheatsText}>
                            YOU USED CHEATS.<br />RECORD NOT SAVED.
                        </div>
                    ) : rank ? (
                        <div className={styles.rankDisplay}>
                            <div className={styles.rankDisplayLabel}>GLOBAL RANK</div>
                            <div className={`${styles.rankDisplayNumber} ${RANK_CLASSES[getRankVariant(rank, false)]}`}>#{rank}</div>
                        </div>
                    ) : null}
                </div>

                <button className={styles.retrialBtn} onClick={onRestart}>RETRIAL</button>
                <button className={styles.mainMenuBtn} onClick={onQuit}>MAIN MENU</button>
            </div>

            <div className={styles.header}>
                <div className={styles.deathTitle}>SESSION TERMINATED</div>

                <div className={styles.tabsBar}>
                    <button className={`${styles.tab}${activeTab === 'overview' ? ` ${styles.active}` : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`${styles.tab}${activeTab === 'modules' ? ` ${styles.active}` : ''}`} onClick={() => setActiveTab('modules')}>Hardware Profile</button>
                    <button className={`${styles.tab}${activeTab === 'damage' ? ` ${styles.active}` : ''}`} onClick={() => setActiveTab('damage')}>Outgoing DMG</button>
                    <button className={`${styles.tab}${activeTab === 'vitals' ? ` ${styles.active}` : ''}`} onClick={() => setActiveTab('vitals')}>Vitals</button>
                </div>
            </div>

            <div className={styles.content}>
                {activeTab === 'overview' && (
                    <div className={styles.overviewGrid}>

                        <div className={styles.panel}>
                            <div className={styles.panelHeader}>
                                <div className={styles.panelHeaderAccent} /> MISSION LOG
                            </div>
                            <StatItem label="Time Active" value={formatTime(stats.time)} color="white" />
                            <StatItem label="LEVEL" value={displayStats.level} color="cyan" />
                            <StatItem label="Kill Count" value={displayStats.kills} color="red" subValue={`${displayStats.bosses} Bosses`} />
                            <StatItem label="Snitches" value={displayStats.snitch} color="amber" />
                            <StatItem label="Portals" value={displayStats.portals} color="purple" />
                            <StatItem label="Meteorites" value={gameState.meteoritesPickedUp || 0} color="green" />
                            <StatItem label="Cause of Death" value={gameState.player.deathCause || 'Unknown'} color="red" />
                            {gameState.player.lastHitDamage !== undefined && (
                                <StatItem label="Killing Blow" value={formatLargeNumber(gameState.player.lastHitDamage)} color="pink" />
                            )}
                            {gameState.player.killerHp !== undefined && (
                                <StatItem label="Killer HP" value={formatLargeNumber(gameState.player.killerHp)} color="amber" />
                            )}
                            {gameState.player.killerMaxHp !== undefined && (
                                <StatItem label="Killer Max HP" value={formatLargeNumber(gameState.player.killerMaxHp)} color="amber" />
                            )}
                        </div>

                        <div className={styles.panel}>
                            <div className={styles.performanceHeader}>
                                FINAL SYSTEM PERFORMANCE
                            </div>
                            <div className={styles.statsGrid}>
                                <FinalStatItem label="DMG/HIT" value={formatLargeNumber(calcStat(gameState.player.dmg))} color="amber" />
                                <FinalStatItem label="MAX HP" value={formatLargeNumber(maxHp)} color="lightGreen" />
                                <FinalStatItem label="XP/KILL" value={formatLargeNumber(finalXpPerKill)} color="cyan" />
                                <FinalStatItem label="ATK SPEED" value={(2.64 * Math.log(calcStat(gameState.player.atk) / 100) - 1.25).toFixed(2) + '/s'} color="purple" />
                                <FinalStatItem label="REGEN" value={formatLargeNumber(regen) + '/s'} color="lightGreen" />
                                <FinalStatItem label="ARMOR" value={formatLargeNumber(Math.round(calcStat(gameState.player.arm)))} color="blue" />
                                <FinalStatItem label="ARM REDUC" value={armRed + '%'} color="blue" />
                                <FinalStatItem label="SPEED" value={gameState.player.speed.toFixed(1)} color="cyan" />
                                <FinalStatItem label="COL REDUC" value={colRed + '%'} color="blue" />
                                <FinalStatItem label="PROJ REDUC" value={projRed + '%'} color="blue" />
                            </div>

                            <div className={styles.sectorAllocation}>
                                SECTOR ALLOCATION
                                <div className={styles.sectorList}>
                                    <div className={styles.sectorItem}><span>ECONOMIC ARENA</span><span className={styles.sectorTime}>{formatTime(gameState.timeInArena?.[0] || 0)}</span></div>
                                    <div className={styles.sectorItem}><span>COMBAT ARENA</span><span className={styles.sectorTime}>{formatTime(gameState.timeInArena?.[1] || 0)}</span></div>
                                    <div className={styles.sectorItem}><span>DEFENCE ARENA</span><span className={styles.sectorTime}>{formatTime(gameState.timeInArena?.[2] || 0)}</span></div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.panelWide}>
                            <div className={styles.analyticsContent}>
                                <div className={styles.analyticsLeft}>
                                    <div className={styles.analyticsHeader}>
                                        <div className={styles.analyticsAccent} /> COMBAT ANALYTICS
                                    </div>
                                    <div className={styles.analyticsGrid}>
                                        <StatItem label="DMG Dealt" value={formatLargeNumber(gameState.player.damageDealt)} color="amber" />
                                        <div className={styles.dmgBlockedRow}>
                                            <span className={styles.dmgBlockedLabel}>DMG Blocked</span>
                                            <span className={styles.dmgBlockedValue}>{formatLargeNumber(gameState.player.damageBlocked)}</span>
                                        </div>
                                        <StatItem label="DMG Received" value={formatLargeNumber(gameState.player.damageTaken)} color="red" />
                                        <div className={styles.blockBreakdown}>
                                            <div className={styles.blockBreakdownRow}><span className={styles.blockBreakdownLabel}>ARMOR</span><span className={styles.blockBreakdownValue}>{formatLargeNumber(gameState.player.damageBlockedByArmor || 0)}</span></div>
                                            <div className={styles.blockBreakdownRow}><span className={styles.blockBreakdownLabel}>SHIELD</span><span className={styles.blockBreakdownValue}>{formatLargeNumber(gameState.player.damageBlockedByShield || 0)}</span></div>
                                            <div className={styles.blockBreakdownRow}><span className={styles.blockBreakdownLabel}>COLLISION</span><span className={styles.blockBreakdownValue}>{formatLargeNumber(gameState.player.damageBlockedByCollisionReduc || 0)}</span></div>
                                            <div className={styles.blockBreakdownRow}><span className={styles.blockBreakdownLabel}>PROJECTILE</span><span className={styles.blockBreakdownValue}>{formatLargeNumber(gameState.player.damageBlockedByProjectileReduc || 0)}</span></div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.radarContainer}>
                                    <RadarChart player={gameState.player} size={150} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'modules' && (
                    <div className={styles.panel}>
                        <div className={styles.modulesHeader}>
                            HARDWARE MODIFICATIONS ({gameState.player.upgradesCollected.length})
                        </div>
                        <div className={styles.modulesGrid}>
                            {grouped.map((g, i) => (
                                <div key={i} className={styles.moduleCard} style={{ '--rarity-color': g.choice.rarity.color } as RarityVars}>
                                    <div className={styles.moduleCardInfo}>
                                        <span className={styles.moduleRarity}>{g.choice.rarity.label}</span>
                                        <span className={styles.moduleName}>{g.choice.type.name}</span>
                                    </div>
                                    <span className={styles.moduleCount}>x{g.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'vitals' && (
                    <div className={styles.panel}>
                        <div className={styles.damageHeader}>
                            VITALS ANALYSIS
                        </div>
                        <VitalsAnalysis player={gameState.player} t={t} />
                    </div>
                )}

                {activeTab === 'damage' && (
                    <div className={styles.panel}>
                        <div className={styles.damageHeader}>
                            OUTGOING DAMAGE ATTRIBUTION
                        </div>
                        <div className={styles.damageList}>
                            {(() => {
                                const { groupMap, sourceColors, sourceGradients } = getDamageMapping(gameState.player.playerClass);
                                const breakdown = gameState.player.damageBreakdown || {};
                                const totalDamage = gameState.player.damageDealt;
                                const processedSources = new Set<string>();
                                const rows: React.ReactNode[] = [];

                                Object.entries(groupMap).forEach(([parent, cfg]) => {
                                    let groupTotal = 0;
                                    cfg.children.forEach(c => groupTotal += (breakdown[c] || 0));

                                    if (groupTotal > 0) {
                                        const activeChildren = cfg.children.filter(c => (breakdown[c] || 0) > 0);
                                        const showChildren = activeChildren.length > 1;

                                        rows.push(
                                            <div key={parent + "_group"}>
                                                <DamageRow
                                                    label={parent === 'Projectile' ? (t.statsMenu.labels.damageSources.projectile || 'Projectile') : parent}
                                                    amount={groupTotal}
                                                    total={totalDamage}
                                                    color={cfg.color}
                                                    gradient={cfg.gradient}
                                                    icon={parent === 'Projectile' ? undefined : cfg.icon}
                                                />
                                                {showChildren && (
                                                    <div className={styles.damageChildList}>
                                                        {activeChildren.map(c => (
                                                            <div key={c} className={styles.damageChildRow}>
                                                                <span className={styles.damageChildLabel}>- {cfg.childLabels[c] || c}</span>
                                                                <span className={styles.damageChildValue}>{formatLargeNumber(breakdown[c])}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                        cfg.children.forEach(c => processedSources.add(c));
                                    }
                                });

                                Object.entries(breakdown).forEach(([source, amount]) => {
                                    if (processedSources.has(source) || amount <= 0) return;

                                    rows.push(
                                        <DamageRow
                                            key={source}
                                            label={t.statsMenu.labels.damageSources[source as keyof typeof t.statsMenu.labels.damageSources] || source}
                                            amount={amount}
                                            total={totalDamage}
                                            color={sourceColors[source] || '#64748b'}
                                            gradient={sourceGradients[source]}
                                        />
                                    );
                                });

                                return rows.length > 0 ? rows : <div className={styles.noCombatData}>NO COMBAT DATA</div>;
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
