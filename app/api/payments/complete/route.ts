import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { grantProduct, takePayment } from "@/lib/store";
import { completePayment, getPayment, hasApiKey } from "@/lib/pi-server";
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
  if (!body.paymentId || !body.txid) {
    return NextResponse.json({ error: "paymentId et txid requis" }, { status: 400 });
  }
  try {
    await bootWallet(req, session.uid);
    const payment = await getPayment(body.paymentId);
    if (payment.user_uid && payment.user_uid !== session.uid) {
      return NextResponse.json({ error: "Paiement Pi d’un autre Pioneer" }, { status: 403 });
    }
    if (payment.status.cancelled || payment.status.user_cancelled) {
      return NextResponse.json({ error: "Paiement Pi annulé" }, { status: 400 });
    }
    if (!payment.status.developer_completed) {
      await completePayment(body.paymentId, body.txid);
    }
    const pending = await takePayment(body.paymentId);
    const productId = String(payment.metadata?.productId || pending?.productId || "");
    if (productId.startsWith("deposit:")) {
      const expected = Number(productId.slice("deposit:".length));
      if (!Number.isFinite(expected) || Math.abs(Number(payment.amount) - expected) > 0.0001) {
        return NextResponse.json({ error: "Montant de dépôt incohérent" }, { status: 400 });
      }
    }
    if (!productId || productId === "unknown") {
      return NextResponse.json({ error: "Produit de paiement inconnu" }, { status: 400 });
    }
    const pioneer = await grantProduct(session.uid, productId, session.username, body.paymentId);
    return walletJson({ ok: true, pioneer, paymentId: body.paymentId }, session.uid);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Paiement incomplet" },
      { status: 502 },
    );
  }
}
