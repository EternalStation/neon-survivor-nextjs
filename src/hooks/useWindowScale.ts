import { useState, useEffect } from 'react';

interface WindowScale {
    scale: number;
    logicalWidth: number;
    logicalHeight: number;
    isMobile: boolean;
    isLandscape: boolean;
}

const REFERENCE_HEIGHT = 800;

export function useWindowScale(): WindowScale {
    const [windowScale, setWindowScale] = useState<WindowScale>({
        scale: 1,
        logicalWidth: 1920,
        logicalHeight: 1080,
        isMobile: false,
        isLandscape: true
    });

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Mobile Detection (Simple user agent check)
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isLandscape = width > height;

            // Calculate Scale based on Height (Vertical Reference)
            // If on mobile/portrait, we might want to clamp or adjust, 
            // but for now we follow the plan: Reference Height logic.
            const scale = height / REFERENCE_HEIGHT;

            setWindowScale({
                scale,
                logicalWidth: width / scale,
                logicalHeight: height / scale, // Should always be ~1080
                isMobile,
                isLandscape
            });
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        // Initial call
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    return windowScale;
}
