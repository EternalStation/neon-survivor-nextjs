export interface ColorPalette {
    name: string;
    core: string;
    inner: string;
    outer: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
    { name: 'Green', core: '#4ade80', inner: '#22c55e', outer: '#166534' },
    { name: 'Blue', core: '#60a5fa', inner: '#3b82f6', outer: '#1e40af' },
    { name: 'Purple', core: '#c084fc', inner: '#a855f7', outer: '#6b21a8' },
    { name: 'Orange', core: '#fb923c', inner: '#f97316', outer: '#9a3412' },
    { name: 'Red', core: '#f87171', inner: '#ef4444', outer: '#991b1b' },
];

export function getCurrentPalette(gameTime: number): ColorPalette {
    const eraIndex = Math.floor(gameTime / 900) % COLOR_PALETTES.length;
    return COLOR_PALETTES[eraIndex];
}

export function getShellVisibility(gameTime: number): { core: number; inner: number; outer: number } {
    const timeInEra = gameTime % 900;
    const stage = Math.floor(timeInEra / 300);

    if (stage === 0) {
        return { core: 1.0, inner: 0.25, outer: 0.0 };
    } else if (stage === 1) {
        return { core: 0.3, inner: 1.0, outer: 0.6 };
    } else {
        return { core: 1.0, inner: 0.35, outer: 1.0 };
    }
}
