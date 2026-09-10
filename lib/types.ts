export type View =
  | "splash"
  | "lobby"
  | "play"
  | "tournaments"
  | "rankings"
  | "shop"
  | "wallet"
  | "profile"
  | "privacy";

export type GameCategory = "arcade" | "puzzle" | "action" | "competitive" | "casual";

export type GameDef = {
  id: string;
  title: string;
  tagline: string;
  category: GameCategory;
  accent: string;
  howTo: string;
  rules: string[];
  perks: string[];
};

export type Pioneer = {
  uid: string;
  username: string;
  crownScore: number;
  coins: number;
  tickets: number;
  lives: number;
  boostUntil: number;
  streak: number;
  lastPlayDay: string;
  gamesPlayed: number;
  adsWatched: number;
  piCredit: number;
  damie: number;
  ledger: { at: number; type: string; amount: number; memo: string }[];
  bestScores: Record<string, number>;
  missions: {
    play3: number;
    score500: boolean;
    ad1: boolean;
    tournament1: boolean;
    claimed: boolean;
  };
};

export type ScoreEntry = {
  uid: string;
  username: string;
  gameId: string;
  score: number;
  at: number;
};

export type TournamentDef = {
  id: string;
  title: string;
  gameId: string;
  entryPi: number;
  prizeLabel: string;
  durationHours: number;
};

export type TournamentState = {
  id: string;
  endsAt: number;
  entries: Record<string, { username: string; best: number }>;
};

export type ShopItem = {
  id: string;
  name: string;
  detail: string;
  amount: number;
  tickets?: number;
  lives?: number;
  coins?: number;
  crowns?: number;
  boostMs?: number;
};

export type StoreShape = {
  pioneers: Record<string, Pioneer>;
  scores: ScoreEntry[];
  tournaments: Record<string, TournamentState>;
  pendingPayments: Record<string, { uid: string; productId: string }>;
};
