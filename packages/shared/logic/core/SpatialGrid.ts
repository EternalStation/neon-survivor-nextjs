import type { Enemy } from './Types';

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

        
        this.addToCell(col, row, enemy);

        
        
        
        
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
        const seen = new Set<number>(); 

        
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
