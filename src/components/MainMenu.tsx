import React, { useEffect, useState } from 'react';
import { startMenuMusic } from '../logic/AudioLogic';

import { SettingsMenu } from './SettingsMenu';

interface MainMenuProps {
    onStart: () => void;
    onShowLeaderboard: () => void;
    username?: string;
    onLogout?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, onShowLeaderboard, username, onLogout }) => {
    const [fading, setFading] = useState(false);
    const [showBlueprint, setShowBlueprint] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });

    // Start Menu Music on mount
    useEffect(() => {
        startMenuMusic();
    }, []);

    // Handle ESC key to close modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showBlueprint) setShowBlueprint(false);
                if (showSettings) setShowSettings(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showBlueprint, showSettings]);

    // Mouse movement for parallax
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMouse({
                x: (e.clientX / window.innerWidth) - 0.5,
                y: (e.clientY / window.innerHeight) - 0.5
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleStart = () => {
        setFading(true);
        setTimeout(() => {
            onStart();
        }, 1000);
    };

    // --- ENHANCED CANVAS BACKGROUND ---
    useEffect(() => {
        const canvas = document.getElementById('menu-particles') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        const handleResize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        class Star {
            x: number; y: number; size: number; opacity: number; pulse: number;
            constructor() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.size = Math.random() * 1.5;
                this.opacity = Math.random();
                this.pulse = Math.random() * 0.02;
            }
            update() {
                this.opacity += this.pulse;
                if (this.opacity > 1 || this.opacity < 0.2) this.pulse *= -1;
            }
            draw() {
                if (!ctx) return;
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class Meteor {
            x!: number; y!: number; length!: number; speed!: number; opacity!: number; active: boolean;
            constructor() {
                this.reset();
                this.active = Math.random() > 0.98; // Rare start
            }
            reset() {
                this.x = Math.random() * w;
                this.y = Math.random() * h * 0.5;
                this.length = Math.random() * 80 + 20;
                this.speed = Math.random() * 15 + 10;
                this.opacity = 0;
                this.active = false;
            }
            update() {
                if (!this.active) {
                    if (Math.random() > 0.999) this.active = true;
                    return;
                }
                this.x += this.speed;
                this.y += this.speed * 0.5;
                this.opacity += 0.05;
                if (this.x > w || this.y > h) this.reset();
            }
            draw() {
                if (!this.active || !ctx) return;
                const grad = ctx.createLinearGradient(this.x, this.y, this.x - this.length, this.y - this.length * 0.5);
                grad.addColorStop(0, `rgba(34, 211, 238, ${Math.min(1, this.opacity)})`);
                grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x - this.length, this.y - this.length * 0.5);
                ctx.stroke();
            }
        }

        class Hex {
            x: number; y: number; baseSize: number; size: number; opacity: number; targetOpacity: number;
            constructor(x: number, y: number, size: number) {
                this.x = x;
                this.y = y;
                this.baseSize = size;
                this.size = size;
                this.opacity = 0;
                this.targetOpacity = 0.05 + Math.random() * 0.05;
            }
            update(mx: number, my: number) {
                const dx = mx - this.x;
                const dy = my - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 300;

                if (dist < maxDist) {
                    const factor = 1 - dist / maxDist;
                    this.size = this.baseSize + factor * 5;
                    this.opacity = this.targetOpacity + factor * 0.2;
                } else {
                    this.size += (this.baseSize - this.size) * 0.1;
                    this.opacity += (this.targetOpacity - this.opacity) * 0.1;
                }
            }
            draw() {
                if (!ctx) return;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.lineTo(this.x + this.size * Math.cos(angle), this.y + this.size * Math.sin(angle));
                }
                ctx.closePath();
                ctx.strokeStyle = `rgba(34, 211, 238, ${this.opacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        const stars = Array.from({ length: 150 }, () => new Star());
        const meteors = Array.from({ length: 3 }, () => new Meteor());
        const hexes: Hex[] = [];
        const hexSize = 40;
        const hexW = hexSize * Math.sqrt(3);
        const hexH = hexSize * 1.5;

        for (let y = 0; y < h + hexH; y += hexH) {
            for (let x = 0; x < w + hexW; x += hexW) {
                const xOffset = (Math.floor(y / hexH) % 2) * (hexW / 2);
                hexes.push(new Hex(x + xOffset, y, hexSize - 2));
            }
        }

        let animId: number;
        const loop = () => {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, w, h);

            stars.forEach(s => { s.update(); s.draw(); });
            meteors.forEach(m => { m.update(); m.draw(); });

            const mx = (mouse.x + 0.5) * w;
            const my = (mouse.y + 0.5) * h;
            hexes.forEach(hex => { hex.update(mx, my); hex.draw(); });

            animId = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, [mouse]);

    return (
        <div className="main-menu" style={{ transition: 'opacity 1s', opacity: fading ? 0 : 1 }}>
            <canvas id="menu-particles" style={{ position: 'absolute', top: 0, left: 0 }} />

            {/* Post-Processing Overlays */}
            <div className="menu-vignette" />
            <div className="menu-scanlines" />
            <div className="menu-scanline-beam" />

            <div className="menu-container" style={{
                transform: `translate(${mouse.x * -20}px, ${mouse.y * -20}px)`,
                transition: 'transform 0.1s ease-out'
            }}>
                <div className="menu-title">NEON SURVIVOR</div>

                {username && (
                    <div className="user-profile-tag" style={{ marginBottom: 20 }}>
                        <div className="user-status-dot" />
                        PILOT_{username.toUpperCase()} // PROTOCOL_ACTIVE
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center', pointerEvents: 'auto' }}>
                    <button className="btn-start" onClick={handleStart}>
                        <span>ENTER VOID</span>
                    </button>
                    <button className="btn-logic" onClick={onShowLeaderboard}>
                        LEADERBOARD
                    </button>
                    <button className="btn-logic" onClick={() => setShowSettings(true)}>
                        SETTINGS
                    </button>
                    <button className="btn-logic" onClick={() => setShowBlueprint(true)}>
                        DATABASE
                    </button>
                    {onLogout && (
                        <button className="btn-logout" onClick={onLogout}>
                            DISCONNECT
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                .user-profile-tag {
                    color: #00ffff;
                    font-size: 14px;
                    font-weight: 700;
                    letter-spacing: 2px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
                    opacity: 0.8;
                }
                .user-status-dot {
                    width: 8px;
                    height: 8px;
                    background: #00ffff;
                    border-radius: 50%;
                    box-shadow: 0 0 8px #00ffff;
                    animation: pulse-green 2s infinite;
                }
                @keyframes pulse-green {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .btn-logout {
                    background: transparent;
                    border: none;
                    color: rgba(255, 68, 68, 0.6);
                    font-size: 12px;
                    font-weight: 900;
                    letter-spacing: 3px;
                    cursor: pointer;
                    margin-top: 15px;
                    padding: 8px 20px;
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                }
                .btn-logout:hover {
                    color: #ff4444;
                    text-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
                    border: 1px solid rgba(255, 68, 68, 0.3);
                    background: rgba(255, 68, 68, 0.05);
                }
            `}</style>

            {/* Sub-panels */}
            {showSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 5000 }}>
                    <SettingsMenu onClose={() => setShowSettings(false)} mode="menu" />
                </div>
            )}

            {showBlueprint && (
                <div className="blueprint-modal" onClick={() => setShowBlueprint(false)}>
                    <div className="blueprint-container" onClick={(e) => e.stopPropagation()}>
                        <div className="blueprint-header">
                            <div className="blueprint-title">NEON SURVIVOR - ARCHIVE</div>
                            <button className="btn-close-blueprint" onClick={() => setShowBlueprint(false)}>CLOSE [ESC]</button>
                        </div>
                        <iframe src="/blueprint.html" className="blueprint-iframe" title="Game Archive" />
                    </div>
                </div>
            )}
        </div>
    );
};
