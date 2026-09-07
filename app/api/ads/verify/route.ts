import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { markAd } from "@/lib/store";
import { hasApiKey, verifyRewardedAd } from "@/lib/pi-server";
import { requirePiReady } from "@/lib/pi-flags";

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const blocked = requirePiReady();
  if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
  const body = (await req.json()) as { adId?: string };
  if (hasApiKey()) {
    if (!body.adId) {
      return NextResponse.json({ error: "adId requis pour récompenser" }, { status: 400 });
    }
    const check = await verifyRewardedAd(body.adId);
    if (!check.ok) {
      return NextResponse.json({ error: "Pub non vérifiée" }, { status: 403 });
    }
  } else if (!body.adId) {
    return NextResponse.json({ error: "Pub Pi requise" }, { status: 400 });
  }
  const pioneer = markAd(session.uid);
  return NextResponse.json({ ok: true, pioneer });
}
