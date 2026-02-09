export interface Keybinds {
    stats: string;
    matrix: string;
    portal: string;
    skill1: string;
    skill2: string;
    skill3: string;
    skill4: string;
    skill5: string;
    skill6: string;
}

const DEFAULT_KEYBINDS: Keybinds = {
    stats: 'KeyC',
    matrix: 'KeyX',
    portal: 'KeyP',
    skill1: 'Digit1',
    skill2: 'Digit2',
    skill3: 'Digit3',
    skill4: 'Digit4',
    skill5: 'Digit5',
    skill6: 'Digit6',
};

const STORAGE_KEY = 'neon_survivor_keybinds';

export const getKeybinds = (): Keybinds => {
    if (typeof window === 'undefined') return DEFAULT_KEYBINDS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...DEFAULT_KEYBINDS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('Failed to load keybinds', e);
    }
    return DEFAULT_KEYBINDS;
};

export const saveKeybinds = (keybinds: Keybinds) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keybinds));
        // Dispatch a custom event so components can update immediately
        window.dispatchEvent(new Event('keybindsChanged'));
    } catch (e) {
        console.warn('Failed to save keybinds', e);
    }
};

export const resetKeybinds = () => {
    saveKeybinds(DEFAULT_KEYBINDS);
};

export const getKeyDisplay = (key: string): string => {
    if (!key) return 'NONE';
    if (key === ' ') return 'SPACE';

    // Convert common codes to friendly names
    let display = key;
    if (display.startsWith('Key')) display = display.substring(3);
    if (display.startsWith('Digit')) display = display.substring(5);
    if (display.startsWith('Arrow')) display = display.substring(5);

    return display.toUpperCase();
};
