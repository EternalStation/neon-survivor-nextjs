export interface ColorPalette {
    name: string;
    core: string;
    inner: string;
    outer: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
    { name: 'Green', core: '#4ade80', inner: '#22c55e', outer: '#16a34a' },
    { name: 'Blue', core: '#60a5fa', inner: '#3b82f6', outer: '#2563eb' },
    { name: 'Purple', core: '#c084fc', inner: '#a855f7', outer: '#9333ea' },
    { name: 'Orange', core: '#fb923c', inner: '#f97316', outer: '#ea580c' },
    { name: 'Red', core: '#f87171', inner: '#ef4444', outer: '#dc2626' },
];

export function getCurrentPalette(gameTime: number): ColorPalette {
    const eraIndex = Math.floor(gameTime / 900) % COLOR_PALETTES.length; // 15 min = 900s
    return COLOR_PALETTES[eraIndex];
}

export function getShellVisibility(gameTime: number): { core: number; inner: number; outer: number } {
    const timeInEra = gameTime % 900; // 0-900 seconds within current era
    const stage = Math.floor(timeInEra / 300); // 0, 1, or 2 (5-minute stages)

    if (stage === 0) {
        return { core: 1.0, inner: 0.2, outer: 0.0 };
    } else if (stage === 1) {
        return { core: 0.7, inner: 0.6, outer: 0.3 };
    } else {
        return { core: 0.5, inner: 0.8, outer: 1.0 };
    }
}
