
export function drawCurvedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    color: string,
    isDefense: boolean = false
) {
    ctx.save();
    ctx.translate(x, y);
    
    

    ctx.font = '900 24px Orbitron';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    
    ctx.font = '900 36px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isDefense) {
        
        
        
        ctx.translate(0, -radius);
        ctx.rotate(0);
    } else if (startAngle === Math.PI) {
        
        
        
        ctx.translate(-radius, 0);
        ctx.rotate(-Math.PI / 2);
    } else if (startAngle === 0) {
        
        
        
        ctx.translate(radius, 0);
        ctx.rotate(Math.PI / 2);
    }

    ctx.fillText(text, 0, 0);

    ctx.restore();
}
