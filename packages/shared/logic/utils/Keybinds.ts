export interface Keybinds {
    useDefaultMovement?: boolean;
    moveUp?: string;
    moveDown?: string;
    moveLeft?: string;
    moveRight?: string;
    stats: string;
    matrix: string;
    portal: string;
    dash: string;
    classAbility: string;
    skill1: string;
    skill2: string;
    skill3: string;
    skill4: string;
    skill5: string;
    skill6: string;
    selectUpgrade: string;
    interact: string;
}

const DEFAULT_KEYBINDS: Keybinds = {
    useDefaultMovement: true,
    moveUp: 'KeyW',
    moveDown: 'KeyS',
    moveLeft: 'KeyA',
    moveRight: 'KeyD',
    stats: 'Tab',
    matrix: 'KeyX',
    portal: 'KeyP',
    dash: 'ShiftLeft',
    classAbility: 'Mouse0',
    skill1: 'Digit1',
    skill2: 'Digit2',
    skill3: 'Digit3',
    skill4: 'Digit4',
    skill5: 'Digit5',
    skill6: 'Digit6',
    selectUpgrade: 'Space',
    interact: 'KeyE',
};

const STORAGE_KEY = 'neon_survivor_keybinds';
const KEYBINDS_VERSION_KEY = 'neon_survivor_keybinds_v';
const CURRENT_KEYBINDS_VERSION = '2';

let cachedKeybinds: Keybinds | null = null;

export const initKeybinds = () => {
    if (typeof window === 'undefined') return;
    try {
        const storedVersion = localStorage.getItem(KEYBINDS_VERSION_KEY);
        if (storedVersion !== CURRENT_KEYBINDS_VERSION) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KEYBINDS));
            localStorage.setItem(KEYBINDS_VERSION_KEY, CURRENT_KEYBINDS_VERSION);
            cachedKeybinds = DEFAULT_KEYBINDS;
            window.dispatchEvent(new Event('keybindsChanged'));
        }
    } catch (e) {
        console.warn('Failed to init keybinds', e);
    }
};

export const getKeybinds = (): Keybinds => {
    if (cachedKeybinds) return cachedKeybinds;
    if (typeof window === 'undefined') return DEFAULT_KEYBINDS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            cachedKeybinds = { ...DEFAULT_KEYBINDS, ...JSON.parse(stored) };
            return cachedKeybinds as Keybinds;
        }
    } catch (e) {
        console.warn('Failed to load keybinds', e);
    }
    cachedKeybinds = DEFAULT_KEYBINDS;
    return DEFAULT_KEYBINDS;
};

export const saveKeybinds = (keybinds: Keybinds) => {
    if (typeof window === 'undefined') return;
    try {
        cachedKeybinds = keybinds;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keybinds));
        localStorage.setItem(KEYBINDS_VERSION_KEY, CURRENT_KEYBINDS_VERSION);
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
    if (key === ' ' || key === 'Space') return 'SPACE';
    if (key === 'Tab') return 'TAB';
    if (key === 'ShiftLeft') return 'LSHIFT';
    if (key === 'ShiftRight') return 'RSHIFT';

    if (key.toLowerCase() === 'mouse0') return 'MOUSE 1';
    if (key.toLowerCase() === 'mouse2') return 'MOUSE 2';
    if (key.toLowerCase() === 'mouse1') return 'MOUSE 3';

    let display = key;
    if (display.startsWith('Key')) display = display.substring(3);
    if (display.startsWith('Digit')) display = display.substring(5);
    if (display.startsWith('Arrow')) display = display.substring(5);

    return display.toUpperCase();
};
