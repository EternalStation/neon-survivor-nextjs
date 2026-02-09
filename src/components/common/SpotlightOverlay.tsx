import React, { useState, useEffect } from 'react';
import { useWindowScale } from '../../hooks/useWindowScale';

interface SpotlightOverlayProps {
    selector: string;
    text: string;
    subtext: string;
    onNext?: () => void;
    onPrev?: () => void;
    nextLabel?: string;
    prevLabel?: string;
    preferredPosition?: 'left' | 'right' | 'top' | 'bottom';
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
    selector, text, subtext, onNext, onPrev, preferredPosition = 'top',
    nextLabel = '[ NEXT ]', prevLabel = '[ PREV ]'
}) => {
    const [targetRect, setTargetRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null);
    const { scale } = useWindowScale();

    useEffect(() => {
        const updateRect = () => {
            const el = document.querySelector(selector);
            if (el) {
                const rect = el.getBoundingClientRect();
                // Special case for radar chart to include labels better
                const isRadar = selector.includes('radar');
                const padding = isRadar ? 5 : 20;

                setTargetRect({
                    top: (rect.top - padding) / scale,
                    left: (rect.left - padding) / scale,
                    width: (rect.width + padding * 2) / scale,
                    height: (rect.height + padding * 2) / scale
                });
            }
        };

        const timer = setInterval(updateRect, 100);
        updateRect();
        return () => clearInterval(timer);
    }, [selector, scale]);

    if (!targetRect) return null;

    // Calculate Hint Box Position
    let hintTop = targetRect.top - 200;
    let hintLeft = targetRect.left + targetRect.width / 2 - 275;

    if (preferredPosition === 'left') {
        hintTop = targetRect.top + targetRect.height / 2 - 100; // Adjusted for better center alignment
        hintLeft = targetRect.left - 860; // Shifted even further left to clear labels
    }

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9998 }}>
            <style>{`
                .tutorial-spotlight-box {
                    position: absolute;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
                    z-index: 9998;
                    border: 2px solid #0ff;
                    border-radius: 8px;
                    animation: pulseBorder 2s infinite;
                }

                @keyframes pulseBorder {
                    0% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85), 0 0 10px #0ff; }
                    50% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85), 0 0 25px #0ff; }
                    100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85), 0 0 10px #0ff; }
                }

                .tutorial-hint-box {
                    position: absolute;
                    background: rgba(0, 10, 20, 0.95);
                    border: 1px solid #0ff;
                    padding: 24px;
                    width: 550px;
                    color: #fff;
                    z-index: 9999;
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
                    pointer-events: auto; /* Enable clicks for buttons */
                    animation: slideIn 0.3s ease-out;
                    backdrop-filter: blur(10px);
                    display: flex;
                    flex-direction: column;
                }

                .tutorial-hint-box h3 {
                    margin: 0 0 12px 0;
                    color: #0ff;
                    font-size: 18px;
                    text-transform: uppercase;
                    letter-spacing: 4px;
                    font-weight: 900;
                }

                .tutorial-hint-box p {
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.6;
                    color: #fff;
                    font-weight: 500;
                }

                .tutorial-nav {
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    margin-top: 20px;
                }

                .nav-btn {
                    background: transparent;
                    border: 1px solid #0ff;
                    color: #0ff;
                    padding: 6px 12px;
                    cursor: pointer;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    transition: all 0.2s;
                }

                .nav-btn:hover {
                    background: rgba(0, 255, 255, 0.2);
                    box-shadow: 0 0 10px #0ff;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="tutorial-spotlight-box" style={{
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
            }} />

            <div className="tutorial-hint-box" style={{
                top: Math.max(20, hintTop),
                left: Math.max(20, hintLeft),
            }}>
                <h3>{text}</h3>
                <p>{subtext}</p>

                {(onNext || onPrev) && (
                    <div className="tutorial-nav">
                        {onPrev && <button className="nav-btn" onClick={onPrev}>{prevLabel}</button>}
                        {onNext && <button className="nav-btn" onClick={onNext}>{nextLabel}</button>}
                    </div>
                )}
            </div>
        </div>
    );
};
