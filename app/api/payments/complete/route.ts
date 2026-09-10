import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { grantProduct, takePayment } from "@/lib/store";
import { hasApiKey, withPiRequest } from "@/lib/pi-server";
import { requirePiReady } from "@/lib/pi-flags";
import { bootWallet, walletJson } from "@/lib/wallet-cookie";
import { roundPi } from "@/lib/economy";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withPiRequest(req, async (pi) => {
    const session = readSession(bearer(req));
    if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    const blocked = requirePiReady(req);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
    if (!hasApiKey(req)) {
      return NextResponse.json({ error: blocked || "Clé API Pi manquante" }, { status: 503 });
    }
    const body = (await req.json()) as { paymentId?: string; txid?: string };
    if (!body.paymentId || !body.txid) {
      return NextResponse.json({ error: "paymentId et txid requis" }, { status: 400 });
    }
    try {
      await bootWallet(req, session.uid);
      const payment = await pi.completePaymentReliable(body.paymentId, body.txid);
      const pending = await takePayment(body.paymentId);
      if (payment.metadata?.type === "withdraw") {
        return walletJson({ ok: true, pioneer: null, paymentId: body.paymentId }, session.uid);
      }
      const amount = roundPi(Number(payment.amount) || 0);
      const metaId = String(payment.metadata?.productId || pending?.productId || "");
      const productId = metaId.startsWith("deposit:") ? `deposit:${amount || metaId.slice(8)}` : `deposit:${amount}`;
      const pioneer = await grantProduct(session.uid, productId, session.username, body.paymentId);
      return walletJson({ ok: true, pioneer, paymentId: body.paymentId }, session.uid);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Paiement incomplet" },
        { status: 502 },
      );
    }
  });
}
