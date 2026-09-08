import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { grantProduct, takePayment } from "@/lib/store";
import { completePayment, getPayment, hasApiKey } from "@/lib/pi-server";
import { requirePiReady } from "@/lib/pi-flags";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const blocked = requirePiReady();
  if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
  const body = (await req.json()) as { paymentId?: string; txid?: string };
  if (!body.paymentId || !body.txid) {
    return NextResponse.json({ error: "paymentId et txid requis" }, { status: 400 });
  }
  try {
    if (hasApiKey()) {
      await completePayment(body.paymentId, body.txid);
    }
    let pending = takePayment(body.paymentId);
    if (!pending && hasApiKey()) {
      const payment = await getPayment(body.paymentId);
      const productId = String(payment.metadata?.productId || "unknown");
      pending = { uid: session.uid, productId };
    }
    const pioneer = grantProduct(pending?.uid || session.uid, pending?.productId || "unknown");
    return NextResponse.json({ ok: true, pioneer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Complete failed" },
      { status: 502 },
    );
  }
}
