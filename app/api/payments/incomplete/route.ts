import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { grantProduct, takePayment } from "@/lib/store";
import { cancelPayment, completePayment, getPayment, hasApiKey } from "@/lib/pi-server";
import { requirePiReady } from "@/lib/pi-flags";
import { bootWallet, walletJson } from "@/lib/wallet-cookie";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const blocked = requirePiReady();
  if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
  if (!hasApiKey()) {
    return NextResponse.json({ error: "Clé API Pi manquante" }, { status: 503 });
  }
  const body = (await req.json()) as { paymentId?: string; txid?: string };
  const paymentId = body.paymentId;
  if (!paymentId) return NextResponse.json({ error: "paymentId requis" }, { status: 400 });

  try {
    await bootWallet(req, session.uid);
    const payment = await getPayment(paymentId);
    if (payment.user_uid && payment.user_uid !== session.uid) {
      return NextResponse.json({ error: "Paiement Pi d’un autre Pioneer" }, { status: 403 });
    }
    if (payment.status.cancelled || payment.status.user_cancelled) {
      await takePayment(paymentId);
      return NextResponse.json({ ok: true, cancelled: true });
    }
    const txid = body.txid || payment.transaction?.txid;
    if (!txid) {
      const created = Date.parse(payment.created_at);
      if (Number.isFinite(created) && Date.now() - created > 5 * 60 * 1000) {
        await cancelPayment(paymentId);
        await takePayment(paymentId);
        return NextResponse.json({ ok: true, cancelled: true });
      }
      return NextResponse.json({ error: "Paiement Pi encore en cours. Réessayez dans un instant." }, { status: 409 });
    }
    if (!payment.status.developer_completed) {
      await completePayment(paymentId, txid);
    }
    const pending = await takePayment(paymentId);
    const productId = String(payment.metadata?.productId || pending?.productId || "");
    if (payment.metadata?.type === "withdraw" || !productId || productId === "unknown") {
      return walletJson({ ok: true, pioneer: null }, session.uid);
    }
    const pioneer = await grantProduct(session.uid, productId, session.username, paymentId);
    return walletJson({ ok: true, pioneer, paymentId }, session.uid);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Paiement incomplet" },
      { status: 502 },
    );
  }
}
