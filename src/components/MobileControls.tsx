import React, { useRef, useState } from 'react';

interface MobileControlsProps {
    onInput: (x: number, y: number) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onInput }) => {
    const joyRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Relative to center
    const [origin, setOrigin] = useState({ x: 0, y: 0 }); // Touch start position
    const [touchId, setTouchId] = useState<number | null>(null);

    const RADIUS = 50; // Max stick distance

    const handleStart = (e: React.TouchEvent) => {
        // Prevent default only if needed, but here we want to stop scroll
        // e.preventDefault(); 

        // Find the first touch in the joystick zone
        const touch = e.changedTouches[0];
        setTouchId(touch.identifier);

        const rect = joyRef.current?.getBoundingClientRect();
        if (rect) {
            // Center of the joystick container
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // If we want "Floating Joystick" logic (stick appears where you touch), 
            // we would set origin to touch.clientX/Y. 
            // BUT here we have a fixed visual anchor.
            // Let's use Fixed Anchor logic for simplicity first.
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

        // Normalize
        if (dist > RADIUS) {
            dx = (dx / dist) * RADIUS;
            dy = (dy / dist) * RADIUS;
        }

        setPosition({ x: dx, y: dy });

        // Send normalized input (-1 to 1)
        onInput(dx / RADIUS, dy / RADIUS);
    };

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 40,
                right: 40,
                width: 160,
                height: 160,
                zIndex: 1000,
                // debug
                // border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none' // Critical for preventing scroll
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
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)'
            }} />

            {/* Stick */}
            <div style={{
                position: 'absolute',
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: active ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.5)',
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: active ? 'none' : 'transform 0.1s ease-out',
                boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
            }} />

            {/* Label */}
            {!active && (
                <div style={{
                    position: 'absolute',
                    top: -30,
                    width: '100%',
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    fontWeight: 'bold',
                    pointerEvents: 'none'
                }}>
                    MOVE
                </div>
            )}
        </div>
    );
};
