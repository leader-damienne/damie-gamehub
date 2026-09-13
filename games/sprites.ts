import { rgba, type GameTheme, themeFor } from "@/lib/game-theme";

function shade(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + amt);
  const g = clamp(((n >> 8) & 255) + amt);
  const b = clamp((n & 255) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function paintBoard(ctx: CanvasRenderingContext2D, w: number, h: number, theme: GameTheme | string = themeFor("")) {
  const t = typeof theme === "string" ? { ...themeFor(""), accent: theme, bg0: themeFor("").bg0, bg1: themeFor("").bg1 } : theme;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, t.bg0);
  g.addColorStop(1, t.bg1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = rgba(t.accent, 0.4);
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.strokeStyle = rgba(t.accent, 0.18);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 16, w - 32, h - 32);
}

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = "#ed8936") {
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 1, 0, 0, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.35, color);
  g.addColorStop(1, shade(color, -70));
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "#ffffffcc";
  ctx.lineWidth = Math.max(1.2, r * 0.12);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawBomb(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fuse = "#e67e22") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.arc(0, 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = fuse;
  ctx.beginPath();
  ctx.moveTo(r * 0.35, -r * 0.55);
  ctx.quadraticCurveTo(r * 0.7, -r * 0.95, r * 0.2, -r * 1.15);
  ctx.stroke();
  ctx.fillStyle = fuse;
  ctx.beginPath();
  ctx.arc(r * 0.2, -r * 1.15, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color = "#ed8936") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
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
  ctx.fillStyle = "#ffffffcc";
  ctx.fillRect(-s * 0.85, s * 0.45, s * 1.7, s * 0.18);
  ctx.beginPath();
  ctx.arc(0, -s * 0.55, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBasket(ctx: CanvasRenderingContext2D, x: number, y: number, color = "#c4782a") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = shade(color, -40);
  ctx.fillRect(-40, 4, 80, 10);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-38, 4);
  ctx.lineTo(-28, -10);
  ctx.lineTo(28, -10);
  ctx.lineTo(38, 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shade(color, 40);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -10);
  ctx.quadraticCurveTo(0, -28, 22, -10);
  ctx.stroke();
  ctx.restore();
}

export function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = "#7f8c8d") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(-r * 0.4, -r);
  ctx.lineTo(r * 0.2, -r * 0.7);
  ctx.lineTo(r, -r * 0.15);
  ctx.lineTo(r * 0.55, r * 0.85);
  ctx.lineTo(-r * 0.5, r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shade(color, -40);
  ctx.stroke();
  ctx.restore();
}

export function paintRoad(ctx: CanvasRenderingContext2D, w: number, h: number, offset: number, lanes = 3, theme: GameTheme = themeFor("moto-rush")) {
  paintBoard(ctx, w, h, theme);
  const top = h * 0.12;
  const roadH = h - top - 20;
  ctx.fillStyle = theme.lane;
  ctx.fillRect(18, top, w - 36, roadH);
  ctx.strokeStyle = rgba(theme.accent2, 0.55);
  ctx.strokeRect(18, top, w - 36, roadH);
  const inner = w - 48;
  for (let i = 1; i < lanes; i += 1) {
    const x = 24 + (inner * i) / lanes;
    ctx.strokeStyle = "#ffffffaa";
    ctx.setLineDash([16, 18]);
    ctx.lineDashOffset = -((offset * 180) % 34);
    ctx.beginPath();
    ctx.moveTo(x, top + 8);
    ctx.lineTo(x, top + roadH - 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawMoto(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = "#e74c3c") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(-16, 10, 9, 0, Math.PI * 2);
  ctx.arc(16, 10, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(color, -30);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-18, 4);
  ctx.lineTo(20, 2);
  ctx.lineTo(14, -8);
  ctx.lineTo(-8, -6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#5dade2";
  ctx.fillRect(-4, -18, 10, 12);
  ctx.restore();
}

export function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = "#e74c3c") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(-16, 8, 10, 8);
  ctx.fillRect(6, 8, 10, 8);
  ctx.fillStyle = color;
  ctx.fillRect(-20, -8, 40, 20);
  ctx.fillStyle = "#1c2833";
  ctx.fillRect(-12, -4, 24, 10);
  ctx.fillStyle = "#ecf0f1";
  ctx.fillRect(-6, -12, 12, 5);
  ctx.restore();
}

export function drawPlane(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = "#ecf0f1") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-16, 8);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-16, -8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-14, 18);
  ctx.lineTo(6, 0);
  ctx.lineTo(-14, -18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(color, -50);
  ctx.fillRect(-6, -3, 10, 6);
  ctx.restore();
}

export function drawTank(ctx: CanvasRenderingContext2D, x: number, y: number, aim = -Math.PI / 2, color = "#1e8449") {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(-22, 6, 44, 10);
  ctx.fillStyle = color;
  ctx.fillRect(-18, -6, 36, 16);
  ctx.save();
  ctx.rotate(aim);
  ctx.fillStyle = shade(color, 40);
  ctx.fillRect(0, -3, 28, 6);
  ctx.restore();
  ctx.fillStyle = shade(color, -30);
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBike(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = "#f1c40f") {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(-16, 12, 10, 0, Math.PI * 2);
  ctx.arc(16, 12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ecf0f1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-16, 12, 6, 0, Math.PI * 2);
  ctx.arc(16, 12, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, 12);
  ctx.lineTo(0, 0);
  ctx.lineTo(16, 12);
  ctx.moveTo(0, 0);
  ctx.lineTo(4, -14);
  ctx.moveTo(-6, -2);
  ctx.lineTo(10, -6);
  ctx.stroke();
  ctx.fillStyle = "#e74c3c";
  ctx.fillRect(-4, -22, 10, 10);
  ctx.fillStyle = "#f5cba7";
  ctx.beginPath();
  ctx.arc(2, -26, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = "#e74c3c") {
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.4, color);
  g.addColorStop(1, shade(color, -80));
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, 0.2, 2.2);
  ctx.stroke();
  ctx.restore();
}

export function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, color = "#2980b9", scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f5cba7";
  ctx.beginPath();
  ctx.arc(0, -18, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-8, -10, 16, 18);
  ctx.fillRect(-11, 8, 8, 12);
  ctx.fillRect(3, 8, 8, 12);
  ctx.restore();
}

export function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, color = "#ff6b35") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a + Math.PI / 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(10, 12);
  ctx.lineTo(0, 6);
  ctx.lineTo(-10, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffffcc";
  ctx.fillRect(-3, -4, 6, 8);
  ctx.restore();
}
