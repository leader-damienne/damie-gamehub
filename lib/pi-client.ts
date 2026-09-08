"use client";

export function piSandbox() {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  if (host === "damiegamehub.com" || host === "www.damiegamehub.com") return false;
  return true;
}

export function hasPiSdk() {
  return typeof window !== "undefined" && Boolean(window.Pi);
}

export async function waitForPiSdk(ms = 5000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (hasPiSdk()) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return hasPiSdk();
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

let initPromise: Promise<void> | null = null;

export function initPi() {
  if (!hasPiSdk()) return Promise.reject(new Error("Ouvrez cette page dans le Pi Browser, pas Chrome."));
  if (!initPromise) {
    const sandbox = piSandbox();
    initPromise = withTimeout(
      window.Pi!.init({ version: "2.0", sandbox }),
      8000,
      `Pi.init bloqué (${sandbox ? "Testnet" : "Mainnet"}). L’URL de l’app dans Develop doit être exactement ${window.location.origin}.`,
    ).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export function piError(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  try {
    const text = JSON.stringify(err);
    if (text && text !== "{}") return text;
  } catch {
    /* ignore */
  }
  return `Connexion Pi refusée. L’URL de l’app dans Develop doit être exactement ${typeof window !== "undefined" ? window.location.origin : ""}.`;
}

export async function authenticatePi(
  onIncomplete?: (payment: PiPaymentDTO) => void,
  scopes: PiScope[] = ["username"],
) {
  await initPi();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const network = piSandbox() ? "Testnet" : "Mainnet";
  const timeoutMsg = `Pi n’a pas répondu (${network}). Dans Develop, l’URL de l’app ${network} doit être ${origin}. Touchez Entrer avec Pi, puis Autoriser.`;
  return withTimeout(
    window.Pi!.authenticate(scopes, (payment: PiPaymentDTO) => onIncomplete?.(payment)),
    15000,
    timeoutMsg,
  );
}

export async function api<T>(path: string, session: string | null, body?: unknown, method = "POST") {
  const res = await fetch(path, {
    method: body ? method : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const raw = await res.text();
  let data: T & { error?: string };
  try {
    data = JSON.parse(raw) as T & { error?: string };
  } catch {
    throw new Error(res.ok ? "Réponse serveur invalide" : `Erreur serveur ${res.status}`);
  }
  if (!res.ok) throw new Error(data.error || `Erreur serveur ${res.status}`);
  return data;
}
