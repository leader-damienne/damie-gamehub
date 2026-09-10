"use client";

import { useId } from "react";
import type { GameBoardKind, GameDef } from "@/lib/types";
import { boardKindFor, boardSeed } from "@/lib/game-board";

type GameRef = Pick<GameDef, "id" | "category" | "accent"> & { board?: GameBoardKind };

export default function GameBoard({ game, compact = false }: { game: GameRef; compact?: boolean }) {
  const kind = boardKindFor(game);
  const seed = boardSeed(game.id);
  const uid = `gb-${useId().replace(/:/g, "")}`;
  const accent = game.accent || "#d4af37";
  const shift = seed % 24;

  return (
    <svg
      className={`game-board${compact ? " compact" : ""}`}
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${uid}-felt`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2010" />
          <stop offset="55%" stopColor="#120e08" />
          <stop offset="100%" stopColor="#070705" />
        </linearGradient>
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5e6a3" />
          <stop offset="50%" stopColor={accent} />
          <stop offset="100%" stopColor="#8a6a1a" />
        </linearGradient>
        <radialGradient id={`${uid}-coin`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff6c8" />
          <stop offset="55%" stopColor={accent} />
          <stop offset="100%" stopColor="#6b5210" />
        </radialGradient>
      </defs>
      <rect width="320" height="200" fill="#090806" />
      <rect x="6" y="6" width="308" height="188" rx="18" fill={`url(#${uid}-felt)`} stroke={`url(#${uid}-gold)`} strokeWidth="4" />
      <rect x="16" y="16" width="288" height="168" rx="12" fill="none" stroke={accent} strokeOpacity="0.22" />
      <path d="M22 28h18M22 28v18" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M298 28h-18M298 28v18" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M22 172h18M22 172v-18" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M298 172h-18M298 172v-18" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <Playfield kind={kind} uid={uid} accent={accent} shift={shift} />
    </svg>
  );
}

function Coin({ x, y, r = 12, uid }: { x: number; y: number; r?: number; uid: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={`url(#${uid}-coin)`} />
      <circle r={r * 0.68} fill="none" stroke="#f5e6a3" strokeWidth="1.4" />
      <polygon points={`0,${-r * 0.45} ${r * 0.14},${-r * 0.1} ${r * 0.42},${-r * 0.1} ${r * 0.18},${r * 0.12} ${r * 0.26},${r * 0.42} 0,${r * 0.22} ${-r * 0.26},${r * 0.42} ${-r * 0.18},${r * 0.12} ${-r * 0.42},${-r * 0.1} ${-r * 0.14},${-r * 0.1}`} fill="#6b5210" />
    </g>
  );
}

function Crown({ x, y, s = 14 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-s} ${s * 0.4} L${-s} ${-s * 0.15} L${-s * 0.5} ${s * 0.1} L0 ${-s * 0.55} L${s * 0.5} ${s * 0.1} L${s} ${-s * 0.15} L${s} ${s * 0.4} Z`} fill="#d4af37" />
      <rect x={-s * 0.85} y={s * 0.4} width={s * 1.7} height={s * 0.18} fill="#f5e6a3" />
    </g>
  );
}

function Playfield({
  kind,
  uid,
  accent,
  shift,
}: {
  kind: GameBoardKind;
  uid: string;
  accent: string;
  shift: number;
}) {
  const dx = (shift % 11) - 5;
  const dy = (Math.floor(shift / 3) % 9) - 4;

  if (kind === "catch") {
    return (
      <g>
        <Coin uid={uid} x={70 + dx} y={48 + dy} r={11} />
        <Coin uid={uid} x={150} y={36} r={13} />
        <Coin uid={uid} x={230 - dx} y={58} r={10} />
        <g transform={`translate(${190 + dx} ${88})`}>
          <circle r="11" fill="#2c2c2c" />
          <path d="M4 -8 Q10 -16 2 -20" fill="none" stroke={accent} strokeWidth="2" />
        </g>
        <g transform="translate(160 168)">
          <rect x="-42" y="0" width="84" height="12" rx="3" fill="#8a6a1a" />
          <path d="M-38 0 L-26 -14 H26 L38 0 Z" fill={accent} />
          <Crown x={0} y={-22} s={9} />
        </g>
      </g>
    );
  }

  if (kind === "ring") {
    return (
      <g>
        <circle cx="160" cy="104" r="62" fill="none" stroke="#2a2418" strokeWidth="16" />
        <circle cx="160" cy="104" r="62" fill="none" stroke={accent} strokeWidth="16" strokeDasharray="48 180" transform={`rotate(${40 + shift} 160 104)`} />
        <circle cx="160" cy="104" r="28" fill="none" stroke="#f0d56a" strokeWidth="5" />
        <Crown x={160} y={108} s={12} />
      </g>
    );
  }

  if (kind === "cards") {
    const faces = [true, false, true, false, false, true, false, true];
    return (
      <g>
        {faces.map((open, i) => {
          const x = 46 + (i % 4) * 58;
          const y = 46 + Math.floor(i / 4) * 72;
          return (
            <g key={i}>
              <rect x={x} y={y} width="50" height="62" rx="8" fill={open ? "#1a160e" : "#16120a"} stroke={accent} strokeWidth="1.6" />
              {open ? <Crown x={x + 25} y={y + 34} s={11} /> : <rect x={x + 10} y={y + 14} width="30" height="34" rx="4" fill={`${accent}33`} />}
            </g>
          );
        })}
      </g>
    );
  }

  if (kind === "orbit") {
    return (
      <g>
        <circle cx="160" cy="104" r="54" fill="none" stroke={`${accent}55`} strokeWidth="2" strokeDasharray="6 8" />
        <circle cx="160" cy="104" r="10" fill={`url(#${uid}-gold)`} />
        <Coin uid={uid} x={160 + 54} y={104} r={8} />
        <Coin uid={uid} x={118} y={62} r={7} />
        <g transform={`translate(${160 - 38} ${104 + 38}) rotate(${shift})`}>
          <polygon points="0,-12 9,10 0,5 -9,10" fill={accent} />
        </g>
        <polygon points={`${214 + dx},${70 + dy} 226,58 238,74 222,86`} fill="#3a3a3a" />
      </g>
    );
  }

  if (kind === "stack") {
    const widths = [120, 108, 92, 78, 64];
    return (
      <g>
        {widths.map((w, i) => (
          <rect
            key={i}
            x={160 - w / 2 + (i === 4 ? dx : 0)}
            y={154 - i * 18}
            width={w}
            height="15"
            rx="3"
            fill={i % 2 ? accent : "#f0d56a"}
          />
        ))}
        <rect x={118 + dx} y={46} width="64" height="15" rx="3" fill="#fff2b0" />
      </g>
    );
  }

  if (kind === "lanes") {
    return (
      <g>
        {[0, 1, 2].map((l) => (
          <g key={l}>
            <rect x={58 + l * 70} y="28" width="56" height="144" rx="10" fill="#0e0c08" stroke={`${accent}44`} />
            <rect x={66 + l * 70} y={48 + ((l * 37 + shift) % 80)} width="40" height="14" rx="4" fill={accent} />
            <rect x={62 + l * 70} y="148" width="48" height="8" rx="2" fill="#f0d56a" opacity="0.45" />
          </g>
        ))}
      </g>
    );
  }

  if (kind === "grid") {
    const vals = [2, 4, 8, 16, 0, 32, 4, 2, 8, 0, 2, 64, 4, 8, 2, 16];
    return (
      <g>
        <rect x="76" y="28" width="168" height="148" rx="10" fill="#0c0a06" stroke={`${accent}55`} />
        {vals.map((v, i) => {
          const x = 84 + (i % 4) * 40;
          const y = 36 + Math.floor(i / 4) * 34;
          return (
            <g key={i}>
              <rect x={x} y={y} width="34" height="28" rx="5" fill={v ? `${accent}${v >= 16 ? "cc" : "88"}` : "#16120c"} />
              {v > 0 && (
                <text x={x + 17} y={y + 19} textAnchor="middle" fill="#161000" fontSize="11" fontWeight="800">
                  {v}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  if (kind === "slash") {
    return (
      <g>
        <path d={`M40 ${70 + dy} Q160 20 280 ${90 + dx}`} fill="none" stroke="#f5e6a3" strokeWidth="3" strokeDasharray="8 6" />
        <Coin uid={uid} x={86} y={72} r={14} />
        <Coin uid={uid} x={168} y={48} r={12} />
        <Coin uid={uid} x={248} y={86} r={13} />
        <g transform={`translate(${200 + dx} ${128})`}>
          <circle r="13" fill="#2a2a2a" stroke="#555" />
        </g>
      </g>
    );
  }

  if (kind === "tap") {
    return (
      <g>
        <circle cx="160" cy="104" r="58" fill={`url(#${uid}-gold)`} stroke="#f5e6a3" strokeWidth="5" />
        <circle cx="148" cy="90" r="18" fill="#fff6c8" opacity="0.35" />
        <Crown x={160} y={108} s={18} />
      </g>
    );
  }

  const walls = [
    [40, 36, 240, 12],
    [40, 152, 240, 12],
    [40, 36, 12, 128],
    [268, 36, 12, 128],
    [88, 64, 12, 56],
    [148, 88, 80, 12],
    [220, 64, 12, 56],
  ];
  return (
    <g>
      {walls.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#1c1810" stroke={`${accent}33`} />
      ))}
      <Crown x={96 + dx} y={128} s={11} />
      <Coin uid={uid} x={186} y={68} r={8} />
      <Coin uid={uid} x={244} y={128} r={8} />
      <rect x={232} y={70} width="16" height="16" rx="4" fill="#4a4a4a" />
    </g>
  );
}
