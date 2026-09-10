"use client";

import { useEffect, useRef, useState } from "react";
import GameCanvas from "./GameCanvas";
import { paintBoard, drawBasket, drawBomb, drawCoin, drawCrown } from "./sprites";

type RunProps = {
  onScore: (score: number) => void;
  onOver: (score: number) => void;
};

export function LaneRush({ onScore, onOver }: RunProps) {
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
        const gap = Math.max(0.32, 0.7 - s.score / 4000);
        if (s.spawn > gap) {
          s.spawn = 0;
          const gold = Math.random() > 0.38;
          s.items.push({ lane: Math.floor(Math.random() * 3), y: -0.08, gold });
        }
        const speed = 0.38 + Math.min(0.45, s.score / 2500);
        s.items.forEach((it) => (it.y += speed * dt));
        s.items = s.items.filter((it) => {
          if (it.y > 0.78 && it.y < 0.92 && it.lane === s.lane) {
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
        paintBoard(ctx, w, h);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i === s.lane ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)";
          ctx.fillRect((i * w) / 3 + 8, 16, w / 3 - 16, h - 32);
          ctx.strokeStyle = "rgba(212,175,55,0.22)";
          ctx.strokeRect((i * w) / 3 + 8, 16, w / 3 - 16, h - 32);
        }
        for (const it of s.items) {
          const x = ((it.lane + 0.5) * w) / 3;
          if (it.gold) drawCoin(ctx, x, it.y * h, 13);
          else drawBomb(ctx, x, it.y * h, 15);
        }
        drawBasket(ctx, ((s.lane + 0.5) * w) / 3, h * 0.88);
      }}
    />
  );
}

export function TargetCrown({ onScore, onOver }: RunProps) {
  const state = useRef({
    targets: [] as { x: number; y: number; gold: boolean; life: number }[],
    score: 0,
    spawn: 0,
    misses: 0,
    dead: false,
    tap: null as { x: number; y: number } | null,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, y, type, w, h) => {
        if (type !== "down") return;
        state.current.tap = { x: x / Math.max(1, w), y: y / Math.max(1, h) };
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.spawn += dt;
        if (s.spawn > Math.max(0.38, 0.85 - s.score / 3500)) {
          s.spawn = 0;
          s.targets.push({
            x: 0.14 + Math.random() * 0.72,
            y: 0.16 + Math.random() * 0.62,
            gold: Math.random() > 0.22,
            life: 1.15,
          });
        }
        if (s.tap) {
          const hit = s.targets.findIndex((t) => Math.hypot(t.x - s.tap!.x, t.y - s.tap!.y) < 0.09);
          if (hit >= 0) {
            const t = s.targets[hit];
            if (t.gold) {
              s.score += 22;
              onScore(s.score);
            } else if (!s.dead) {
              s.dead = true;
              onOver(s.score);
            }
            s.targets.splice(hit, 1);
          }
          s.tap = null;
        }
        s.targets.forEach((t) => (t.life -= dt));
        const lost = s.targets.filter((t) => t.life <= 0 && t.gold).length;
        if (lost) {
          s.misses += lost;
          if (s.misses >= 5 && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
        }
        s.targets = s.targets.filter((t) => t.life > 0);
        paintBoard(ctx, w, h);
        for (const t of s.targets) {
          if (t.gold) drawCrown(ctx, t.x * w, t.y * h, 16);
          else drawBomb(ctx, t.x * w, t.y * h, 16);
        }
      }}
    />
  );
}

export function GoldSnake({ onScore, onOver }: RunProps) {
  const state = useRef({
    body: [
      { x: 6, y: 8 },
      { x: 5, y: 8 },
      { x: 4, y: 8 },
    ],
    dir: { x: 1, y: 0 },
    next: { x: 1, y: 0 },
    food: { x: 10, y: 6 },
    acc: 0,
    score: 0,
    dead: false,
    cols: 16,
    rows: 22,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, y, type, w, h) => {
        if (type !== "down") return;
        const s = state.current;
        const nx = x / Math.max(1, w) - 0.5;
        const ny = y / Math.max(1, h) - 0.5;
        if (Math.abs(nx) > Math.abs(ny)) {
          if (s.dir.x === 0) s.next = { x: nx > 0 ? 1 : -1, y: 0 };
        } else if (s.dir.y === 0) {
          s.next = { x: 0, y: ny > 0 ? 1 : -1 };
        }
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        const step = Math.max(0.09, 0.22 - s.score / 8000);
        s.acc += dt;
        while (s.acc >= step && !s.dead) {
          s.acc -= step;
          s.dir = s.next;
          const head = { x: s.body[0].x + s.dir.x, y: s.body[0].y + s.dir.y };
          const hitWall = head.x < 0 || head.y < 0 || head.x >= s.cols || head.y >= s.rows;
          const hitSelf = s.body.some((p) => p.x === head.x && p.y === head.y);
          if (hitWall || hitSelf) {
            s.dead = true;
            onOver(s.score);
            break;
          }
          s.body.unshift(head);
          if (head.x === s.food.x && head.y === s.food.y) {
            s.score += 30;
            onScore(s.score);
            s.food = {
              x: Math.floor(Math.random() * s.cols),
              y: Math.floor(Math.random() * s.rows),
            };
          } else {
            s.body.pop();
          }
        }
        paintBoard(ctx, w, h);
        const cw = w / s.cols;
        const ch = h / s.rows;
        drawCoin(ctx, s.food.x * cw + cw / 2, s.food.y * ch + ch / 2, Math.min(cw, ch) * 0.32);
        s.body.forEach((p, i) => {
          ctx.fillStyle = i === 0 ? "#f5e6a3" : "#c9a227";
          ctx.fillRect(p.x * cw + 2, p.y * ch + 2, cw - 4, ch - 4);
        });
      }}
    />
  );
}

export function GapFlyer({ onScore, onOver }: RunProps) {
  const state = useRef({
    y: 0.45,
    v: 0,
    pipes: [{ x: 1.1, gap: 0.42, scored: false }],
    score: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, _y, type) => {
        if (type === "down") state.current.v = -0.72;
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.v += 1.55 * dt;
        s.y += s.v * dt;
        const speed = 0.28 + Math.min(0.18, s.score / 4000);
        s.pipes.forEach((p) => (p.x -= speed * dt));
        if (s.pipes[s.pipes.length - 1].x < 0.55) {
          s.pipes.push({ x: 1.15, gap: 0.28 + Math.random() * 0.32, scored: false });
        }
        s.pipes = s.pipes.filter((p) => p.x > -0.2);
        for (const p of s.pipes) {
          if (!p.scored && p.x + 0.16 < 0.28) {
            p.scored = true;
            s.score += 25;
            onScore(s.score);
          }
          const inX = 0.28 > p.x && 0.28 < p.x + 0.16;
          const inGap = s.y > p.gap - 0.13 && s.y < p.gap + 0.13;
          if (inX && !inGap && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
        }
        if ((s.y < 0.04 || s.y > 0.96) && !s.dead) {
          s.dead = true;
          onOver(s.score);
        }
        paintBoard(ctx, w, h);
        for (const p of s.pipes) {
          ctx.fillStyle = "#8a6a1a";
          ctx.fillRect(p.x * w, 0, 0.16 * w, (p.gap - 0.14) * h);
          ctx.fillRect(p.x * w, (p.gap + 0.14) * h, 0.16 * w, h);
          ctx.fillStyle = "#d4af37";
          ctx.fillRect(p.x * w, (p.gap - 0.14) * h - 10, 0.16 * w, 10);
          ctx.fillRect(p.x * w, (p.gap + 0.14) * h, 0.16 * w, 10);
        }
        drawCoin(ctx, 0.28 * w, s.y * h, 14);
      }}
    />
  );
}

const COLORS = [
  { id: "or", hex: "#d4af37" },
  { id: "ivoire", hex: "#f5e6a3" },
  { id: "bronze", hex: "#8a6a1a" },
  { id: "noir", hex: "#3a3a3a" },
];

export function ColorRush({ onScore, onOver }: RunProps) {
  const [target, setTarget] = useState(0);
  const [time, setTime] = useState(1);
  const [hp, setHp] = useState(3);
  const score = useRef(0);
  const lives = useRef(3);
  const dead = useRef(false);
  const limit = useRef(1.2);

  useEffect(() => {
    let last = performance.now();
    let id = 0;
    const loop = (now: number) => {
      if (dead.current) return;
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => {
        const next = t - dt / limit.current;
        if (next <= 0) {
          lives.current -= 1;
          setHp(lives.current);
          if (lives.current <= 0) {
            dead.current = true;
            onOver(score.current);
            return 0;
          }
          setTarget(Math.floor(Math.random() * COLORS.length));
          return 1;
        }
        return next;
      });
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [onOver]);

  const pick = (i: number) => {
    if (dead.current) return;
    if (i === target) {
      score.current += 20;
      onScore(score.current);
      limit.current = Math.max(0.55, 1.2 - score.current / 2500);
      setTarget(Math.floor(Math.random() * COLORS.length));
      setTime(1);
    } else {
      lives.current -= 1;
      setHp(lives.current);
      if (lives.current <= 0) {
        dead.current = true;
        onOver(score.current);
      }
    }
  };

  return (
    <div style={{ padding: "90px 16px 24px", height: "100%", display: "grid", gap: 16, alignContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>Touchez la couleur</p>
        <div
          style={{
            margin: "12px auto 0",
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: COLORS[target].hex,
            border: "3px solid #f5e6a3",
          }}
        />
        <div style={{ height: 8, marginTop: 16, borderRadius: 8, background: "#1a160e", overflow: "hidden" }}>
          <div style={{ width: `${time * 100}%`, height: "100%", background: "#d4af37" }} />
        </div>
        <small>{hp} vies</small>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {COLORS.map((c, i) => (
          <button
            key={c.id}
            className="gold-btn"
            style={{ background: c.hex, color: i === 3 ? "#f6f1e4" : "#161000", border: "none" }}
            onClick={() => pick(i)}
          >
            {c.id}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SimonCrown({ onScore, onOver }: RunProps) {
  const pads = ["Or", "Ivoire", "Bronze", "Nuit"];
  const [lit, setLit] = useState<number | null>(null);
  const [msg, setMsg] = useState("Regardez");
  const seq = useRef<number[]>([Math.floor(Math.random() * 4)]);
  const step = useRef(0);
  const locked = useRef(true);
  const score = useRef(0);
  const dead = useRef(false);

  const playSeq = (list: number[]) => {
    locked.current = true;
    setMsg("Regardez");
    list.forEach((n, i) => {
      setTimeout(() => setLit(n), 420 * i);
      setTimeout(() => setLit(null), 420 * i + 280);
    });
    setTimeout(() => {
      locked.current = false;
      setMsg("À vous");
    }, 420 * list.length + 80);
  };

  useEffect(() => {
    const t = setTimeout(() => playSeq(seq.current), 400);
    return () => clearTimeout(t);
  }, []);

  const press = (i: number) => {
    if (locked.current || dead.current) return;
    setLit(i);
    setTimeout(() => setLit(null), 180);
    if (seq.current[step.current] !== i) {
      dead.current = true;
      onOver(score.current);
      setMsg("Raté");
      return;
    }
    step.current += 1;
    if (step.current >= seq.current.length) {
      score.current += 40 + seq.current.length * 8;
      onScore(score.current);
      step.current = 0;
      seq.current = [...seq.current, Math.floor(Math.random() * 4)];
      setTimeout(() => playSeq(seq.current), 500);
    }
  };

  return (
    <div style={{ padding: "90px 16px 24px", height: "100%", display: "grid", alignContent: "center", gap: 16 }}>
      <p style={{ textAlign: "center", margin: 0 }}>{msg}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 280, margin: "0 auto" }}>
        {pads.map((p, i) => (
          <button
            key={p}
            className="gold-btn"
            style={{
              height: 88,
              fontSize: 16,
              opacity: lit === i ? 1 : 0.45,
              transform: lit === i ? "scale(1.04)" : "none",
            }}
            onClick={() => press(i)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
