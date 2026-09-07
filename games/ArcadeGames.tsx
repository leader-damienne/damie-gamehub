"use client";

import { useEffect, useRef, useState } from "react";
import GameCanvas from "./GameCanvas";

type RunProps = {
  onScore: (score: number) => void;
  onOver: (score: number) => void;
};

export function CrownCatch({ onScore, onOver }: RunProps) {
  const state = useRef({
    x: 0.5,
    items: [] as { x: number; y: number; gold: boolean; vy: number }[],
    score: 0,
    hits: 0,
    t: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type) => {
        if (type === "move" || type === "down") {
          const canvas = document.querySelector(".board") as HTMLCanvasElement | null;
          if (canvas) state.current.x = Math.min(0.92, Math.max(0.08, x / canvas.clientWidth));
        }
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.t += dt;
        if (s.t > 0.45 - Math.min(0.28, s.score / 4000)) {
          s.t = 0;
          s.items.push({
            x: 0.08 + Math.random() * 0.84,
            y: -0.05,
            gold: Math.random() > 0.28,
            vy: 0.22 + Math.random() * 0.18 + s.score / 8000,
          });
        }
        s.items.forEach((it) => (it.y += it.vy * dt));
        s.items = s.items.filter((it) => {
          if (it.y > 0.9 && Math.abs(it.x - s.x) < 0.12) {
            if (it.gold) {
              s.score += 20;
              onScore(s.score);
            } else {
              s.hits += 1;
              if (s.hits >= 3 && !s.dead) {
                s.dead = true;
                onOver(s.score);
              }
            }
            return false;
          }
          return it.y < 1.05;
        });
        ctx.fillStyle = "#070707";
        ctx.fillRect(0, 0, w, h);
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#14100a");
        g.addColorStop(1, "#070707");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        for (const it of s.items) {
          ctx.beginPath();
          ctx.fillStyle = it.gold ? "#d4af37" : "#3a3a3a";
          ctx.arc(it.x * w, it.y * h, it.gold ? 11 : 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#d4af37";
        ctx.fillRect(s.x * w - 36, h - 46, 72, 16);
        ctx.fillStyle = "#f0d56a";
        ctx.fillRect(s.x * w - 8, h - 58, 16, 12);
      }}
    />
  );
}

export function OrbitDash({ onScore, onOver }: RunProps) {
  const state = useRef({
    a: 0,
    dir: 0,
    rocks: [] as { a: number; r: number }[],
    coins: [] as { a: number; r: number }[],
    score: 0,
    spawn: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type) => {
        const canvas = document.querySelector(".board") as HTMLCanvasElement | null;
        if (!canvas) return;
        if (type === "up") state.current.dir = 0;
        else state.current.dir = x < canvas.clientWidth / 2 ? -1 : 1;
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.a += s.dir * 2.4 * dt;
        s.spawn += dt;
        if (s.spawn > 0.7) {
          s.spawn = 0;
          s.rocks.push({ a: Math.random() * Math.PI * 2, r: 0.02 });
          if (Math.random() > 0.45) s.coins.push({ a: Math.random() * Math.PI * 2, r: 0.02 });
        }
        const cx = w / 2;
        const cy = h / 2;
        const orbit = Math.min(w, h) * 0.32;
        ctx.fillStyle = "#080808";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(212,175,55,0.25)";
        ctx.beginPath();
        ctx.arc(cx, cy, orbit, 0, Math.PI * 2);
        ctx.stroke();
        const px = cx + Math.cos(s.a) * orbit;
        const py = cy + Math.sin(s.a) * orbit;
        const move = (arr: { a: number; r: number }[], gold: boolean) => {
          for (const o of arr) o.r += dt * 0.18;
          return arr.filter((o) => {
            const x = cx + Math.cos(o.a) * o.r * Math.min(w, h);
            const y = cy + Math.sin(o.a) * o.r * Math.min(w, h);
            ctx.beginPath();
            ctx.fillStyle = gold ? "#f0d56a" : "#555";
            ctx.arc(x, y, gold ? 7 : 11, 0, Math.PI * 2);
            ctx.fill();
            const hit = Math.hypot(x - px, y - py) < 18;
            if (hit && gold) {
              s.score += 25;
              onScore(s.score);
              return false;
            }
            if (hit && !gold && !s.dead) {
              s.dead = true;
              onOver(s.score);
              return false;
            }
            return o.r < 0.7;
          });
        };
        s.rocks = move(s.rocks, false);
        s.coins = move(s.coins, true);
        ctx.beginPath();
        ctx.fillStyle = "#d4af37";
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();
      }}
    />
  );
}

export function GoldSlash({ onScore, onOver }: RunProps) {
  const state = useRef({
    orbs: [] as { x: number; y: number; vx: number; vy: number; gold: boolean }[],
    score: 0,
    t: 0,
    last: { x: 0, y: 0, on: false },
    missed: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, y, type) => {
        const canvas = document.querySelector(".board") as HTMLCanvasElement | null;
        if (!canvas) return;
        const s = state.current;
        const nx = x / canvas.clientWidth;
        const ny = y / canvas.clientHeight;
        if (type === "down") s.last = { x: nx, y: ny, on: true };
        if (type === "up") s.last.on = false;
        if (type === "move" && s.last.on) {
          s.orbs = s.orbs.filter((o) => {
            const cut = Math.hypot(o.x - nx, o.y - ny) < 0.08;
            if (!cut) return true;
            if (o.gold) {
              s.score += 15;
              onScore(s.score);
              return false;
            }
            if (!s.dead) {
              s.dead = true;
              onOver(s.score);
            }
            return false;
          });
          s.last = { x: nx, y: ny, on: true };
        }
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.t += dt;
        if (s.t > 0.55) {
          s.t = 0;
          s.orbs.push({
            x: Math.random(),
            y: 1.05,
            vx: (Math.random() - 0.5) * 0.25,
            vy: -0.85 - Math.random() * 0.2,
            gold: Math.random() > 0.22,
          });
        }
        ctx.fillStyle = "#070707";
        ctx.fillRect(0, 0, w, h);
        s.orbs.forEach((o) => {
          o.vy += dt * 0.9;
          o.x += o.vx * dt;
          o.y += o.vy * dt;
          ctx.beginPath();
          ctx.fillStyle = o.gold ? "#d4af37" : "#2c2c2c";
          ctx.arc(o.x * w, o.y * h, 16, 0, Math.PI * 2);
          ctx.fill();
        });
        const before = s.orbs.length;
        s.orbs = s.orbs.filter((o) => o.y < 1.2);
        if (s.orbs.length < before) {
          s.missed += before - s.orbs.length;
          if (s.missed >= 8 && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
        }
      }}
    />
  );
}

export function StackKing({ onScore, onOver }: RunProps) {
  const state = useRef({
    blocks: [{ x: 0.5, w: 0.46 }],
    cur: { x: 0.1, w: 0.46, dir: 1 },
    score: 0,
    drop: false,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, _y, type) => {
        if (type === "down") state.current.drop = true;
      }}
      onFrame={(ctx, w, h) => {
        const s = state.current;
        s.cur.x += s.cur.dir * 0.0075;
        if (s.cur.x < 0.08 || s.cur.x > 0.92) s.cur.dir *= -1;
        if (s.drop) {
          s.drop = false;
          const prev = s.blocks[s.blocks.length - 1];
          const left = Math.max(prev.x - prev.w / 2, s.cur.x - s.cur.w / 2);
          const right = Math.min(prev.x + prev.w / 2, s.cur.x + s.cur.w / 2);
          const nw = right - left;
          if (nw < 0.04) {
            if (!s.dead) {
              s.dead = true;
              onOver(s.score);
            }
          } else {
            s.blocks.push({ x: (left + right) / 2, w: nw });
            s.cur = { x: 0.1, w: nw, dir: Math.random() > 0.5 ? 1 : -1 };
            s.score += 20 + Math.floor(nw * 80);
            onScore(s.score);
          }
        }
        ctx.fillStyle = "#080808";
        ctx.fillRect(0, 0, w, h);
        const base = h - 80;
        s.blocks.forEach((b, i) => {
          ctx.fillStyle = i % 2 ? "#d4af37" : "#f0d56a";
          const y = base - i * 18;
          ctx.fillRect((b.x - b.w / 2) * w, y, b.w * w, 16);
        });
        ctx.fillStyle = "#fff2b0";
        ctx.fillRect((s.cur.x - s.cur.w / 2) * w, base - s.blocks.length * 18, s.cur.w * w, 16);
      }}
    />
  );
}

export function ReflexRing({ onScore, onOver }: RunProps) {
  const [pulse, setPulse] = useState(0);
  const score = useRef(0);
  const lives = useRef(3);
  const band = useRef(0.62);
  const running = useRef(true);

  useEffect(() => {
    let p = 0;
    let id = 0;
    const loop = () => {
      if (!running.current) return;
      p += 0.012 + score.current / 8000;
      if (p > 1.15) {
        lives.current -= 1;
        p = 0;
        if (lives.current <= 0) {
          running.current = false;
          onOver(score.current);
        }
      }
      setPulse(p);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [onOver]);

  return (
    <div className="tap-king" onPointerDown={() => {
      if (!running.current) return;
      const hit = Math.abs(pulse - band.current) < 0.09;
      if (hit) {
        score.current += 40;
        onScore(score.current);
        band.current = 0.45 + Math.random() * 0.3;
        setPulse(0);
      } else {
        lives.current -= 1;
        if (lives.current <= 0) {
          running.current = false;
          onOver(score.current);
        }
      }
    }}>
      <svg width="260" height="260" viewBox="0 0 260 260">
        <circle cx="130" cy="130" r="100" fill="none" stroke="#222" strokeWidth="18" />
        <circle
          cx="130"
          cy="130"
          r="100"
          fill="none"
          stroke="#d4af37"
          strokeWidth="18"
          strokeDasharray={`${40 + band.current * 20} 999`}
          transform={`rotate(${band.current * 260} 130 130)`}
        />
        <circle cx="130" cy="130" r={20 + pulse * 80} fill="none" stroke="#f0d56a" strokeWidth="6" />
        <text x="130" y="136" textAnchor="middle" fill="#f6f1e4" fontSize="18">
          TAP
        </text>
      </svg>
    </div>
  );
}
