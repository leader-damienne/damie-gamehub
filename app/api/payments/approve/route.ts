import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { rememberPayment } from "@/lib/store";
import { approvePayment, hasApiKey } from "@/lib/pi-server";
import { requirePiReady } from "@/lib/pi-flags";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const blocked = requirePiReady();
  if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
  const body = (await req.json()) as { paymentId?: string; productId?: string };
  if (!body.paymentId) return NextResponse.json({ error: "paymentId requis" }, { status: 400 });
  rememberPayment(body.paymentId, session.uid, body.productId || "unknown");
  if (!hasApiKey()) {
    return NextResponse.json({ ok: true, sandboxLocal: true });
  }
  try {
    const payment = await approvePayment(body.paymentId);
    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Approve failed" },
      { status: 502 },
    );
  }
}
