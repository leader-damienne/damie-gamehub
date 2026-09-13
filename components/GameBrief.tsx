import GameCover from "@/components/GameCover";
import { FREE_PLAY_MAX_DGH, MICRON, TOKEN, formatDgh } from "@/lib/economy";
import type { GameDef } from "@/lib/types";

export default function GameBrief({ game }: { game: GameDef }) {
  return (
    <>
      <GameCover id={game.id} className="cover-lg" />
      <h3>{game.title}</h3>
      <p className="brief-tag">{game.tagline}</p>
      <div className="brief">
        <h4>Règles</h4>
        <ul>
          {game.rules.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <h4>Avantages</h4>
        <ul>
          {game.perks.map((line) => (
            <li key={line}>{line}</li>
          ))}
          <li>
            Sans mise : des microns de {TOKEN} selon le score (1 micron = {formatDgh(MICRON)} {TOKEN}, max{" "}
            {formatDgh(FREE_PLAY_MAX_DGH)} {TOKEN} par partie).
          </li>
          <li>Avec mise : 150 pts = 50% · 300 = mise rendue · 600 = ×1,5 · 1000 = ×2.</li>
          <li>Chaque partie compte pour les missions, les couronnes et le classement.</li>
        </ul>
      </div>
    </>
  );
}
