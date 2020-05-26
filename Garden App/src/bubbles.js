const scale = 512;

function roundedRect(ctx, x, y, width, height, radius, lineWidth) {
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";

    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);

    let arrowX1 = x + (width - radius) * .2,
        arrowY1 = y + height,
        arrowX2 = x + lineWidth + radius / 2,
        arrowY2 = arrowY1 + 45;

    ctx.lineTo(arrowX1, arrowY1);
    ctx.lineTo(arrowX2, arrowY2);
    ctx.lineTo(x + (width - radius) * .4, arrowY1);
    ctx.lineTo(x + width - radius, arrowY1);

    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
    ctx.stroke();
}

function createBubble() {
    let cvs = document.createElement("canvas");
    cvs.height = cvs.width = scale;
    cvs.style.height = cvs.style.width = scale + "px";
    let ctx = cvs.getContext("2d");

    ctx.font = "bold 48px Comic Neue";

    let textHeight = arguments.length * 50;
    let top = scale - 120 - textHeight;
    let max = 0;
    Array.from(arguments).forEach((cur) => { 
        max = Math.max(max, ctx.measureText(cur).width); 
    });

    ctx.clearRect(0, 0, scale, scale);
    roundedRect(ctx, 50, top, 100 + max, 50 + textHeight, 20, 10);

    ctx.fillStyle = "#000000";
    ctx.textBaseline = 'top';

    for(let i = 0; i<arguments.length; i++) {
        ctx.fillText(arguments[i], 80, top + 25 + i * 50);
    }
    return cvs;
}

export { createBubble };