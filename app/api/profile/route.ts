import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { claimMissions, getPioneer, upsertPioneer, useLife } from "@/lib/store";
import { bootWallet, walletJson } from "@/lib/wallet-cookie";

export const dynamic = "force-dynamic";

async function pioneerFor(session: { uid: string; username: string }) {
  return (await getPioneer(session.uid)) || upsertPioneer(session.uid, session.username);
}

export async function GET(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  await bootWallet(req, session.uid);
  return walletJson({ pioneer: await pioneerFor(session) }, session.uid);
}

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  await bootWallet(req, session.uid);
  const body = (await req.json()) as { action?: string };
  if (body.action === "claim") {
    return walletJson({ pioneer: await claimMissions(session.uid) }, session.uid);
  }
  if (body.action === "use-life") {
    const pioneer = await useLife(session.uid);
    if (!pioneer) return NextResponse.json({ error: "Aucune vie restante" }, { status: 400 });
    return walletJson({ pioneer }, session.uid);
  }
  return walletJson({ pioneer: await pioneerFor(session) }, session.uid);
}
