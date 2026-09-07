import type { GameDef, ShopItem, TournamentDef } from "./types";

export const GAMES: GameDef[] = [
  {
    id: "crown-catch",
    title: "Crown Catch",
    tagline: "Attrapez l'or, évitez les pièges",
    category: "arcade",
    accent: "#d4af37",
    howTo: "Glissez le panier. Attrapez l’or, évitez les boules noires.",
  },
  {
    id: "reflex-ring",
    title: "Reflex Ring",
    tagline: "Tapez dans la zone d'or",
    category: "competitive",
    accent: "#f0d56a",
    howTo: "Touchez l’écran quand l’anneau est sur la zone d’or.",
  },
  {
    id: "memory-vault",
    title: "Memory Vault",
    tagline: "Mémorisez les couronnes",
    category: "puzzle",
    accent: "#c9a227",
    howTo: "Retournez deux cartes identiques jusqu’à tout vider.",
  },
  {
    id: "orbit-dash",
    title: "Orbit Dash",
    tagline: "Survivez dans l'orbite",
    category: "action",
    accent: "#e8c547",
    howTo: "Touchez gauche / droite pour tourner. Prenez l’or, évitez les rochers.",
  },
  {
    id: "stack-king",
    title: "Stack King",
    tagline: "Empilez parfaitement",
    category: "casual",
    accent: "#d4af37",
    howTo: "Touchez pour poser chaque barre le plus au centre possible.",
  },
  {
    id: "pulse-tap",
    title: "Pulse Tap",
    tagline: "Rythme et précision",
    category: "competitive",
    accent: "#f5d76e",
    howTo: "Appuyez sur la voie quand la barre d’or passe la ligne.",
  },
  {
    id: "grid-merge",
    title: "Grid Merge",
    tagline: "Fusionnez les tuiles d'or",
    category: "puzzle",
    accent: "#b8962e",
    howTo: "Glissez pour fusionner les mêmes nombres.",
  },
  {
    id: "gold-slash",
    title: "Gold Slash",
    tagline: "Tranchez l'or en vol",
    category: "action",
    accent: "#d4af37",
    howTo: "Balayez les orbes d’or. Ne touchez pas les noirs.",
  },
  {
    id: "king-tap",
    title: "King Tap",
    tagline: "Combo de taps royaux",
    category: "casual",
    accent: "#f0d56a",
    howTo: "Tapez le plus vite possible pendant 15 secondes.",
  },
  {
    id: "maze-crown",
    title: "Maze Crown",
    tagline: "Collectez avant le garde",
    category: "arcade",
    accent: "#c9a227",
    howTo: "Glissez pour bouger. Ramassez l’or avant le garde.",
  },
];

export const CATEGORIES: { id: "all" | GameDef["category"]; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "arcade", label: "Arcade" },
  { id: "puzzle", label: "Puzzle" },
  { id: "action", label: "Action" },
  { id: "competitive", label: "Compétitif" },
  { id: "casual", label: "Casual" },
];

export const TOURNAMENTS: TournamentDef[] = [
  {
    id: "daily-cup",
    title: "Daily Crown Cup",
    gameId: "reflex-ring",
    entryPi: 0,
    prizeLabel: "Couronnes + badge",
    durationHours: 24,
  },
  {
    id: "gold-clash",
    title: "Gold Clash",
    gameId: "crown-catch",
    entryPi: 0.1,
    prizeLabel: "Coffre d'or",
    durationHours: 48,
  },
  {
    id: "merge-masters",
    title: "Merge Masters",
    gameId: "grid-merge",
    entryPi: 0.05,
    prizeLabel: "Boost x2",
    durationHours: 36,
  },
  {
    id: "tap-throne",
    title: "Tap Throne",
    gameId: "king-tap",
    entryPi: 0.2,
    prizeLabel: "Couronne royale",
    durationHours: 72,
  },
];

export const SHOP: ShopItem[] = [
  {
    id: "tickets-5",
    name: "5 tickets tournoi",
    detail: "Accès immédiat aux coupes payantes",
    amount: 0.25,
    tickets: 5,
  },
  {
    id: "boost-1h",
    name: "Boost Couronne x2",
    detail: "Score doublé pendant 1 heure",
    amount: 0.1,
    boostMs: 60 * 60 * 1000,
  },
  {
    id: "lives-3",
    name: "Pack 3 vies",
    detail: "Continuez après un game over",
    amount: 0.05,
    lives: 3,
  },
  {
    id: "crown-200",
    name: "Pack 200 Couronnes",
    detail: "Progression de saison",
    amount: 0.2,
    crowns: 200,
  },
];

export function gameById(id: string) {
  return GAMES.find((g) => g.id === id);
}
