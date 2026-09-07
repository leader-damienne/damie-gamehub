export const TOKEN = "DGH";
export const DGH_PER_PI = 100;
export const DEPOSITS = [0.1, 0.25, 0.5, 1, 2, 5];
export const STAKES = [0, 5, 10, 25, 50];
export const MIN_WITHDRAW = 0.1;
export const MIN_CONVERT = 100;
export const MIN_SWAP_PI = 0.1;

export function roundPi(n: number) {
  return Math.round(n * 10000) / 10000;
}

export function piToDgh(pi: number) {
  return Math.floor(roundPi(pi) * DGH_PER_PI);
}

export function dghToPi(amount: number) {
  return roundPi(Math.floor(amount) / DGH_PER_PI);
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

export function dghFromScore(score: number) {
  return Math.max(1, Math.floor(score / 8));
}
