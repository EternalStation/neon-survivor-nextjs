import React, { useState } from 'react';
import type { GameState } from '../../logic/types';


interface BossStatusProps {
    gameState: GameState;
    showSkillDetail: boolean;
    setShowSkillDetail: (v: boolean) => void;
}

const BOSS_NAMES: Record<string, string> = {
    square: 'THE FORTRESS',
    circle: 'THE JUGGERNAUT',
    triangle: 'THE BLADE',
    diamond: 'THE MARKSMAN',
    pentagon: 'THE OVERMIND'
};

const BOSS_SKILLS: Record<string, { name: string; desc: string; color: string; iconLabel: string; iconUrl?: string }> = {
    square: {
        name: 'THORNS',
        desc: 'Hardened shell reflects 3% of incoming damage back to the source.',
        color: '#94a3b8',
        iconLabel: 'T',
        iconUrl: '/assets/BossSkills/ThornsLVL2.JPG'
    },
    pentagon: {
        name: 'SOUL LINK',
        desc: 'Links minions to the hive mind. Contact with linked targets deals 30% HP damage but destroys the target and damages the Boss. Shared HP pool.',
        color: '#bf00ff',
        iconLabel: 'L',
        iconUrl: '/assets/BossSkills/LinkLVL2.JPG'
    },
    circle: {
        name: 'BERSERK RUSH',
        desc: 'Initiates a high-velocity dash towards the player, dealing 30% Max HP damage on impact.',
        color: '#ef4444',
        iconLabel: 'R',
        iconUrl: '/assets/BossSkills/RushLVL2.JPG'
    },
    triangle: {
        name: 'BLADE SPIN',
        desc: 'Spins violently during dash phases, increasing movement speed and generating a jagged yellow aura.',
        color: '#eab308',
        iconLabel: 'S',
        iconUrl: '/assets/BossSkills/DushLVL2.JPG'
    },
    diamond: {
        name: 'HYPER BEAM',
        desc: 'Fires a high-intensity laser burst. LVL 1 is reduced by Armor. LVL 2 PIERCES ALL ARMOR.',
        color: '#f87171',
        iconLabel: '⚡',
        iconUrl: '/assets/BossSkills/LaserLVL2.JPG'
    }
};

const BOSS_SKILLS_L3: Record<string, { name: string; desc: string; color: string; iconLabel: string; iconUrl?: string }> = {
    square: {
        name: 'ORBITAL PLATING',
        desc: 'Deploys 3 localized shield generators that grant invulnerability. Shields must be destroyed to damage the boss. Regenerates every 15s.',
        color: '#cbd5e1',
        iconLabel: 'P',
        iconUrl: '/assets/BossSkills/ShieldLVL3.JPG'
    },
    pentagon: {
        name: 'PARASITIC LINK',
        desc: ' Tethers to the player if close, draining 3% Max HP per second to heal the boss. moved > 800px away to break.',
        color: '#a855f7',
        iconLabel: 'L',
        iconUrl: '/assets/BossSkills/ParasiticLinkLVL3.JPG'
    },
    circle: {
        name: 'CYCLONE PULL',
        desc: 'Generates a massive vacuum that pulls the player and projectiles towards the boss. 10s Cooldown.',
        color: '#d1d5db', // windy grey
        iconLabel: 'C',
        iconUrl: '/assets/BossSkills/CycloneLVL3.JPG'
    },
    triangle: {
        name: 'DEFLECTION FIELD',
        desc: 'While spinning, deflects 50% of incoming projectiles in random directions.',
        color: '#fde047',
        iconLabel: 'D',
        iconUrl: '/assets/BossSkills/BladeLVL3.JPG'
    },
    diamond: {
        name: 'SATELLITE STRIKE',
        desc: 'Marks 3 zones around the player and strikes them with orbital beams after a short delay. Deals 3% Boss HP damage.',
        color: '#ef4444',
        iconLabel: 'S',
        iconUrl: '/assets/BossSkills/SateliteLVL3.JPG'
    }
};

export const BossStatus: React.FC<BossStatusProps> = ({ gameState, showSkillDetail, setShowSkillDetail }) => {
    const boss = gameState.enemies.find(e => e.boss && !e.dead);
    // Remove local state, use props
    const [localSkillData, setLocalSkillData] = useState<{ name: string; desc: string; color: string } | null>(null);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && showSkillDetail) {
                setShowSkillDetail(false);
                setLocalSkillData(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSkillDetail]);

    const hasBoss = !!boss;
    const hpPct = boss ? (boss.hp / boss.maxHp) * 100 : 0;

    const isLevel3 = boss && (boss.bossTier === 3 || (gameState.gameTime > 1200 && boss.bossTier !== 1));
    const isLevel2 = boss && (boss.bossTier === 2 || gameState.gameTime > 600 || isLevel3);

    // Collect Skills
    const skills = [];
    if (boss) {
        // Level 2 Skill (Available for L2 and L3 bosses)
        if (isLevel2 && BOSS_SKILLS[boss.shape]) {
            skills.push(BOSS_SKILLS[boss.shape]);
        }
        // Level 3 Skill (Available only for L3 bosses)
        if (isLevel3 && BOSS_SKILLS_L3[boss.shape]) {
            skills.push(BOSS_SKILLS_L3[boss.shape]);
        }
    }

    return (
        <>
            {hasBoss && (
                <div style={{
                    position: 'absolute', top: 45, left: '50%', transform: 'translateX(-50%)',
                    width: 500, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4
                }}>
                    {/* BOSS NAME & LEVEL */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', width: '100%',
                        color: '#fff', fontSize: 12, fontWeight: 900, textTransform: 'uppercase',
                        letterSpacing: 2, textShadow: '0 0 10px rgba(239, 68, 68, 0.5)', marginBottom: 2
                    }}>
                        <span>{boss ? (BOSS_NAMES[boss.shape] || 'ANOMALY') : ''}</span>
                        <span style={{
                            color: (() => {
                                const minutes = gameState.gameTime / 60;
                                const eraIndex = Math.floor(minutes / 15) % 4;
                                const eraColors = ['#4ade80', '#3b82f6', '#a855f7', '#f97316'];
                                return eraColors[eraIndex];
                            })()
                        }}>LVL {isLevel3 ? '3' : (isLevel2 ? '2' : '1')}</span>
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
                            {Math.round(boss.hp).toLocaleString()} / {Math.round(boss.maxHp).toLocaleString()} HP
                        </div>
                    </div>

                    {/* SKILL ICONS SECTION */}
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
                                        skill.iconLabel
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

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
                            [ DISMISS ]
                        </button>
                        <div style={{ position: 'absolute', bottom: -30, width: '100%', left: 0, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1 }}>
                            PRESS ESC OR CLICK ANYWHERE TO RESUME
                        </div>
                    </div>
                </div>
            )}



        </>
    );
};
