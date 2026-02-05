export function getPulseInterval(gameTime: number): number {
    if (gameTime < 300) return 5000;      // 0-5 min: 5s
    if (gameTime < 600) return 4000;      // 5-10 min: 4s
    if (gameTime < 900) return 3000;      // 10-15 min: 3s
    if (gameTime < 1800) return 2000;     // 15-30 min: 2s
    if (gameTime < 2700) return 1000;     // 30-45 min: 1s
    return 500;                           // 45+ min: 0.5s
}

export function getPulseIntensity(gameTime: number): number {
    const interval = getPulseInterval(gameTime);
    const phase = (Date.now() % interval) / interval;
    // Pulse between 0.8 and 1.2 scale/alpha
    return 0.8 + 0.4 * Math.sin(phase * Math.PI * 2);
}
