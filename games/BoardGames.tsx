"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { themeFor } from "@/lib/game-theme";

type RunProps = {
  onScore: (score: number) => void;
  onOver: (score: number) => void;
};

const ICONS = ["♛", "◆", "●", "▲", "★", "■", "✦", "◈"];
const CARD_COLORS = ["#2ecc71", "#f4d03f", "#5dade2", "#e74c3c", "#9b59b6", "#e67e22", "#1abc9c", "#e91e63"];

const MERGE_TILE: Record<number, { bg: string; fg: string }> = {
  0: { bg: "#cdc1b4", fg: "transparent" },
  2: { bg: "#eee4da", fg: "#776e65" },
  4: { bg: "#ede0c8", fg: "#776e65" },
  8: { bg: "#f2b179", fg: "#fff" },
  16: { bg: "#f59563", fg: "#fff" },
  32: { bg: "#f67c5f", fg: "#fff" },
  64: { bg: "#f65e3b", fg: "#fff" },
  128: { bg: "#edcf72", fg: "#fff" },
  256: { bg: "#edcc61", fg: "#fff" },
  512: { bg: "#edc850", fg: "#fff" },
  1024: { bg: "#edc53f", fg: "#fff" },
  2048: { bg: "#edc22e", fg: "#fff" },
};

export function MemoryVault({ onScore, onOver }: RunProps) {
  const T = themeFor("memory-vault");
  const deck = useMemo(() => {
    const pairs = [...ICONS, ...ICONS].sort(() => Math.random() - 0.5);
    return pairs.map((v, i) => ({ id: i, v, open: false, done: false }));
  }, []);
  const [cards, setCards] = useState(deck);
  const [picked, setPicked] = useState<number[]>([]);
  const moves = useRef(0);
  const started = useRef(Date.now());

  const finished = useRef(false);

  useEffect(() => {
    if (picked.length !== 2) return;
    const [a, b] = picked;
    const same = cards[a].v === cards[b].v;
    const t = setTimeout(() => {
      moves.current += 1;
      setCards((c) => {
        const next = c.map((card, i) => {
          if (i === a || i === b) return { ...card, open: same, done: card.done || same };
          return card;
        });
        if (!finished.current && next.every((card) => card.done)) {
          finished.current = true;
          const bonus = Math.max(50, 900 - Math.floor((Date.now() - started.current) / 80) - moves.current * 12);
          onScore(bonus);
          onOver(bonus);
        }
        return next;
      });
      setPicked([]);
    }, 420);
    return () => clearTimeout(t);
  }, [picked, cards, onOver, onScore]);

  return (
    <div className="memory" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      {cards.map((c, i) => {
        const shown = c.open || c.done;
        const color = CARD_COLORS[ICONS.indexOf(c.v) % CARD_COLORS.length];
        return (
          <button
            key={c.id}
            className="cell"
            style={{
              background: shown ? color : T.bg1,
              color: "#fff",
              border: `2px solid ${shown ? color : T.accent}`,
            }}
            onClick={() => {
              if (c.done || c.open || picked.length === 2) return;
              setCards((all) => all.map((x, idx) => (idx === i ? { ...x, open: true } : x)));
              setPicked((p) => [...p, i]);
            }}
          >
            {shown ? c.v : ""}
          </button>
        );
      })}
    </div>
  );
}

export function GridMerge({ onScore, onOver }: RunProps) {
  const [grid, setGrid] = useState(() => spawn(Array.from({ length: 16 }, () => 0)));
  const score = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const ended = useRef(false);

  const play = (dir: "L" | "R" | "U" | "D") => {
    if (ended.current) return;
    const moved = slide(grid, dir);
    if (!moved.changed) return;
    score.current += moved.gained;
    onScore(score.current);
    const next = spawn(moved.grid);
    setGrid(next);
    if (!canMove(next)) {
      ended.current = true;
      onOver(score.current);
    }
  };

  return (
    <div
      className="merge"
      style={{ gridTemplateColumns: "repeat(4, 1fr)", background: "#bbada0", borderRadius: 16 }}
      onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        if (Math.hypot(dx, dy) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) play(dx > 0 ? "R" : "L");
        else play(dy > 0 ? "D" : "U");
      }}
    >
      {grid.map((v, i) => {
        const tile = MERGE_TILE[v] || { bg: "#3c3a32", fg: "#fff" };
        return (
          <div key={i} className={`tile v${v}`} style={{ background: tile.bg, color: tile.fg }}>
            {v || ""}
          </div>
        );
      })}
    </div>
  );
}

function spawn(grid: number[]) {
  const empty = grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
  if (!empty.length) return grid;
  const next = [...grid];
  next[empty[Math.floor(Math.random() * empty.length)]] = Math.random() > 0.9 ? 4 : 2;
  return next;
}

function slide(grid: number[], dir: "L" | "R" | "U" | "D") {
  const get = (r: number, c: number) => grid[r * 4 + c];
  let gained = 0;
  const out = Array(16).fill(0) as number[];
  const set = (r: number, c: number, v: number) => (out[r * 4 + c] = v);
  for (let i = 0; i < 4; i++) {
    let line: number[] = [];
    for (let j = 0; j < 4; j++) {
      const v = dir === "L" || dir === "R" ? get(i, j) : get(j, i);
      if (v) line.push(v);
    }
    if (dir === "R" || dir === "D") line.reverse();
    const merged: number[] = [];
    for (let n = 0; n < line.length; n++) {
      if (line[n] === line[n + 1]) {
        merged.push(line[n] * 2);
        gained += line[n] * 2;
        n += 1;
      } else merged.push(line[n]);
    }
    while (merged.length < 4) merged.push(0);
    if (dir === "R" || dir === "D") merged.reverse();
    merged.forEach((v, j) => {
      if (dir === "L" || dir === "R") set(i, j, v);
      else set(j, i, v);
    });
  }
  return { grid: out, gained, changed: out.some((v, i) => v !== grid[i]) };
}

function canMove(grid: number[]) {
  if (grid.includes(0)) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = grid[r * 4 + c];
      if (c < 3 && grid[r * 4 + c + 1] === v) return true;
      if (r < 3 && grid[(r + 1) * 4 + c] === v) return true;
    }
  }
  return false;
}

export function MazeCrown({ onScore, onOver }: RunProps) {
  const T = themeFor("maze-crown");
  const W = 9;
  const H = 11;
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [guard, setGuard] = useState({ x: 7, y: 9 });
  const [coins, setCoins] = useState(() => {
    const out: { x: number; y: number }[] = [];
    const seen = new Set<string>();
    while (out.length < 8) {
      const x = 1 + Math.floor(Math.random() * 7);
      const y = 1 + Math.floor(Math.random() * 9);
      if (x === 1 && y === 1) continue;
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ x, y });
    }
    return out;
  });
  const score = useRef(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const dead = useRef(false);
  const playerRef = useRef(player);
  playerRef.current = player;

  useEffect(() => {
    const id = setInterval(() => {
      if (dead.current) return;
      setGuard((g) => {
        const p = playerRef.current;
        const gx = Math.min(W - 2, Math.max(1, g.x + Math.sign(p.x - g.x)));
        const gy = Math.min(H - 2, Math.max(1, g.y + (Math.random() > 0.5 ? Math.sign(p.y - g.y) : 0)));
        if (gx === p.x && gy === p.y) {
          dead.current = true;
          onOver(score.current);
        }
        return { x: gx, y: gy };
      });
    }, 520);
    return () => clearInterval(id);
  }, [onOver]);

  const move = (dx: number, dy: number) => {
    if (dead.current) return;
    setPlayer((p) => {
      const x = Math.min(W - 2, Math.max(1, p.x + dx));
      const y = Math.min(H - 2, Math.max(1, p.y + dy));
      setCoins((cs) => {
        const left = cs.filter((c) => !(c.x === x && c.y === y));
        if (left.length !== cs.length) {
          score.current += 50;
          onScore(score.current);
          if (left.length === 0) {
            dead.current = true;
            onOver(score.current + 200);
          }
        }
        return left;
      });
      return { x, y };
    });
  };

  return (
    <div
      className="maze"
      style={{ gridTemplateColumns: `repeat(${W}, 1fr)`, height: "auto", aspectRatio: `${W}/${H}` }}
      onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        if (!start.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1, 0);
        else if (Math.abs(dy) > 12) move(0, dy > 0 ? 1 : -1);
      }}
    >
      {Array.from({ length: W * H }, (_, i) => {
        const x = i % W;
        const y = Math.floor(i / W);
        const wall = x === 0 || y === 0 || x === W - 1 || y === H - 1;
        const me = player.x === x && player.y === y;
        const g = guard.x === x && guard.y === y;
        const coin = coins.some((c) => c.x === x && c.y === y);
        return (
          <div
            key={i}
            className="tile"
            style={{
              background: wall ? T.accent : me ? T.player : g ? T.hazard : T.bg1,
              color: coin ? T.collect : T.bg1,
            }}
          >
            {coin && !me ? "●" : ""}
          </div>
        );
      })}
    </div>
  );
}

const PULSE = ["#ff2e63", "#08d9d6", "#f9ed69"];

export function PulseTap({ onScore, onOver }: RunProps) {
  const T = themeFor("pulse-tap");
  const [notes, setNotes] = useState<{ id: number; lane: number; y: number }[]>([]);
  const score = useRef(0);
  const misses = useRef(0);
  const id = useRef(0);
  const dead = useRef(false);

  useEffect(() => {
    const spawn = setInterval(() => {
      if (dead.current) return;
      setNotes((n) => [...n, { id: ++id.current, lane: Math.floor(Math.random() * 3), y: -10 }]);
    }, 700);
    const move = setInterval(() => {
      setNotes((n) => {
        const next = n.map((x) => ({ ...x, y: x.y + 4 }));
        const missed = next.filter((x) => x.y > 92);
        misses.current += missed.length;
        if (misses.current >= 5 && !dead.current) {
          dead.current = true;
          onOver(score.current);
        }
        return next.filter((x) => x.y <= 92);
      });
    }, 50);
    return () => {
      clearInterval(spawn);
      clearInterval(move);
    };
  }, [onOver]);

  const hit = (lane: number) => {
    if (dead.current) return;
    setNotes((n) => {
      const idx = n.findIndex((x) => x.lane === lane && x.y > 70);
      if (idx < 0) {
        misses.current += 1;
        if (misses.current >= 5 && !dead.current) {
          dead.current = true;
          onOver(score.current);
        }
        return n;
      }
      score.current += 30;
      onScore(score.current);
      return n.filter((_, i) => i !== idx);
    });
  };

  return (
    <div style={{ padding: "90px 16px 24px", height: "100%" }}>
      <div
        style={{
          position: "relative",
          height: "70%",
          border: `1px solid ${T.accent2}`,
          borderRadius: 16,
          background: T.bg1,
        }}
      >
        {[0, 1, 2].map((lane) => (
          <div
            key={lane}
            style={{
              position: "absolute",
              left: `${10 + lane * 30}%`,
              top: 8,
              bottom: 8,
              width: "24%",
              borderRadius: 10,
              background: T.lane,
              opacity: 0.55,
            }}
          />
        ))}
        {notes.map((n) => (
          <div
            key={n.id}
            style={{
              position: "absolute",
              left: `${10 + n.lane * 30}%`,
              top: `${n.y}%`,
              width: "24%",
              height: 18,
              borderRadius: 8,
              background: PULSE[n.lane],
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: "18%",
            height: 8,
            background: "rgba(255,255,255,0.85)",
          }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
        {[0, 1, 2].map((l) => (
          <button key={l} className="gold-btn" style={{ background: PULSE[l], color: l === 2 ? "#1a1a2e" : "#fff" }} onClick={() => hit(l)}>
            {l + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export function KingTap({ onScore, onOver }: RunProps) {
  const T = themeFor("king-tap");
  const [left, setLeft] = useState(15);
  const score = useRef(0);
  const combo = useRef(0);
  const ended = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          if (!ended.current) {
            ended.current = true;
            onOver(score.current);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onOver]);

  return (
    <div className="tap-king">
      <button
        className="big-tap"
        style={{
          borderColor: T.accent,
          background: `radial-gradient(circle at 35% 30%, ${T.accent2}, ${T.player} 70%)`,
          color: "#fff",
          boxShadow: `0 0 40px ${T.player}66`,
        }}
        onPointerDown={() => {
          combo.current += 1;
          score.current += 8 + Math.min(40, combo.current);
          onScore(score.current);
        }}
      >
        {left}s
      </button>
    </div>
  );
}
