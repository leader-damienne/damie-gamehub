"use client";

export function piSandbox() {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_PI_SANDBOX !== "false";
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
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  return hasPiSdk();
}

let initPromise: Promise<void> | null = null;

export function initPi() {
  if (!hasPiSdk()) return Promise.reject(new Error("Pi SDK absent"));
  if (!initPromise) {
    initPromise = window.Pi!.init({ version: "2.0", sandbox: piSandbox() }).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
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

export async function authenticatePi(onIncomplete?: (payment: PiPaymentDTO) => void) {
  await initPi();
  return withTimeout(
    window.Pi!.authenticate(["username", "payments"], (payment) => {
      onIncomplete?.(payment);
    }),
    45000,
    "Autorisez Damie GameHub dans la fenêtre Pi, puis réessayez.",
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
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "Erreur réseau");
  return data;
}
