import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { buyWithCredit, convertDamie, convertPiToDamie, refundWithdraw, stakeDamie, withdrawPi } from "@/lib/store";
import { hasApiKey, hasWalletSeed, withPiRequest } from "@/lib/pi-server";
import { isMainnetHost, requestHost, requirePiReady } from "@/lib/pi-flags";
import { SHOP } from "@/lib/catalog";
import { bootWallet, walletJson } from "@/lib/wallet-cookie";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return withPiRequest(req, async (pi) => {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const body = (await req.json()) as {
    action?: string;
    amount?: number;
    productId?: string;
    paymentId?: string;
  };
  await bootWallet(req, session.uid);

  if (body.action === "stake") {
    const result = await stakeDamie(session.uid, Number(body.amount) || 0);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return walletJson(result, session.uid);
  }

  if (body.action === "swap-in") {
    const result = await convertPiToDamie(session.uid, Number(body.amount) || 0);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return walletJson(result, session.uid);
  }

  if (body.action === "convert") {
    const result = await convertDamie(session.uid, Number(body.amount) || 0);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return walletJson(result, session.uid);
  }

  if (body.action === "buy") {
    const item = SHOP.find((s) => s.id === body.productId);
    if (!item) return NextResponse.json({ error: "Article introuvable" }, { status: 400 });
    const result = await buyWithCredit(session.uid, item.id, item.amount);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return walletJson(result, session.uid);
  }

  if (body.action === "withdraw-status") {
    const blocked = requirePiReady(req);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
    if (!body.paymentId) return NextResponse.json({ error: "paymentId requis" }, { status: 400 });
    try {
      const result = await pi.finishA2UPayment(body.paymentId);
      return NextResponse.json({ ok: true, pendingWithdraw: !result.done, paymentId: body.paymentId });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Retrait impossible" },
        { status: 502 },
      );
    }
  }

  if (body.action === "withdraw") {
    const blocked = requirePiReady(req);
    if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
    if (!hasApiKey(req)) {
      return NextResponse.json({ error: "Clé API Pi manquante. Impossible d’envoyer des π." }, { status: 503 });
    }
    if (!hasWalletSeed(isMainnetHost(requestHost(req)))) {
      return NextResponse.json(
        {
          error:
            "Ajoutez PI_WALLET_SEED dans Cloudflare Settings : la graine secrète (S…, 56 caractères) du App Wallet Mainnet, créée dans develop.pinet.com. Sans ce wallet, Pi refuse les retraits.",
        },
        { status: 503 },
      );
    }
    try {
      await pi.drainIncompleteA2U();
    } catch {
      /* still attempt a new A2U */
    }
    const prepared = await withdrawPi(session.uid, Number(body.amount) || 0);
    if (!prepared.ok) return NextResponse.json(prepared, { status: 400 });
    try {
      const memo = `WD ${prepared.amount} Pi`.slice(0, 24);
      const sent = await pi.sendA2UPayment(session.uid, prepared.amount, memo);
      return walletJson(
        {
          ok: true,
          pioneer: prepared.pioneer,
          pendingWithdraw: sent.pending,
          paymentId: sent.paymentId,
        },
        session.uid,
      );
    } catch (error) {
      const pioneer = await refundWithdraw(session.uid, prepared.amount);
      return walletJson(
        { error: error instanceof Error ? error.message : "Retrait impossible", pioneer },
        session.uid,
        502,
      );
    }
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  });
}
