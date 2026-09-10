import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import type { Pioneer } from "./types";
import { absorbWalletSnap, creditedFor, getPioneer } from "./store";

const COOKIE = "damie_wallet";

function secret() {
  return process.env.SESSION_SECRET || process.env.PI_API_KEY || "damie-gamehub-dev-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export type WalletSnap = Pioneer & { credited: string[] };

export function readWalletCookie(req: Request): WalletSnap | null {
  const header = req.headers.get("cookie") || "";
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${COOKIE}=`));
  if (!match) return null;
  const token = decodeURIComponent(match.slice(COOKIE.length + 1));
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if (!same(sign(payload), sig)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as WalletSnap;
    if (!data?.uid) return null;
    return data;
  } catch {
    return null;
  }
}

export function signWalletCookie(snap: WalletSnap) {
  const compact = {
    uid: snap.uid,
    username: snap.username,
    piCredit: snap.piCredit,
    damie: snap.damie,
    coins: snap.coins,
    tickets: snap.tickets,
    lives: snap.lives,
    boostUntil: snap.boostUntil,
    crownScore: snap.crownScore,
    gamesPlayed: snap.gamesPlayed,
    adsWatched: snap.adsWatched,
    streak: snap.streak,
    lastPlayDay: snap.lastPlayDay,
    missions: snap.missions,
    ledger: (snap.ledger || []).slice(0, 8),
    credited: (snap.credited || []).slice(-24),
  };
  const payload = Buffer.from(JSON.stringify(compact), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function attachWalletCookie(res: NextResponse, snap: WalletSnap | null) {
  if (!snap) return res;
  res.cookies.set(COOKIE, signWalletCookie(snap), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return res;
}

export async function bootWallet(req: Request, uid: string) {
  await absorbWalletSnap(uid, readWalletCookie(req));
}

export async function walletJson(body: unknown, uid: string, status = 200) {
  const payload = body as { pioneer?: Pioneer | null };
  const pioneer = payload.pioneer || (await getPioneer(uid));
  const credited = await creditedFor(uid);
  const res = NextResponse.json(body, { status });
  if (pioneer) attachWalletCookie(res, { ...pioneer, credited });
  return res;
}
