export interface ColorPalette {
    name: string;
    core: string;
    inner: string;
    outer: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
    { name: 'Green', core: '#4ade80', inner: '#22c55e', outer: '#064e3b' },
    { name: 'Blue', core: '#00ffff', inner: '#3b82f6', outer: '#1e3a8a' },
    { name: 'Purple', core: '#e9d5ff', inner: '#a855f7', outer: '#581c87' },
    { name: 'Orange', core: '#fff7ed', inner: '#f97316', outer: '#7c2d12' },
    { name: 'Red', core: '#fee2e2', inner: '#ef4444', outer: '#7f1d1d' },
];

export function getCurrentPalette(gameTime: number): ColorPalette {
    const eraIndex = Math.floor(gameTime / 900) % COLOR_PALETTES.length;
    return COLOR_PALETTES[eraIndex];
}

export function getShellVisibility(gameTime: number): { core: number; inner: number; outer: number } {
    const timeInEra = gameTime % 900;
    const stage = Math.floor(timeInEra / 300);

    if (stage === 0) {
        // Stage 0: "Raw Core" - High core visibility, visible outer structure
        return { core: 1.0, inner: 0.2, outer: 0.4 };
    } else if (stage === 1) {
        // Stage 1: "Energy Flux" - Intense inner ring/glow, dimmed core
        return { core: 0.4, inner: 1.0, outer: 0.5 };
    } else {
        // Stage 2: "Solidified" - Full outer shell, pulsing core, structured look
        return { core: 0.8, inner: 0.4, outer: 1.0 };
    }
}
