"use client";

import { USE_MAINNET } from "./pi-host";

export function piSandbox() {
  if (typeof window === "undefined") return true;
  if (!USE_MAINNET) return true;
  const host = window.location.hostname;
  if (host === "damiegamehub.com" || host === "www.damiegamehub.com") return false;
  return true;
}

export function hasPiSdk() {
  return typeof window !== "undefined" && Boolean(window.Pi);
}

export async function waitForPiSdk(ms = 8000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (hasPiSdk()) return true;
    await new Promise((resolve) => setTimeout(resolve, 40));
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
  if (!hasPiSdk()) {
    return Promise.reject(new Error("Ouvrez cette page dans le Pi Browser, pas Chrome."));
  }
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

export function bootPi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Ouvrez cette page dans le Pi Browser, pas Chrome."));
  }
  return waitForPiSdk(8000).then((ok) => {
    if (!ok) throw new Error("Ouvrez cette page dans le Pi Browser, pas Chrome.");
    return initPi();
  });
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

/** Call from a click handler. Do not await anything before this. */
export function startPiAuth(
  onIncomplete?: (payment: PiPaymentDTO) => void,
  scopes: PiScope[] = ["username", "payments"],
) {
  if (!hasPiSdk()) {
    return Promise.reject(new Error("Ouvrez cette page dans le Pi Browser, pas Chrome."));
  }
  return window.Pi!.authenticate(scopes, (payment: PiPaymentDTO) => {
    onIncomplete?.(payment);
  });
}

let paymentsAuth: Promise<PiAuthResult> | null = null;
let incompleteHandler: ((payment: PiPaymentDTO) => void) | undefined;

export function clearPaymentsAuth() {
  paymentsAuth = null;
}

/** Keep payments scope for this document. After a reload, call again — Pi usually restores silently. */
export function ensurePaymentsAuth(onIncomplete?: (payment: PiPaymentDTO) => void) {
  if (onIncomplete) incompleteHandler = onIncomplete;
  if (!hasPiSdk()) {
    return Promise.reject(new Error("Ouvrez cette page dans le Pi Browser, pas Chrome."));
  }
  if (!paymentsAuth) {
    paymentsAuth = startPiAuth((payment) => incompleteHandler?.(payment), ["username", "payments"]).catch(
      (err) => {
        paymentsAuth = null;
        throw err;
      },
    );
  }
  return paymentsAuth;
}

export function paymentsAuthActive() {
  return Boolean(paymentsAuth);
}

export async function api<T>(path: string, session: string | null, body?: unknown, method = "POST") {
  const res = await fetch(path, {
    method: body ? method : "GET",
    credentials: "same-origin",
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
