const API = "https://api.minepi.com/v2";

function apiKey() {
  return process.env.PI_API_KEY || "";
}

export function hasApiKey() {
  return Boolean(apiKey());
}

export function explainPiError(raw: string) {
  const text = (raw || "").toLowerCase();
  if (text.includes("wallet") && (text.includes("none") || text.includes("not") || text.includes("missing") || text.includes("setup"))) {
    return "Wallet de l’app Pi non configuré. Dans develop.pinet.com, créez un App Wallet (pas None) et alimentez-le.";
  }
  if (text.includes("insufficient") || text.includes("not enough") || text.includes("balance")) {
    return "Solde du wallet de l’app insuffisant pour envoyer des π.";
  }
  if (text.includes("unauthorized") || text.includes("api key") || text.includes("invalid key") || text.includes("forbidden")) {
    return "Clé API Pi invalide pour ce réseau. Sur damiegamehub.com il faut la clé Mainnet (pas celle du Testnet).";
  }
  if (text.includes("sandbox") && text.includes("network")) {
    return "Réseau Pi incohérent : l’app Mainnet doit utiliser la clé API Mainnet.";
  }
  if (text.includes("migrat") || text.includes("kyc") || (text.includes("mainnet") && text.includes("wallet"))) {
    return "Wallet Mainnet manquant. Le compte développeur doit avoir un wallet Pi Mainnet migré (KYC).";
  }
  if (text.includes("not verified") || text.includes("txid") || text.includes("pending")) {
    return "Transaction Pi pas encore confirmée. Nouvelle tentative…";
  }
  if (text.includes("memo")) {
    return "Mémo de paiement Pi refusé. Réessayez.";
  }
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 240) || "Erreur Pi";
}

async function piFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Key ${apiKey()}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(explainPiError(text || `HTTP ${res.status}`));
  }
  if (!text) return {} as never;
  try {
    return JSON.parse(text);
  } catch {
    return {} as never;
  }
}

export async function verifyAccessToken(accessToken: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(`${API}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: ctrl.signal,
    });
  } catch {
    throw new Error("Pi API trop lente. Réessayez.");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    throw new Error(`Jeton Pi invalide (${res.status})`);
  }
  const me = (await res.json()) as { uid?: string; username?: string };
  if (!me.uid) throw new Error("Réponse Pi /me incomplète");
  return me as { uid: string; username?: string };
}

export async function approvePayment(paymentId: string) {
  return piFetch(`/payments/${paymentId}/approve`, { method: "POST" });
}

export async function completePayment(paymentId: string, txid: string) {
  return piFetch(`/payments/${paymentId}/complete`, {
    method: "POST",
    body: JSON.stringify({ txid }),
  });
}

export async function completePaymentReliable(paymentId: string, txid?: string) {
  let lastError: Error | null = null;
  for (let i = 0; i < 10; i += 1) {
    try {
      const current = await getPayment(paymentId);
      if (current.status.developer_completed) return current;
      if (current.status.cancelled || current.status.user_cancelled) {
        throw new Error("Paiement Pi annulé");
      }
      const useTx = txid || current.transaction?.txid;
      if (!useTx) {
        await sleep(1500);
        continue;
      }
      await completePayment(paymentId, useTx);
      return getPayment(paymentId);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Paiement incomplet");
      const msg = lastError.message.toLowerCase();
      if (
        msg.includes("annul") ||
        msg.includes("clé api") ||
        msg.includes("invalide") ||
        msg.includes("wallet mainnet") ||
        msg.includes("réseau pi")
      ) {
        throw lastError;
      }
      try {
        const current = await getPayment(paymentId);
        if (current.status.developer_completed) return current;
      } catch {
        /* keep retrying */
      }
      await sleep(1500);
    }
  }
  throw lastError || new Error("La transaction n’est pas encore confirmée sur le Mainnet. Réessayez.");
}

export async function cancelPayment(paymentId: string) {
  return piFetch(`/payments/${paymentId}/cancel`, { method: "POST" });
}

export async function getPayment(paymentId: string) {
  return piFetch(`/payments/${paymentId}`) as Promise<PiPaymentDTO & { metadata?: { productId?: string; uid?: string; type?: string } }>;
}

export async function listIncompleteServerPayments() {
  const data = (await piFetch("/payments/incomplete_server_payments")) as {
    incomplete_server_payments?: PiPaymentDTO[];
  };
  return data.incomplete_server_payments || [];
}

export async function verifyRewardedAd(adId: string) {
  try {
    const data = (await piFetch(`/ads_network/status/${adId}`)) as { mediator_ack_status?: string };
    return {
      ok: data.mediator_ack_status === "granted" || data.mediator_ack_status === "granted_by_publisher",
    };
  } catch {
    return { ok: false };
  }
}

export async function createA2UPayment(uid: string, amount: number, memo: string) {
  return piFetch("/payments", {
    method: "POST",
    body: JSON.stringify({
      payment: {
        amount,
        memo,
        metadata: { type: "withdraw" },
        uid,
      },
    }),
  }) as Promise<PiPaymentDTO>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function finishA2UPayment(paymentId: string) {
  const payment = await getPayment(paymentId);
  if (payment.status.cancelled || payment.status.user_cancelled) {
    throw new Error("Retrait annulé par Pi");
  }
  const txid = payment.transaction?.txid;
  if (!txid) return { done: false as const, payment };
  if (!payment.status.developer_completed) {
    await completePayment(paymentId, txid);
  }
  return { done: true as const, payment };
}

export async function sendA2UPayment(uid: string, amount: number, memo: string) {
  await drainIncompleteA2U().catch(() => undefined);
  const run = async () => {
    const created = await createA2UPayment(uid, amount, memo);
    const paymentId = created.identifier;
    const deadline = Date.now() + 25000;
    while (Date.now() < deadline) {
      const result = await finishA2UPayment(paymentId);
      if (result.done) return { paymentId, pending: false as const, payment: result.payment };
      await sleep(400);
    }
    return { paymentId, pending: true as const, payment: created };
  };
  try {
    return await run();
  } catch {
    await drainIncompleteA2U().catch(() => undefined);
    await sleep(800);
    return run();
  }
}

export async function drainIncompleteA2U() {
  const pending = await listIncompleteServerPayments();
  const results: { paymentId: string; done: boolean }[] = [];
  for (const payment of pending) {
    try {
      const txid = payment.transaction?.txid;
      if (txid && !payment.status.developer_completed) {
        await completePayment(payment.identifier, txid);
        results.push({ paymentId: payment.identifier, done: true });
      } else {
        results.push({ paymentId: payment.identifier, done: false });
      }
    } catch {
      results.push({ paymentId: payment.identifier, done: false });
    }
  }
  return results;
}
