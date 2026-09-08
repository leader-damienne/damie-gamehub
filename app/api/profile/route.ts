import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { claimMissions, getPioneer, upsertPioneer, useLife } from "@/lib/store";

export const dynamic = "force-dynamic";

function pioneerFor(session: { uid: string; username: string }) {
  return getPioneer(session.uid) || upsertPioneer(session.uid, session.username);
}

export async function GET(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  return NextResponse.json({ pioneer: pioneerFor(session) });
}

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const body = (await req.json()) as { action?: string };
  if (body.action === "claim") {
    return NextResponse.json({ pioneer: claimMissions(session.uid) });
  }
  if (body.action === "use-life") {
    const pioneer = useLife(session.uid);
    if (!pioneer) return NextResponse.json({ error: "Aucune vie restante" }, { status: 400 });
    return NextResponse.json({ pioneer });
  }
  return NextResponse.json({ pioneer: pioneerFor(session) });
}
