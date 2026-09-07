import { NextResponse } from "next/server";
import { bearer, readSession } from "@/lib/session";
import { buyWithCredit, convertDamie, convertPiToDamie, refundWithdraw, stakeDamie, withdrawPi } from "@/lib/store";
import { createA2UPayment, hasApiKey } from "@/lib/pi-server";
import { requirePiReady } from "@/lib/pi-flags";
import { SHOP } from "@/lib/catalog";

export async function POST(req: Request) {
  const session = readSession(bearer(req));
  if (!session) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  const body = (await req.json()) as {
    action?: string;
    amount?: number;
    productId?: string;
  };

  if (body.action === "stake") {
    const result = stakeDamie(session.uid, Number(body.amount) || 0);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }

  if (body.action === "swap-in") {
    const result = convertPiToDamie(session.uid, Number(body.amount) || 0);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }

  if (body.action === "convert") {
    const result = convertDamie(session.uid, Number(body.amount) || 0);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }

  if (body.action === "buy") {
    const item = SHOP.find((s) => s.id === body.productId);
    if (!item) return NextResponse.json({ error: "Article introuvable" }, { status: 400 });
    const result = buyWithCredit(session.uid, item.id, item.amount);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  }

  if (body.action === "withdraw") {
    const blocked = requirePiReady();
    if (blocked) return NextResponse.json({ error: blocked }, { status: 503 });
    const prepared = withdrawPi(session.uid, Number(body.amount) || 0);
    if (!prepared.ok) return NextResponse.json(prepared, { status: 400 });
    if (!hasApiKey()) {
      return NextResponse.json({ ok: true, pioneer: prepared.pioneer, pendingWallet: true });
    }
    try {
      await createA2UPayment(session.uid, prepared.amount, `Retrait Damie GameHub ${prepared.amount} π`);
      return NextResponse.json({ ok: true, pioneer: prepared.pioneer });
    } catch (error) {
      const pioneer = refundWithdraw(session.uid, prepared.amount);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Retrait impossible", pioneer },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
