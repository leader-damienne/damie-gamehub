const API = "https://api.minepi.com/v2";

function apiKey() {
  return process.env.PI_API_KEY || "";
}

export async function verifyAccessToken(accessToken: string) {
  const res = await fetch(`${API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Jeton Pi invalide");
  }
  return (await res.json()) as { uid: string; username?: string };
}

export async function approvePayment(paymentId: string) {
  const res = await fetch(`${API}/payments/${paymentId}/approve`, {
    method: "POST",
    headers: { Authorization: `Key ${apiKey()}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Approve failed: ${text}`);
  }
  return res.json();
}

export async function completePayment(paymentId: string, txid: string) {
  const res = await fetch(`${API}/payments/${paymentId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ txid }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Complete failed: ${text}`);
  }
  return res.json();
}

export async function getPayment(paymentId: string) {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: { Authorization: `Key ${apiKey()}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payment fetch failed: ${text}`);
  }
  return (await res.json()) as PiPaymentDTO & { metadata?: { productId?: string; uid?: string } };
}

export async function verifyRewardedAd(adId: string) {
  const res = await fetch(`${API}/ads_network/status/${adId}`, {
    headers: { Authorization: `Key ${apiKey()}` },
    cache: "no-store",
  });
  if (!res.ok) return { ok: false };
  const data = (await res.json()) as { mediator_ack_status?: string };
  return { ok: data.mediator_ack_status === "granted" || data.mediator_ack_status === "granted_by_publisher" };
}

export async function createA2UPayment(uid: string, amount: number, memo: string) {
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      payment: {
        amount,
        memo,
        metadata: { type: "withdraw" },
        uid,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Retrait Pi impossible: ${text}`);
  }
  return res.json() as Promise<PiPaymentDTO>;
}

export function hasApiKey() {
  return Boolean(apiKey());
}
