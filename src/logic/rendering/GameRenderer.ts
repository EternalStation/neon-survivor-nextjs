import type { GameState } from '../core/types';
import type { Language } from '../../lib/LanguageContext';
import { getPulseIntensity } from '../effects/PulseSystem';
import { renderBackground, renderMapBoundaries, renderPortals, renderArenaVignette } from './renderers/MapRenderer';
import { renderPOIs } from './renderers/PoiRenderer';
import { renderPlayer, renderVoidMarker } from './renderers/PlayerRenderer';
import { renderEnemies } from './renderers/EnemyRenderer';
import { renderDrones, renderAllies, renderMeteorites, renderBossIndicator, renderExtractionShip } from './renderers/EntityRenderer';
import { renderProjectiles } from './renderers/ProjectileRenderer';
import { renderAreaEffects, renderEpicenterShield, renderParticles, renderFloatingNumbers, renderScreenEffects, renderVignette } from './renderers/EffectRenderer';
import { renderSandbox } from './renderers/SandboxRenderer';

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, meteoriteImages: Record<string, HTMLImageElement>, scaleFactor: number = 1, language: Language = 'en') {
    
    
    const DAMAGE_FLASH_CD = 1.5;
    if ((window as any)._lastRenderedPlayerHp !== undefined) {
        if (state.player.curHp < (window as any)._lastRenderedPlayerHp) {
            const lastDmg = state.player.lastDamageTime ?? -999;
            if (state.gameTime - lastDmg >= DAMAGE_FLASH_CD) {
                state.player.lastDamageTime = state.gameTime;
            }
        }
    }
    (window as any)._lastRenderedPlayerHp = state.player.curHp;

    const { width, height } = ctx.canvas;
    const { camera } = state;

    
    ctx.imageSmoothingEnabled = false;

    
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.globalAlpha = 1.0;
    ctx.setLineDash([]);

    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = (width / dpr) / scaleFactor;
    const logicalHeight = (height / dpr) / scaleFactor;

    
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    try {
        ctx.save();

        
        ctx.translate(width / 2, height / 2);
        const zoom = scaleFactor * 0.58 * dpr;
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);

        
        

        
        if (state.bossPresence > 0.01) {
            ctx.fillStyle = `rgba(0, 0, 0, ${state.bossPresence * 0.7})`;
            const vW = logicalWidth / 0.58;
            const vH = logicalHeight / 0.58;
            ctx.fillRect(camera.x - vW, camera.y - vH, vW * 2, vH * 2);
        }

        

        
        renderBackground(ctx, state, logicalWidth, logicalHeight);

        
        renderMapBoundaries(ctx, state);


        
        renderPOIs(ctx, state, language);


        
        
        
        
        
        
        
        
        renderArenaVignette(ctx, state);

        
        renderAreaEffects(ctx, state);
        renderVoidMarker(ctx, state);
        renderSandbox(ctx, state);

        
        renderPortals(ctx, state);

        
        renderMeteorites(ctx, state, meteoriteImages);

        
        renderProjectiles(ctx, state);

        
        renderDrones(ctx, state);
        renderAllies(ctx, state);

        
        renderParticles(ctx, state, 'void');

        renderEnemies(ctx, state, meteoriteImages);

        
        
        if (state.players) {
            Object.values(state.players).forEach(p => {
                renderPlayer(ctx, p, state, meteoriteImages);
            });
        } else {
            
            renderPlayer(ctx, state.player, state, meteoriteImages);
        }

        
        
        renderEpicenterShield(ctx, state);

        
        renderParticles(ctx, state, 'non-void');
        renderFloatingNumbers(ctx, state);

        
        renderExtractionShip(ctx, state, meteoriteImages);

        ctx.restore(); 

        
        renderBossIndicator(ctx, state, width, height, camera, scaleFactor);
        renderScreenEffects(ctx, state, width, height);

        
        if (state.extractionStatus === 'departing' || state.extractionStatus === 'complete') {
            const opacity = state.extractionStatus === 'complete' ? 1.0 : (1 - state.extractionTimer / 5.0);
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.fillRect(0, 0, width, height);

            if (state.extractionStatus === 'complete') {
                ctx.fillStyle = '#fff';
                ctx.font = `italic 900 ${80 * dpr}px Orbitron, sans-serif`;
                ctx.textAlign = 'center';
                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 40;
                ctx.fillText("MISSION COMPLETED", width / 2, height / 2);

                
            }
        }

        
        renderVignette(ctx, width, height);

        
        
        if (state.gameTime > 1800) { 
            const intensity = getPulseIntensity(state.gameTime); 
            
            
            const alpha = Math.max(0, (intensity - 0.4) * 0.2);

            if (alpha > 0) {
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);

                
                const cx = width / 2;
                const cy = height / 2;
                const radius = Math.max(width, height) * 0.7;

                const pulseGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
                pulseGrad.addColorStop(0, 'rgba(220, 38, 38, 0)');
                pulseGrad.addColorStop(1, `rgba(220, 38, 38, ${alpha})`); 

                ctx.fillStyle = pulseGrad;
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        }

    } catch (e) {
        
        if ((window as any)._rendererErrorCount === undefined) {
            (window as any)._rendererErrorCount = 0;
        }
        if ((window as any)._rendererErrorCount < 3) {
            console.error("Render Error:", e);
            (window as any)._rendererErrorCount++;
        }
    }

    
    try { ctx.restore(); } catch (e) { }
}
