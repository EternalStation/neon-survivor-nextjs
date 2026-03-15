import type { Enemy } from './Types';

export class SpatialGrid {
    private static readonly KEY_OFFSET = 32768;
    private static readonly KEY_MASK = 0xffff;

    private cellSize: number;
    private grid: Map<number, Enemy[]>;
    private activeKeys: number[];

    constructor(cellSize: number = 200) {
        this.cellSize = cellSize;
        this.grid = new Map();
        this.activeKeys = [];
    }

    clear() {
        for (const key of this.activeKeys) {
            this.grid.get(key)!.length = 0;
        }
        this.activeKeys.length = 0;
    }

    private getKey(col: number, row: number): number {
        return (
            ((((col + SpatialGrid.KEY_OFFSET) & SpatialGrid.KEY_MASK) << 16) |
                ((row + SpatialGrid.KEY_OFFSET) & SpatialGrid.KEY_MASK)) >>>
            0
        );
    }

    add(enemy: Enemy) {
        const col = Math.floor(enemy.x / this.cellSize);
        const row = Math.floor(enemy.y / this.cellSize);

        this.addToCell(col, row, enemy);
    }

    private addToCell(col: number, row: number, enemy: Enemy) {
        const key = this.getKey(col, row);
        let cell = this.grid.get(key);
        if (!cell) {
            cell = [];
            this.grid.set(key, cell);
        }
        if (cell.length === 0) {
            this.activeKeys.push(key);
        }
        cell.push(enemy);
    }

    query(x: number, y: number, radius: number, result: Enemy[] = []): Enemy[] {
        result.length = 0;

        const startCol = Math.floor((x - radius) / this.cellSize);
        const endCol = Math.floor((x + radius) / this.cellSize);
        const startRow = Math.floor((y - radius) / this.cellSize);
        const endRow = Math.floor((y + radius) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                const cell = this.grid.get(this.getKey(c, r));
                if (cell) {
                    for (const enemy of cell) {
                        result.push(enemy);
                    }
                }
            }
        }

        return result;
    }
}
