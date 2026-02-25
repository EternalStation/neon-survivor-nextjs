import React, { useState } from 'react';
import type { GameState } from '../../logic/core/types';
import { formatLargeNumber } from '../../utils/format';
import { useLanguage } from '../../lib/LanguageContext';
import { getUiTranslation } from '../../lib/uiTranslations';


interface BossStatusProps {
    gameState: GameState;
    showSkillDetail: boolean;
    setShowSkillDetail: (v: boolean) => void;
}

export const BossStatus: React.FC<BossStatusProps> = ({ gameState, showSkillDetail, setShowSkillDetail }) => {
    const { language } = useLanguage();
    const t = getUiTranslation(language);
    const tb = t.bosses;

    const BOSS_NAMES: Record<string, string> = tb.names;

    const BOSS_SKILLS: Record<string, { name: string; desc: string; color: string; iconLabel: string; iconUrl?: string }> = {
        square: { ...tb.skills.thorns, color: '#94a3b8', iconLabel: 'T', iconUrl: '/assets/BossSkills/ThornsLVL2.JPG' },
        pentagon: { ...tb.skills.soulLink, color: '#bf00ff', iconLabel: 'L', iconUrl: '/assets/BossSkills/LinkLVL2.JPG' },
        circle: { ...tb.skills.berserkRush, color: '#ef4444', iconLabel: 'R', iconUrl: '/assets/BossSkills/RushLVL2.JPG' },
        triangle: { ...tb.skills.bladeSpin, color: '#eab308', iconLabel: 'S', iconUrl: '/assets/BossSkills/DushLVL2.JPG' },
        diamond: { ...tb.skills.hyperBeam, color: '#f87171', iconLabel: '⚡', iconUrl: '/assets/BossSkills/LaserLVL2.JPG' }
    };

    const BOSS_SKILLS_L3: Record<string, { name: string; desc: string; color: string; iconLabel: string; iconUrl?: string }> = {
        square: { ...tb.skills.orbitalPlating, color: '#cbd5e1', iconLabel: 'B', iconUrl: '/assets/BossSkills/ShieldLVL3.JPG' },
        pentagon: { ...tb.skills.parasiticLink, color: '#a855f7', iconLabel: 'L', iconUrl: '/assets/BossSkills/ParasiticLinkLVL3.JPG' },
        circle: { ...tb.skills.cyclonePull, color: '#d1d5db', iconLabel: 'V', iconUrl: '/assets/BossSkills/CycloneLVL3.JPG' },
        triangle: { ...tb.skills.deflectionField, color: '#fde047', iconLabel: 'D', iconUrl: '/assets/BossSkills/BladeLVL3.JPG' },
        diamond: { ...tb.skills.satelliteStrike, color: '#ef4444', iconLabel: 'S', iconUrl: '/assets/BossSkills/SateliteLVL3.JPG' }
    };

    const BOSS_SKILLS_L4: Record<string, { name: string; desc: string; color: string; iconLabel: string; iconUrl?: string }> = {
        square: { ...tb.skills.titanPlating, color: '#ef4444', iconLabel: 'T', iconUrl: '/assets/BossSkills/ThornsLVL4.JPG' },
        circle: { ...tb.skills.soulDevourer, color: '#bf00ff', iconLabel: 'D', iconUrl: '/assets/BossSkills/SuckLVL4.JPG' },
        triangle: { ...tb.skills.mortalityCurse, color: '#991b1b', iconLabel: 'C', iconUrl: '/assets/BossSkills/CurseLVL4.JPG' },
        diamond: { ...tb.skills.convergenceZone, color: '#f59e0b', iconLabel: 'Z', iconUrl: '/assets/BossSkills/LaserLVL4.JPG' },
        pentagon: { ...tb.skills.hivemindPhalanx, color: '#6366f1', iconLabel: 'P', iconUrl: '/assets/BossSkills/PhalanxLVL4.JPG' }
    };

    const BOSS_SKILLS_L5: Record<string, { name: string; desc: string; color: string; iconLabel: string; iconUrl?: string }> = {
        diamond: { ...tb.skills.crystalFence, color: '#00ffff', iconLabel: 'F', iconUrl: '/assets/BossSkills/CrystalFenceLVL5.JPG' }
    };

    const hudT = t.hud;

    const activeBosses = gameState.enemies.filter(e => e.boss && !e.dead);
    // Sort by spawn time to keep order consistent with appearance
    activeBosses.sort((a, b) => (a.spawnedAt || 0) - (b.spawnedAt || 0));

    // Remove local state, use props
    const [localSkillData, setLocalSkillData] = useState<{ name: string; desc: string; color: string; iconLabel: string; iconUrl?: string } | null>(null);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Escape' && showSkillDetail) {
                setShowSkillDetail(false);
                setLocalSkillData(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSkillDetail]);

    return (
        <>
            <div style={{
                position: 'absolute', top: 45, left: '50%', transform: 'translateX(-50%)',
                width: 500, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
            }}>
                {activeBosses.map((boss) => {
                    const hpPct = (boss.hp / boss.maxHp) * 100;
                    const isLevel5 = boss.bossTier === 5 || (gameState.gameTime > 2400 && boss.bossTier !== 1);
                    const isLevel4 = boss.bossTier === 4 || (gameState.gameTime > 1800 && boss.bossTier !== 1) || isLevel5;
                    const isLevel3 = boss.bossTier === 3 || (gameState.gameTime > 1200 && boss.bossTier !== 1) || isLevel4;
                    const isLevel2 = boss.bossTier === 2 || gameState.gameTime > 600 || isLevel3;

                    // Collect Skills for THIS boss
                    const skills = [];
                    if (isLevel2 && BOSS_SKILLS[boss.shape]) skills.push(BOSS_SKILLS[boss.shape]);
                    if (isLevel3 && BOSS_SKILLS_L3[boss.shape]) skills.push(BOSS_SKILLS_L3[boss.shape]);
                    if (isLevel4 && BOSS_SKILLS_L4[boss.shape]) skills.push(BOSS_SKILLS_L4[boss.shape]);
                    if (isLevel5 && BOSS_SKILLS_L5[boss.shape]) skills.push(BOSS_SKILLS_L5[boss.shape]);

                    return (
                        <div key={boss.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* BOSS NAME & LEVEL */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', width: '100%',
                                color: '#fff', fontSize: 12, fontWeight: 900, textTransform: 'uppercase',
                                letterSpacing: 2, textShadow: '0 0 10px rgba(239, 68, 68, 0.5)', marginBottom: 2
                            }}>
                                <span>{BOSS_NAMES[boss.shape] || hudT.bossWord}</span>
                                <span style={{ color: '#ef4444' }}>
                                    {hudT.bossLvl} {isLevel5 ? '5' : (isLevel4 ? '4' : (isLevel3 ? '3' : (isLevel2 ? '2' : '1')))}
                                </span>
                            </div>

                            {/* HP BAR SECTION */}
                            <div style={{
                                width: '100%', height: 16, background: 'rgba(0,0,0,0.8)', border: '1px solid #ef4444',
                                borderRadius: 2, overflow: 'hidden', position: 'relative',
                                boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)'
                            }}>
                                <div style={{
                                    width: `${hpPct}%`, height: '100%',
                                    background: 'linear-gradient(90deg, #ef4444, #991b1b)',
                                    transition: 'width 0.1s linear'
                                }} />
                                <div style={{
                                    position: 'absolute', width: '100%', textAlign: 'center', top: 0,
                                    color: '#fff', fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                    letterSpacing: 2, lineHeight: '16px', textShadow: '0 0 4px #000'
                                }}>
                                    {formatLargeNumber(Math.round(boss.hp))} / {formatLargeNumber(Math.round(boss.maxHp))} {hudT.bossHp}
                                </div>
                                {boss.shape === 'abomination' && boss.stage && (
                                    <div style={{
                                        position: 'absolute', right: 8, top: 0,
                                        color: boss.stage === 3 ? '#b91c1c' : (boss.stage === 2 ? '#ef4444' : '#f87171'),
                                        fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                                        letterSpacing: 1.5, lineHeight: '16px',
                                        textShadow: `0 0 8px ${boss.stage === 3 ? '#b91c1c' : (boss.stage === 2 ? '#ef4444' : '#f87171')}`
                                    }}>
                                        {hudT.bossStage} {boss.stage}
                                    </div>
                                )}
                            </div>

                            {/* SKILL ICONS SECTION for THIS boss */}
                            {skills.length > 0 && (
                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    {skills.map((skill, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setLocalSkillData(skill);
                                                setShowSkillDetail(true);
                                            }}
                                            style={{
                                                width: 28, height: 28,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: skill.color, fontWeight: 900, cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                pointerEvents: 'auto',
                                                overflow: 'hidden'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            {skill.iconUrl ? (
                                                <img
                                                    src={skill.iconUrl}
                                                    alt={skill.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%', height: '100%', border: `1px solid ${skill.color}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(0,0,0,0.5)', borderRadius: 2
                                                }}>
                                                    {skill.iconLabel}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* SKILL DESCRIPTION MODAL */}
            {showSkillDetail && localSkillData && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 200, backdropFilter: 'blur(8px)', pointerEvents: 'auto'
                }} onClick={() => { setShowSkillDetail(false); setLocalSkillData(null); }}>
                    <div style={{
                        width: 400, background: 'rgba(15, 23, 42, 0.98)', border: `2px solid ${localSkillData.color}`,
                        padding: 30, borderRadius: 12, boxShadow: `0 0 50px ${localSkillData.color}66`,
                        display: 'flex', flexDirection: 'column', gap: 16, position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ color: localSkillData.color, fontWeight: 900, fontSize: 20, letterSpacing: 3, textTransform: 'uppercase' }}>
                            {localSkillData.name}
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: 15, lineHeight: '1.6', fontFamily: 'monospace' }}>
                            {localSkillData.desc}
                        </div>
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                        <button
                            onClick={() => { setShowSkillDetail(false); setLocalSkillData(null); }}
                            style={{
                                alignSelf: 'center', background: localSkillData.color, border: 'none',
                                color: '#000', padding: '10px 30px', borderRadius: 4,
                                fontSize: 12, cursor: 'pointer', fontWeight: 900,
                                textTransform: 'uppercase', letterSpacing: 2,
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        >
                            {hudT.bossDismiss}
                        </button>
                        <div style={{ position: 'absolute', bottom: -30, width: '100%', left: 0, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1 }}>
                            {hudT.bossResumePrompt}
                        </div>
                    </div>
                </div>
            )}



        </>
    );
};
