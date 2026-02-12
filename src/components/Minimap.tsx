import React, { useEffect, useRef } from 'react';
import type { GameState } from '../logic/core/types';
import { ARENA_CENTERS, ARENA_RADIUS, PORTALS, getHexWallLine } from '../logic/mission/MapLogic';

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

        const visibleArenas = gameState.portalsUnlocked
            ? ARENA_CENTERS
            : ARENA_CENTERS.filter(c => c.id === 0);

        visibleArenas.forEach(c => {
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
                // Solid for both open and warn states (Removed flashing per user request)
                const shouldDraw = portalState === 'open' || portalState === 'warn';

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


        // Draw Extraction LZ (Pulsating Red Dot)
        if (gameState.extractionShipPos) {
            const t = gameState.gameTime;
            const pulse = 0.5 + 0.5 * Math.sin(t * 6);
            const baseR = 450;

            ctx.save();
            ctx.globalAlpha = 0.5 + 0.5 * pulse;
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(gameState.extractionShipPos.x, gameState.extractionShipPos.y, baseR + 150 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 200;
            ctx.beginPath();
            ctx.arc(gameState.extractionShipPos.x, gameState.extractionShipPos.y, baseR * 0.7 + 120 * pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw Player
        ctx.fillStyle = '#22d3ee';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 400, 0, Math.PI * 2); // Visible dot
        ctx.fill();

        // Draw POIs
        gameState.pois.forEach(poi => {
            if (poi.respawnTimer > 0 || poi.arenaId !== gameState.currentArena) return;

            ctx.save();
            ctx.translate(poi.x, poi.y);

            if (poi.type === 'overclock') {
                ctx.fillStyle = '#22d3ee';
                ctx.font = 'bold 800px Orbitron';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('XP', 0, 0);
            } else if (poi.type === 'anomaly') {
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 1000px Orbitron';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('☠', 0, 0);
            }
            ctx.restore();
        });

        ctx.restore();
    }, [player.x, player.y, enemies, gameState.extractionShipPos, gameState.gameTime, gameState.pois]);

    return (
        <div style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            width: 150,
            height: 150,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(100, 116, 139, 0.5)',
            boxShadow: '0 0 20px rgba(0,0,0,0.2)',
            backgroundColor: 'transparent',
            zIndex: 5
        }}>
            <canvas ref={canvasRef} width={150} height={150} />
        </div>
    );
};
