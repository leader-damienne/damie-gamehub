import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { getPioneer, grantProduct } from "@/lib/store";
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
  const body = (await req.json()) as { receipts?: { paymentId?: string }[] };
  const receipts = Array.isArray(body.receipts) ? body.receipts : [];
  await bootWallet(req, session.uid);
  let pioneer = await getPioneer(session.uid);
  for (const row of receipts.slice(0, 40)) {
    const paymentId = row.paymentId;
    if (!paymentId) continue;
    try {
      const payment = await getPayment(paymentId);
      if (payment.user_uid && payment.user_uid !== session.uid) continue;
      if (payment.status.cancelled || payment.status.user_cancelled) continue;
      if (payment.metadata?.type === "withdraw") continue;
      const txid = payment.transaction?.txid;
      if (txid && !payment.status.developer_completed) {
        await completePayment(paymentId, txid);
      }
      const productId = String(payment.metadata?.productId || "");
      if (!productId.startsWith("deposit:")) continue;
      pioneer = await grantProduct(session.uid, productId, session.username, paymentId);
    } catch {
      /* skip a bad receipt, continue the rest */
    }
  }
  return walletJson({ ok: true, pioneer }, session.uid);
}
