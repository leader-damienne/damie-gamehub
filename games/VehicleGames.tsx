"use client";

import { useRef } from "react";
import GameCanvas from "./GameCanvas";
import {
  drawBomb,
  drawCar,
  drawCoin,
  drawMoto,
  drawPlane,
  drawTank,
  paintBoard,
  paintRoad,
} from "./sprites";

type RunProps = {
  onScore: (score: number) => void;
  onOver: (score: number) => void;
};

export function MotoRush({ onScore, onOver }: RunProps) {
  const state = useRef({
    lane: 1,
    items: [] as { lane: number; y: number; gold: boolean }[],
    score: 0,
    spawn: 0,
    scroll: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type, w) => {
        if (type !== "down") return;
        state.current.lane = x < w / 3 ? 0 : x > (w * 2) / 3 ? 2 : 1;
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.scroll += dt;
        s.spawn += dt;
        if (s.spawn > Math.max(0.34, 0.72 - s.score / 3500)) {
          s.spawn = 0;
          s.items.push({ lane: Math.floor(Math.random() * 3), y: -0.08, gold: Math.random() > 0.4 });
        }
        const speed = 0.42 + Math.min(0.5, s.score / 2200);
        s.items.forEach((it) => (it.y += speed * dt));
        s.items = s.items.filter((it) => {
          if (it.y > 0.76 && it.y < 0.9 && it.lane === s.lane) {
            if (it.gold) {
              s.score += 18;
              onScore(s.score);
            } else if (!s.dead) {
              s.dead = true;
              onOver(s.score);
            }
            return false;
          }
          return it.y < 1.08;
        });
        paintRoad(ctx, w, h, s.scroll);
        for (const it of s.items) {
          const x = 24 + ((it.lane + 0.5) * (w - 48)) / 3;
          if (it.gold) drawCoin(ctx, x, it.y * h, 12);
          else drawCar(ctx, x, it.y * h, 0.85, "#3a3a3a");
        }
        drawMoto(ctx, 24 + ((s.lane + 0.5) * (w - 48)) / 3, h * 0.84, 1.05);
      }}
    />
  );
}

export function WheelieGold({ onScore, onOver }: RunProps) {
  const state = useRef({
    hold: false,
    angle: 0,
    holes: [{ x: 1.2, w: 0.18 }],
    coins: [{ x: 1.45, y: 0.62 }],
    score: 0,
    scroll: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, _y, type) => {
        state.current.hold = type === "down" || type === "move";
        if (type === "up") state.current.hold = false;
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.angle += (s.hold ? 1.8 : -2.2) * dt;
        s.angle = Math.max(0, Math.min(1.35, s.angle));
        const speed = 0.32 + Math.min(0.22, s.score / 4000);
        s.scroll += speed * dt;
        if (s.holes[s.holes.length - 1].x < 0.7) {
          s.holes.push({ x: 1.15 + Math.random() * 0.25, w: 0.14 + Math.random() * 0.1 });
          s.coins.push({ x: 1.2 + Math.random() * 0.2, y: 0.5 + Math.random() * 0.12 });
        }
        s.holes.forEach((p) => (p.x -= speed * dt));
        s.coins.forEach((c) => (c.x -= speed * dt));
        s.holes = s.holes.filter((p) => p.x + p.w > -0.05);
        const grounded = s.angle < 0.28;
        const px = 0.28;
        for (const hole of s.holes) {
          if (px > hole.x && px < hole.x + hole.w && grounded && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
        }
        if (s.angle > 1.28 && !s.dead) {
          s.dead = true;
          onOver(s.score);
        }
        s.coins = s.coins.filter((c) => {
          if (Math.abs(c.x - px) < 0.07 && Math.abs(c.y - (0.72 - s.angle * 0.12)) < 0.08) {
            s.score += 22;
            onScore(s.score);
            return false;
          }
          return c.x > -0.1;
        });
        paintBoard(ctx, w, h);
        ctx.fillStyle = "#2a2416";
        ctx.fillRect(0, h * 0.78, w, h * 0.22);
        ctx.fillStyle = "#d4af37";
        ctx.fillRect(0, h * 0.78, w, 6);
        for (const hole of s.holes) {
          ctx.fillStyle = "#070705";
          ctx.fillRect(hole.x * w, h * 0.78, hole.w * w, h * 0.22);
        }
        for (const c of s.coins) drawCoin(ctx, c.x * w, c.y * h, 11);
        ctx.save();
        ctx.translate(px * w, h * 0.74);
        ctx.rotate(-s.angle * 0.7);
        drawMoto(ctx, 0, 0, 1.1);
        ctx.restore();
      }}
    />
  );
}

export function GoldRally({ onScore, onOver }: RunProps) {
  const state = useRef({
    x: 0.5,
    cars: [] as { x: number; y: number; gold: boolean }[],
    score: 0,
    spawn: 0,
    scroll: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type, w) => {
        if (type === "up") return;
        state.current.x = Math.min(0.86, Math.max(0.14, x / Math.max(1, w)));
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.scroll += dt;
        s.spawn += dt;
        if (s.spawn > Math.max(0.38, 0.8 - s.score / 3200)) {
          s.spawn = 0;
          s.cars.push({ x: 0.18 + Math.random() * 0.64, y: -0.1, gold: Math.random() > 0.55 });
        }
        const speed = 0.4 + Math.min(0.48, s.score / 2400);
        s.cars.forEach((c) => (c.y += speed * dt));
        s.cars = s.cars.filter((c) => {
          const hit = Math.abs(c.x - s.x) < 0.1 && c.y > 0.72 && c.y < 0.9;
          if (hit) {
            if (c.gold) {
              s.score += 20;
              onScore(s.score);
            } else if (!s.dead) {
              s.dead = true;
              onOver(s.score);
            }
            return false;
          }
          if (!c.gold && c.y > 1.05) {
            s.score += 6;
            onScore(s.score);
          }
          return c.y < 1.1;
        });
        paintRoad(ctx, w, h, s.scroll);
        for (const c of s.cars) {
          if (c.gold) drawCoin(ctx, c.x * w, c.y * h, 12);
          else drawCar(ctx, c.x * w, c.y * h, 1, "#444");
        }
        drawCar(ctx, s.x * w, h * 0.82, 1.15);
      }}
    />
  );
}

export function NitroCrown({ onScore, onOver }: RunProps) {
  const state = useRef({
    y: 0.72,
    v: 0,
    ramps: [{ x: 1.15, gap: 0.16 }],
    score: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, _y, type) => {
        if (type === "down" && state.current.y > 0.7) state.current.v = -0.95;
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.v += 2.1 * dt;
        s.y += s.v * dt;
        if (s.y > 0.72) {
          s.y = 0.72;
          s.v = 0;
        }
        const speed = 0.3 + Math.min(0.2, s.score / 3500);
        s.ramps.forEach((r) => (r.x -= speed * dt));
        if (s.ramps[s.ramps.length - 1].x < 0.55) {
          s.ramps.push({ x: 1.2, gap: 0.12 + Math.random() * 0.1 });
        }
        s.ramps = s.ramps.filter((r) => r.x > -0.2);
        for (const r of s.ramps) {
          const over = 0.26 > r.x && 0.26 < r.x + r.gap + 0.08;
          if (over && s.y > 0.68 && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
          if (!over && r.x + r.gap < 0.22 && r.x + r.gap > 0.18) {
            s.score += 28;
            onScore(s.score);
            r.x = -1;
          }
        }
        paintBoard(ctx, w, h);
        ctx.fillStyle = "#2a2416";
        ctx.fillRect(0, h * 0.78, w, h * 0.22);
        ctx.fillStyle = "#d4af37";
        ctx.fillRect(0, h * 0.78, w, 5);
        for (const r of s.ramps) {
          ctx.fillStyle = "#070705";
          ctx.fillRect(r.x * w, h * 0.78, r.gap * w, h * 0.22);
        }
        drawCar(ctx, 0.26 * w, s.y * h, 1.2);
      }}
    />
  );
}

export function RingFighter({ onScore, onOver }: RunProps) {
  const state = useRef({
    phase: "idle" as "idle" | "windup" | "strike",
    t: 0.8,
    hp: 3,
    enemy: 3,
    score: 0,
    block: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type, w) => {
        if (type !== "down") return;
        const s = state.current;
        if (x < w / 2) {
          s.block = 0.35;
          return;
        }
        if (s.phase === "strike") {
          s.hp -= 1;
          if (s.hp <= 0 && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
          return;
        }
        s.enemy -= 1;
        s.score += 30;
        onScore(s.score);
        if (s.enemy <= 0) {
          s.enemy = 3;
          s.score += 50;
          onScore(s.score);
        }
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.t -= dt;
        s.block = Math.max(0, s.block - dt);
        if (s.phase === "idle" && s.t <= 0) {
          s.phase = "windup";
          s.t = 0.45;
        } else if (s.phase === "windup" && s.t <= 0) {
          s.phase = "strike";
          s.t = 0.32;
          if (s.block <= 0 && !s.dead) {
            s.hp -= 1;
            if (s.hp <= 0) {
              s.dead = true;
              onOver(s.score);
            }
          }
        } else if (s.phase === "strike" && s.t <= 0) {
          s.phase = "idle";
          s.t = Math.max(0.45, 0.9 - s.score / 4000);
        }
        paintBoard(ctx, w, h);
        ctx.fillStyle =
          s.phase === "windup" ? "rgba(211,106,106,0.25)" : s.phase === "strike" ? "rgba(211,106,106,0.45)" : "transparent";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#d4af37";
        ctx.font = "16px sans-serif";
        ctx.fillText(`Vous ${s.hp}  ·  Adversaire ${s.enemy}`, 24, 48);
        ctx.fillStyle = "#8a6a1a";
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.32, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.7, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f5e6a3";
        ctx.font = "14px sans-serif";
        ctx.fillText("Bloquer", 28, h - 28);
        ctx.fillText("Frapper", w - 90, h - 28);
        ctx.strokeStyle = "rgba(212,175,55,0.4)";
        ctx.beginPath();
        ctx.moveTo(w / 2, h * 0.5);
        ctx.lineTo(w / 2, h - 16);
        ctx.stroke();
      }}
    />
  );
}

export function TurretSiege({ onScore, onOver }: RunProps) {
  const state = useRef({
    shots: [] as { x: number; y: number; vx: number; vy: number }[],
    foes: [] as { x: number; y: number }[],
    score: 0,
    spawn: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, y, type, w, h) => {
        if (type !== "down") return;
        const dx = x - w / 2;
        const dy = y - h * 0.88;
        const len = Math.hypot(dx, dy) || 1;
        state.current.shots.push({ x: 0.5, y: 0.88, vx: dx / len, vy: dy / len });
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.spawn += dt;
        if (s.spawn > Math.max(0.4, 0.9 - s.score / 3000)) {
          s.spawn = 0;
          s.foes.push({ x: 0.12 + Math.random() * 0.76, y: -0.06 });
        }
        s.foes.forEach((f) => (f.y += (0.12 + s.score / 8000) * dt));
        s.shots.forEach((b) => {
          b.x += b.vx * 1.6 * dt;
          b.y += b.vy * 1.6 * dt;
        });
        s.shots = s.shots.filter((b) => {
          const hit = s.foes.findIndex((f) => Math.hypot(f.x - b.x, f.y - b.y) < 0.07);
          if (hit >= 0) {
            s.foes.splice(hit, 1);
            s.score += 24;
            onScore(s.score);
            return false;
          }
          return b.y > -0.05 && b.x > 0 && b.x < 1;
        });
        if (s.foes.some((f) => f.y > 0.86) && !s.dead) {
          s.dead = true;
          onOver(s.score);
        }
        s.foes = s.foes.filter((f) => f.y < 1.05);
        paintBoard(ctx, w, h);
        for (const f of s.foes) drawBomb(ctx, f.x * w, f.y * h, 14);
        for (const b of s.shots) drawCoin(ctx, b.x * w, b.y * h, 5);
        drawTank(ctx, w / 2, h * 0.88, -Math.PI / 2);
      }}
    />
  );
}

export function SkyAce({ onScore, onOver }: RunProps) {
  const state = useRef({
    y: 0.5,
    flak: [] as { x: number; y: number; r: number }[],
    coins: [] as { x: number; y: number }[],
    score: 0,
    spawn: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, y, type, _w, h) => {
        if (type === "up") return;
        state.current.y = Math.min(0.9, Math.max(0.1, y / Math.max(1, h)));
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.spawn += dt;
        if (s.spawn > Math.max(0.36, 0.7 - s.score / 4000)) {
          s.spawn = 0;
          s.flak.push({ x: 1.08, y: 0.12 + Math.random() * 0.76, r: 0.03 });
          if (Math.random() > 0.4) s.coins.push({ x: 1.1, y: 0.15 + Math.random() * 0.7 });
        }
        const speed = 0.34 + Math.min(0.28, s.score / 2800);
        s.flak.forEach((f) => {
          f.x -= speed * dt;
          f.r += dt * 0.05;
        });
        s.coins.forEach((c) => (c.x -= speed * dt));
        s.coins = s.coins.filter((c) => {
          if (Math.hypot(c.x - 0.22, c.y - s.y) < 0.07) {
            s.score += 20;
            onScore(s.score);
            return false;
          }
          return c.x > -0.1;
        });
        if (s.flak.some((f) => Math.hypot(f.x - 0.22, f.y - s.y) < f.r + 0.04) && !s.dead) {
          s.dead = true;
          onOver(s.score);
        }
        s.flak = s.flak.filter((f) => f.x > -0.15);
        paintBoard(ctx, w, h, "#8ab4d4");
        ctx.fillStyle = "rgba(80,120,160,0.18)";
        ctx.fillRect(0, 0, w, h * 0.35);
        for (const f of s.flak) {
          ctx.strokeStyle = "#d36a6a";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(f.x * w, f.y * h, f.r * Math.min(w, h), 0, Math.PI * 2);
          ctx.stroke();
        }
        for (const c of s.coins) drawCoin(ctx, c.x * w, c.y * h, 10);
        drawPlane(ctx, 0.22 * w, s.y * h, 1.15);
      }}
    />
  );
}

export function JetStrike({ onScore, onOver }: RunProps) {
  const state = useRef({
    y: 0.5,
    shots: [] as { x: number; y: number }[],
    foes: [] as { x: number; y: number }[],
    score: 0,
    spawn: 0,
    fire: 0,
    dead: false,
    hold: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, y, type, _w, h) => {
        state.current.hold = type !== "up";
        if (type !== "up") state.current.y = Math.min(0.9, Math.max(0.1, y / Math.max(1, h)));
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.fire += dt;
        if (s.hold && s.fire > 0.16) {
          s.fire = 0;
          s.shots.push({ x: 0.28, y: s.y });
        }
        s.spawn += dt;
        if (s.spawn > Math.max(0.38, 0.85 - s.score / 3500)) {
          s.spawn = 0;
          s.foes.push({ x: 1.08, y: 0.12 + Math.random() * 0.76 });
        }
        s.shots.forEach((b) => (b.x += 1.4 * dt));
        s.foes.forEach((f) => (f.x -= (0.28 + s.score / 5000) * dt));
        s.shots = s.shots.filter((b) => {
          const i = s.foes.findIndex((f) => Math.hypot(f.x - b.x, f.y - b.y) < 0.06);
          if (i >= 0) {
            s.foes.splice(i, 1);
            s.score += 26;
            onScore(s.score);
            return false;
          }
          return b.x < 1.1;
        });
        if (s.foes.some((f) => Math.hypot(f.x - 0.2, f.y - s.y) < 0.07 || f.x < 0.02) && !s.dead) {
          s.dead = true;
          onOver(s.score);
        }
        s.foes = s.foes.filter((f) => f.x > -0.1);
        paintBoard(ctx, w, h, "#6a8aaa");
        for (const b of s.shots) {
          ctx.fillStyle = "#f5e6a3";
          ctx.fillRect(b.x * w, b.y * h - 2, 14, 4);
        }
        for (const f of s.foes) {
          ctx.save();
          ctx.translate(f.x * w, f.y * h);
          ctx.scale(-1, 1);
          drawPlane(ctx, 0, 0, 0.85);
          ctx.restore();
        }
        drawPlane(ctx, 0.2 * w, s.y * h, 1.1);
      }}
    />
  );
}

export function TankPush({ onScore, onOver }: RunProps) {
  const state = useRef({
    x: 0.5,
    shots: [] as { x: number; y: number }[],
    rocks: [] as { x: number; y: number }[],
    score: 0,
    spawn: 0,
    fire: 0,
    dead: false,
    hold: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type, w) => {
        state.current.hold = type !== "up";
        if (type !== "up") state.current.x = Math.min(0.88, Math.max(0.12, x / Math.max(1, w)));
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.fire += dt;
        if (s.hold && s.fire > 0.2) {
          s.fire = 0;
          s.shots.push({ x: s.x, y: 0.82 });
        }
        s.spawn += dt;
        if (s.spawn > Math.max(0.4, 0.8 - s.score / 3200)) {
          s.spawn = 0;
          s.rocks.push({ x: 0.1 + Math.random() * 0.8, y: -0.06 });
        }
        s.shots.forEach((b) => (b.y -= 1.3 * dt));
        s.rocks.forEach((r) => (r.y += (0.18 + s.score / 6000) * dt));
        s.shots = s.shots.filter((b) => {
          const i = s.rocks.findIndex((r) => Math.hypot(r.x - b.x, r.y - b.y) < 0.07);
          if (i >= 0) {
            s.rocks.splice(i, 1);
            s.score += 22;
            onScore(s.score);
            return false;
          }
          return b.y > -0.05;
        });
        if (s.rocks.some((r) => r.y > 0.86 && Math.abs(r.x - s.x) < 0.1) && !s.dead) {
          s.dead = true;
          onOver(s.score);
        }
        s.rocks = s.rocks.filter((r) => r.y < 1.05);
        paintBoard(ctx, w, h);
        ctx.fillStyle = "#2a2416";
        ctx.fillRect(0, h * 0.9, w, h * 0.1);
        for (const r of s.rocks) {
          ctx.fillStyle = "#3a3a3a";
          ctx.beginPath();
          ctx.arc(r.x * w, r.y * h, 14, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const b of s.shots) drawCoin(ctx, b.x * w, b.y * h, 5);
        drawTank(ctx, s.x * w, h * 0.86, -Math.PI / 2);
      }}
    />
  );
}

export function HoverDash({ onScore, onOver }: RunProps) {
  const state = useRef({
    lane: 1,
    items: [] as { lane: number; y: number; gold: boolean }[],
    score: 0,
    spawn: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type, w) => {
        if (type !== "down") return;
        state.current.lane = x < w / 3 ? 0 : x > (w * 2) / 3 ? 2 : 1;
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.spawn += dt;
        if (s.spawn > Math.max(0.32, 0.68 - s.score / 3800)) {
          s.spawn = 0;
          s.items.push({ lane: Math.floor(Math.random() * 3), y: -0.08, gold: Math.random() > 0.42 });
        }
        const speed = 0.4 + Math.min(0.46, s.score / 2400);
        s.items.forEach((it) => (it.y += speed * dt));
        s.items = s.items.filter((it) => {
          if (it.y > 0.76 && it.y < 0.9 && it.lane === s.lane) {
            if (it.gold) {
              s.score += 16;
              onScore(s.score);
            } else if (!s.dead) {
              s.dead = true;
              onOver(s.score);
            }
            return false;
          }
          return it.y < 1.08;
        });
        paintBoard(ctx, w, h, "#6a8aaa");
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = i === s.lane ? "rgba(212,175,55,0.16)" : "rgba(255,255,255,0.04)";
          ctx.fillRect((i * w) / 3 + 10, 20, w / 3 - 20, h - 40);
        }
        for (const it of s.items) {
          const x = ((it.lane + 0.5) * w) / 3;
          if (it.gold) drawCoin(ctx, x, it.y * h, 12);
          else drawBomb(ctx, x, it.y * h, 14);
        }
        drawMoto(ctx, ((s.lane + 0.5) * w) / 3, h * 0.84, 0.95);
      }}
    />
  );
}
