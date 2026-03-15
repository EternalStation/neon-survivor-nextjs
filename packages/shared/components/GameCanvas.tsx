import React, { useEffect, useRef } from 'react';
import { useGameLoop } from '../hooks/UseGame';
import { useWindowScale } from '../hooks/UseWindowScale';
import { PixiApp } from '../logic/rendering/pixi/PixiApp';

interface GameCanvasProps {
    hook: ReturnType<typeof useGameLoop>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ hook }) => {
    const { canvasRef, setPixiApp, setWindowScaleFactor } = hook;
    const containerRef = useRef<HTMLDivElement>(null);
    const { scale } = useWindowScale();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        container.appendChild(canvas);
        (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvas;

        const app = new PixiApp();
        let destroyed = false;

        app.init(canvas)
            .then(() => {
                if (destroyed) {
                    app.destroy();
                    return;
                }
                setPixiApp(app);
            })
            .catch(error => {
                console.error('Failed to initialize PixiApp — the game canvas will be blank. Error:', error);
            });

        return () => {
            destroyed = true;
            setPixiApp(null);
            app.destroy();
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = null;
        };
    }, [canvasRef, setPixiApp]);

    useEffect(() => {
        setWindowScaleFactor(scale);
    }, [scale, setWindowScaleFactor]);

    return (
        <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
    );
};
