"use client";

import { useCallback, useMemo, useState } from "react";
import GameBrief from "@/components/GameBrief";
import { gameById } from "@/lib/catalog";
import { TOKEN, formatDgh, freePlayDgh, stakePayout } from "@/lib/economy";
import {
  CrownCatch,
  GoldSlash,
  OrbitDash,
  ReflexRing,
  StackKing,
} from "./ArcadeGames";
import { GridMerge, KingTap, MazeCrown, MemoryVault, PulseTap } from "./BoardGames";
import { ColorRush, GapFlyer, GoldSnake, LaneRush, SimonCrown, TargetCrown } from "./ExtraGames";
import {
  GoldRally,
  HoverDash,
  JetStrike,
  MotoRush,
  NitroCrown,
  RingFighter,
  SkyAce,
  TankPush,
  TurretSiege,
  WheelieGold,
} from "./VehicleGames";

type Props = {
  gameId: string;
  boosted: boolean;
  lives: number;
  stake: number;
  skipIntro?: boolean;
  onExit: () => void;
  onFinished: (score: number) => void;
  onUseLife: () => Promise<boolean>;
};

export default function GameScreen({
  gameId,
  boosted,
  lives,
  stake,
  skipIntro = false,
  onExit,
  onFinished,
  onUseLife,
}: Props) {
  const game = gameById(gameId);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const [ready, setReady] = useState(skipIntro);
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
      case "lane-rush":
        return <LaneRush {...props} />;
      case "target-crown":
        return <TargetCrown {...props} />;
      case "gold-snake":
        return <GoldSnake {...props} />;
      case "gap-flyer":
        return <GapFlyer {...props} />;
      case "color-rush":
        return <ColorRush {...props} />;
      case "simon-crown":
        return <SimonCrown {...props} />;
      case "moto-rush":
        return <MotoRush {...props} />;
      case "wheelie-gold":
        return <WheelieGold {...props} />;
      case "gold-rally":
        return <GoldRally {...props} />;
      case "nitro-crown":
        return <NitroCrown {...props} />;
      case "ring-fighter":
        return <RingFighter {...props} />;
      case "turret-siege":
        return <TurretSiege {...props} />;
      case "tank-push":
        return <TankPush {...props} />;
      case "sky-ace":
        return <SkyAce {...props} />;
      case "jet-strike":
        return <JetStrike {...props} />;
      case "hover-dash":
        return <HoverDash {...props} />;
      default:
        return <KingTap {...props} />;
    }
  }, [finish, gameId, liveScore, nonce]);

  const finalScore = over === null ? 0 : boosted ? over * 2 : over;
  const reward =
    over === null ? 0 : stake > 0 ? stakePayout(finalScore, stake) : freePlayDgh(finalScore);

  return (
    <div className="game-stage">
      <div className="game-hud">
        <button className="ghost-btn" onClick={onExit}>
          Quitter
        </button>
        <div className="pill">
          {game?.title} · {score}
          {stake > 0 ? ` · mise ${stake} ${TOKEN}` : ` · sans mise`}
          {boosted ? " · x2" : ""}
        </div>
      </div>
      {ready && (
        <div key={nonce} style={{ height: "100%" }}>
          {body}
        </div>
      )}
      {!ready && game && (
        <div className="overlay">
          <div className="panel panel-brief">
            <GameBrief game={game} />
            <button className="gold-btn" style={{ marginTop: 16, width: "100%" }} onClick={() => setReady(true)}>
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
              Score{boosted ? " boosté" : ""} : <b>{finalScore}</b>
              {stake > 0 ? ` · mise ${stake} ${TOKEN}` : " · sans mise"}
            </p>
            <p className="brief-tag">
              {stake > 0
                ? reward > 0
                  ? `Gain de mise : ${formatDgh(reward)} ${TOKEN}`
                  : `Mise perdue`
                : reward > 0
                  ? `Microns gagnés : ${formatDgh(reward)} ${TOKEN}`
                  : `Aucun micron cette partie`}
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
