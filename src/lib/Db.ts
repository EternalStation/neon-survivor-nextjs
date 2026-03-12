import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getInstance(): NeonQueryFunction<false, false> {
    if (!_sql) {
        _sql = neon(process.env.DATABASE_URL!);
    }
    return _sql;
}

export const sql = new Proxy(
    (() => {}) as unknown as NeonQueryFunction<false, false>,
    {
        apply(_t, thisArg, args) {
            return Reflect.apply(getInstance(), thisArg, args as Parameters<NeonQueryFunction<false, false>>);
        },
        get(_t, prop) {
            return Reflect.get(getInstance(), prop);
        },
    }
);
