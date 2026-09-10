import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { grantProduct, takePayment } from "@/lib/store";
import { completePaymentReliable, getPayment, hasApiKey } from "@/lib/pi-server";
import { requirePiReady } from "@/lib/pi-flags";
import { bootWallet, walletJson } from "@/lib/wallet-cookie";
import { roundPi } from "@/lib/economy";

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
  if (!body.paymentId || !body.txid) {
    return NextResponse.json({ error: "paymentId et txid requis" }, { status: 400 });
  }
  try {
    await bootWallet(req, session.uid);
    const finished = await completePaymentReliable(body.paymentId, body.txid);
    const payment = await getPayment(body.paymentId).catch(() => finished);
    if (payment.user_uid && payment.user_uid !== session.uid) {
      return NextResponse.json({ error: "Paiement Pi d’un autre Pioneer" }, { status: 403 });
    }
    const pending = await takePayment(body.paymentId);
    if (payment.metadata?.type === "withdraw") {
      return walletJson({ ok: true, pioneer: null, paymentId: body.paymentId }, session.uid);
    }
    const amount = roundPi(Number(payment.amount) || 0);
    const metaId = String(payment.metadata?.productId || pending?.productId || "");
    const productId = metaId.startsWith("deposit:") || amount <= 0 ? metaId || `deposit:${amount}` : `deposit:${amount}`;
    const pioneer = await grantProduct(session.uid, productId, session.username, body.paymentId);
    return walletJson({ ok: true, pioneer, paymentId: body.paymentId }, session.uid);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Paiement incomplet" },
      { status: 502 },
    );
  }
}
