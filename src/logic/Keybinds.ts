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
    stats: 'c',
    matrix: 'x',
    portal: 'p',
    skill1: '1',
    skill2: '2',
    skill3: '3',
    skill4: '4',
    skill5: '5',
    skill6: '6',
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
    if (key === ' ') return 'SPACE';
    return key.toUpperCase();
};
