import React, { useEffect } from 'react';
import { useGameLoop } from '../hooks/UseGame';
import { useWindowScale } from '../hooks/UseWindowScale';
import { PixiApp } from '../logic/rendering/pixi/PixiApp';

interface GameCanvasProps {
    hook: ReturnType<typeof useGameLoop>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ hook }) => {
    const { canvasRef, setPixiApp, setWindowScaleFactor } = hook;
    const { scale } = useWindowScale();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

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
                console.error('Failed to initialize PixiApp:', error);
            });

        return () => {
            destroyed = true;
            setPixiApp(null);
            app.destroy();
        };
    }, [canvasRef, setPixiApp]);

    useEffect(() => {
        setWindowScaleFactor(scale);
    }, [scale, setWindowScaleFactor]);

    return (
        <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100vw', height: '100vh' }}
        />
    );
};
