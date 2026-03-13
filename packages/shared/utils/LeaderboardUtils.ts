import { PLAYER_CLASSES } from '../logic/core/Classes';
import { UI_TRANSLATIONS, Language } from '../lib/UiTranslations';
import { normalizeDeathCause } from './DeathCauseUtils';

export interface LegendaryHex {
    id: string;
    type: string;
    name: string;
}

export interface RadarCounts {
    dps: number;
    arm: number;
    exp: number;
    hp: number;
    reg: number;
    [key: string]: number;
}

export interface Blueprint {
    name?: string;
    type?: string;
    count?: number;
}

export interface LeaderboardEntry {
    id: number;
    username: string;
    score: string | number;
    survival_time: number;
    kills: number;
    boss_kills: number;
    class_used: string;
    completed_at: string;
    legendary_hexes?: LegendaryHex[];
    arena_times?: Record<number, number>;
    damage_dealt?: number;
    damage_taken?: number;
    damage_blocked?: number;
    damage_blocked_armor?: number;
    damage_blocked_collision?: number;
    damage_blocked_projectile?: number;
    damage_blocked_shield?: number;
    radar_counts?: RadarCounts;
    portals_used?: number;
    hex_levelup_order?: Array<{ hexId: string; level: number; killCount: number; gameTime?: number }>;
    snitches_caught?: number;
    death_cause?: string;
    patch_version?: string;
    timezone_offset?: number;
    final_stats?: {
        dmg: number;
        hp: number;
        xp: number;
        atkSpd: number;
        regen: number;
        armor: number;
        speed: number;
    };
    blueprints?: Blueprint[];
    damage_breakdown?: Record<string, number>;
    class_skill_dmg_history?: number[] | string;
    avg_hp_percent?: number;
    incoming_damage_breakdown?: Record<string, number>;
    healing_breakdown?: Record<string, number>;
}

export const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateStr: string, language: Language, timezoneOffset?: number) => {
    const date = new Date(dateStr);

    if (timezoneOffset !== undefined) {
        const viewerOffset = new Date().getTimezoneOffset();
        const offsetDiff = viewerOffset - timezoneOffset;
        date.setMinutes(date.getMinutes() + offsetDiff);
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : undefined, dateOptions) + ' ' + date.toLocaleTimeString(language === 'ru' ? 'ru-RU' : undefined, timeOptions);
};

export const getClassColor = (id: string) => {
    const cls = PLAYER_CLASSES.find(c => c.id === id.toLowerCase() || c.name.toLowerCase() === id.toLowerCase());
    return cls?.themeColor || '#00ffff';
};

export const getClassName = (classId: string, language: Language) => {
    const cls = PLAYER_CLASSES.find(c => c.id === classId.toLowerCase() || c.name.toLowerCase() === classId.toLowerCase());
    if (!cls) return classId;

    if (language === 'ru') {
        const ruClasses = UI_TRANSLATIONS.ru.classSelection.classes;
        const classKey = cls.id as keyof typeof ruClasses;
        if (ruClasses[classKey]) return ruClasses[classKey].name;
    }
    return cls.name;
};

export const translateDeathCause = (cause: string, language: Language) => {
    const normalized = normalizeDeathCause(cause);
    if (language === 'en') return normalized;
    if (!normalized) return 'Неизвестно';

    if (normalized === 'EVACUATED') return 'ЭВАКУИРОВАН';
    if (normalized === 'Hive Swarm') return 'Рой Улья';
    if (normalized === 'Abomination') return 'Абоминация';
    if (normalized === 'Abomination Burn') return 'Испепеление Абоминации';
    if (normalized === 'Enemy Projectile') return 'Вражеский Снаряд';
    if (normalized === 'Wall Impact') return 'Удар об Стену';
    if (normalized === 'Zombie Horde') return 'Орда Зомби';
    if (normalized === 'Pentagon Minion') return 'Миньон Пентагона';
    if (normalized === 'Unknown') return 'Неизвестно';

    let result = normalized;
    const ruBosses = UI_TRANSLATIONS.ru.bosses.names;

    const translateShape = (shape: string) => {
        const lowShape = shape.toLowerCase();
        return ruBosses[lowShape as keyof typeof ruBosses] || shape;
    };

    if (result.startsWith('Boss ')) {
        const match = result.match(/Boss (\w+)(?: \(Lvl (\d+)\))?/);
        if (match) {
            const shape = match[1];
            const lvl = match[2];
            result = `Босс ${translateShape(shape)}${lvl ? ` (Ур ${lvl})` : ''}`;
        }
    } else if (result.startsWith('Killed by Boss Thorns ')) {
        const match = result.match(/\((\w+)\)/);
        if (match) {
            const shape = match[1];
            result = `Убит Шипами Босса (${translateShape(shape)})`;
        }
    } else if (result.startsWith('Collision with Elite ')) {
        const match = result.match(/Elite (\w+)/);
        if (match) {
            const shape = match[1];
            result = `Столкновение с Элитным ${translateShape(shape)}`;
        }
    } else if (result.startsWith('Collision with ')) {
        const match = result.match(/with (\w+)/);
        if (match) {
            const shape = match[1];
            result = `Столкновения с ${translateShape(shape)}`;
        }
    } else if (result === 'Abomination') {
        result = 'Адский Разлом';
    } else if (result === 'Abomination Burn') {
        result = 'Адское Испепеление';
    } else if (result === 'Enemy Projectile') {
        result = 'Вражеский Снаряд';
    } else if (result === 'Wall Impact') {
        result = 'Удар об Стену';
    } else if (result.includes('Diamond Boss: Orbital Satellites')) {
        result = 'Уничтожен Алмазным Боссом: Орбитальные Спутники';
    } else if (result.includes('Pentagon Boss: Parasitic Link')) {
        result = 'Истощен Пятиугольным Боссом: Паразитическая Связь';
    }

    return result;
};
