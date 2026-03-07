import type { GameState, MapPOI } from '../core/Types';
import { TURRET_RANGE } from './TurretLogic';
import { getUiTranslation } from '../../lib/uiTranslations';
import type { Language } from '../../lib/LanguageContext';

export const ARENA_RADIUS = 3750;
export const MAP_GAP = 400;


const R = ARENA_RADIUS;
const SQRT3 = Math.sqrt(3);


const CENTER_DIST = (R * SQRT3) + MAP_GAP;



export const ARENA_CENTERS = [
    { x: 0, y: 0, id: 0 },
    { x: Math.cos(-Math.PI / 6) * CENTER_DIST, y: Math.sin(-Math.PI / 6) * CENTER_DIST, id: 1 },
    { x: Math.cos(Math.PI / 6) * CENTER_DIST, y: Math.sin(Math.PI / 6) * CENTER_DIST, id: 2 }
];

export interface ArenaDetails {
    id: number;
    name: string;
    description: string;
    location: string;
    buffs: string[];
    debuffs: string[];
    color: string;
}

export const ARENA_DATA: Record<number, ArenaDetails> = {
    0: {
        id: 0,
        name: "Economic Arena",
        location: "Sector-01 - Resource Hub",
        description: "Optimized for maximum efficiency. High-fidelity data extraction increases yield by 30%.",
        buffs: ["+30% XP & Soul Yield"],
        debuffs: [],
        color: "#22d3ee"
    },
    1: {
        id: 1,
        name: "Combat Arena",
        location: "Sector-02 - Weapon Testing",
        description: "Restored offensive protocols enhance weapon output and cycling speed by 30%.",
        buffs: ["+30% DMG & Atk Speed"],
        debuffs: [],
        color: "#ef4444"
    },
    2: {
        id: 2,
        name: "Defence Arena",
        location: "Sector-03 - Fortress Perimeter",
        description: "Fortified structural integrity and nano-repair systems increase vitality metrics by 30%.",
        buffs: ["+30% Max HP & Regen"],
        debuffs: [],
        color: "#3b82f6"
    }
};

export function getLocalizedArenaDetails(id: number, lang: Language): ArenaDetails {
    const base = ARENA_DATA[id];
    const t = getUiTranslation(lang);
    const localized = (t.arenas as any)[id];
    if (!localized) return base;
    return {
        ...base,
        name: localized.name,
        location: localized.location,
        description: localized.description,
        buffs: localized.buffs
    };
}

export function getLocalizedARENA_DATA(lang: Language): Record<number, ArenaDetails> {
    const result: Record<number, ArenaDetails> = {};
    Object.keys(ARENA_DATA).forEach(key => {
        const id = parseInt(key);
        result[id] = getLocalizedArenaDetails(id, lang);
    });
    return result;
}

export function getArenaDetails(id: number, level: number = 1): ArenaDetails {
    const base = ARENA_DATA[id];
    if (level === 0) {
        return { ...base, buffs: [], debuffs: [] };
    }
    return base;
}

export const SECTOR_NAMES: Record<number, string> = {
    0: "Economic Arena",
    1: "Combat Arena",
    2: "Defence Arena"
};


export interface PortalDef {
    from: number;
    to: number;
    wall: number;
    color: string;
}









export const PORTALS: PortalDef[] = [

    { from: 0, to: 1, wall: 5, color: '#FF3333' },
    { from: 0, to: 2, wall: 0, color: '#3388FF' },


    { from: 1, to: 0, wall: 2, color: '#FFD700' },
    { from: 1, to: 2, wall: 1, color: '#3388FF' },


    { from: 2, to: 0, wall: 3, color: '#FFD700' },
    { from: 2, to: 1, wall: 4, color: '#FF3333' },
];




export function getHexWallLine(cx: number, cy: number, r: number, wallIndex: number): { x1: number, y1: number, x2: number, y2: number, nx: number, ny: number } {

    const ang1 = (Math.PI / 3) * wallIndex;
    const ang2 = (Math.PI / 3) * ((wallIndex + 1) % 6);


    const vx1 = cx + r * Math.cos(ang1);
    const vy1 = cy + r * Math.sin(ang1);
    const vx2 = cx + r * Math.cos(ang2);
    const vy2 = cy + r * Math.sin(ang2);



    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;


    const px1 = lerp(vx1, vx2, 0.35);
    const py1 = lerp(vy1, vy2, 0.35);
    const px2 = lerp(vx1, vx2, 0.65);
    const py2 = lerp(vy1, vy2, 0.65);







    const midAng = (Math.PI / 3) * wallIndex + (Math.PI / 6);
    const nx = Math.cos(midAng);
    const ny = Math.sin(midAng);

    return {
        x1: px1, y1: py1,
        x2: px2, y2: py2,
        nx, ny
    };
}



function textHex(x: number, y: number, r: number): boolean {
    const px = Math.abs(x);
    const py = Math.abs(y);

    if (px > r) return false;
    if (py > r * SQRT3 / 2) return false;

    return (py + px * SQRT3) <= (r * SQRT3);
}


export function isPointInHex(x: number, y: number, cx: number, cy: number, r: number): boolean {
    return textHex(x - cx, y - cy, r);
}

export function isInMap(x: number, y: number): boolean {
    for (const c of ARENA_CENTERS) {
        if (textHex(x - c.x, y - c.y, ARENA_RADIUS)) return true;
    }
    return false;
}

/**
 * Calculates the shortest distance to a hex boundary and the normal of that boundary.
 * For any point in the map, find the nearest hex edge.
 */
export function getHexDistToWall(x: number, y: number): { dist: number; normal: { x: number; y: number } } {
    let bestMinDist = -Infinity;
    let bestNormal = { x: 0, y: 0 };

    const r = ARENA_RADIUS;
    const H = r * SQRT3 / 2;

    ARENA_CENTERS.forEach(c => {
        const dx = x - c.x;
        const dy = y - c.y;









        const normals = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -SQRT3 / 2, y: -0.5 }, { x: -SQRT3 / 2, y: 0.5 },
            { x: SQRT3 / 2, y: -0.5 }, { x: SQRT3 / 2, y: 0.5 }
        ];

        const dists = [
            H - dy, H + dy,
            (r * SQRT3 - (dx * SQRT3 + dy)) / 2,
            (r * SQRT3 - (dx * SQRT3 - dy)) / 2,
            (r * SQRT3 - (-dx * SQRT3 + dy)) / 2,
            (r * SQRT3 - (-dx * SQRT3 - dy)) / 2
        ];

        let hexMinDist = Infinity;
        let hexNormal = { x: 0, y: 0 };

        dists.forEach((d, i) => {
            if (d < hexMinDist) {
                hexMinDist = d;
                hexNormal = normals[i];
            }
        });

        if (hexMinDist > bestMinDist) {
            bestMinDist = hexMinDist;
            bestNormal = hexNormal;
        }
    });

    return { dist: bestMinDist, normal: bestNormal };
}


export function getArenaIndex(x: number, y: number): number {
    for (const c of ARENA_CENTERS) {
        if (textHex(x - c.x, y - c.y, ARENA_RADIUS)) return c.id;
    }

    let minDist = Infinity;
    let index = 0;
    for (const c of ARENA_CENTERS) {
        const d = Math.hypot(x - c.x, y - c.y);
        if (d < minDist) {
            minDist = d;
            index = c.id;
        }
    }
    return index;
}

export function getRandomPositionInArena(arenaId: number, minWallDist: number = 0): { x: number, y: number } {
    const arena = ARENA_CENTERS.find(c => c.id === arenaId) || ARENA_CENTERS[0];
    let x = arena.x;
    let y = arena.y;
    let attempts = 0;
    while (attempts < 100) {
        const rx = (Math.random() - 0.5) * 2 * ARENA_RADIUS;
        const ry = (Math.random() - 0.5) * 2 * ARENA_RADIUS;

        if (textHex(rx, ry, ARENA_RADIUS)) {
            const tx = arena.x + rx;
            const ty = arena.y + ry;

            if (minWallDist > 0) {
                const { dist } = getHexDistToWall(tx, ty);
                if (dist < minWallDist) {
                    attempts++;
                    continue;
                }
            }

            x = tx;
            y = ty;
            break;
        }
        attempts++;
    }

    return { x, y };
}

export function getRandomMapPosition(): { x: number, y: number } {

    const arenaId = Math.floor(Math.random() * ARENA_CENTERS.length);
    return getRandomPositionInArena(arenaId);
}

export function generateMapPOIs(): MapPOI[] {
    const pois: MapPOI[] = [];
    let idCounter = 1;

    ARENA_CENTERS.forEach(arena => {

        const ocPos = getRandomPositionInArena(arena.id, 400);

        pois.push({
            id: idCounter++,
            type: 'overclock',
            x: ocPos.x,
            y: ocPos.y,
            radius: 400,
            arenaId: arena.id,
            active: false,
            progress: 0,
            activationProgress: 0,
            activeDuration: 0,
            cooldown: 0,
            respawnTimer: 0,
            lastUsed: 0
        });


        let abPos = { x: 0, y: 0 };
        let attempts = 0;
        while (attempts < 30) {
            abPos = getRandomPositionInArena(arena.id, 400);
            const tooClose = pois.some(p => p.arenaId === arena.id && Math.hypot(p.x - abPos.x, p.y - abPos.y) < 1000);
            if (!tooClose) break;
            attempts++;
        }

        pois.push({
            id: idCounter++,
            type: 'anomaly',
            x: abPos.x,
            y: abPos.y,
            radius: 300,
            arenaId: arena.id,
            active: true,
            progress: 0,
            activationProgress: 0,
            activeDuration: 0,
            cooldown: 0,
            respawnTimer: 0,
            lastUsed: 0
        });


    });



    for (let i = 0; i < 3; i++) {
        let tPos: { x: number, y: number } = { x: 0, y: 0 };
        let tries = 0;

        while (tries < 50) {
            tPos = getRandomPositionInArena(0, 400);


            const tooCloseToPoi = pois.some(p => p.arenaId === 0 && Math.hypot(p.x - tPos.x, p.y - tPos.y) < 1000);

            if (!tooCloseToPoi) break;
            tries++;
        }

        pois.push({
            id: idCounter++,
            type: 'turret',
            x: tPos!.x,
            y: tPos!.y,
            radius: 150,
            arenaId: 0,
            active: false,
            progress: 0,
            activationProgress: 0,
            activeDuration: 0,
            cooldown: 0,
            respawnTimer: 0,
            lastUsed: 0,
            turretUses: 0,
            turretCost: 2,
            lastShot: 0,
            turretVariant: ['fire', 'ice', 'heal'][i] as any
        });
    }


    return pois;
}

export function findSafePoiPosition(allPois: MapPOI[], arenaId: number, minWallDist: number, excludeId?: number): { x: number, y: number } {
    const otherPois = allPois.filter(p => (excludeId === undefined || p.id !== excludeId) && p.arenaId === arenaId && p.respawnTimer <= 0);

    let bestPos = { x: 0, y: 0 };
    let maxMinDist = -1;

    for (let i = 0; i < 30; i++) {
        const pos = getRandomPositionInArena(arenaId, minWallDist);
        let minDist = 10000;
        otherPois.forEach(other => {
            const d = Math.hypot(pos.x - other.x, pos.y - other.y);
            if (d < minDist) minDist = d;
        });

        if (minDist > maxMinDist) {
            maxMinDist = minDist;
            bestPos = pos;
        }

        if (maxMinDist > 1000) break;
    }

    return bestPos;
}

export function relocatePOI(allPois: MapPOI[], poi: MapPOI) {
    const minWall = (poi.type === 'anomaly' || poi.type === 'overclock') ? 400 : 200;
    const bestPos = findSafePoiPosition(allPois, poi.arenaId, minWall, poi.id);

    poi.x = bestPos.x;
    poi.y = bestPos.y;
    poi.progress = 0;
    poi.activationProgress = 0;
    poi.activeDuration = 0;
    poi.cooldown = 0;
    poi.respawnTimer = 0;
    poi.active = (poi.type === 'anomaly');
}




export const CORRUPTION_START_TIME = 0;




export const CORRUPTION_MAX_TIME = 60;

export const SAFE_ZONE_PORTAL_RADIUS = 700;
export const SAFE_ZONE_POI_RADIUS = 600;
export const SAFE_ZONE_BOSS_RADIUS = 900;
export const SAFE_ZONE_SHIP_RADIUS = 900;

export const HEX_GRID_SIZE = 120;


export enum CorruptionStage {
    HEALTHY = 0,
    WARNING = 1,
    ACTIVE = 2
}

export function getCorruptionProgress(gameTime: number): number {
    if (gameTime < CORRUPTION_START_TIME) return 0;
    const progress = (gameTime - CORRUPTION_START_TIME) / CORRUPTION_MAX_TIME;
    return Math.min(Math.max(progress, 0), 1.0);
}

export function getSafeZones(state: GameState): { x: number, y: number, r: number }[] {
    const zones: { x: number, y: number, r: number }[] = [];
    const currentArenaId = state.currentArena;
    if (currentArenaId === undefined) return zones;

    const currentArenaCenter = ARENA_CENTERS.find(c => c.id === currentArenaId) || ARENA_CENTERS[0];


    const activePortals = PORTALS.filter(p => p.from === currentArenaId);
    activePortals.forEach(p => {
        const wall = getHexWallLine(currentArenaCenter.x, currentArenaCenter.y, ARENA_RADIUS, p.wall);
        const cx = (wall.x1 + wall.x2) / 2;
        const cy = (wall.y1 + wall.y2) / 2;
        zones.push({ x: cx, y: cy, r: SAFE_ZONE_PORTAL_RADIUS });
    });


    const incomingPortals = PORTALS.filter(p => p.to === currentArenaId);
    incomingPortals.forEach(p => {



        const rev = PORTALS.find(rp => rp.from === currentArenaId && rp.to === p.from);
        if (rev) {
            const wall = getHexWallLine(currentArenaCenter.x, currentArenaCenter.y, ARENA_RADIUS, rev.wall);
            const cx = (wall.x1 + wall.x2) / 2;
            const cy = (wall.y1 + wall.y2) / 2;

            if (!zones.some(z => Math.hypot(z.x - cx, z.y - cy) < 100)) {
                zones.push({ x: cx, y: cy, r: SAFE_ZONE_PORTAL_RADIUS });
            }
        }
    });



    if (state.pois) {
        state.pois.forEach(poi => {
            if (poi.arenaId !== currentArenaId) return;
            zones.push({ x: poi.x, y: poi.y, r: SAFE_ZONE_POI_RADIUS });
        });
    }


    if (state.enemies) {
        state.enemies.forEach(e => {
            if (e.boss && !e.dead) {
                zones.push({ x: e.x, y: e.y, r: SAFE_ZONE_BOSS_RADIUS });
            }
        });
    }


    if (state.extractionStatus && ['arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        if (state.extractionShipPos && state.extractionTargetArena === currentArenaId) {
            zones.push({ x: state.extractionShipPos.x, y: state.extractionShipPos.y, r: SAFE_ZONE_SHIP_RADIUS });
        }
    }

    return zones;
}


export function getHexPointStage(hx: number, hy: number, state: GameState): CorruptionStage {



    const safeZones = getSafeZones(state);
    for (const zone of safeZones) {
        if (Math.hypot(hx - zone.x, hy - zone.y) < zone.r) {
            return CorruptionStage.HEALTHY;
        }
    }


    const { dist } = getHexDistToWall(hx, hy);
    const progress = getCorruptionProgress(state.gameTime);







    const H = ARENA_RADIUS * Math.sqrt(3) / 2;




    const waveDepth = H * progress * 1.5;


    if (dist < waveDepth) {
        return CorruptionStage.ACTIVE;
    }


    const warningBuffer = 600;
    if (dist < waveDepth + warningBuffer) {
        return CorruptionStage.WARNING;
    }

    return CorruptionStage.HEALTHY;
}

export function isPointInCorruption(x: number, y: number, state: GameState): boolean {







    return getHexPointStage(x, y, state) === CorruptionStage.ACTIVE;
}
