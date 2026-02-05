import React, { useEffect, useRef } from 'react';
import type { GameState } from '../logic/types';
import { ARENA_CENTERS, ARENA_RADIUS, PORTALS, getHexWallLine } from '../logic/MapLogic';

interface MinimapProps {
    gameState: GameState;
}

export const Minimap: React.FC<MinimapProps> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { player, enemies, portalState, currentArena } = gameState;

    // Minimap Scale
    // Map bounds are roughly: (-6000, -6000) to (12000, 6000)
    // Radius 5000 * 2 roughly?
    // Let's approximate world size as 16000x16000 for framing.
    const WORLD_SIZE = 10000; // Further reduced from 12000 for an additional 20% zoom
    const MM_SIZE = 150;
    const SCALE = MM_SIZE / WORLD_SIZE;

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, MM_SIZE, MM_SIZE);

        ctx.save();
        // Center the view on Player Dot
        ctx.translate(MM_SIZE / 2, MM_SIZE / 2);
        ctx.scale(SCALE, SCALE);
        ctx.translate(-player.x, -player.y);

        // Draw Arenas (Background)
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 200; // Scaled down this will be thin
        ctx.globalAlpha = 0.5;

        ARENA_CENTERS.forEach(c => {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const ang = Math.PI / 3 * i;
                const hx = c.x + ARENA_RADIUS * Math.cos(ang);
                const hy = c.y + ARENA_RADIUS * Math.sin(ang);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.fillStyle = '#1e293b';
            ctx.fill();
        });

        // Draw Portals on Minimap
        if (portalState !== 'closed') {
            const activePortals = PORTALS.filter(p => p.from === currentArena);
            const center = ARENA_CENTERS.find(c => c.id === currentArena);

            if (center) {
                // Flash if warn, Solid if open
                const shouldDraw = portalState === 'open' || (portalState === 'warn' && Math.floor(Date.now() / 200) % 2 === 0);

                if (shouldDraw) {
                    ctx.beginPath();
                    activePortals.forEach(p => {
                        const wall = getHexWallLine(center.x, center.y, ARENA_RADIUS, p.wall);
                        ctx.moveTo(wall.x1, wall.y1);
                        ctx.lineTo(wall.x2, wall.y2);
                    });

                    ctx.strokeStyle = portalState === 'open' ? '#00FF00' : '#FFD700'; // Green if open, Gold/Yellow if warn
                    ctx.lineWidth = 400; // Thick line on minimap
                    ctx.globalAlpha = 1;
                    ctx.stroke();
                }
            }
        }


        // Draw Player
        ctx.fillStyle = '#22d3ee';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 400, 0, Math.PI * 2); // Visible dot
        ctx.fill();

        // Draw Enemies (Removed per user request)
        /*
        enemies.forEach(e => {
            if (e.boss) {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(e.x, e.y, 600, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        */

        ctx.restore();
    }, [player.x, player.y, enemies]); // Update on frame (actually driven by parent render, useEffect might lag behind 60fps loop if not carefully managed. But for minimap 60fps react render is okay-ish or we can refactor to direct hook)

    // Note: Parent updates state 60fps? 
    // `useGameLoop` uses `setUiState` to force re-render components. So this receives fresh `gameState`.

    return (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            width: 150,
            height: 150,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(100, 116, 139, 0.5)', // Semi-transparent border
            boxShadow: '0 0 20px rgba(0,0,0,0.2)',
            backgroundColor: 'transparent',
            zIndex: 5 // Behind upgrade menu
        }}>
            <canvas ref={canvasRef} width={150} height={150} />
        </div>
    );
};
