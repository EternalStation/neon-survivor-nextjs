import type { Enemy, GameState } from '../../core/types';
import { spawnParticles, spawnFloatingNumber } from '../../effects/ParticleLogic';
import { playSfx } from '../../audio/AudioLogic';

export function updateAbominationBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel4: boolean) {
    if (!e.stage) e.stage = 1;

    
    const hpPct = e.hp / e.maxHp;

    
    if (e.stage === 1 && hpPct < 0.6) {
        e.stage = 2;
        e.stage2StartTime = state.gameTime; 
        spawnFloatingNumber(state, e.x, e.y, "STAGE 2: EXPANDING INFERNO", '#ef4444', true);
        playSfx('rare-spawn');
    }

    
    if (e.stage === 2 && hpPct < 0.3) {
        e.stage = 3;
        spawnFloatingNumber(state, e.x, e.y, "STAGE 3: ETERNAL FLAME", '#b91c1c', true);
        playSfx('rare-spawn');
        
        for (let i = 0; i < 20; i++) {
            const a = Math.random() * 6.28;
            spawnParticles(state, e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 50, '#ef4444', 3);
        }
    }

    
    if (e.stage === 2) {
        
        if (e.stage2StartTime) {
            const stage2Duration = state.gameTime - e.stage2StartTime;
            e.bonusBurnRadius = Math.floor(stage2Duration * 10); 
        }
    }

    
    if (e.stage === 3) {
        
        if (e.stage2StartTime) {
            const stage2Duration = state.gameTime - e.stage2StartTime;
            e.bonusBurnRadius = Math.floor(stage2Duration * 10); 
        }

        if (state.frameCount % 60 === 0) {
            
            const heal = e.maxHp * 0.03;
            if (e.hp < e.maxHp) {
                e.hp = Math.min(e.maxHp, e.hp + heal);
                spawnFloatingNumber(state, e.x, e.y - 40, `+${Math.round(heal)}`, '#22c55e', false);
            }
            
            e.bonusBurnPct = (e.bonusBurnPct || 0) + 0.01;
            
            spawnFloatingNumber(state, e.x, e.y + 40, "B U R N ++", '#ef4444', false);
        }
    }

    
    const effectiveSpd = currentSpd;
    const angle = Math.atan2(dy, dx);
    const wobble = Math.sin(state.gameTime * 5) * 0.2;
    const vx = Math.cos(angle + wobble) * effectiveSpd + pushX;
    const vy = Math.sin(angle + wobble) * effectiveSpd + pushY;
    e.rotationPhase = angle + Math.PI / 2;

    return { vx, vy };
}

export function updateSquareBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean) {
    let effectiveSpd = currentSpd;
    if (isLevel2) {
        e.thorns = 0.03; 
        effectiveSpd = currentSpd * 0.85; 
    }

    if (isLevel4) {
        e.thorns = 0.05; 
        e.thornsIgnoresArmor = true;
    }

    
    if (isLevel3) {
        
        const activeShields = state.enemies.filter(s => s.parentId === e.id && !s.dead);
        e.orbitalShields = activeShields.length;

        
        if (!e.shieldsInitialized) {
            e.shieldsInitialized = true;
            
            import('../EnemySpawnLogic').then(({ spawnShield }) => {
                for (let i = 0; i < 3; i++) {
                    const angle = (i * Math.PI * 2) / 3;
                    const sx = e.x + Math.cos(angle) * 150;
                    const sy = e.y + Math.sin(angle) * 150;
                    spawnShield(state, sx, sy, e.id, e.maxHp * 0.1, angle);
                }
            });
        }

        if (e.orbitalShields > 0) {
            
            e.takenDamageMultiplier = 0;
            
            if (state.frameCount % 20 === 0) {
                spawnParticles(state, e.x, e.y, '#94a3b8', 2); 
            }
        } else {
            e.takenDamageMultiplier = 1.0;

            
            e.shieldRegenTimer = (e.shieldRegenTimer || 0) + 1;
            if (e.shieldRegenTimer > 900) { 
                
                for (let i = 0; i < 3; i++) {
                    
                    
                    
                    
                    import('../EnemySpawnLogic').then(({ spawnShield }) => {
                        const angle = (i * Math.PI * 2) / 3;
                        const sx = e.x + Math.cos(angle) * 150;
                        const sy = e.y + Math.sin(angle) * 150;
                        
                        
                        
                        
                        spawnShield(state, sx, sy, e.id, e.maxHp * 0.1, angle); 
                    });
                }
                e.shieldRegenTimer = 0;
                playSfx('recycle'); 
            }
        }
    }

    
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * effectiveSpd + pushX;
    const vy = Math.sin(angle) * effectiveSpd + pushY;
    return { vx, vy };
}

export function updateCircleBoss(e: Enemy, currentSpd: number, dx: number, dy: number, pushX: number, pushY: number, state: GameState, isLevel2: boolean, isLevel3: boolean, isLevel4: boolean) {
    const distToPlayer = Math.hypot(dx, dy);

    
    if (isLevel4) {
        
        if (!e.soulSuckUsed && distToPlayer < 700) {
            e.soulSuckUsed = true;
            e.soulSuckActive = true;
            e.soulSuckTimer = 300; 
            playSfx('warning'); 
        }

        if (e.soulSuckActive) {
            const totalTime = 300;
            e.soulSuckTimer = (e.soulSuckTimer || 0) - 1;
            const progress = Math.min(1.0, (totalTime - e.soulSuckTimer) / totalTime);

            if (e.soulSuckTimer <= 0) {
                e.soulSuckActive = false;
            }
            
            e.takenDamageMultiplier = 0;
            
            if (state.frameCount % 3 === 0) {
                const angleToBoss = Math.atan2(e.y - state.player.y, e.x - state.player.x);
                const spd = 15;
                const px = state.player.x + (Math.random() - 0.5) * 40;
                const py = state.player.y + (Math.random() - 0.5) * 40;
                spawnParticles(state, px, py, '#eab308', 4, spd, angleToBoss, 'void');
            }
            
            state.player.soulDrainMult = 1.0 - (0.5 * progress);

            
            e.soulSuckCoreSize = 5 + (25 * progress);

            return { vx: 0, vy: 0 }; 
        } else if (e.soulSuckUsed) {
            
            state.player.soulDrainMult = 0.5;
            e.takenDamageMultiplier = 1.0; 
        }
    }
    
    if (isLevel3) {
        if (!e.cycloneTimer) e.cycloneTimer = 0;
        e.cycloneTimer++;

        
        

        if (e.cycloneState === 1) {
            
            if (e.cycloneTimer > 120) {
                e.cycloneState = 0;
                e.cycloneTimer = 0;
            } else {
                
                const pullStrength = 0.86; 
                const angleToBoss = Math.atan2(e.y - state.player.y, e.x - state.player.x);
                
                
                
                state.player.knockback.x += Math.cos(angleToBoss) * pullStrength; 
                state.player.knockback.y += Math.sin(angleToBoss) * pullStrength;

                
                e.rotationPhase = (e.rotationPhase || 0) + 0.5; 
                if (state.frameCount % 5 === 0) {
                    spawnParticles(state, e.x, e.y, '#d1d5db', 3); 
                }

                
                return { vx: 0, vy: 0 };
            }
        } else {
            
            if (e.cycloneTimer > 600) {
                
                
                
                
                const pDist = Math.hypot(e.x - state.player.x, e.y - state.player.y);
                const isDashReady = !e.dashState || (e.dashState === 0 && (e.dashTimer || 0) > 90);

                if (pDist > 400 && isDashReady) {
                    e.cycloneState = 1;
                    e.cycloneTimer = 0;
                    playSfx('warning'); 
                } else {
                    
                    e.cycloneTimer = 600;
                }
            }
        }
    }

    if (isLevel2) {
        if (!e.dashTimer) e.dashTimer = 0;
        e.dashTimer++;
        const CD = 390; 

        
        if (e.dashState !== 1 && e.dashState !== 2) {
            
            
            
            
            
            
            
            
            
            

            const isCycloneSafe = !isLevel3 || (e.cycloneState !== 1 && (e.cycloneTimer || 0) > 120);

            if (distToPlayer < 700 && e.dashTimer > CD && isCycloneSafe) {
                e.dashState = 1; 
                e.dashTimer = 0;
                e.dashLockX = state.player.x;
                e.dashLockY = state.player.y;
            }
            
            const angle = Math.atan2(dy, dx);
            const vx = Math.cos(angle) * currentSpd + pushX;
            const vy = Math.sin(angle) * currentSpd + pushY;
            return { vx, vy };
        }
        else if (e.dashState === 1) {
            
            const vx = 0; const vy = 0; 
            if (e.dashTimer > 30) {
                e.dashState = 2; 
                e.dashTimer = 0;
                
                const dashAngle = Math.atan2((e.dashLockY || 0) - e.y, (e.dashLockX || 0) - e.x);
                e.dashAngle = dashAngle;
            }
            return { vx, vy };
        }
        else if (e.dashState === 2) {
            
            const vx = Math.cos(e.dashAngle || 0) * (currentSpd * 5);
            const vy = Math.sin(e.dashAngle || 0) * (currentSpd * 5);
            if (e.dashTimer > 30) {
                e.dashState = 0; 
                e.dashTimer = 0;
            }
            return { vx, vy };
        }
    }

    
    const angle = Math.atan2(dy, dx);
    const vx = Math.cos(angle) * currentSpd + pushX;
    const vy = Math.sin(angle) * currentSpd + pushY;
    return { vx, vy };
}
