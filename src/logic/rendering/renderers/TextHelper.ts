
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
    // If Defense, we might need specific rotation handling
    // "bottom of letters facing center" -> Standard tangent text at top of circle.

    ctx.font = '900 24px Orbitron';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Simplified Sector Label Placement
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    // Default Font Settings
    ctx.font = '900 36px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isDefense) {
        // DEFENSE: Top Center
        // "bottom of letters will be facing center" -> Upright text at Top of screen faces center.
        // "parallel to longest line of 4 corner sector" -> Horizontal.
        ctx.translate(0, -radius);
        ctx.rotate(0);
    } else if (startAngle === Math.PI) {
        // ECONOMIC: Center Left
        // "bottom of letters facing center" -> Text base is on the right side.
        // Rotated -90 degrees? 
        ctx.translate(-radius, 0);
        ctx.rotate(-Math.PI / 2);
    } else if (startAngle === 0) {
        // COMBAT: Center Right
        // "bottom of letters facing center" -> Text base is on left side.
        // Rotated 90 degrees?
        ctx.translate(radius, 0);
        ctx.rotate(Math.PI / 2);
    }

    ctx.fillText(text, 0, 0);

    ctx.restore();
}
