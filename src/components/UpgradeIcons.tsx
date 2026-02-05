
// Common wide heart path (normalized 100x100)
// Designed to be 'wider' than the classic hex-heart
// M 50 30 ...
const WIDE_HEART_PATH = "M 50 35 C 10 10, 0 45, 50 85 C 100 45, 90 10, 50 35 Z";

export const getIcon = (type: string, color: string) => {
    // Common styles
    const filterGlow = `drop-shadow(0 0 2px ${color})`;

    switch (type) {
        case 'dmg': // Flat Dmg: White Hex + Cyan Dot (Burst)
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: filterGlow }}>
                    <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
                        fill="none" stroke="white" strokeWidth="3" />
                    <circle cx="50" cy="50" r="6" fill="#00FFFF">
                        <animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <line x1="50" y1="50" x2="50" y2="25" stroke="#00FFFF" strokeWidth="2" opacity="0.6" />
                </svg>
            );

        case 'dmg_m': // Dmg Multi: Hex + X + Orbiting Dots
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 4px #FF69B4)` }}>
                    <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
                        fill="none" stroke="white" strokeWidth="3" />
                    <text x="50" y="62" textAnchor="middle" fill="#FF69B4" fontSize="40" fontFamily="Orbitron, sans-serif" fontWeight="900">%</text>
                    <g fill="#FF69B4" opacity="0.8">
                        <circle cx="50" cy="25" r="4">
                            <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="25" cy="65" r="4">
                            <animate attributeName="r" values="4;6;4" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="75" cy="65" r="4">
                            <animate attributeName="r" values="4;6;4" dur="1.5s" begin="1s" repeatCount="indefinite" />
                        </circle>
                    </g>
                </svg>
            );

        case 'atk': // Atk Speed: Cyan Lightning Bolt
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 4px #00FFFF)` }}>
                    <path d="M60 10 L30 50 L55 50 L40 90 L70 50 L45 50 Z"
                        fill="#00FFFF" stroke="#00FFFF" strokeWidth="1">
                        <animate attributeName="opacity" values="1;0.4;1;0.8;1" dur="0.2s" repeatCount="indefinite" />
                        <animate attributeName="fill" values="#00FFFF;#E0FFFF;#00FFFF" dur="0.5s" repeatCount="indefinite" />
                    </path>
                </svg>
            );

        case 'hp_f': // Flat Max Health: Red Outline Heart (Wider) + Growing Animation
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 3px #EF4444)` }}>
                    <path d={WIDE_HEART_PATH} fill="none" stroke="#EF4444" strokeWidth="4" transform-origin="50 50">
                        <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="0.8s" repeatCount="indefinite" />
                    </path>
                </svg>
            );

        case 'hp_m': // Health Multiplier: Red Outline Heart + X + Growing Animation
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 3px #EF4444)` }}>
                    <path d={WIDE_HEART_PATH} fill="none" stroke="#EF4444" strokeWidth="4" transform-origin="50 50">
                        <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="0.8s" repeatCount="indefinite" />
                    </path>
                    <text x="50" y="65" textAnchor="middle" fill="#EF4444" fontSize="36" fontFamily="Orbitron, sans-serif" fontWeight="900">%</text>
                </svg>
            );

        case 'reg_f': // Regen Health: Green Heart + Water Fill
            const regenColor = '#4ade80';
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 3px ${regenColor})` }}>
                    <defs>
                        <mask id="regenMask">
                            <rect x="0" y="100" width="100" height="100" fill="white">
                                <animate attributeName="y" values="100;0;100" dur="1.5s" repeatCount="indefinite" />
                            </rect>
                        </mask>
                        <clipPath id="regenClip">
                            <path d={WIDE_HEART_PATH} />
                        </clipPath>
                    </defs>
                    {/* Outline */}
                    <path d={WIDE_HEART_PATH} fill="none" stroke={regenColor} strokeWidth="4" />
                    {/* Filling Effect */}
                    <rect x="0" y="0" width="100" height="100" fill={regenColor} opacity="0.6" clipPath="url(#regenClip)">
                        <animate attributeName="y" values="100;0;100" dur="1.5s" repeatCount="indefinite" />
                    </rect>
                </svg>
            );

        case 'reg_m': // Regen Multiplier: Heart + %
            const regenColorM = '#4ade80';
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 3px ${regenColorM})` }}>
                    <defs>
                        <clipPath id="regenClipM">
                            <path d={WIDE_HEART_PATH} />
                        </clipPath>
                    </defs>
                    <path d={WIDE_HEART_PATH} fill="none" stroke={regenColorM} strokeWidth="4" />
                    <rect x="0" y="0" width="100" height="100" fill={regenColorM} opacity="0.6" clipPath="url(#regenClipM)">
                        <animate attributeName="y" values="100;0;100" dur="1.5s" repeatCount="indefinite" />
                    </rect>
                    <text x="50" y="65" textAnchor="middle" fill="#fff" fontSize="36" fontFamily="Orbitron, sans-serif" fontWeight="900" stroke={regenColorM} strokeWidth="1">%</text>
                </svg>
            );

        case 'arm': // Armor: Slate Shield (Hex Outline) + Glint
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 2px #708090)` }}>
                    <defs>
                        <clipPath id="shieldClip">
                            <path d="M50 10 L85 25 V60 L50 90 L15 60 V25 Z" />
                        </clipPath>
                    </defs>
                    <path d="M50 10 L85 25 V60 L50 90 L15 60 V25 Z"
                        fill="none" stroke="#708090" strokeWidth="4" />
                    {/* Glint Animation - Centered and Non-tilted */}
                    <g clipPath="url(#shieldClip)">
                        <rect x="-20" y="-20" width="50" height="200" fill="white" opacity="0.4" transform="rotate(25 50 50)">
                            <animate attributeName="x" values="-20;150" dur="1.2s" repeatCount="indefinite" />
                        </rect>
                    </g>
                </svg>
            );

        case 'arm_m': // Armor Multi: Shield + Glint + X
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 2px #708090)` }}>
                    <defs>
                        <clipPath id="shieldClipM">
                            <path d="M50 10 L85 25 V60 L50 90 L15 60 V25 Z" />
                        </clipPath>
                    </defs>
                    <path d="M50 10 L85 25 V60 L50 90 L15 60 V25 Z"
                        fill="none" stroke="#708090" strokeWidth="4" />
                    {/* Glint Animation - Centered and Non-tilted */}
                    <g clipPath="url(#shieldClipM)">
                        <rect x="-20" y="-20" width="50" height="200" fill="white" opacity="0.4" transform="rotate(25 50 50)">
                            <animate attributeName="x" values="-20;150" dur="1.2s" repeatCount="indefinite" />
                        </rect>
                    </g>
                    {/* X Symbol - Centered Vertically */}
                    <text x="50" y="58" textAnchor="middle" fill="#708090" fontSize="40" fontFamily="Orbitron, sans-serif" fontWeight="900">%</text>
                </svg>
            );

        case 'xp': // XP: Cyan Bar (Meter)
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 4px #00FFFF)` }}>
                    <text x="50" y="45" textAnchor="middle" fill="white" fontSize="24" fontFamily="Orbitron" fontWeight="900">XP</text>
                    <rect x="20" y="60" width="60" height="8" fill="none" stroke="#00FFFF" strokeWidth="1" rx="2" />
                    <rect x="22" y="62" width="56" height="4" fill="#00FFFF">
                        <animate attributeName="width" values="0;56;0" dur="2s" repeatCount="indefinite" />
                    </rect>
                </svg>
            );

        case 'xp_m': // XP Multiplier: Cyan Bar + % Text
            return (
                <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ filter: `drop-shadow(0 0 4px #00FFFF)` }}>
                    <text x="50" y="45" textAnchor="middle" fill="white" fontSize="24" fontFamily="Orbitron" fontWeight="900">XP%</text>
                    <rect x="20" y="60" width="60" height="8" fill="none" stroke="#00FFFF" strokeWidth="1" rx="2" />
                    <rect x="22" y="62" width="56" height="4" fill="#00FFFF">
                        <animate attributeName="width" values="0;56;0" dur="2s" repeatCount="indefinite" />
                    </rect>
                </svg>
            );

        default:
            return null;
    }
};
