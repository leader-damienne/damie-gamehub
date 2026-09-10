import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { enterTournament, listTournaments, tournamentScore } from "@/lib/store";
import { bootWallet, walletJson } from "@/lib/wallet-cookie";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ tournaments: await listTournaments() });
}

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  await bootWallet(req, session.uid);
  const body = (await req.json()) as {
    action?: string;
    tournamentId?: string;
    score?: number;
  };
  if (!body.tournamentId) {
    return NextResponse.json({ error: "tournamentId requis" }, { status: 400 });
  }
  if (body.action === "score") {
    const result = await tournamentScore(session.uid, body.tournamentId, Math.max(0, Math.floor(body.score || 0)));
    return NextResponse.json(result);
  }
  const result = await enterTournament(session.uid, session.username, body.tournamentId);
  if (!result.ok) return NextResponse.json(result);
  return walletJson(result, session.uid);
}
