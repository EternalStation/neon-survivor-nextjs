import React, { useEffect } from 'react';
import { useGameLoop } from '../hooks/useGame';
import { useWindowScale } from '../hooks/useWindowScale';

interface GameCanvasProps {
    // We can pass props from App if needed, but hook manages most
    hook: ReturnType<typeof useGameLoop>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ hook }) => {
    const { canvasRef } = hook;
    const { scale } = useWindowScale();

    useEffect(() => {
        if (canvasRef.current) {
            const dpr = window.devicePixelRatio || 1;

            // Buffer size (Physical Pixels)
            canvasRef.current.width = window.innerWidth * dpr;
            canvasRef.current.height = window.innerHeight * dpr;

            // CSS size
            canvasRef.current.style.width = `${window.innerWidth}px`;
            canvasRef.current.style.height = `${window.innerHeight}px`;

            // Context scale is handled inside useGame's renderGame loop now, 
            // but we trigger the hook update below.
        }
    }, [canvasRef, scale]);

    // Updating the hook with the latest scale to be used in render/logic
    useEffect(() => {
        hook.setWindowScaleFactor(scale);
    }, [scale, hook]);

    return (
        <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100vw', height: '100vh' }}
        />
    );
};
