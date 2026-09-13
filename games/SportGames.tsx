"use client";

import { useRef } from "react";
import { rgba, themeFor } from "@/lib/game-theme";
import GameCanvas from "./GameCanvas";
import { drawBall, drawBike, drawBomb, drawCoin, drawMoto, drawPerson, drawPlane, paintBoard } from "./sprites";

type RunProps = {
  onScore: (score: number) => void;
  onOver: (score: number) => void;
};

export function BikeDash({ onScore, onOver }: RunProps) {
  const T = themeFor("bike-dash");
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
        if (s.spawn > Math.max(0.34, 0.72 - s.score / 3500)) {
          s.spawn = 0;
          s.items.push({ lane: Math.floor(Math.random() * 3), y: -0.08, gold: Math.random() > 0.38 });
        }
        const speed = 0.4 + Math.min(0.48, s.score / 2400);
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
        paintBoard(ctx, w, h, T);
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = i === s.lane ? rgba(T.accent, 0.28) : rgba(T.lane, 0.55);
          ctx.fillRect((i * w) / 3 + 8, 20, w / 3 - 16, h - 40);
        }
        for (const it of s.items) {
          const x = ((it.lane + 0.5) * w) / 3;
          if (it.gold) drawCoin(ctx, x, it.y * h, 12, T.collect);
          else drawBomb(ctx, x, it.y * h, 13, T.hazard);
        }
        drawBike(ctx, ((s.lane + 0.5) * w) / 3, h * 0.84, 1.05, T.accent);
      }}
    />
  );
}

export function MotoCross({ onScore, onOver }: RunProps) {
  const T = themeFor("moto-cross");
  const state = useRef({
    y: 0.72,
    v: 0,
    ramps: [{ x: 1.15, gap: 0.16 }],
    coins: [{ x: 1.4, y: 0.55 }],
    score: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, _y, type) => {
        if (type === "down" && state.current.y > 0.68) state.current.v = -0.98;
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.v += 2.15 * dt;
        s.y += s.v * dt;
        if (s.y > 0.72) {
          s.y = 0.72;
          s.v = 0;
        }
        const speed = 0.32 + Math.min(0.22, s.score / 3500);
        s.ramps.forEach((r) => (r.x -= speed * dt));
        s.coins.forEach((c) => (c.x -= speed * dt));
        if (s.ramps[s.ramps.length - 1].x < 0.55) {
          s.ramps.push({ x: 1.2, gap: 0.12 + Math.random() * 0.1 });
          s.coins.push({ x: 1.25 + Math.random() * 0.15, y: 0.48 + Math.random() * 0.12 });
        }
        s.ramps = s.ramps.filter((r) => r.x > -0.2);
        s.coins = s.coins.filter((c) => {
          if (Math.abs(c.x - 0.26) < 0.08 && Math.abs(c.y - s.y) < 0.08) {
            s.score += 22;
            onScore(s.score);
            return false;
          }
          return c.x > -0.1;
        });
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
        paintBoard(ctx, w, h, T);
        ctx.fillStyle = T.lane;
        ctx.fillRect(0, h * 0.78, w, h * 0.22);
        ctx.fillStyle = T.accent;
        ctx.fillRect(0, h * 0.78, w, 6);
        for (const r of s.ramps) {
          ctx.fillStyle = T.hazard;
          ctx.fillRect(r.x * w, h * 0.78, r.gap * w, h * 0.22);
        }
        for (const c of s.coins) drawCoin(ctx, c.x * w, c.y * h, 11, T.collect);
        drawMoto(ctx, 0.26 * w, s.y * h, 1.15, T.player);
      }}
    />
  );
}

export function LoopAce({ onScore, onOver }: RunProps) {
  const T = themeFor("loop-ace");
  const state = useRef({
    y: 0.5,
    rings: [] as { x: number; y: number; hit: boolean }[],
    score: 0,
    spawn: 0,
    misses: 0,
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
        if (s.spawn > Math.max(0.55, 0.95 - s.score / 4000)) {
          s.spawn = 0;
          s.rings.push({ x: 1.08, y: 0.18 + Math.random() * 0.64, hit: false });
        }
        const speed = 0.32 + Math.min(0.26, s.score / 2800);
        s.rings.forEach((r) => (r.x -= speed * dt));
        s.rings = s.rings.filter((r) => {
          if (!r.hit && Math.hypot(r.x - 0.22, r.y - s.y) < 0.07) {
            r.hit = true;
            s.score += 24;
            onScore(s.score);
          }
          if (r.x < 0.04 && !r.hit) {
            s.misses += 1;
            if (s.misses >= 5 && !s.dead) {
              s.dead = true;
              onOver(s.score);
            }
            return false;
          }
          return r.x > -0.12;
        });
        paintBoard(ctx, w, h, T);
        for (const r of s.rings) {
          ctx.strokeStyle = r.hit ? T.accent2 : T.accent;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.ellipse(r.x * w, r.y * h, 22, 34, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawPlane(ctx, 0.22 * w, s.y * h, 1.15, T.player);
      }}
    />
  );
}

export function KnockOut({ onScore, onOver }: RunProps) {
  const T = themeFor("knock-out");
  const state = useRef({
    phase: "wait" as "wait" | "open" | "danger",
    t: 0.7,
    hp: 3,
    score: 0,
    dead: false,
    flash: 0,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, _y, type) => {
        if (type !== "down") return;
        const s = state.current;
        if (s.phase === "open") {
          s.score += 22;
          onScore(s.score);
          s.flash = 0.12;
          s.phase = "wait";
          s.t = Math.max(0.35, 0.7 - s.score / 5000);
        } else if (s.phase === "danger") {
          s.hp -= 1;
          if (s.hp <= 0 && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
        }
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.t -= dt;
        s.flash = Math.max(0, s.flash - dt);
        if (s.t <= 0) {
          if (s.phase === "wait") {
            s.phase = Math.random() > 0.42 ? "open" : "danger";
            s.t = s.phase === "open" ? 0.55 : 0.38;
          } else if (s.phase === "danger") {
            s.hp -= 1;
            s.phase = "wait";
            s.t = 0.55;
            if (s.hp <= 0 && !s.dead) {
              s.dead = true;
              onOver(s.score);
            }
          } else {
            s.phase = "wait";
            s.t = 0.4;
          }
        }
        paintBoard(ctx, w, h, T);
        ctx.fillStyle =
          s.phase === "open" ? "rgba(46,204,113,0.28)" : s.phase === "danger" ? "rgba(231,76,60,0.4)" : "transparent";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = T.hazard;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.34, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = s.flash > 0 ? T.collect : T.player;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.68, 52, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "18px sans-serif";
        ctx.fillText(`Vies ${s.hp}`, 24, 48);
        ctx.fillText(s.phase === "open" ? "FRAPPEZ" : s.phase === "danger" ? "GARDEZ" : "ATTENDEZ", 24, h - 32);
      }}
    />
  );
}

export function BallKeep({ onScore, onOver }: RunProps) {
  const T = themeFor("ball-keep");
  const state = useRef({ y: 0.42, v: -0.45, x: 0.5, score: 0, dead: false });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type, w) => {
        if (type !== "down") return;
        const s = state.current;
        const nx = x / Math.max(1, w);
        if (Math.abs(nx - s.x) < 0.22 && s.y > 0.28) {
          s.v = -0.78;
          s.x = Math.min(0.86, Math.max(0.14, nx));
          s.score += 12;
          onScore(s.score);
        }
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        s.v += 1.45 * dt;
        s.y += s.v * dt;
        if (s.y > 0.96 && !s.dead) {
          s.dead = true;
          onOver(s.score);
        }
        paintBoard(ctx, w, h, T);
        ctx.fillStyle = T.lane;
        ctx.fillRect(0, h * 0.92, w, h * 0.08);
        drawPerson(ctx, s.x * w, h * 0.86, T.player, 1.15);
        drawBall(ctx, s.x * w, s.y * h, 18, T.collect);
      }}
    />
  );
}

function GoalDuel({ id, onScore, onOver }: RunProps & { id: "foot-strike" | "hand-goal" }) {
  const T = themeFor(id);
  const state = useRef({
    lane: 1,
    keeper: 1,
    ballY: 0.78,
    flying: false,
    score: 0,
    misses: 0,
    dead: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(x, _y, type, w) => {
        if (type !== "down" || state.current.flying) return;
        const s = state.current;
        s.lane = x < w / 3 ? 0 : x > (w * 2) / 3 ? 2 : 1;
        s.keeper = Math.floor(Math.random() * 3);
        s.flying = true;
        s.ballY = 0.78;
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        if (s.flying) {
          s.ballY -= 0.85 * dt;
          if (s.ballY <= 0.22) {
            if (s.lane !== s.keeper) {
              s.score += 30;
              onScore(s.score);
            } else {
              s.misses += 1;
              if (s.misses >= 5 && !s.dead) {
                s.dead = true;
                onOver(s.score);
              }
            }
            s.flying = false;
            s.ballY = 0.78;
          }
        }
        paintBoard(ctx, w, h, T);
        ctx.fillStyle = rgba(T.accent2, 0.35);
        ctx.fillRect(w * 0.12, 28, w * 0.76, h * 0.22);
        ctx.strokeStyle = T.accent;
        ctx.lineWidth = 6;
        ctx.strokeRect(w * 0.12, 28, w * 0.76, h * 0.22);
        for (let i = 0; i < 3; i += 1) {
          ctx.fillStyle = i === s.lane && !s.flying ? rgba(T.player, 0.25) : "transparent";
          ctx.fillRect((i * w) / 3 + 10, h * 0.7, w / 3 - 20, h * 0.22);
        }
        drawPerson(ctx, ((s.flying ? s.keeper : 1) + 0.5) * (w / 3), h * 0.28, T.hazard, 1.1);
        drawPerson(ctx, ((s.flying ? s.lane : 1) + 0.5) * (w / 3), h * 0.86, T.player, 1.2);
        const bx = ((s.flying ? s.lane : 1) + 0.5) * (w / 3);
        drawBall(ctx, bx, s.ballY * h, id === "hand-goal" ? 14 : 16, T.collect);
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.fillText(id === "foot-strike" ? "Tirez gauche · centre · droite" : "Lancez vers un angle", 18, h - 18);
      }}
    />
  );
}

export function FootStrike(props: RunProps) {
  return <GoalDuel id="foot-strike" {...props} />;
}

export function HandGoal(props: RunProps) {
  return <GoalDuel id="hand-goal" {...props} />;
}

function NetRally({ id, onScore, onOver }: RunProps & { id: "volley-spike" | "sipa-kick" }) {
  const T = themeFor(id);
  const state = useRef({
    x: 0.82,
    y: 0.32,
    vy: 0.12,
    score: 0,
    misses: 0,
    dead: false,
    window: false,
  });

  return (
    <GameCanvas
      running
      onPointer={(_x, _y, type) => {
        if (type !== "down") return;
        const s = state.current;
        if (s.x < 0.42 && s.x > 0.12) {
          s.score += 26;
          onScore(s.score);
          s.x = 0.92;
          s.y = 0.22 + Math.random() * 0.28;
          s.vy = 0.08 + Math.random() * 0.1;
        } else {
          s.misses += 1;
          if (s.misses >= 5 && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
        }
      }}
      onFrame={(ctx, w, h, dt) => {
        const s = state.current;
        const speed = 0.28 + Math.min(0.22, s.score / 3200);
        s.x -= speed * dt;
        s.y += s.vy * dt;
        if (s.y < 0.18 || s.y > 0.62) s.vy *= -1;
        if (s.x < 0.06) {
          s.misses += 1;
          s.x = 0.94;
          s.y = 0.28 + Math.random() * 0.24;
          if (s.misses >= 5 && !s.dead) {
            s.dead = true;
            onOver(s.score);
          }
        }
        s.window = s.x < 0.42 && s.x > 0.12;
        paintBoard(ctx, w, h, T);
        ctx.fillStyle = T.lane;
        ctx.fillRect(0, h * 0.72, w, h * 0.28);
        ctx.fillStyle = T.accent2;
        ctx.fillRect(w * 0.48, h * 0.28, 8, h * 0.44);
        drawPerson(ctx, w * 0.78, h * 0.68, T.hazard, 1);
        drawPerson(ctx, w * 0.24, h * 0.7, T.player, 1.15);
        drawBall(ctx, s.x * w, s.y * h, id === "sipa-kick" ? 11 : 16, T.collect);
        ctx.fillStyle = s.window ? T.accent : "#fff";
        ctx.font = "15px sans-serif";
        ctx.fillText(s.window ? (id === "sipa-kick" ? "SIPA !" : "SMASH !") : "Attendez le ballon", 18, 44);
      }}
    />
  );
}

export function VolleySpike(props: RunProps) {
  return <NetRally id="volley-spike" {...props} />;
}

export function SipaKick(props: RunProps) {
  return <NetRally id="sipa-kick" {...props} />;
}
