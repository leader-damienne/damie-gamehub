import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { grantProduct, rememberPayment, takePayment } from "@/lib/store";
import { completePayment, getPayment, hasApiKey } from "@/lib/pi-server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const body = (await req.json()) as { paymentId?: string; txid?: string };
  const paymentId = body.paymentId;
  if (!paymentId) return NextResponse.json({ error: "paymentId requis" }, { status: 400 });

  try {
    if (hasApiKey()) {
      const payment = await getPayment(paymentId);
      const txid = body.txid || payment.transaction?.txid;
      if (!txid) return NextResponse.json({ error: "txid manquant" }, { status: 400 });
      if (!payment.status.developer_completed) {
        await completePayment(paymentId, txid);
      }
      const productId = String(payment.metadata?.productId || takePayment(paymentId)?.productId || "unknown");
      const pioneer = grantProduct(session.uid, productId);
      return NextResponse.json({ ok: true, pioneer });
    }
    const pending = takePayment(paymentId);
    if (pending) {
      const pioneer = grantProduct(pending.uid, pending.productId);
      return NextResponse.json({ ok: true, pioneer });
    }
    rememberPayment(paymentId, session.uid, "unknown");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Incomplete failed" },
      { status: 502 },
    );
  }
}
