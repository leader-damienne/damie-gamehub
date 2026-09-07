"use client";

import { useCallback, useMemo, useState } from "react";
import { gameById } from "@/lib/catalog";
import { TOKEN } from "@/lib/economy";
import {
  CrownCatch,
  GoldSlash,
  OrbitDash,
  ReflexRing,
  StackKing,
} from "./ArcadeGames";
import { GridMerge, KingTap, MazeCrown, MemoryVault, PulseTap } from "./BoardGames";

type Props = {
  gameId: string;
  boosted: boolean;
  lives: number;
  stake: number;
  onExit: () => void;
  onFinished: (score: number) => void;
  onUseLife: () => Promise<boolean>;
};

export default function GameScreen({ gameId, boosted, lives, stake, onExit, onFinished, onUseLife }: Props) {
  const game = gameById(gameId);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const [ready, setReady] = useState(false);
  const [usingLife, setUsingLife] = useState(false);

  const finish = useCallback((value: number) => setOver(value), []);
  const liveScore = useCallback((value: number) => setScore(value), []);

  const body = useMemo(() => {
    const props = { onScore: liveScore, onOver: finish };
    switch (gameId) {
      case "crown-catch":
        return <CrownCatch {...props} />;
      case "orbit-dash":
        return <OrbitDash {...props} />;
      case "gold-slash":
        return <GoldSlash {...props} />;
      case "stack-king":
        return <StackKing {...props} />;
      case "reflex-ring":
        return <ReflexRing {...props} />;
      case "memory-vault":
        return <MemoryVault {...props} />;
      case "grid-merge":
        return <GridMerge {...props} />;
      case "maze-crown":
        return <MazeCrown {...props} />;
      case "pulse-tap":
        return <PulseTap {...props} />;
      default:
        return <KingTap {...props} />;
    }
  }, [finish, gameId, liveScore, nonce]);

  return (
    <div className="game-stage">
      <div className="game-hud">
        <button className="ghost-btn" onClick={onExit}>
          Quitter
        </button>
        <div className="pill">
          {game?.title} · {score}
          {stake > 0 ? ` · mise ${stake} ${TOKEN}` : ""}
          {boosted ? " · x2" : ""}
        </div>
      </div>
      {ready && (
        <div key={nonce} style={{ height: "100%" }}>
          {body}
        </div>
      )}
      {!ready && (
        <div className="overlay">
          <div className="panel">
            <h3>{game?.title}</h3>
            <p>{game?.howTo}</p>
            <button className="gold-btn" style={{ marginTop: 16 }} onClick={() => setReady(true)}>
              Jouer
            </button>
          </div>
        </div>
      )}
      {over !== null && (
        <div className="overlay">
          <div className="panel">
            <h3>Partie terminée</h3>
            <p>
              Score{boosted ? " boosté" : ""} : <b>{boosted ? over * 2 : over}</b>
              {stake > 0 ? ` · mise ${stake} ${TOKEN}` : ""}
            </p>
            <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
              {lives > 0 && (
                <button
                  className="gold-btn"
                  disabled={usingLife}
                  onClick={async () => {
                    setUsingLife(true);
                    const ok = await onUseLife();
                    setUsingLife(false);
                    if (!ok) return;
                    setOver(null);
                    setScore(0);
                    setNonce((n) => n + 1);
                  }}
                >
                  Continuer ({lives} vie{lives > 1 ? "s" : ""})
                </button>
              )}
              <button
                className="gold-btn"
                onClick={() => {
                  onFinished(over);
                  setOver(null);
                  setScore(0);
                  setNonce((n) => n + 1);
                  setReady(true);
                }}
              >
                Enregistrer & rejouer
              </button>
              <button
                className="ghost-btn"
                onClick={() => {
                  onFinished(over);
                  onExit();
                }}
              >
                Retour lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
