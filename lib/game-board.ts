import type { GameBoardKind, GameCategory, GameDef } from "./types";

const BY_ID: Record<string, GameBoardKind> = {
  "crown-catch": "catch",
  "reflex-ring": "ring",
  "memory-vault": "cards",
  "orbit-dash": "orbit",
  "stack-king": "stack",
  "pulse-tap": "lanes",
  "grid-merge": "grid",
  "gold-slash": "slash",
  "king-tap": "tap",
  "maze-crown": "maze",
  "lane-rush": "lanes",
  "target-crown": "slash",
  "gold-snake": "maze",
  "gap-flyer": "orbit",
  "color-rush": "cards",
  "simon-crown": "tap",
  "moto-rush": "lanes",
  "wheelie-gold": "orbit",
  "gold-rally": "lanes",
  "nitro-crown": "orbit",
  "ring-fighter": "tap",
  "turret-siege": "slash",
  "tank-push": "catch",
  "sky-ace": "orbit",
  "jet-strike": "slash",
  "hover-dash": "lanes",
};

const BY_CATEGORY: Record<GameCategory, GameBoardKind[]> = {
  arcade: ["catch", "maze"],
  puzzle: ["cards", "grid"],
  action: ["orbit", "slash"],
  competitive: ["ring", "lanes"],
  casual: ["stack", "tap"],
  racing: ["lanes", "orbit"],
  combat: ["slash", "tap"],
  flight: ["orbit", "slash"],
};

export const BOARD_KINDS: GameBoardKind[] = [
  "catch",
  "ring",
  "cards",
  "orbit",
  "stack",
  "lanes",
  "grid",
  "slash",
  "tap",
  "maze",
];

export function boardSeed(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function boardKindFor(game: Pick<GameDef, "id" | "category" | "board">): GameBoardKind {
  if (game.board) return game.board;
  if (BY_ID[game.id]) return BY_ID[game.id];
  const options = BY_CATEGORY[game.category] ?? BOARD_KINDS;
  return options[boardSeed(game.id) % options.length];
}
