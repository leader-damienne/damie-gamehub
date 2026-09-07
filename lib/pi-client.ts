"use client";

export const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== "false";

export function hasPiSdk() {
  return typeof window !== "undefined" && Boolean(window.Pi);
}

let initPromise: Promise<void> | null = null;

export function initPi() {
  if (!hasPiSdk()) return Promise.reject(new Error("Pi SDK absent"));
  if (!initPromise) {
    initPromise = window.Pi!.init({ version: "2.0", sandbox: PI_SANDBOX });
  }
  return initPromise;
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
