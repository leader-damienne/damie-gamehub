import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { getPioneer, recordScore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  return NextResponse.json({ pioneer: getPioneer(session.uid) });
}

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const body = (await req.json()) as { gameId?: string; score?: number; stake?: number };
  if (!body.gameId || typeof body.score !== "number") {
    return NextResponse.json({ error: "score invalide" }, { status: 400 });
  }
  const result = recordScore(
    session.uid,
    session.username,
    body.gameId,
    Math.max(0, Math.floor(body.score)),
    Math.max(0, Number(body.stake) || 0),
  );
  return NextResponse.json(result);
}
