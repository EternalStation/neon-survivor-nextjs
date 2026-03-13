export function getPulseInterval(gameTime: number): number {
    if (gameTime < 300) return 5000;      
    if (gameTime < 600) return 4000;      
    if (gameTime < 900) return 3000;      
    if (gameTime < 1800) return 2000;     
    if (gameTime < 2700) return 1000;     
    return 500;                           
}

export function getPulseIntensity(gameTime: number): number {
    const interval = getPulseInterval(gameTime);
    const phase = (Date.now() % interval) / interval;
    
    return 0.8 + 0.4 * Math.sin(phase * Math.PI * 2);
}
