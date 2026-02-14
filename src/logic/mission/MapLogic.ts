import type { GameState, MapPOI } from '../core/types';

export const ARENA_RADIUS = 3750; // Increased by 3x (1250 -> 3750)
export const MAP_GAP = 400;

// Calculated Constants
const R = ARENA_RADIUS;
const SQRT3 = Math.sqrt(3);

// Flat-Topped Hexagon Geometry
const CENTER_DIST = (R * SQRT3) + MAP_GAP;

// Layout: 
// Arena 0 (Spawn): (0, 0)
export const ARENA_CENTERS = [
    { x: 0, y: 0, id: 0 }, // Left (Spawn)
    { x: Math.cos(-Math.PI / 6) * CENTER_DIST, y: Math.sin(-Math.PI / 6) * CENTER_DIST, id: 1 }, // Top Right
    { x: Math.cos(Math.PI / 6) * CENTER_DIST, y: Math.sin(Math.PI / 6) * CENTER_DIST, id: 2 }   // Bottom Right
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
        name: "ECONOMIC HEX",
        location: "Central Sector - Resource Hub",
        description: "Optimized for maximum efficiency. High-fidelity data extraction increases yield by 30%.",
        buffs: ["+30% XP & Soul Yield"],
        debuffs: [],
        color: "#22d3ee"
    },
    1: {
        id: 1,
        name: "COMBAT HEX",
        location: "Northern Sector - Weapon Testing",
        description: "Restored offensive protocols enhance weapon output and cycling speed by 30%.",
        buffs: ["+30% DMG & Atk Speed"],
        debuffs: [],
        color: "#ef4444"
    },
    2: {
        id: 2,
        name: "DEFENCE HEX",
        location: "Southern Sector - Fortress Perimeter",
        description: "Fortified structural integrity and nano-repair systems increase vitality metrics by 30%.",
        buffs: ["+30% Max HP & Regen"],
        debuffs: [],
        color: "#3b82f6"
    }
};

export function getArenaDetails(id: number, level: number = 1): ArenaDetails {
    const base = ARENA_DATA[id];
    if (level === 0) {
        return { ...base, buffs: [], debuffs: [] };
    }
    return base;
}

export const SECTOR_NAMES: Record<number, string> = {
    0: ARENA_DATA[0].name,
    1: ARENA_DATA[1].name,
    2: ARENA_DATA[2].name
};

// Portal Definitions
export interface PortalDef {
    from: number;
    to: number;
    wall: number; // Index into wall definitions
    color: string;
}

// Wall Indices based on getHexDistToWall normals
// 0: Right (0, R)
// 1: Left (180, -R)
// 2: Bottom Right (60)
// 3: Top Right (300/-60)
// 4: Bottom Left (120)
// 5: Top Left (240/-120)

export const PORTALS: PortalDef[] = [
    // From Economic (0)
    { from: 0, to: 1, wall: 5, color: '#FF3333' }, // To Combat (Red)
    { from: 0, to: 2, wall: 0, color: '#3388FF' }, // To Defence (Blue)

    // From Combat (1) - To Economic
    { from: 1, to: 0, wall: 2, color: '#FFD700' }, // To Economic (Yellow)
    { from: 1, to: 2, wall: 1, color: '#3388FF' }, // To Defence (Blue)

    // From Defence (2) - To Economic
    { from: 2, to: 0, wall: 3, color: '#FFD700' }, // To Economic (Yellow)
    { from: 2, to: 1, wall: 4, color: '#FF3333' }, // To Combat (Red)
];

// Helper to get Wall Line Segment (Visual Match)
// Vertices are at i * 60 degrees (0, 60, 120...)
// Wall i connects Vertex i and Vertex (i+1)%6
export function getHexWallLine(cx: number, cy: number, r: number, wallIndex: number): { x1: number, y1: number, x2: number, y2: number, nx: number, ny: number } {
    // 1. Calculate Start Vertex and End Vertex angles
    const ang1 = (Math.PI / 3) * wallIndex;
    const ang2 = (Math.PI / 3) * ((wallIndex + 1) % 6);

    // 2. Vertex Coordinates
    const vx1 = cx + r * Math.cos(ang1);
    const vy1 = cy + r * Math.sin(ang1);
    const vx2 = cx + r * Math.cos(ang2);
    const vy2 = cy + r * Math.sin(ang2);

    // 3. Shorten for Portal (Center 30% of wall)
    // Lerp function
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    // Start at 35%, End at 65% (30% length)
    const px1 = lerp(vx1, vx2, 0.35);
    const py1 = lerp(vy1, vy2, 0.35);
    const px2 = lerp(vx1, vx2, 0.65);
    const py2 = lerp(vy1, vy2, 0.65);

    // 4. Calculate Normal (Outward)
    // Midpoint Angle is (ang1 + ang2) / 2? Need to handle wrap around roughly?
    // Actually just perpendicular to vector (vx2-vx1)
    // Vector V = (dx, dy). Normal = (dy, -dx) or (-dy, dx).
    // Vector 0->60: dx>0, dy>0. Normal should point +/+ (30 deg).
    // Let's use Midpoint Angle Logic: ang = wallIndex * 60 + 30.
    const midAng = (Math.PI / 3) * wallIndex + (Math.PI / 6);
    const nx = Math.cos(midAng);
    const ny = Math.sin(midAng);

    return {
        x1: px1, y1: py1,
        x2: px2, y2: py2,
        nx, ny
    };
}


// Flat-Topped Hexagon Math Helper
function textHex(x: number, y: number, r: number): boolean {
    const px = Math.abs(x);
    const py = Math.abs(y);

    if (px > r) return false;
    if (py > r * SQRT3 / 2) return false;

    return (py + px * SQRT3) <= (r * SQRT3);
}

// Check if point is inside any arena
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

        // Plane equations for flat-topped hex (horizontal top/bottom):
        // 1. py = H (top)
        // 2. py = -H (bottom)
        // 3. x*sqrt3 + y = r*sqrt3 (top-right)
        // 4. x*sqrt3 - y = r*sqrt3 (bottom-right)
        // 5. -x*sqrt3 + y = r*sqrt3 (top-left)
        // 6. -x*sqrt3 - y = r*sqrt3 (bottom-left)

        const normals = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, // Top, Bottom
            { x: -SQRT3 / 2, y: -0.5 }, { x: -SQRT3 / 2, y: 0.5 }, // TR, BR
            { x: SQRT3 / 2, y: -0.5 }, { x: SQRT3 / 2, y: 0.5 }   // TL, BL
        ];

        const dists = [
            H - dy, H + dy, // Top, Bottom
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

// Get the index of the arena closest to the point (or containing it)
export function getArenaIndex(x: number, y: number): number {
    for (const c of ARENA_CENTERS) {
        if (textHex(x - c.x, y - c.y, ARENA_RADIUS)) return c.id;
    }
    // Fallback: Closest center
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
    // Randomly pick an arena
    const arenaId = Math.floor(Math.random() * ARENA_CENTERS.length);
    return getRandomPositionInArena(arenaId);
}

export function generateMapPOIs(): MapPOI[] {
    const pois: MapPOI[] = [];
    let idCounter = 1;

    ARENA_CENTERS.forEach(arena => {
        // 1. One Overclock Transmitter per arena (User Request: > 400px from walls)
        const ocPos = getRandomPositionInArena(arena.id, 400);
        // Ensure it's not too close to the center (spawn) if it's arena 0
        pois.push({
            id: idCounter++,
            type: 'overclock',
            x: ocPos.x,
            y: ocPos.y,
            radius: 400, // Large zone for doubling XP/Spawn
            arenaId: arena.id,
            active: false, // Starts inactive
            progress: 0,
            activationProgress: 0,
            activeDuration: 0,
            cooldown: 0,
            respawnTimer: 30, // 30s initial delay
            lastUsed: 0
        });

        // 2. One Anomaly Beacon per arena
        let abPos;
        let attempts = 0;
        while (attempts < 10) {
            abPos = getRandomPositionInArena(arena.id, 400); // User Request: > 400px from walls
            const distToOC = Math.hypot(abPos.x - ocPos.x, abPos.y - ocPos.y);
            if (distToOC > 1000) break; // Ensure they are spread out
            attempts++;
        }

        pois.push({
            id: idCounter++,
            type: 'anomaly',
            x: abPos!.x,
            y: abPos!.y,
            radius: 300, // Range for summoning
            arenaId: arena.id,
            active: true,
            progress: 0,
            activationProgress: 0,
            activeDuration: 0,
            cooldown: 0,
            respawnTimer: 30, // 30s initial delay
            lastUsed: 0
        });


        // 3. Three Turret Nodes per arena (Repairable Fire Support)
        for (let i = 0; i < 3; i++) {
            let tPos: { x: number, y: number } = { x: 0, y: 0 };
            let tries = 0;
            // Ensure spread and distance from walls
            while (tries < 20) {
                tPos = getRandomPositionInArena(arena.id);

                // 1. Distance from other POIs
                const tooCloseToPoi = pois.some(p => Math.hypot(p.x - tPos.x, p.y - tPos.y) < 600);

                // 2. Distance from Walls (User Request: Now 400px for consistency)
                const { dist: wallDist } = getHexDistToWall(tPos.x, tPos.y);
                const tooCloseToWall = wallDist < 400;

                if (!tooCloseToPoi && !tooCloseToWall) break;
                tries++;
            }

            pois.push({
                id: idCounter++,
                type: 'turret',
                x: tPos!.x,
                y: tPos!.y,
                radius: 170, // Activation zone (Increased by ~40% from 120)
                arenaId: arena.id,
                active: false,
                progress: 0,
                activationProgress: 0, // Repair progress
                activeDuration: 0, // 30s when active
                cooldown: 0, // 60s overheat
                respawnTimer: 0, // Permanent position? Or respawn if destroyed? "Overheat recharge" suggests permanent.
                lastUsed: 0,
                turretUses: 0,
                turretCost: 5, // Initial cost (User Request)
                lastShot: 0,
                turretVariant: ['fire', 'ice', 'heal'][i] as any // Guaranteed: 0=Fire, 1=Ice, 2=Heal
            });
        }
    });

    return pois;
}

export function relocatePOI(poi: MapPOI) {
    const minWall = (poi.type === 'anomaly' || poi.type === 'overclock') ? 400 : 200;
    const newPos = getRandomPositionInArena(poi.arenaId, minWall);
    poi.x = newPos.x;
    poi.y = newPos.y;
    poi.progress = 0;
    poi.activationProgress = 0;
    poi.activeDuration = 0;
    poi.cooldown = 0;
    poi.respawnTimer = 30; // 30s before it reappears
    poi.active = (poi.type === 'anomaly');
}


// --- CORRUPTION LOGIC ---

export const CORRUPTION_START_TIME = 0; // Immediate start for testing

// Revert to 60 * 60 for production after testing, or keep low for testing as requested.
// User initially said "60-70 mins", then "every 5 seconds... for now".
// Let's use a scale: 0 -> full in X seconds.
export const CORRUPTION_MAX_TIME = 60; // 60s as requested for testing

export const SAFE_ZONE_PORTAL_RADIUS = 700;
export const SAFE_ZONE_POI_RADIUS = 600;
export const SAFE_ZONE_BOSS_RADIUS = 900;
export const SAFE_ZONE_SHIP_RADIUS = 900;

export const HEX_GRID_SIZE = 120; // Must match renderer

// Corruption Stages
export enum CorruptionStage {
    HEALTHY = 0,
    WARNING = 1, // Obsidian/Dark
    ACTIVE = 2   // Red/Damage
}

export function getCorruptionProgress(gameTime: number): number {
    if (gameTime < CORRUPTION_START_TIME) return 0;
    const progress = (gameTime - CORRUPTION_START_TIME) / CORRUPTION_MAX_TIME;
    return Math.min(Math.max(progress, 0), 1.0);
}

export function getSafeZones(state: GameState): { x: number, y: number, r: number }[] {
    const zones: { x: number, y: number, r: number }[] = [];
    const currentArenaId = state.currentArena;
    if (currentArenaId === undefined) return zones; // Safety check

    const currentArenaCenter = ARENA_CENTERS.find(c => c.id === currentArenaId) || ARENA_CENTERS[0];

    // 1. Portals
    const activePortals = PORTALS.filter(p => p.from === currentArenaId);
    activePortals.forEach(p => {
        const wall = getHexWallLine(currentArenaCenter.x, currentArenaCenter.y, ARENA_RADIUS, p.wall);
        const cx = (wall.x1 + wall.x2) / 2;
        const cy = (wall.y1 + wall.y2) / 2;
        zones.push({ x: cx, y: cy, r: SAFE_ZONE_PORTAL_RADIUS });
    });

    // Also Incoming Portals (Important for returning player safety)
    const incomingPortals = PORTALS.filter(p => p.to === currentArenaId);
    incomingPortals.forEach(p => {
        // Find the wall where I arrive from. 
        // If I arrive from X to Y, I arrive at the wall that connects Y to X.
        // That is the "reverse portal".
        const rev = PORTALS.find(rp => rp.from === currentArenaId && rp.to === p.from);
        if (rev) {
            const wall = getHexWallLine(currentArenaCenter.x, currentArenaCenter.y, ARENA_RADIUS, rev.wall);
            const cx = (wall.x1 + wall.x2) / 2;
            const cy = (wall.y1 + wall.y2) / 2;
            // Check duplicates just in case?
            if (!zones.some(z => Math.hypot(z.x - cx, z.y - cy) < 100)) {
                zones.push({ x: cx, y: cy, r: SAFE_ZONE_PORTAL_RADIUS });
            }
        }
    });


    // 2. Active POIs
    if (state.pois) {
        state.pois.forEach(poi => {
            if (poi.arenaId !== currentArenaId) return;
            zones.push({ x: poi.x, y: poi.y, r: SAFE_ZONE_POI_RADIUS });
        });
    }

    // 3. Bosses
    if (state.enemies) {
        state.enemies.forEach(e => {
            if (e.boss && !e.dead) {
                zones.push({ x: e.x, y: e.y, r: SAFE_ZONE_BOSS_RADIUS });
            }
        });
    }

    // 4. Extraction Ship
    if (state.extractionStatus && ['arriving', 'arrived', 'departing'].includes(state.extractionStatus)) {
        if (state.extractionShipPos && state.extractionTargetArena === currentArenaId) {
            zones.push({ x: state.extractionShipPos.x, y: state.extractionShipPos.y, r: SAFE_ZONE_SHIP_RADIUS });
        }
    }

    return zones;
}

// Get stage for a specific hex coordinate (pixel center)
export function getHexPointStage(hx: number, hy: number, state: GameState): CorruptionStage {
    // 1. Is it safe?
    // Optimization: Check only if "progress > 0" first?
    // Safe zones override everything.
    const safeZones = getSafeZones(state);
    for (const zone of safeZones) {
        if (Math.hypot(hx - zone.x, hy - zone.y) < zone.r) {
            return CorruptionStage.HEALTHY;
        }
    }

    // 2. Check Depth
    const { dist } = getHexDistToWall(hx, hy);
    const progress = getCorruptionProgress(state.gameTime);

    // Inward Erosion
    // Max Distance (Center) is H = R * sqrt(3) / 2.
    // If progress is 0, corruption starts at H relative to center? No, start at wall.
    // Distance from wall: 0 (Wall) -> H (Center).
    // Corruption Depth: 0 -> H+buffer.

    const H = ARENA_RADIUS * Math.sqrt(3) / 2;
    // We want stages. 
    // Stage 2 (Red): The core corruption wave.
    // Stage 1 (Obsidian): A warning buffer AHEAD of the red wave.

    const waveDepth = H * progress * 1.5; // Main wave position

    // If dist to wall < waveDepth -> Stage 2 (Unless Safe)
    if (dist < waveDepth) {
        return CorruptionStage.ACTIVE;
    }

    // If dist to wall < waveDepth + WarningBuffer -> Stage 1
    const warningBuffer = 600; // 5 hexes or so
    if (dist < waveDepth + warningBuffer) {
        return CorruptionStage.WARNING;
    }

    return CorruptionStage.HEALTHY;
}

export function isPointInCorruption(x: number, y: number, state: GameState): boolean {
    // Round position to nearest hex center for consistency? 
    // Or just check exact point?
    // For grid effect, we should probably check the exact point against the thresholds.
    // But since the renderer draws HEXES, the logic should ideally match the hex grid.
    // However, figuring out "which hex does (x,y) belong to" in axial coords is standard.
    // Let's just use the point logic directly. The visual grid is just a sampling.

    return getHexPointStage(x, y, state) === CorruptionStage.ACTIVE;
}
