import type { GameState } from './types';
import { renderBackground, renderMapBoundaries, renderPortals, renderArenaVignette } from './renderers/MapRenderer';
import { renderPlayer, renderEnemies, renderProjectiles, renderDrones, renderMeteorites, renderBossIndicator } from './renderers/EntityRenderer';
import { renderAreaEffects, renderEpicenterShield, renderParticles, renderFloatingNumbers, renderScreenEffects, renderVignette } from './renderers/EffectRenderer';

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, meteoriteImages: Record<string, HTMLImageElement>, scaleFactor: number = 1) {
    const { width, height } = ctx.canvas;
    const { camera } = state;

    // Pixel Art Rendering
    ctx.imageSmoothingEnabled = false;

    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = (width / dpr) / scaleFactor;
    const logicalHeight = (height / dpr) / scaleFactor;

    // Clear (Full buffer size, PHYSICAL pixels)
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    try {
        ctx.save();

        // Zoom / Camera Logic
        ctx.translate(width / 2, height / 2);
        const zoom = scaleFactor * 0.58 * dpr;
        ctx.scale(zoom, zoom);
        ctx.translate(-camera.x, -camera.y);

        // Screen Shake Logic
        if (state.spawnTimer > 0 || state.bossPresence > 0.01) {
            let intensity = 0;
            if (state.spawnTimer > 0) intensity += state.spawnTimer * 5;
            if (state.bossPresence > 0) {
                intensity += 3 * state.bossPresence;
                if (Math.random() < 0.05 * state.bossPresence) intensity += 15 * state.bossPresence;
            }
            const shakeX = (Math.random() - 0.5) * (intensity + (state.critShake || 0));
            const shakeY = (Math.random() - 0.5) * (intensity + (state.critShake || 0));
            ctx.translate(shakeX, shakeY);
        }

        // Global Darken for Boss
        if (state.bossPresence > 0.01) {
            ctx.fillStyle = `rgba(0, 0, 0, ${state.bossPresence * 0.7})`;
            const vW = logicalWidth / 0.58;
            const vH = logicalHeight / 0.58;
            ctx.fillRect(camera.x - vW, camera.y - vH, vW * 2, vH * 2);
        }

        // --- LAYERED RENDERING ---

        // 1. Background
        renderBackground(ctx, state, logicalWidth, logicalHeight);

        // 2. Map Boundaries
        renderMapBoundaries(ctx);

        // 2.5 Arena Fog (Vignette for Arena) - Draws ON TOP of background but BELOW entities if we want entities to pop? 
        // User wants "atmosphere" so fog should probably be below entities to simulate ground fog?
        // But "depth of field off screen" implies hiding things.
        // Let's draw it HERE so the grid is hidden, but entities are visible on top of the black void?
        // If entities walk into the void, they should be hidden?
        // If so, draw it LATER.
        // Let's draw it AFTER entities (Layer 8.5) so they fade out when leaving?
        // No, let's draw it HERE to hide the "grid" outside.
        renderArenaVignette(ctx);

        // 3. Ground Effects (Area Effects)
        renderAreaEffects(ctx, state);

        // 4. Portals
        renderPortals(ctx, state);

        // 5. Pickups / Loot
        renderMeteorites(ctx, state, meteoriteImages);

        // 6. Projectiles
        renderProjectiles(ctx, state);

        // 7. Entities (Enemies, Drones)
        renderDrones(ctx, state);

        // 7.5. Void particles (behind enemies for layering)
        renderParticles(ctx, state, 'void');

        renderEnemies(ctx, state, meteoriteImages);

        // 8. Player (Drawn ON TOP of enemies to prevent clipping/coloring issues)
        renderPlayer(ctx, state, meteoriteImages);
        renderEpicenterShield(ctx, state);

        // 9. Particles & Floating Numbers (in front of enemies)
        renderParticles(ctx, state, 'non-void');
        renderFloatingNumbers(ctx, state);

        ctx.restore(); // Restores zoom/camera for screen-space/ui elements

        // --- OVERLAYS (Screen Space) ---
        renderBossIndicator(ctx, state, width, height, camera, scaleFactor);
        renderScreenEffects(ctx, state, width, height);

        // Atmospheric Vignette (Tunnel Vision)
        renderVignette(ctx, width, height);

    } catch (e) {
        // Prevent console spam causing freeze
        if ((window as any)._rendererErrorCount === undefined) {
            (window as any)._rendererErrorCount = 0;
        }
        if ((window as any)._rendererErrorCount < 3) {
            console.error("Render Error:", e);
            (window as any)._rendererErrorCount++;
        }
    }

    // Final restore in case of nested saves
    try { ctx.restore(); } catch (e) { }
}
