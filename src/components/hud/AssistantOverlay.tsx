import React, { useEffect, useState } from 'react';
export type AssistantEmotion = 'Normal' | 'Dissapointed' | 'Point' | 'Smile' | 'Thinks';

interface AssistantOverlayProps {
    message: string;
    emotion?: AssistantEmotion;
    onComplete?: () => void;
    isVisible: boolean;
}

export const AssistantOverlay: React.FC<AssistantOverlayProps> = ({ message, emotion = 'Normal', onComplete, isVisible }) => {
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!isVisible) {
            setDisplayedText("");
            return;
        }

        if (displayedText.length < message.length) {
            setIsTyping(true);
            const timeout = setTimeout(() => {
                setDisplayedText(message.slice(0, displayedText.length + 1));
            }, 25);
            return () => clearTimeout(timeout);
        } else {
            setIsTyping(false);
            onComplete?.();
        }
    }, [displayedText, message, isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '120px',
            right: '40px',
            zIndex: 30000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            pointerEvents: 'none',
            animation: 'orbitSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            {/* PORTRAIT AREA */}
            <div style={{
                width: '180px',
                height: '180px',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '2px solid rgba(0, 243, 255, 0.5)',
                borderRadius: '50%',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(0, 243, 255, 0.3), inset 0 0 15px rgba(0, 243, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* ORBIT PORTRAIT IMAGE */}
                <img
                    src={`/assets/Assistant/${emotion}.png`}
                    alt="Orbit Assistant"
                    style={{
                        width: '110%',
                        height: '110%',
                        objectFit: 'cover',
                        opacity: 0.9,
                        filter: 'drop-shadow(0 0 10px rgba(0,243,255,0.4))',
                        animation: isTyping ? 'orbitGlow 1s infinite alternate' : 'none'
                    }}
                />

                {/* Scanner lines */}
                <div style={{
                    position: 'absolute',
                    top: '-100%',
                    left: 0,
                    width: '100%',
                    height: '10px',
                    background: 'rgba(0, 243, 255, 0.2)',
                    boxShadow: '0 0 10px rgba(0, 243, 255, 0.5)',
                    animation: 'scanLine 2s linear infinite'
                }} />
            </div>

            {/* DIALOGUE BOX */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(0, 243, 255, 0.4)',
                borderRight: '4px solid #00f3ff',
                borderRadius: '12px 0 12px 12px',
                padding: '16px 20px',
                maxWidth: '400px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 243, 255, 0.1)',
                backdropFilter: 'blur(12px)',
                position: 'relative'
            }}>
                <div style={{
                    color: '#00f3ff',
                    fontSize: '11px',
                    fontWeight: 950,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ width: '6px', height: '6px', background: '#00f3ff', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                    Orbit Assistant
                </div>

                <div style={{
                    color: '#eee',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    lineHeight: '1.5',
                    minHeight: '24px'
                }}>
                    {displayedText}
                    {isTyping && <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '16px',
                        background: '#00f3ff',
                        marginLeft: '4px',
                        animation: 'blink 0.8s step-end infinite'
                    }} />}
                </div>

                {/* Corner detail */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '8px',
                    height: '8px',
                    borderLeft: '1px solid #00f3ff',
                    borderBottom: '1px solid #00f3ff'
                }} />
            </div>

            <style>{`
                @keyframes orbitGlow {
                    from { filter: drop-shadow(0 0 5px rgba(0,243,255,0.3)); transform: scale(1.0); }
                    to { filter: drop-shadow(0 0 15px rgba(0,243,255,0.7)); transform: scale(1.05); }
                }
                @keyframes orbitSlideIn {
                    from { transform: translateX(50px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes scanLine {
                    from { top: -20%; }
                    to { top: 120%; }
                }
                @keyframes blink {
                    50% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};
