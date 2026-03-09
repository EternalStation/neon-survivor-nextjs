export const normalizeDeathCause = (cause: string) => {
    if (!cause) return cause;
    let c = cause;

    // Clean up common "Died from" prefixes (case insensitive)
    if (c.toLowerCase().startsWith('died from ')) {
        c = c.slice(10);
    }

    // Specific legacy and variety mappings
    const low = c.toLowerCase().trim();
    if (low === 'enemy projectile') return 'Enemy Projectile';
    if (low === 'wall' || low === 'wall impact') return 'Wall Impact';
    if (low === 'anomaly of animation, someone from hell' || low.includes('someone from hell') || low.includes('anomaly')) return 'Overlord';
    if (low.includes('infernal combustion') || low.includes('overlord boss')) return 'Overlord Burn';
    if (low.includes('legion swarm')) return 'Hive Swarm';
    if (low.includes('abomination burn')) return 'Overlord Burn';
    if (low.includes('overlord') || low.includes('abomination')) return 'Overlord';

    return c;
};
