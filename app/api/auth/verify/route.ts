import { NextResponse } from "next/server";
import { signSession } from "@/lib/session";
import { defaultPioneer, upsertPioneer } from "@/lib/store";
import { verifyAccessToken } from "@/lib/pi-server";
import { bootWallet, walletJson } from "@/lib/wallet-cookie";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { accessToken?: string };
  if (!body.accessToken) {
    return NextResponse.json({ error: "Connexion Pi requise" }, { status: 400 });
  }
  try {
    const me = await verifyAccessToken(body.accessToken);
    const username = me.username || `Pioneer-${me.uid.slice(0, 6)}`;
    await bootWallet(req, me.uid);
    let pioneer;
    try {
      pioneer = await upsertPioneer(me.uid, username);
    } catch {
      pioneer = defaultPioneer(me.uid, username);
    }
    return walletJson(
      {
        session: signSession(pioneer.uid, pioneer.username),
        pioneer,
      },
      pioneer.uid,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auth Pi impossible" },
      { status: 401 },
    );
  }
}
