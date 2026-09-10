import fs from "fs";
import path from "path";
import type { Pioneer, StoreShape, TournamentState } from "./types";
import { GAMES, TOURNAMENTS } from "./catalog";
import { MIN_CONVERT, MIN_SWAP_PI, MIN_WITHDRAW, TOKEN, dghToPi, freePlayDgh, piToDgh, roundDgh, roundPi, stakePayout } from "./economy";

const emptyMissions = () => ({
  play3: 0,
  score500: false,
  ad1: false,
  tournament1: false,
  claimed: false,
});

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function storePath() {
  try {
    const dir =
      process.env.VERCEL || process.env.CF_PAGES || process.env.CLOUDFLARE
        ? "/tmp"
        : path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, "store.json");
  } catch {
    return "";
  }
}

function freshTournaments(): Record<string, TournamentState> {
  const now = Date.now();
  const map: Record<string, TournamentState> = {};
  for (const t of TOURNAMENTS) {
    map[t.id] = {
      id: t.id,
      endsAt: now + t.durationHours * 60 * 60 * 1000,
      entries: {},
    };
  }
  return map;
}

function defaultStore(): StoreShape {
  return { pioneers: {}, scores: [], tournaments: freshTournaments(), pendingPayments: {} };
}

let memory: StoreShape | null = null;

function load(): StoreShape {
  if (memory) return rotateTournaments(memory);
  const file = storePath();
  if (file) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      memory = JSON.parse(raw) as StoreShape;
    } catch {
      memory = defaultStore();
    }
  } else {
    memory = defaultStore();
  }
  return rotateTournaments(memory);
}

function save(data: StoreShape) {
  memory = data;
  const file = storePath();
  if (!file) return;
  try {
    fs.writeFileSync(file, JSON.stringify(data));
  } catch {
    /* Cloudflare / serverless may block disk writes */
  }
}

function rotateTournaments(data: StoreShape) {
  const now = Date.now();
  for (const t of TOURNAMENTS) {
    const current = data.tournaments[t.id];
    if (!current || current.endsAt < now) {
      data.tournaments[t.id] = {
        id: t.id,
        endsAt: now + t.durationHours * 60 * 60 * 1000,
        entries: {},
      };
    }
  }
  return data;
}

export function defaultPioneer(uid: string, username: string): Pioneer {
  return {
    uid,
    username,
    crownScore: 0,
    coins: 0,
    tickets: 0,
    lives: 0,
    boostUntil: 0,
    streak: 1,
    lastPlayDay: todayKey(),
    gamesPlayed: 0,
    adsWatched: 0,
    piCredit: 0,
    damie: 0,
    ledger: [],
    bestScores: {},
    missions: emptyMissions(),
  };
}

function normalize(p: Pioneer): Pioneer {
  return {
    ...defaultPioneer(p.uid, p.username),
    ...p,
    piCredit: p.piCredit || 0,
    damie: roundDgh(p.damie || 0),
    ledger: Array.isArray(p.ledger) ? p.ledger : [],
  };
}

function note(p: Pioneer, type: string, amount: number, memo: string) {
  p.ledger = [{ at: Date.now(), type, amount, memo }, ...(p.ledger || [])].slice(0, 30);
}

function rollDay(p: Pioneer) {
  const n = normalize(p);
  const day = todayKey();
  if (n.lastPlayDay === day) return n;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);
  n.streak = n.lastPlayDay === yKey ? n.streak + 1 : 1;
  n.lastPlayDay = day;
  n.missions = emptyMissions();
  return n;
}

export function upsertPioneer(uid: string, username: string) {
  const data = load();
  const existing = data.pioneers[uid];
  data.pioneers[uid] = rollDay(existing ? { ...existing, username } : defaultPioneer(uid, username));
  save(data);
  return data.pioneers[uid];
}

export function getPioneer(uid: string) {
  const data = load();
  const p = data.pioneers[uid];
  if (!p) return null;
  data.pioneers[uid] = rollDay(p);
  save(data);
  return data.pioneers[uid];
}

export function savePioneer(p: Pioneer) {
  const data = load();
  data.pioneers[p.uid] = p;
  save(data);
  return p;
}

export function grantProduct(uid: string, productId: string) {
  const p = getPioneer(uid);
  if (!p) return null;
  if (productId.startsWith("deposit:")) {
    const amount = roundPi(Number(productId.slice("deposit:".length)));
    if (amount > 0) {
      p.piCredit = roundPi(p.piCredit + amount);
      note(p, "deposit", amount, `Dépôt ${amount} π`);
    }
  }
  if (productId === "tickets-5") {
    p.tickets += 5;
    note(p, "buy", 0.25, "5 tickets tournoi");
  }
  if (productId === "boost-1h") p.boostUntil = Math.max(p.boostUntil, Date.now()) + 60 * 60 * 1000;
  if (productId === "lives-3") p.lives += 3;
  if (productId === "crown-200") p.crownScore += 200;
  if (productId.startsWith("tournament:")) {
    const tournamentId = productId.slice("tournament:".length);
    enterTournament(uid, p.username, tournamentId, true);
  }
  savePioneer(p);
  return p;
}

export function buyWithCredit(uid: string, productId: string, piPrice: number) {
  const p = getPioneer(uid);
  if (!p) return { ok: false as const, error: "Compte introuvable" };
  const cost = piToDgh(piPrice);
  if (p.damie < cost) return { ok: false as const, error: `${TOKEN} insuffisants. Échangez d’abord vos π.` };
  p.damie -= cost;
  note(p, "buy", -cost, `Achat ${cost} ${TOKEN}`);
  savePioneer(p);
  const pioneer = grantProduct(uid, productId);
  return { ok: true as const, pioneer };
}

export function stakeDamie(uid: string, amount: number) {
  const p = getPioneer(uid);
  if (!p) return { ok: false as const, error: "Compte introuvable" };
  const stake = Math.floor(amount);
  if (stake < 0) return { ok: false as const, error: "Mise invalide" };
  if (stake > 0 && p.damie < stake) {
    return { ok: false as const, error: `${TOKEN} insuffisants. Déposez des π puis échangez-les.` };
  }
  if (stake > 0) {
    p.damie -= stake;
    note(p, "stake", -stake, `Mise ${stake} ${TOKEN}`);
    savePioneer(p);
  }
  return { ok: true as const, pioneer: p, stake };
}

export function convertPiToDamie(uid: string, piAmount: number) {
  const p = getPioneer(uid);
  if (!p) return { ok: false as const, error: "Compte introuvable" };
  const qty = roundPi(piAmount);
  if (qty < MIN_SWAP_PI) return { ok: false as const, error: `Minimum ${MIN_SWAP_PI} π` };
  if (p.piCredit < qty) return { ok: false as const, error: "Solde π insuffisant" };
  const tokens = piToDgh(qty);
  p.piCredit = roundPi(p.piCredit - qty);
  p.damie += tokens;
  note(p, "swap-in", tokens, `${qty} π → ${tokens} ${TOKEN}`);
  savePioneer(p);
  return { ok: true as const, pioneer: p, tokens };
}

export function convertDamie(uid: string, damieAmount: number) {
  const p = getPioneer(uid);
  if (!p) return { ok: false as const, error: "Compte introuvable" };
  const qty = Math.floor(damieAmount);
  if (qty < MIN_CONVERT) return { ok: false as const, error: `Minimum ${MIN_CONVERT} ${TOKEN}` };
  if (p.damie < qty) return { ok: false as const, error: `${TOKEN} insuffisants` };
  const pi = dghToPi(qty);
  p.damie -= qty;
  p.piCredit = roundPi(p.piCredit + pi);
  note(p, "swap-out", pi, `${qty} ${TOKEN} → ${pi} π`);
  savePioneer(p);
  return { ok: true as const, pioneer: p, pi };
}

export function withdrawPi(uid: string, amount: number) {
  const p = getPioneer(uid);
  if (!p) return { ok: false as const, error: "Compte introuvable" };
  const qty = roundPi(amount);
  if (qty < MIN_WITHDRAW) return { ok: false as const, error: `Minimum ${MIN_WITHDRAW} π` };
  if (p.piCredit < qty) return { ok: false as const, error: "Solde π insuffisant" };
  p.piCredit = roundPi(p.piCredit - qty);
  note(p, "withdraw", -qty, `Retrait ${qty} π vers le wallet Pi`);
  savePioneer(p);
  return { ok: true as const, pioneer: p, amount: qty };
}

export function refundWithdraw(uid: string, amount: number) {
  const p = getPioneer(uid);
  if (!p) return null;
  p.piCredit = roundPi(p.piCredit + amount);
  note(p, "refund", amount, "Retrait échoué, solde recrédité");
  return savePioneer(p);
}

export function recordScore(uid: string, username: string, gameId: string, score: number, stake = 0) {
  const data = load();
  const p = rollDay(data.pioneers[uid] || defaultPioneer(uid, username));
  const boosted = p.boostUntil > Date.now();
  const finalScore = boosted ? score * 2 : score;
  p.username = username;
  p.gamesPlayed += 1;
  p.coins += Math.max(2, Math.floor(finalScore / 40));
  p.crownScore += 10 + Math.floor(finalScore / 12);
  p.bestScores[gameId] = Math.max(p.bestScores[gameId] || 0, finalScore);
  p.missions.play3 = Math.min(3, p.missions.play3 + 1);
  if (finalScore >= 500) p.missions.score500 = true;
  const payout = stakePayout(finalScore, stake);
  let earned = 0;
  if (stake > 0) {
    p.damie = roundDgh(p.damie + payout);
    note(p, payout > stake ? "win" : payout === 0 ? "lose" : "result", payout - stake, `Mise ${stake} ${TOKEN} → ${payout} ${TOKEN}`);
  } else {
    earned = freePlayDgh(finalScore);
    if (earned > 0) {
      p.damie = roundDgh(p.damie + earned);
      note(p, "micron", earned, `Sans mise · +${earned} ${TOKEN}`);
    }
  }
  data.pioneers[uid] = p;
  data.scores.push({ uid, username, gameId, score: finalScore, at: Date.now() });
  data.scores = data.scores.sort((a, b) => b.score - a.score).slice(0, 400);
  save(data);
  return { pioneer: p, score: finalScore, boosted, payout, stake, damie: earned };
}

export function leaderboard(gameId?: string) {
  const data = load();
  const rows = gameId ? data.scores.filter((s) => s.gameId === gameId) : data.scores;
  const best = new Map<string, { username: string; score: number; gameId: string }>();
  for (const row of rows) {
    const prev = best.get(row.uid);
    if (!prev || row.score > prev.score) {
      best.set(row.uid, { username: row.username, score: row.score, gameId: row.gameId });
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, 50);
}

export function listTournaments() {
  const data = load();
  return TOURNAMENTS.map((def) => {
    const state = data.tournaments[def.id];
    const board = Object.entries(state.entries)
      .map(([uid, e]) => ({ uid, ...e }))
      .sort((a, b) => b.best - a.best)
      .slice(0, 20);
    return { ...def, endsAt: state.endsAt, players: board.length, board };
  });
}

export function enterTournament(uid: string, username: string, tournamentId: string, paid = false) {
  const data = load();
  const def = TOURNAMENTS.find((t) => t.id === tournamentId);
  const state = data.tournaments[tournamentId];
  if (!def || !state || !data.pioneers[uid]) return { ok: false as const, error: "Tournoi introuvable" };
  const player = normalize(data.pioneers[uid]);
  if (state.entries[uid]) return { ok: true as const, pioneer: player, already: true };
  if (def.entryPi > 0 && !paid) {
    const cost = piToDgh(def.entryPi);
    if (player.tickets >= 1) {
      player.tickets -= 1;
    } else if (player.damie >= cost) {
      player.damie -= cost;
      note(player, "stake", -cost, `Entrée tournoi ${def.title}`);
    } else {
      return { ok: false as const, error: `${TOKEN} ou ticket insuffisant` };
    }
  }
  state.entries[uid] = { username, best: 0 };
  player.missions.tournament1 = true;
  data.pioneers[uid] = player;
  save(data);
  return { ok: true as const, pioneer: player, already: false };
}

export function tournamentScore(uid: string, tournamentId: string, score: number) {
  const data = load();
  const state = data.tournaments[tournamentId];
  if (!state?.entries[uid]) return { ok: false as const, error: "Non inscrit" };
  state.entries[uid].best = Math.max(state.entries[uid].best, score);
  save(data);
  return { ok: true as const, best: state.entries[uid].best };
}

export function rememberPayment(paymentId: string, uid: string, productId: string) {
  const data = load();
  data.pendingPayments[paymentId] = { uid, productId };
  save(data);
}

export function takePayment(paymentId: string) {
  const data = load();
  const pending = data.pendingPayments[paymentId];
  if (pending) {
    delete data.pendingPayments[paymentId];
    save(data);
  }
  return pending;
}

export function markAd(uid: string) {
  const p = getPioneer(uid);
  if (!p) return null;
  p.adsWatched += 1;
  p.coins += 15;
  p.lives += 1;
  p.damie += 10;
  p.missions.ad1 = true;
  return savePioneer(p);
}

export function claimMissions(uid: string) {
  const p = getPioneer(uid);
  if (!p) return null;
  const done =
    p.missions.play3 >= 3 && p.missions.score500 && p.missions.ad1 && p.missions.tournament1;
  if (!done || p.missions.claimed) return p;
  p.missions.claimed = true;
  p.crownScore += 80;
  p.coins += 50;
  p.tickets += 1;
  return savePioneer(p);
}

export function useLife(uid: string) {
  const p = getPioneer(uid);
  if (!p || p.lives < 1) return null;
  p.lives -= 1;
  return savePioneer(p);
}

export function gameStats() {
  const data = load();
  const plays: Record<string, number> = {};
  const uniques: Record<string, Set<string>> = {};
  for (const row of data.scores) {
    plays[row.gameId] = (plays[row.gameId] || 0) + 1;
    if (!uniques[row.gameId]) uniques[row.gameId] = new Set();
    uniques[row.gameId].add(row.uid);
  }
  return Object.fromEntries(
    GAMES.map((g) => [
      g.id,
      { plays: plays[g.id] || 0, players: uniques[g.id]?.size || 0 },
    ]),
  ) as Record<string, { plays: number; players: number }>;
}
