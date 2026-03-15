import React, { useRef, useState } from 'react';

interface MobileControlsProps {
    onInput: (x: number, y: number) => void;
    isInverted?: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onInput, isInverted }) => {
    const joyRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Relative to center
    const [origin, setOrigin] = useState({ x: 0, y: 0 }); // Touch start position
    const [touchId, setTouchId] = useState<number | null>(null);

    const RADIUS = 50; // Max stick distance

    const handleStart = (e: React.TouchEvent) => {
        const touch = e.changedTouches[0];
        setTouchId(touch.identifier);

        const rect = joyRef.current?.getBoundingClientRect();
        if (rect) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            setOrigin({ x: centerX, y: centerY });
            setActive(true);
            updateJoystick(touch.clientX, touch.clientY, centerX, centerY);
        }
    };

    const handleMove = (e: React.TouchEvent) => {
        if (!active) return;
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
        if (touch) {
            updateJoystick(touch.clientX, touch.clientY, origin.x, origin.y);
        }
    };

    const handleEnd = (e: React.TouchEvent) => {
        const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
        if (touch) {
            setActive(false);
            setPosition({ x: 0, y: 0 });
            setTouchId(null);
            onInput(0, 0);
        }
    };

    const updateJoystick = (clientX: number, clientY: number, originX: number, originY: number) => {
        let dx = clientX - originX;
        let dy = clientY - originY;

        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > RADIUS) {
            dx = (dx / dist) * RADIUS;
            dy = (dy / dist) * RADIUS;
        }

        setPosition({ x: dx, y: dy });
        onInput(dx / RADIUS, dy / RADIUS);
    };

    const baseColor = isInverted ? 'rgba(168, 85, 247, 0.4)' : 'rgba(59, 130, 246, 0.3)';
    const stickColor = isInverted ? 'rgba(168, 85, 247, 0.8)' : 'rgba(59, 130, 246, 0.8)';

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 40,
                right: 40,
                width: 160,
                height: 160,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none'
            }}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            ref={joyRef}
        >
            {/* Base */}
            <div style={{
                position: 'absolute',
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: isInverted ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.1)',
                border: `2px solid ${baseColor}`,
                boxShadow: `0 0 15px ${isInverted ? 'rgba(168, 85, 247, 0.3)' : 'rgba(59, 130, 246, 0.1)'}`,
                animation: isInverted ? 'joystick-glitch 0.2s infinite' : 'none'
            }} />

            {/* Stick */}
            <div style={{
                position: 'absolute',
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: active ? stickColor : (isInverted ? 'rgba(168, 85, 247, 0.5)' : 'rgba(59, 130, 246, 0.5)'),
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: active ? 'none' : 'transform 0.1s ease-out',
                boxShadow: `0 0 10px ${isInverted ? 'rgba(168, 85, 247, 0.6)' : 'rgba(59, 130, 246, 0.5)'}`
            }} />

            {/* Label */}
            {!active && (
                <div style={{
                    position: 'absolute',
                    top: -30,
                    width: '100%',
                    textAlign: 'center',
                    color: isInverted ? '#ff00ff' : 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    textShadow: isInverted ? '0 0 5px #ff00ff' : 'none'
                }}>
                    {isInverted ? 'SYSTEM GLITCHED' : 'MOVE'}
                </div>
            )}

            <style>{`
                @keyframes joystick-glitch {
                    0% { transform: translate(0, 0); opacity: 1; }
                    25% { transform: translate(-2px, 2px); opacity: 0.8; }
                    50% { transform: translate(2px, -2px); opacity: 0.9; }
                    75% { transform: translate(-1px, 1px); opacity: 0.8; }
                    100% { transform: translate(0, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};
