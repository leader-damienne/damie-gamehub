export function paintBoard(ctx: CanvasRenderingContext2D, w: number, h: number, accent = "#d4af37") {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#221a0c");
  g.addColorStop(0.45, "#120e08");
  g.addColorStop(1, "#070705");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = `${accent}66`;
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.strokeStyle = `${accent}22`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 16, w - 32, h - 32);
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 1, 0, 0, r);
  g.addColorStop(0, "#fff6c8");
  g.addColorStop(0.4, "#e8c547");
  g.addColorStop(1, "#7a5c12");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#f5e6a3";
  ctx.lineWidth = Math.max(1.2, r * 0.12);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#6b5210";
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.38);
  ctx.lineTo(r * 0.12, -r * 0.08);
  ctx.lineTo(r * 0.38, -r * 0.08);
  ctx.lineTo(r * 0.16, r * 0.1);
  ctx.lineTo(r * 0.24, r * 0.38);
  ctx.lineTo(0, r * 0.2);
  ctx.lineTo(-r * 0.24, r * 0.38);
  ctx.lineTo(-r * 0.16, r * 0.1);
  ctx.lineTo(-r * 0.38, -r * 0.08);
  ctx.lineTo(-r * 0.12, -r * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawBomb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.arc(0, 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = "#d4af37";
  ctx.beginPath();
  ctx.moveTo(r * 0.35, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.7, -r * 0.95, r * 0.2, -r * 1.15);
  ctx.stroke();
  ctx.fillStyle = "#f0d56a";
  ctx.beginPath();
  ctx.arc(r * 0.2, -r * 1.15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#d4af37";
  ctx.beginPath();
  ctx.moveTo(-s, s * 0.45);
  ctx.lineTo(-s, -s * 0.15);
  ctx.lineTo(-s * 0.5, s * 0.12);
  ctx.lineTo(0, -s * 0.55);
  ctx.lineTo(s * 0.5, s * 0.12);
  ctx.lineTo(s, -s * 0.15);
  ctx.lineTo(s, s * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f5e6a3";
  ctx.fillRect(-s * 0.85, s * 0.45, s * 1.7, s * 0.18);
  ctx.beginPath();
  ctx.arc(0, -s * 0.55, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBasket(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#8a6a1a";
  ctx.fillRect(-40, 4, 80, 10);
  ctx.fillStyle = "#d4af37";
  ctx.beginPath();
  ctx.moveTo(-38, 4);
  ctx.lineTo(-28, -10);
  ctx.lineTo(28, -10);
  ctx.lineTo(38, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#f0d56a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -10);
  ctx.quadraticCurveTo(0, -28, 22, -10);
  ctx.stroke();
  drawCrown(ctx, 0, -18, 8);
  ctx.restore();
}

export function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(-r * 0.4, -r);
  ctx.lineTo(r * 0.2, -r * 0.7);
  ctx.lineTo(r, -r * 0.15);
  ctx.lineTo(r * 0.55, r * 0.85);
  ctx.lineTo(-r * 0.5, r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#222";
  ctx.stroke();
  ctx.restore();
}

export function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, a: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a + Math.PI / 2);
  ctx.fillStyle = "#d4af37";
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(10, 12);
  ctx.lineTo(0, 6);
  ctx.lineTo(-10, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f5e6a3";
  ctx.fillRect(-3, -4, 6, 8);
  ctx.restore();
}
