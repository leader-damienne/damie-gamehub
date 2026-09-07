import { NextResponse } from "next/server";
import { signSession } from "@/lib/session";
import { upsertPioneer } from "@/lib/store";
import { verifyAccessToken } from "@/lib/pi-server";

export async function POST(req: Request) {
  const body = (await req.json()) as { accessToken?: string };
  if (!body.accessToken) {
    return NextResponse.json({ error: "Connexion Pi requise" }, { status: 400 });
  }
  try {
    const me = await verifyAccessToken(body.accessToken);
    const username = me.username || `Pioneer-${me.uid.slice(0, 6)}`;
    const pioneer = upsertPioneer(me.uid, username);
    return NextResponse.json({
      session: signSession(pioneer.uid, pioneer.username),
      pioneer,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Auth Pi impossible" },
      { status: 401 },
    );
  }
}
