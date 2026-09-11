import { isMainnetHost, piApiKeyForHost, requestHost } from "./pi-host";
import { hasWalletSeed, submitA2UOnChain, walletSeedForHost } from "./pi-horizon";

const API = "https://api.minepi.com/v2";

export function explainPiError(raw: string) {
  const text = (raw || "").toLowerCase();
  if (text.includes("feature_not_available") || text.includes("feature is not available")) {
    return "Retraits Test-π indisponibles sur ce projet. Dans develop.pinet.com, ouvrez l’app Testnet, créez un App Wallet (pas None), alimentez-le avec des Test-π, puis ajoutez PI_WALLET_SEED_TESTNET (graine S…) dans Cloudflare Settings.";
  }
  if (text.includes("missing_wallet")) {
    return "Wallet de l’app Pi manquant. Dans develop.pinet.com, générez un App Wallet et copiez la graine secrète (S…) dans PI_WALLET_SEED.";
  }
  if (text.includes("ongoing_payment")) {
    return "Un retrait Pi est déjà en cours. Attendez quelques secondes puis réessayez.";
  }
  if (text.includes("private_seed") || text.includes("seed_mismatch")) {
    return "PI_WALLET_SEED ne correspond pas au wallet de l’app Mainnet.";
  }
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

type PiApiOptions = { seed?: string; mainnet?: boolean };

export function createPiApi(key: string, options: PiApiOptions = {}) {
  const seed = (options.seed || "").trim();
  const mainnet = Boolean(options.mainnet);
  async function piFetch(path: string, init: RequestInit = {}) {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Key ${key}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      let raw = text || `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(text) as { error?: string; error_message?: string };
        if (parsed.error) raw = `${parsed.error} ${parsed.error_message || ""}`.trim();
      } catch {
        /* keep raw */
      }
      const explained = explainPiError(raw);
      throw new Error(
        res.status === 401 || res.status === 403
          ? mainnet
            ? `Clé API Pi refusée (${res.status}). Sur damiegamehub.com ajoutez PI_API_KEY_MAINNET (projet Mainnet).`
            : `Clé API Pi refusée (${res.status}). Ajoutez PI_API_KEY (projet Testnet) dans Cloudflare.`
          : `${explained} [${res.status}]`,
      );
    }
    if (!text) return {} as never;
    try {
      return JSON.parse(text);
    } catch {
      return {} as never;
    }
  }

  async function approvePayment(paymentId: string) {
    return piFetch(`/payments/${paymentId}/approve`, { method: "POST" });
  }

  async function completePayment(paymentId: string, txid: string) {
    return piFetch(`/payments/${paymentId}/complete`, {
      method: "POST",
      body: JSON.stringify({ txid }),
    });
  }

  async function getPayment(paymentId: string) {
    return piFetch(`/payments/${paymentId}`) as Promise<
      PiPaymentDTO & { metadata?: { productId?: string; uid?: string; type?: string } }
    >;
  }

  async function cancelPayment(paymentId: string) {
    return piFetch(`/payments/${paymentId}/cancel`, { method: "POST" });
  }

  async function completePaymentReliable(paymentId: string, txid?: string) {
    let lastError: Error | null = null;
    for (let i = 0; i < 6; i += 1) {
      try {
        const current = await getPayment(paymentId);
        if (current.status.developer_completed) return current;
        if (current.status.cancelled || current.status.user_cancelled) {
          throw new Error("Paiement Pi annulé");
        }
        const useTx = txid || current.transaction?.txid;
        if (!useTx) {
          await sleep(800);
          continue;
        }
        await completePayment(paymentId, useTx);
        return getPayment(paymentId);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Paiement incomplet");
        const msg = lastError.message.toLowerCase();
        if (msg.includes("annul") || msg.includes("clé api pi refusée") || msg.includes("pi_api_key_mainnet")) {
          throw lastError;
        }
        try {
          const current = await getPayment(paymentId);
          if (current.status.developer_completed) return current;
        } catch {
          /* keep retrying */
        }
        await sleep(800);
      }
    }
    throw lastError || new Error("La transaction n’est pas encore confirmée sur le Mainnet. Réessayez.");
  }

  async function listIncompleteServerPayments() {
    const data = (await piFetch("/payments/incomplete_server_payments")) as {
      incomplete_server_payments?: PiPaymentDTO[];
    };
    return data.incomplete_server_payments || [];
  }

  async function verifyRewardedAd(adId: string) {
    try {
      const data = (await piFetch(`/ads_network/status/${adId}`)) as { mediator_ack_status?: string };
      return {
        ok: data.mediator_ack_status === "granted" || data.mediator_ack_status === "granted_by_publisher",
      };
    } catch {
      return { ok: false };
    }
  }

  async function createA2UPayment(uid: string, amount: number, memo: string) {
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

  async function finishA2UPayment(paymentId: string) {
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

  async function submitCreatedPayment(payment: PiPaymentDTO) {
    if (payment.transaction?.txid) return payment.transaction.txid;
    if (!seed) {
      throw new Error(
        mainnet
          ? "Ajoutez PI_WALLET_SEED (graine S… du App Wallet Mainnet) dans Cloudflare Settings pour envoyer les retraits."
          : "Ajoutez PI_WALLET_SEED_TESTNET (graine S… du App Wallet Testnet) dans Cloudflare Settings.",
      );
    }
    return submitA2UOnChain({
      seed,
      amount: payment.amount,
      paymentId: payment.identifier,
      fromAddress: payment.from_address,
      toAddress: payment.to_address,
      mainnet,
      network: payment.network,
    });
  }

  async function drainIncompleteA2U() {
    const pending = await listIncompleteServerPayments();
    const results: { paymentId: string; done: boolean }[] = [];
    for (const payment of pending) {
      try {
        let txid = payment.transaction?.txid;
        if (!txid && seed && payment.from_address && payment.to_address) {
          txid = await submitCreatedPayment(payment);
        }
        if (txid && !payment.status.developer_completed) {
          await completePayment(payment.identifier, txid);
          results.push({ paymentId: payment.identifier, done: true });
        } else {
          results.push({ paymentId: payment.identifier, done: Boolean(txid) });
        }
      } catch {
        results.push({ paymentId: payment.identifier, done: false });
      }
    }
    return results;
  }

  async function sendA2UPayment(uid: string, amount: number, memo: string) {
    await drainIncompleteA2U().catch(() => undefined);
    const run = async () => {
      const created = await createA2UPayment(uid, amount, memo);
      const paymentId = created.identifier;
      if (created.status.developer_completed) {
        return { paymentId, pending: false as const, payment: created };
      }
      const txid = await submitCreatedPayment(created);
      const completed = await completePaymentReliable(paymentId, txid);
      return { paymentId, pending: false as const, payment: completed };
    };
    try {
      return await run();
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : "";
      if (
        msg.includes("feature_not_available") ||
        msg.includes("indisponibles") ||
        msg.includes("pi_wallet_seed") ||
        msg.includes("clé api pi refusée")
      ) {
        throw error;
      }
      await drainIncompleteA2U().catch(() => undefined);
      await sleep(800);
      return run();
    }
  }

  return {
    approvePayment,
    completePayment,
    completePaymentReliable,
    cancelPayment,
    getPayment,
    verifyRewardedAd,
    finishA2UPayment,
    sendA2UPayment,
    drainIncompleteA2U,
  };
}

export type PiApi = ReturnType<typeof createPiApi>;

export function withPiRequest<T>(req: Request, fn: (pi: PiApi) => T): T {
  const host = requestHost(req);
  const mainnet = isMainnetHost(host);
  return fn(createPiApi(piApiKeyForHost(host), { seed: walletSeedForHost(mainnet), mainnet }));
}

export { hasWalletSeed, walletSeedForHost };

export function hasApiKey(req?: Request) {
  if (req) return Boolean(piApiKeyForHost(requestHost(req)));
  return Boolean(process.env.PI_API_KEY_MAINNET || process.env.PI_API_KEY_TESTNET || process.env.PI_API_KEY);
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
