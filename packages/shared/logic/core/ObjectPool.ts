export class ObjectPool<T> {
    private pool: T[] = []
    constructor(private factory: () => T, private reset: (obj: T) => void) {}

    acquire(): T {
        return this.pool.length > 0 ? this.pool.pop()! : this.factory()
    }

    release(obj: T): void {
        this.reset(obj)
        this.pool.push(obj)
    }

    get size(): number {
        return this.pool.length
    }
}

export function removeDeadInPlace<T>(arr: T[], isDead: (obj: T) => boolean, pool?: ObjectPool<T>): void {
    let write = 0
    for (let read = 0; read < arr.length; read++) {
        const item = arr[read]
        if (isDead(item)) {
            if (pool) pool.release(item)
        } else {
            arr[write++] = item
        }
    }
    arr.length = write
}

export function removeAtSwapPop<T>(arr: T[], index: number, pool?: ObjectPool<T>): T | undefined {
    if (index < 0 || index >= arr.length) return undefined

    const removed = arr[index]
    const lastIndex = arr.length - 1
    if (index !== lastIndex) {
        arr[index] = arr[lastIndex]
    }
    arr.pop()

    if (pool) pool.release(removed)
    return removed
}
