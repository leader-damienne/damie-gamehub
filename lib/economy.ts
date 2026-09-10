export const TOKEN = "DGH";
export const DGH_PER_PI = 100;
export const DEPOSITS = [0.1, 0.25, 0.5, 1, 2, 5];
export const STAKES = [0, 5, 10, 25, 50];
export const MIN_WITHDRAW = 0.1;
export const MIN_CONVERT = 100;
export const MIN_SWAP_PI = 0.1;
export const MIN_DEPOSIT = 0.01;
export const MAX_DEPOSIT = 10000;

/** 1 micron = 0,01 DGH. Les parties sans mise en rapportent selon le score. */
export const MICRON = 0.01;
export const FREE_PLAY_MAX_DGH = 0.25;

export function roundPi(n: number) {
  return Math.round(n * 10000) / 10000;
}

export function roundDgh(n: number) {
  return Math.round(n * 100) / 100;
}

export function formatDgh(n: number) {
  const v = roundDgh(Number(n) || 0);
  const text = Number.isInteger(v) ? String(v) : v.toFixed(2);
  return text.replace(".", ",");
}

/** Parties sans mise : 1 micron (0,01 DGH) tous les 40 pts, min 1, max 0,25 DGH. */
export function freePlayDgh(score: number) {
  if (score <= 0) return 0;
  const microns = Math.min(25, Math.max(1, Math.floor(score / 40)));
  return roundDgh(microns * MICRON);
}

export function piToDgh(pi: number) {
  return Math.floor(roundPi(pi) * DGH_PER_PI);
}

export function dghToPi(amount: number) {
  return roundPi(Math.floor(amount) / DGH_PER_PI);
}

export function parsePiInput(text: string) {
  const n = Number(String(text).trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return roundPi(n);
}

export function parseDghInput(text: string) {
  const n = Number(String(text).trim().replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

export function stakePayout(score: number, stake: number) {
  if (stake <= 0) return 0;
  let m = 0;
  if (score >= 1000) m = 2;
  else if (score >= 600) m = 1.5;
  else if (score >= 300) m = 1;
  else if (score >= 150) m = 0.5;
  return Math.floor(stake * m);
}
