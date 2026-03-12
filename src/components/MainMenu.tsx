import React, { useEffect, useState } from 'react';
import { startMenuMusic, preloadMusic, playSfx } from '../logic/audio/AudioLogic';
import { CURRENT_PATCH_VERSION } from '../utils/Leaderboard';

import { SettingsMenu } from './SettingsMenu';
import { useLanguage } from '../lib/LanguageContext';
import { getUiTranslation } from '../lib/UiTranslations';
import { AssistantOverlay } from './hud/AssistantOverlay';

interface MainMenuProps {
    onStart: () => void;
    onStartMultiplayer?: () => void;
    onShowLeaderboard: () => void;
    username?: string;
    onLogout?: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStart, onStartMultiplayer, onShowLeaderboard, username, onLogout }) => {
    const [fading, setFading] = useState(false);
    const [showBlueprint, setShowBlueprint] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const { language } = useLanguage();
    const t = getUiTranslation(language).mainMenu;

    const mouseRef = React.useRef({ x: 0, y: 0 });
    const hoveringStartRef = React.useRef(false);
    const zoomFactorRef = React.useRef(1);
    const zoomTargetRef = React.useRef({ x: 0, y: 0 });

    useEffect(() => {
        startMenuMusic();
        preloadMusic();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Tab' || e.key === 'Tab') {
                e.preventDefault();
            }
            if (e.code === 'Escape') {
                if (showBlueprint) setShowBlueprint(false);
                if (showSettings) setShowSettings(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showBlueprint, showSettings]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const x = (e.clientX / window.innerWidth) - 0.5;
            const y = (e.clientY / window.innerHeight) - 0.5;
            setMouse({ x, y });
            mouseRef.current = { x, y };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const [isTransitioning, setIsTransitioning] = useState(false);
    const [buttonOffsets, setButtonOffsets] = useState<Record<string, { x: number, y: number, r?: number }>>({});
    const [isBlackout, setIsBlackout] = useState(false);
    const [isFlickering, setIsFlickering] = useState(false);
    
    // Physics-based buttons system
    const buttonPhysicsRef = React.useRef<Record<string, {
        x: number; y: number; r: number; 
        vx: number; vy: number; vr: number; 
        isDragging: boolean;
        initialX?: number;
        initialY?: number;
        hasMoved: boolean;
        startTime: number;
    }>>({});
    const dragTargetRef = React.useRef<string | null>(null);
    const dragOffsetRef = React.useRef({ x: 0, y: 0 });

    const [assistantMsg, setAssistantMsg] = useState<string | null>(null);
    const clickTrackRef = React.useRef<{ count: number, lastTime: number }>({ count: 0, lastTime: 0 });
    const onStartTriggeredRef = React.useRef(false);
    const transitionStartRef = React.useRef<number | null>(null);
    const isBlackoutRef = React.useRef(false);
    
    useEffect(() => {
        isBlackoutRef.current = isBlackout || isFlickering;
    }, [isBlackout, isFlickering]);

    const handleDragStart = (e: React.PointerEvent, id: string) => {
        if (!isBlackoutRef.current) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        dragTargetRef.current = id;
        const phys = buttonPhysicsRef.current[id];
        if (phys) {
            phys.isDragging = true;
            phys.hasMoved = false;
            phys.startTime = Date.now();
            phys.vx = 0; phys.vy = 0; phys.vr = 0;
            const initX = phys.initialX ?? (window.innerWidth / 2);
            const initY = phys.initialY ?? (window.innerHeight * 0.4);
            dragOffsetRef.current = {
                x: (e.clientX - initX) - phys.x,
                y: (e.clientY - initY) - phys.y
            };
        }
    };

    const handleDragMove = (e: React.PointerEvent) => {
        const id = dragTargetRef.current;
        if (id) {
            const phys = buttonPhysicsRef.current[id];
            if (phys) {
                const initX = phys.initialX ?? (window.innerWidth / 2);
                const initY = phys.initialY ?? (window.innerHeight * 0.4);
                const targetX = (e.clientX - initX) - dragOffsetRef.current.x;
                const targetY = (e.clientY - initY) - dragOffsetRef.current.y;
                
                if (Math.hypot(targetX - phys.x, targetY - phys.y) > 4) {
                    phys.hasMoved = true;
                }

                phys.vx = (targetX - phys.x) * 0.5;
                phys.vy = (targetY - phys.y) * 0.5;
                phys.x = targetX;
                phys.y = targetY;
            }
        }
    };

    const handleDragEnd = (e: React.PointerEvent) => {
        const id = dragTargetRef.current;
        if (id) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
            const phys = buttonPhysicsRef.current[id];
            if (phys) {
                phys.isDragging = false;
                // Add some toss velocity
                phys.vr = (Math.random() - 0.5) * 10;
            }
            dragTargetRef.current = null;
        }
    };

    const handleStart = () => {
        playSfx('transition');
        // Pre-calculate target to avoid layout thrashing at frame 1
        const canvas = document.getElementById('menu-particles');
        if (canvas) {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            zoomTargetRef.current = { x: w / 2 + 75, y: h * 0.35 };
        }
        
        transitionStartRef.current = performance.now();
        setIsTransitioning(true);
    };

    const handleMultiplayerStart = () => {
        if (onStartMultiplayer) onStartMultiplayer();
    };

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
                this.active = Math.random() > 0.98;
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

        class Particle {
            x: number; y: number; vx: number; vy: number; life: number; color: string;
            constructor(x: number, y: number, color: string) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 10;
                this.vy = (Math.random() - 0.5) * 10;
                this.life = 1.0;
                this.color = color;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= 0.02;
            }
            draw() {
                if (!ctx || this.life <= 0) return;
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        class Hex {
            x: number; y: number; baseSize: number; size: number; opacity: number; targetOpacity: number;
            dispX: number; dispY: number; dist: number;
            constructor(x: number, y: number, size: number) {
                this.x = x;
                this.y = y;
                this.baseSize = size;
                this.size = size;
                this.opacity = 0;
                this.targetOpacity = 0.02 + Math.random() * 0.02;
                this.dispX = 0;
                this.dispY = 0;
                this.dist = 9999;
            }
            update(mx: number, my: number) {
                const dx = this.x - mx;
                const dy = this.y - my;
                this.dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 350; // Smaller radius for tighter focus

                if (this.dist < maxDist) {
                    const factor = 1 - this.dist / maxDist;
                    const power = Math.pow(factor, 2); 
                    
                    const bonusSize = power * 10; 
                    
                    // Smooth displacement: Multiply by distance ratio to prevent center-jumping
                    // As dist -> 0, displacement -> 0, making the central hex stable.
                    const smoothDisp = power * 15; 
                    this.dispX = dx * (smoothDisp / maxDist);
                    this.dispY = dy * (smoothDisp / maxDist);
                    
                    this.size = this.baseSize + bonusSize;
                    this.opacity = this.targetOpacity + power * 0.4;
                } else {
                    this.dispX *= 0.94;
                    this.dispY *= 0.94;
                    this.size += (this.baseSize - this.size) * 0.1;
                    this.opacity += (this.targetOpacity - this.opacity) * 0.1;
                    this.dist = 9999;
                }
            }
            draw() {
                if (!ctx) return;
                const px = this.x + this.dispX;
                const py = this.y + this.dispY;
                
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 6;
                    ctx.lineTo(px + this.size * Math.cos(angle), py + this.size * Math.sin(angle));
                }
                ctx.closePath();
                
                ctx.fillStyle = `rgba(34, 211, 238, ${this.opacity * 0.25})`;
                ctx.fill();
                
                ctx.strokeStyle = `rgba(34, 211, 238, ${this.opacity})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }
        }

        class Lurker {
            x: number; y: number; opacity: number; openAmount: number; flinchFactor: number;
            constructor() {
                this.x = w / 2;
                this.y = h * 0.35;
                this.opacity = 0.04;
                this.openAmount = 0;
                this.flinchFactor = 0;
            }
            update() {
                const breath = Math.sin(Date.now() / 2000) * 5;
                this.y = (h * 0.35) + breath;
                
                const targetOpen = hoveringStartRef.current ? 1 : 0;
                this.openAmount += (targetOpen - this.openAmount) * 0.08;
            }
            draw(mx: number, my: number, zoom: number = 1, targetX: number = 0, targetY: number = 0) {
                if (!ctx || this.openAmount < 0.001) return;
                
                ctx.save();
                if (zoom > 1) {
                    // Zoom origin is the target eye
                    ctx.translate(targetX, targetY);
                    ctx.scale(zoom, zoom);
                    ctx.translate(-targetX, -targetY);
                }

                ctx.translate(this.x, this.y);

                const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 280);
                grad.addColorStop(0, `rgba(200, 0, 0, ${this.opacity * this.openAmount})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(0, 0, 200 * this.openAmount, 250 * this.openAmount, 0, 0, Math.PI * 2);
                ctx.fill();

                const eyeSpread = 75;
                const eyeWidth = 110;
                const currentHeight = 1 + (35 * this.openAmount);

                // Disable eye movement during transition for perfect zoom targeting
                const isTransitioning = zoom > 1.1;
                const ldx = isTransitioning ? 0 : (mx - this.x) / 10;
                const ldy = isTransitioning ? 0 : (my - this.y) / 10;

                [-1, 1].forEach(side => {
                    ctx.save();
                    ctx.translate(side * eyeSpread + ldx, ldy);
                    
                    ctx.shadowBlur = 20 * this.openAmount; // Less intense glow
                    ctx.shadowColor = '#880000';
                    ctx.fillStyle = `rgba(180, 0, 0, ${0.4 * this.openAmount})`; // Dimmer red
                    
                    ctx.beginPath();
                    ctx.moveTo(-eyeWidth/2, -2);
                    ctx.quadraticCurveTo(0, -currentHeight/2 - 5, eyeWidth/2, -currentHeight/4);
                    ctx.quadraticCurveTo(0, currentHeight/2 + 5, -eyeWidth/2, 2);
                    ctx.fill();

                    // Pupil - The "Infinite Void"
                    // Pupil expands to fill view as we get extremely close
                    const pupilExpand = zoom > 100 ? (zoom - 100) / 3 : 0;
                    const pupilW = 6 + pupilExpand;
                    const pupilH = (currentHeight/3 + 2) + pupilExpand;
                    
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, pupilW, pupilH, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // If zooming, draw "nested" void layers to create a tunnel effect
                    if (zoom > 5) {
                        const layers = Math.min(10, Math.floor(zoom / 3));
                        for (let i = 0; i < layers; i++) {
                            // Shifting offsets based on zoom for a "travelling inside" feel
                            const layerScale = 1 + (i * 0.8);
                            ctx.strokeStyle = `rgba(255, 0, 0, ${0.3 / layerScale})`;
                            ctx.lineWidth = 1 / zoom;
                            ctx.beginPath();
                            ctx.ellipse(0, 0, pupilW * layerScale, pupilH * layerScale, 0, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                    }
                    
                    ctx.fillStyle = '#fff';
                    ctx.globalAlpha = 0.4 * this.openAmount;
                    ctx.beginPath();
                    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                });

                ctx.restore();
            }
        }

        class TacticalDrone {
            x: number; y: number; tx: number; ty: number; active: boolean;
            vx: number; vy: number; angle: number;
            state: 'idle' | 'wandering' | 'hunting' | 'pushing' | 'returning' | 'hiding' | 'stalking' | 'observing' = 'idle';
            targetId: string | null = null;
            timer: number = 0;
            wanderingTarget: { x: number, y: number } | null = null;
            pushDir: { x: number, y: number } = { x: 1, y: 0 };
            pushOffset: { x: number, y: number } = { x: 0, y: 0 };
            initialPos: { x: number, y: number } = { x: 100, y: 100 };
            standbyPos: { x: number, y: number } = { x: 0, y: 0 };
            approaching: boolean = false;
            constructor() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.tx = this.x;
                this.ty = this.y;
                this.vx = 0;
                this.vy = 0;
                this.angle = 0;
                this.active = true;
            }

            update(mx: number, my: number, setOffsets: any) {
                const prevX = this.x;
                const prevY = this.y;

                if (!this.active || isBlackoutRef.current || document.querySelector('.assistant-dialog-overlay')) {
                    this.state = 'idle';
                } else {
                    if (this.state === 'idle') {
                        const roll = Math.random();
                        if (roll < 0.01) {
                            this.state = 'wandering';
                            this.wanderingTarget = { x: 200 + Math.random() * (w - 400), y: 200 + Math.random() * (h - 400) };
                        } else if (roll < 0.015) {
                            this.state = 'stalking';
                        } else if (roll < 0.02) {
                            const ids = ['btn-settings-actual', 'btn-multiplayer', 'btn-blueprints', 'btn-leaderboard'];
                            this.targetId = ids[Math.floor(Math.random() * ids.length)];
                            this.state = Math.random() > 0.5 ? 'hunting' : 'observing';
                        }
                        // Gentle idle drift instead of homing to corner
                        this.tx += Math.sin(Date.now() / 2000) * 0.5;
                        this.ty += Math.cos(Date.now() / 2000) * 0.5;
                    } else if (this.state === 'wandering' && this.wanderingTarget) {
                        this.tx = this.wanderingTarget.x;
                        this.ty = this.wanderingTarget.y;
                        if (Math.hypot(this.tx - this.x, this.ty - this.y) < 40) this.state = 'idle';
                        if (Math.random() < 0.01) this.state = 'idle';
                    } else if (this.state === 'stalking') {
                        this.tx = mx + Math.sin(Date.now() / 800) * 180;
                        this.ty = my + Math.cos(Date.now() / 800) * 180;
                        if (Math.random() < 0.005) this.state = 'idle';
                    } else if (this.state === 'observing' && this.targetId) {
                        const el = document.getElementById(this.targetId);
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            const cr = canvas.getBoundingClientRect();
                            this.tx = (rect.left - cr.left) + rect.width / 2;
                            this.ty = (rect.top - cr.top) - 80;
                            if (Math.random() < 0.01) this.state = 'idle';
                        } else this.state = 'idle';
                    } else if (this.state === 'hunting' && this.targetId) {
                        const el = document.getElementById(this.targetId);
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            const cr = canvas.getBoundingClientRect();
                            if (this.timer === 0) { 
                                // Push direction: Left to Right only
                                this.pushDir = { x: 1, y: 0 };
                                this.timer = 120 + Math.random() * 240;
                                this.pushOffset = { x: 0, y: 0 };
                                
                                const distToEdge = Math.min(
                                    (rect.width / 2) / Math.abs(this.pushDir.x || 0.01),
                                    (rect.height / 2) / Math.abs(this.pushDir.y || 0.01)
                                );
                                const totalDist = distToEdge + 32; // Buffer for arms

                                this.initialPos = { 
                                    x: (rect.left - cr.left + rect.width / 2) - this.pushDir.x * totalDist,
                                    y: (rect.top - cr.top + rect.height / 2) - this.pushDir.y * totalDist
                                };
                                // Waypoint to avoid flying through the button
                                this.standbyPos = {
                                    x: this.initialPos.x - this.pushDir.x * 80,
                                    y: this.initialPos.y - this.pushDir.y * 80
                                };
                                this.approaching = true;
                            }
                            
                            this.tx = this.approaching ? this.standbyPos.x : this.initialPos.x;
                            this.ty = this.approaching ? this.standbyPos.y : this.initialPos.y;

                            if (this.approaching && Math.hypot(this.tx - this.x, this.ty - this.y) < 15) {
                                this.approaching = false;
                            }
                            
                            if (!this.approaching && Math.hypot(this.tx - this.x, this.ty - this.y) < 5) {
                                this.state = 'pushing';
                                this.x = this.tx;
                                this.y = this.ty;
                            }
                        } else this.state = 'idle';
                    } else if (this.state === 'pushing' && this.targetId) {
                        this.timer--;
                        const id = this.targetId;
                        const pushSpeed = 0.55; // Slightly faster for impact
                        this.pushOffset.x += this.pushDir.x * pushSpeed;
                        this.pushOffset.y += this.pushDir.y * pushSpeed;

                        setOffsets((prev: any) => ({
                            ...prev,
                            [id]: { 
                                x: (prev[id]?.x || 0) + this.pushDir.x * pushSpeed, 
                                y: (prev[id]?.y || 0) + this.pushDir.y * pushSpeed 
                            }
                        }));

                        this.tx = this.initialPos.x + this.pushOffset.x;
                        this.ty = this.initialPos.y + this.pushOffset.y;
                        this.x = this.tx;
                        this.y = this.ty;

                        if (this.timer % 15 === 0) {
                            particles.push(new Particle(this.x, this.y, '#00ffff'));
                        }

                        if (this.timer <= 0) {
                            this.state = 'idle';
                            this.timer = 0;
                        }
                    }
 else if (this.state === 'returning') {
                        this.state = 'idle';
                    }
                }

                // Constant speed following logic - Prevents "teleporting" over long distances
                const dx = this.tx - this.x;
                const dy = this.ty - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0.1) {
                    const moveSpeed = (this.state === 'hiding' || this.state === 'stalking') ? 1.5 : 0.8;
                    const amount = Math.min(dist, moveSpeed);
                    this.x += (dx / dist) * amount;
                    this.y += (dy / dist) * amount;
                }
                this.vx = this.x - prevX;
                this.vy = this.y - prevY;

                // Rotate to face travel direction
                if (Math.hypot(this.vx, this.vy) > 0.05 || this.state === 'pushing') {
                    const targetAngle = this.state === 'pushing' ? Math.atan2(this.pushDir.y, this.pushDir.x) : Math.atan2(this.vy, this.vx);
                    let diff = targetAngle - this.angle;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    this.angle += diff * 0.15;
                }
            }
            draw() {
                if (!ctx) return;
                ctx.save();
                
                // Mechanical Vibration during load/push
                const t = Date.now();
                let ox = 0, oy = 0;
                if (this.state === 'pushing') {
                    ox = (Math.random() - 0.5) * 1.5;
                    oy = (Math.random() - 0.5) * 1.5;
                }
                
                ctx.translate(this.x + ox, this.y + oy);
                ctx.rotate(this.angle);

                const hover = Math.sin(t / 400) * 3;
                ctx.translate(0, hover);

                // Heavy Plasma Boosters (Live Fire)
                const isMoving = Math.hypot(this.vx, this.vy) > 0.2 || this.state === 'pushing';
                if (isMoving) {
                    const pCount = this.state === 'pushing' ? 3 : 1;
                    for (let p = 0; p < pCount; p++) {
                        const trailLen = this.state === 'pushing' ? 60 + Math.random() * 20 : 35 + Math.random() * 10;
                        const flareWidth = this.state === 'pushing' ? 14 : 8;
                        const grad = ctx.createLinearGradient(-15, 0, -15 - trailLen, 0);
                        grad.addColorStop(0, '#fff');
                        grad.addColorStop(0.2, '#00ffff');
                        grad.addColorStop(0.5, '#22d3ee');
                        grad.addColorStop(1, 'transparent');
                        
                        ctx.fillStyle = grad;
                        ctx.beginPath();
                        ctx.moveTo(-12, -flareWidth/2);
                        // Jittery plasma core
                        ctx.lineTo(-12 - trailLen, (Math.random() - 0.5) * 4);
                        ctx.lineTo(-12, flareWidth/2);
                        ctx.fill();
                        
                        // Outer glow segment
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = '#00ffff';
                        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                }

                // Advanced Plasma Rocket Engines (Replacing Wing Housings)
                [-1, 1].forEach(side => {
                    ctx.save();
                    ctx.translate(-5, side * 5);
                    
                    // Engine Pod
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = '#22d3ee';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.roundRect(-15, -6, 20, 12, 3);
                    ctx.fill();
                    ctx.stroke();

                    // Rocket Nozzle (Backwards facing)
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.rect(-18, -4, 4, 8);
                    ctx.fill();
                    ctx.stroke();

                    // Auxiliary Thusters
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(-12, side * 2.5, 3, 1.5);
                    
                    ctx.restore();
                });

                // Iron Man Stabilizer Arms (Hands)
                if (this.state === 'pushing') {
                    const armLen = 14;
                    const spread = 9;
                    const deployProgress = Math.min(1, (240 - this.timer) / 20);
                    ctx.strokeStyle = '#22d3ee';
                    ctx.lineWidth = 2;
                    [-1, 1].forEach(side => {
                        ctx.beginPath();
                        ctx.moveTo(10, side * 5);
                        ctx.lineTo(10 + armLen * deployProgress, side * spread);
                        ctx.lineTo(15 + armLen * deployProgress, side * spread);
                        ctx.stroke();
                        
                        // Contact spark
                        if (Math.random() < 0.1) {
                            ctx.fillStyle = '#fff';
                            ctx.fillRect(14 + armLen * deployProgress, side * spread - 1, 3, 3);
                        }
                    });
                }

                // Main Armored Hull (Diamond)
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(20, 0);
                ctx.lineTo(0, -14);
                ctx.lineTo(-18, 0);
                ctx.lineTo(0, 14);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Advanced Tri-Node Core
                for (let i = 0; i < 3; i++) {
                    const ax = 10 - i * 9;
                    const as = 5 - i * 1.2;
                    const pulse = 0.7 + Math.sin(t / 200 + i) * 0.3;
                    ctx.fillStyle = `rgba(34, 211, 238, ${pulse * (1 - i * 0.25)})`;
                    ctx.beginPath();
                    ctx.moveTo(ax + as, 0);
                    ctx.lineTo(ax - as, -as * 0.7);
                    ctx.lineTo(ax - as * 0.4, 0);
                    ctx.lineTo(ax - as, as * 0.7);
                    ctx.closePath();
                    ctx.fill();
                }

                // Tactical Front Lens (Scanning)
                const scan = Math.sin(t / 150) * 2;
                ctx.fillStyle = '#00ffff';
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#00ffff';
                ctx.beginPath();
                ctx.arc(12 + scan, 0, 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        }

        const stars = Array.from({ length: 150 }, () => new Star());
        const meteors = Array.from({ length: 8 }, () => new Meteor());
        const lurker = new Lurker();
        const hexes: Hex[] = [];
        const particles: Particle[] = [];
        const drone = new TacticalDrone();
        const hexSize = 80;
        const hexW = hexSize * Math.sqrt(3);
        const hexH = hexSize * 1.5;

        for (let y = -hexH; y < h + hexH * 2; y += hexH) {
            for (let x = -hexW; x < w + hexW * 2; x += hexW) {
                const xOffset = (Math.floor(y / hexH) % 2) * (hexW / 2);
                hexes.push(new Hex(x + xOffset, y, hexSize - 2)); 
            }
        }

        const handleCanvasClick = (e: MouseEvent) => {
            if (isBlackoutRef.current) return; 

            const rect = canvas.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top;

            if (Math.hypot(cx - drone.x, cy - drone.y) < 60) {
                // Easter Egg Trigger Logic
                const now = Date.now();
                const track = clickTrackRef.current;
                if (now - track.lastTime > 5000) {
                    track.count = 1;
                } else {
                    track.count++;
                    if (track.count >= 5) {
                        const dialogues = [
                            { en: "Ha ha ha! Very funny to click on my ship... You really shouldn't do that.", ru: "Ха ха ха! Очень смешно кликать на мой корабль... Тебе не стоит так делать." },
                            { en: "System error: Pilot patience at 0%. Initiating darkness protocol.", ru: "Системная ошибка: Терпение пилота на нуле. Запуск протокола тьмы." },
                            { en: "Oh, we're playing touchy-feely now? Let's see how you like the void.", ru: "О, мы теперь играем в «потрогай корабль»? Посмотрим, как тебе понравится пустота." },
                            { en: "Keep poking the hull and I'll poke your reality. Lights out.", ru: "Продолжай тыкать в корпус, и я проткну твою реальность. Свет гаснет." },
                            { en: "That ship is worth more than your entire sector. Hands off.", ru: "Этот корабль стоит больше, чем весь твой сектор. Руки прочь." },
                            { en: "You think you're in control? Gravity always wins in the end.", ru: "Думаешь, ты всё контролируешь? Гравитация всегда побеждает в конце." },
                            { en: "Searching for meaning in the dark? Start with these buttons.", ru: "Ищешь смысл в темноте? Начни с этих кнопок." },
                            { en: "Hehe... I hope you're not afraid of things that go bump in the void.", ru: "Хе-хе... Надеюсь, ты не боишься того, что гремит в пустоте." },
                            { en: "Clicking won't save you. Searching might. Good luck, 'Pilot'.", ru: "Клики тебя не спасут. Поиски — возможно. Удачи, «Пилот»." },
                            { en: "You've interrupted my scan for the last time. Find your own way.", ru: "Ты прервал моё сканирование в последний раз. Ищи свой путь сам." }
                        ];
                        const variant = dialogues[Math.floor(Math.random() * dialogues.length)];
                        setAssistantMsg(language === 'ru' ? variant.ru : variant.en);
                        
                        // Instant Blackout Protocol - No more flickering delays
                        setTimeout(() => {
                            setAssistantMsg(null);
                            setIsFlickering(false);
                            setIsBlackout(true); // Light off IMMEDIATELY
                            
                            // EXPLOSION PHASE - Launch everyone UP (including logout)
                            const ids = ['btn-multiplayer', 'btn-leaderboard', 'btn-settings-actual', 'btn-blueprints', 'btn-start', 'btn-logout'];
                            ids.forEach(id => {
                                const el = document.getElementById(id);
                                const rect = el?.getBoundingClientRect();
                                
                                // Account for existing drone offsets to prevent a "jump" at start
                                const current = buttonOffsets[id] || { x: 0, y: 0, r: 0 };
                                const initialX = rect ? (rect.left + rect.width / 2) - (current.x || 0) : (w / 2);
                                const initialY = rect ? (rect.top + rect.height / 2) - (current.y || 0) : (h * 0.4);

                                buttonPhysicsRef.current[id] = {
                                    x: current.x || 0,
                                    y: current.y || 0,
                                    r: current.r || 0,
                                    vx: (Math.random() - 0.5) * 6, 
                                    vy: -4 - Math.random() * 4, 
                                    vr: (Math.random() - 0.5) * 6,
                                    isDragging: false,
                                    hasMoved: false,
                                    startTime: 0,
                                    initialX,
                                    initialY
                                };
                            });
                        }, 7000); // 7 seconds delay to let user read the warning
                    }
                }
                track.lastTime = now;

                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(drone.x, drone.y, '#22d3ee'));
                }
                
                if (drone.state === 'pushing' || drone.state === 'hunting') {
                    drone.state = 'idle';
                    drone.timer = 0;
                    drone.tx = drone.x + (Math.random() - 0.5) * 200;
                    drone.ty = drone.y + (Math.random() - 0.5) * 200;
                } else {
                    drone.state = 'wandering';
                    drone.wanderingTarget = { 
                        x: 100 + Math.random() * (w - 200), 
                        y: 100 + Math.random() * (h - 200) 
                    };
                }
            }
        };
        window.addEventListener('click', handleCanvasClick);

        let animId: number;
        const loop = () => {
            const now = performance.now();
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, w, h);

            const mx = (mouseRef.current.x + 0.5) * w;
            const my = (mouseRef.current.y + 0.5) * h;

            // Update Physics for fallen buttons
            if (isBlackoutRef.current) {
                const floorOffsetFromBottom = 10; 
                const newOffsets: Record<string, { x: number, y: number, r: number }> = {};
                let changed = false;

                Object.keys(buttonPhysicsRef.current).forEach(id => {
                    const p = buttonPhysicsRef.current[id];
                    if (!p.isDragging) {
                        p.vy += 0.45; // Gravity
                        p.x += p.vx;
                        p.y += p.vy;
                        p.r += p.vr;

                        // Corner-Aware Floor Bounce
                        const isStart = id === 'btn-start';
                        const isLogout = id === 'btn-logout';
                        const w_b = isStart ? 340 : (isLogout ? 140 : 280);
                        const h_b = isStart ? 80 : (isLogout ? 45 : 55);
                        const rad = (p.r || 0) * Math.PI / 180;
                        
                        const verticalExtent = Math.abs((w_b / 2) * Math.sin(rad)) + Math.abs((h_b / 2) * Math.cos(rad));
                        const absoluteYCenter = p.y + (p.initialY || (h * 0.4));
                        
                        // Bottom edge check
                        if (absoluteYCenter + verticalExtent > h - floorOffsetFromBottom) {
                            p.y = (h - floorOffsetFromBottom) - verticalExtent - (p.initialY || (h * 0.4));
                            p.vy *= -0.55;
                            p.vx *= 0.8;
                            p.vr *= 0.6; 

                            const currentRot = p.r || 0;
                            const targetRot = Math.round(currentRot / 180) * 180;
                            const diff = targetRot - currentRot;
                            p.vr += diff * 0.12; 
                            
                            if (Math.abs(diff) < 2 && Math.abs(p.vr) < 1) {
                                p.r = targetRot;
                                p.vr = 0;
                            }
                        }

                        // Side Wall Bounce (using horizontal extent)
                        const horizontalExtent = Math.abs((w_b / 2) * Math.cos(rad)) + Math.abs((h_b / 2) * Math.sin(rad));
                        const absoluteXCenter = p.x + (p.initialX || (w / 2));
                        if (absoluteXCenter - horizontalExtent < 20) {
                            p.x = 20 + horizontalExtent - (p.initialX || (w / 2));
                            p.vx *= -0.7;
                            p.vr *= 0.9;
                        } else if (absoluteXCenter + horizontalExtent > w - 20) {
                            p.x = (w - 20) - horizontalExtent - (p.initialX || (w / 2));
                            p.vx *= -0.7;
                            p.vr *= 0.9;
                        }

                        newOffsets[id] = { x: p.x, y: p.y, r: p.r };
                        changed = true;
                    } else {
                        // Drag logic updates p directly, just sync to state
                        newOffsets[id] = { x: p.x, y: p.y, r: p.r };
                        changed = true;
                    }
                });
                if (changed) {
                    setButtonOffsets(prev => ({ ...prev, ...newOffsets }));
                }
            }
            
            // Lurker Curiosity: Sometimes follow the drone instead of mouse
            const droneDist = Math.hypot(drone.x - w/2, drone.y - h*0.35);
            const shouldWatchDrone = drone.active && (drone.state === 'pushing' || drone.state === 'hunting' || (drone.state === 'wandering' && Math.sin(now/2000) > 0.5));
            const targetX = shouldWatchDrone ? drone.x : mx;
            const targetY = shouldWatchDrone ? drone.y : my;

            // Unified Transition Logic
            if (transitionStartRef.current !== null) {
                const duration = 1200; // Slow cinematic duration
                const elapsed = now - transitionStartRef.current;
                const progress = Math.min(elapsed / duration, 1);
                zoomFactorRef.current = 1 + Math.pow(progress, 4) * 500; 
                
                // Trigger handover as soon as the eye fills the screen, cutting the trailing black time
                if (progress >= 0.82 && !onStartTriggeredRef.current) {
                    onStartTriggeredRef.current = true;
                    onStart();
                }
            }

            const internalZoom = zoomFactorRef.current;
            const zt = zoomTargetRef.current;

            // Global background zoom/pan
            ctx.save();
            if (internalZoom > 1) {
                ctx.translate(zt.x, zt.y);
                ctx.scale(internalZoom, internalZoom);
                ctx.translate(-zt.x, -zt.y);
            }

            stars.forEach(s => { s.update(); s.draw(); });
            meteors.forEach(m => { m.update(); m.draw(); });
            
            particles.forEach((p, i) => {
                p.update();
                p.draw();
                if (p.life <= 0) particles.splice(i, 1);
            });

            drone.update(mx, my, setButtonOffsets);
            drone.draw();
            
            lurker.update();
            lurker.draw(targetX, targetY, internalZoom, zt.x, zt.y);
            
            const sortedHexes = [...hexes].sort((a, b) => b.dist - a.dist);
            sortedHexes.forEach(hex => { hex.update(mx, my); hex.draw(); });

            if (isBlackoutRef.current) {
                // Draw total blackout mask - pure black or flickering
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0); 
                
                let opacity = 1;
                if (isFlickering) {
                    // Slow nervous flicker logic
                    const flicker = Math.sin(now / 50) * Math.cos(now / 150);
                    opacity = flicker > 0.3 ? 0.3 : 0.85; 
                }
                
                ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
                ctx.fillRect(0, 0, w, h);
                
                if (isBlackout) {
                    // Tactical Scanner beam (Only after total blackout)
                    ctx.globalCompositeOperation = 'destination-out';
                    const lightRadius = 80;
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(mx, my, lightRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    // High-Tech HUD Rim
                    ctx.save();
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    
                    // Outer rotating ring
                    ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([10, 20]);
                    ctx.beginPath();
                    ctx.arc(mx, my, lightRadius + 4, now / 800, now / 800 + Math.PI * 2);
                    ctx.stroke();
                    
                    // Inner solid rim
                    ctx.setLineDash([]);
                    ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
                    ctx.beginPath();
                    ctx.arc(mx, my, lightRadius, 0, Math.PI * 2);
                    ctx.stroke();

                    // Advanced Crosshair
                    ctx.strokeStyle = '#22d3ee';
                    ctx.globalAlpha = 0.8;
                    ctx.beginPath();
                    // Top
                    ctx.moveTo(mx, my - lightRadius + 5); ctx.lineTo(mx, my - lightRadius + 15);
                    // Bottom
                    ctx.moveTo(mx, my + lightRadius - 5); ctx.lineTo(mx, my + lightRadius - 15);
                    // Left
                    ctx.moveTo(mx - lightRadius + 5, my); ctx.lineTo(mx - lightRadius + 15, my);
                    // Right
                    ctx.moveTo(mx + lightRadius - 5, my); ctx.lineTo(mx + lightRadius - 15, my);
                    ctx.stroke();
                }
                ctx.restore();
            }

            ctx.restore();

            animId = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('click', handleCanvasClick);
        };
    }, []);

    return (
        <div 
            className={`main-menu ${language === 'ru' ? 'ru-menu' : ''} ${isBlackout ? 'is-blackout' : ''}`} 
            style={{ 
                transition: 'opacity 1s', 
                opacity: fading ? 0 : 1,
                cursor: isBlackout ? 'none' : 'default'
            }}
        >
            <canvas id="menu-particles" style={{ position: 'absolute', top: 0, left: 0 }} />

            <div className="menu-vignette" />
            <div className="menu-scanlines" />
            <div className="menu-scanline-beam" />
            
            {isBlackout && (
                <div 
                    className="mouse-candle" 
                    style={{ 
                        left: (mouse.x + 0.5) * 100 + '%', 
                        top: (mouse.y + 0.5) * 100 + '%' 
                    }} 
                />
            )}

            <div className={`menu-container ${isBlackout ? 'in-blackout' : ''}`} style={{
                // Disappear instantly when dive begins to clear view
                opacity: (isTransitioning || (isBlackout && !assistantMsg && Math.hypot(mouse.x, mouse.y) > 2)) ? 0 : 1, // Keep it simple
                transform: isTransitioning ? `scale(${1 + (zoomFactorRef.current - 1) * 3})` : 'none',
                transformOrigin: '50% 35%', 
                pointerEvents: isTransitioning ? 'none' : 'auto',
                transition: isBlackout ? 'all 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'opacity 0.05s linear',
                willChange: isTransitioning ? 'transform, opacity' : 'auto',
                maskImage: (isBlackout && !isFlickering) ? `radial-gradient(circle 80px at ${(mouse.x + 0.5) * window.innerWidth}px ${(mouse.y + 0.5) * window.innerHeight}px, black 85%, transparent 100%)` : 'none',
                WebkitMaskImage: (isBlackout && !isFlickering) ? `radial-gradient(circle 80px at ${(mouse.x + 0.5) * window.innerWidth}px ${(mouse.y + 0.5) * window.innerHeight}px, black 85%, transparent 100%)` : 'none',
                height: isBlackout ? '100vh' : 'auto',
                top: isBlackout ? 0 : 'auto',
                justifyContent: isBlackout ? 'center' : 'center',
                overflow: 'visible'
            }}>
                <div className="menu-title">VOID NEXUS</div>

                {username && (
                    <div className="user-profile-tag" style={{ marginBottom: 20 }}>
                        <div className="user-status-dot" />
                        {t.pilotName}: {username.toUpperCase()}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center', pointerEvents: 'auto' }}>
                <button 
                    id="btn-start"
                    className="btn-start" 
                    onClick={() => {
                        const phys = buttonPhysicsRef.current['btn-start'];
                        const wasRealClick = !isBlackout || (phys && !phys.hasMoved && Date.now() - phys.startTime < 300);
                        if (wasRealClick) handleStart();
                    }}
                    onPointerDown={(e) => handleDragStart(e, 'btn-start')}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                    onMouseEnter={() => hoveringStartRef.current = true}
                    onMouseLeave={() => hoveringStartRef.current = false}
                    style={{
                        transform: buttonOffsets['btn-start'] 
                            ? `translate(${buttonOffsets['btn-start'].x}px, ${buttonOffsets['btn-start'].y}px) rotate(${buttonOffsets['btn-start'].r}deg)` 
                            : 'none',
                        transition: isFlickering ? 'transform 0.8s cubic-bezier(0.5, 0, 0.75, 0)' : 'none',
                        cursor: isBlackout ? 'grab' : 'pointer',
                        zIndex: dragTargetRef.current === 'btn-start' ? 1000 : 1
                    }}
                >
                    <span>{t.enterVoid}</span>
                </button>
                {isBlackout && (
                    <img 
                        src="/assets/Assistant/Candle.png" 
                        style={{
                            position: 'fixed',
                            bottom: '40px',
                            left: '40px',
                            width: '130px',
                            pointerEvents: 'none',
                            zIndex: 10,
                            transform: 'scaleX(-1)', // Face inwards
                            filter: 'brightness(0.9) drop-shadow(0 0 15px rgba(0, 243, 255, 0.3))'
                        }}
                        alt=""
                    />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center' }}>
                        <button 
                            id="btn-multiplayer"
                            className="btn-logic" 
                            onPointerDown={(e) => handleDragStart(e, 'btn-multiplayer')}
                            onPointerMove={handleDragMove}
                            onPointerUp={handleDragEnd}
                            style={{ 
                                border: '1px solid #a855f7', 
                                color: '#a855f7',
                                transform: `translate(${buttonOffsets['btn-multiplayer']?.x || 0}px, ${buttonOffsets['btn-multiplayer']?.y || 0}px) rotate(${buttonOffsets['btn-multiplayer']?.r || 0}deg)`,
                                transition: isFlickering ? 'transform 0.8s cubic-bezier(0.5, 0, 0.75, 0)' : 'none',
                                cursor: isBlackout ? 'grab' : 'pointer',
                                zIndex: dragTargetRef.current === 'btn-multiplayer' ? 1000 : 1
                            }} 
                            onClick={() => {
                                const phys = buttonPhysicsRef.current['btn-multiplayer'];
                                const wasRealClick = !isBlackout || (phys && !phys.hasMoved && Date.now() - phys.startTime < 300);
                                if (wasRealClick) handleMultiplayerStart();
                            }}
                        >
                            {t.multiplayerVoid}
                        </button>
                        <button 
                            id="btn-leaderboard"
                            className="btn-logic" 
                            onPointerDown={(e) => handleDragStart(e, 'btn-leaderboard')}
                            onPointerMove={handleDragMove}
                            onPointerUp={handleDragEnd}
                            style={{ 
                                transform: `translate(${buttonOffsets['btn-leaderboard']?.x || 0}px, ${buttonOffsets['btn-leaderboard']?.y || 0}px) rotate(${buttonOffsets['btn-leaderboard']?.r || 0}deg)`,
                                transition: isFlickering ? 'transform 0.8s cubic-bezier(0.5, 0, 0.75, 0)' : 'none',
                                cursor: isBlackout ? 'grab' : 'pointer',
                                zIndex: dragTargetRef.current === 'btn-leaderboard' ? 1000 : 1
                            }}
                            onClick={() => {
                                const phys = buttonPhysicsRef.current['btn-leaderboard'];
                                const wasRealClick = !isBlackout || (phys && !phys.hasMoved && Date.now() - phys.startTime < 300);
                                if (wasRealClick) onShowLeaderboard();
                            }}
                        >
                            {t.leaderboard}
                        </button>
                        <button 
                            id="btn-settings"
                            className="menu-btn secondary" 
                            style={{ display: 'none' }} // Hidden legacy buttons but kept IDs for collision if needed
                        />
                        <button 
                            className="btn-logic" 
                            id="btn-settings-actual"
                            onPointerDown={(e) => handleDragStart(e, 'btn-settings-actual')}
                            onPointerMove={handleDragMove}
                            onPointerUp={handleDragEnd}
                            style={{ 
                                transform: `translate(${buttonOffsets['btn-settings-actual']?.x || 0}px, ${buttonOffsets['btn-settings-actual']?.y || 0}px) rotate(${buttonOffsets['btn-settings-actual']?.r || 0}deg)`,
                                transition: isFlickering ? 'transform 0.8s cubic-bezier(0.5, 0, 0.75, 0)' : 'none',
                                cursor: isBlackout ? 'grab' : 'pointer',
                                zIndex: dragTargetRef.current === 'btn-settings-actual' ? 1000 : 1
                            }}
                            onClick={() => {
                                const phys = buttonPhysicsRef.current['btn-settings-actual'];
                                const wasRealClick = !isBlackout || (phys && !phys.hasMoved && Date.now() - phys.startTime < 300);
                                if (wasRealClick) setShowSettings(true);
                            }}
                        >
                            {t.settings}
                        </button>
                        <button 
                            id="btn-blueprints"
                            className="btn-logic" 
                            onPointerDown={(e) => handleDragStart(e, 'btn-blueprints')}
                            onPointerMove={handleDragMove}
                            onPointerUp={handleDragEnd}
                            style={{ 
                                transform: `translate(${buttonOffsets['btn-blueprints']?.x || 0}px, ${buttonOffsets['btn-blueprints']?.y || 0}px) rotate(${buttonOffsets['btn-blueprints']?.r || 0}deg)`,
                                transition: isFlickering ? 'transform 0.8s cubic-bezier(0.5, 0, 0.75, 0)' : 'none',
                                cursor: isBlackout ? 'grab' : 'pointer',
                                zIndex: dragTargetRef.current === 'btn-blueprints' ? 1000 : 1
                            }}
                            onClick={() => {
                                const phys = buttonPhysicsRef.current['btn-blueprints'];
                                const wasRealClick = !isBlackout || (phys && !phys.hasMoved && Date.now() - phys.startTime < 300);
                                if (wasRealClick) setShowBlueprint(true);
                            }}
                        >
                            {t.database}
                        </button>
                    </div>
    {onLogout && (
                        <button 
                            id="btn-logout"
                            className="btn-logout" 
                            onPointerDown={(e) => handleDragStart(e, 'btn-logout')}
                            onPointerMove={handleDragMove}
                            onPointerUp={handleDragEnd}
                            style={{ 
                                transform: `translate(${buttonOffsets['btn-logout']?.x || 0}px, ${buttonOffsets['btn-logout']?.y || 0}px) rotate(${buttonOffsets['btn-logout']?.r || 0}deg)`,
                                transition: isFlickering ? 'transform 0.8s cubic-bezier(0.5, 0, 0.75, 0)' : 'none',
                                cursor: isBlackout ? 'grab' : 'pointer',
                                zIndex: dragTargetRef.current === 'btn-logout' ? 1000 : 1,
                                position: 'relative'
                            }}
                            onClick={() => {
                                const phys = buttonPhysicsRef.current['btn-logout'];
                                const wasRealClick = !isBlackout || (phys && !phys.hasMoved && Date.now() - phys.startTime < 300);
                                if (wasRealClick && onLogout) onLogout();
                            }}
                        >
                            {t.disconnect}
                        </button>
                    )}
                </div>
            </div>

            <div className="patch-version-overlay">
                {t.ver} {CURRENT_PATCH_VERSION}
            </div>

            <style>{`
                .patch-version-overlay {
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    color: rgba(34, 211, 238, 0.4);
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    pointer-events: none;
                    text-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
                    z-index: 10;
                }
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
                .assistant-dialog-overlay {
                    position: fixed;
                    top: 20%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.85);
                    border: 1px solid #22d3ee;
                    padding: 20px 40px;
                    border-radius: 4px;
                    color: #fff;
                    font-size: 18px;
                    letter-spacing: 2px;
                    z-index: 10000;
                    box-shadow: 0 0 30px rgba(34, 211, 238, 0.3);
                    text-align: center;
                    animation: dialog-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes dialog-appear {
                    from { transform: translate(-50%, -20px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .is-blackout .blackout-vignette {
                    opacity: 1;
                }
                .mouse-candle {
                    position: fixed;
                    width: 160px;
                    height: 160px;
                    border: 1px solid rgba(0, 243, 255, 0.2);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 9999;
                    box-shadow: inset 0 0 30px rgba(0, 243, 255, 0.1);
                }
                .mouse-candle::after {
                    content: 'LOOSER SCANNER V2';
                    position: absolute;
                    bottom: -30px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #00f3ff;
                    font-size: 7px;
                    font-weight: 900;
                    letter-spacing: 3px;
                    opacity: 0.7;
                    text-shadow: 0 0 5px #00f3ff;
                    animation: text-glitch 0.2s infinite alternate;
                }
                @keyframes text-glitch {
                    from { transform: translateX(-50%) skew(0deg); opacity: 0.7; }
                    to { transform: translateX(-48%) skew(2deg); opacity: 0.9; }
                }
                .mouse-candle::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 4px;
                    height: 4px;
                    background: #00f3ff;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #00f3ff;
                }
                .in-blackout .menu-title {
                    opacity: 0.05;
                    filter: blur(15px);
                }
                .blackout-vignette {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: black;
                    pointer-events: none;
                    z-index: 4000;
                    opacity: 0;
                    transition: opacity 2s;
                }
                .is-blackout .blackout-vignette {
                    opacity: 1;
                }
            `}</style>

            {assistantMsg && <AssistantOverlay isVisible={true} message={assistantMsg} emotion="Point" />}

            {showSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 5000 }}>
                    <SettingsMenu onClose={() => setShowSettings(false)} mode="menu" />
                </div>
            )}

            {showBlueprint && (
                <div className="blueprint-modal" onClick={() => setShowBlueprint(false)}>
                    <div className="blueprint-container" onClick={(e) => e.stopPropagation()}>
                        <div className="blueprint-header">
                            <div className="blueprint-title">{t.archiveTitle}</div>
                            <button className="btn-close-blueprint" onClick={() => setShowBlueprint(false)}>{t.close}</button>
                        </div>
                        <iframe src="/blueprint.html" className="blueprint-iframe" title="Game Archive" />
                    </div>
                </div>
            )}
        </div>
    );
};
