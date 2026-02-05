import type { Enemy } from './types';

export class SpatialGrid {
    private cellSize: number;
    private grid: Map<string, Enemy[]>;

    constructor(cellSize: number = 200) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    private getKey(col: number, row: number): string {
        return `${col},${row}`;
    }

    add(enemy: Enemy) {
        const col = Math.floor(enemy.x / this.cellSize);
        const row = Math.floor(enemy.y / this.cellSize);

        // Add to main cell
        this.addToCell(col, row, enemy);

        // Handle edge cases: If enemy overlaps cell boundaries, add to neighbors?
        // Simpler approach for "Point" insertion:
        // Just insert into the cell containing the center.
        // Query will check neighbor cells.
    }

    private addToCell(col: number, row: number, enemy: Enemy) {
        const key = this.getKey(col, row);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key)!.push(enemy);
    }

    query(x: number, y: number, radius: number): Enemy[] {
        const enemies: Enemy[] = [];
        const seen = new Set<number>(); // Dedupe by ID

        // Calculate range of cells to check
        const startCol = Math.floor((x - radius) / this.cellSize);
        const endCol = Math.floor((x + radius) / this.cellSize);
        const startRow = Math.floor((y - radius) / this.cellSize);
        const endRow = Math.floor((y + radius) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                const cell = this.grid.get(this.getKey(c, r));
                if (cell) {
                    for (const enemy of cell) {
                        if (!seen.has(enemy.id)) {
                            enemies.push(enemy);
                            seen.add(enemy.id);
                        }
                    }
                }
            }
        }
        return enemies;
    }
}
