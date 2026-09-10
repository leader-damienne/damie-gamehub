import type { StoreShape } from "./types";

const STORE_KEY = "damie-store";

export type PersistBackend = "cloudflare-kv" | "upstash" | "file" | "memory";

function cfAccount() {
  return process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || "";
}

function cfNamespace() {
  return process.env.CF_KV_NAMESPACE_ID || process.env.CLOUDFLARE_KV_NAMESPACE_ID || "";
}

function cfToken() {
  return process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || "";
}

function upstashUrl() {
  return (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
}

function upstashToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || "";
}

export function persistBackend(): PersistBackend {
  if (cfAccount() && cfNamespace() && cfToken()) return "cloudflare-kv";
  if (upstashUrl() && upstashToken()) return "upstash";
  if (process.env.VERCEL || process.env.CF_PAGES || process.env.CLOUDFLARE) return "memory";
  return "file";
}

export function persistReady() {
  const backend = persistBackend();
  return backend === "cloudflare-kv" || backend === "upstash";
}

async function cfKvUrl(key: string) {
  const encoded = encodeURIComponent(key);
  return `https://api.cloudflare.com/client/v4/accounts/${cfAccount()}/storage/kv/namespaces/${cfNamespace()}/values/${encoded}`;
}

async function remoteGet(): Promise<StoreShape | null> {
  const backend = persistBackend();
  try {
    if (backend === "cloudflare-kv") {
      const res = await fetch(await cfKvUrl(STORE_KEY), {
        headers: { Authorization: `Bearer ${cfToken()}` },
        cache: "no-store",
      });
      if (res.status === 404) return null;
      if (!res.ok) return null;
      const raw = await res.text();
      if (!raw) return null;
      return JSON.parse(raw) as StoreShape;
    }
    if (backend === "upstash") {
      const res = await fetch(upstashUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(["GET", STORE_KEY]),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { result?: string | null };
      if (!data.result) return null;
      return JSON.parse(data.result) as StoreShape;
    }
  } catch {
    return null;
  }
  return null;
}

async function remotePut(data: StoreShape) {
  const backend = persistBackend();
  const body = JSON.stringify(data);
  if (backend === "cloudflare-kv") {
    const res = await fetch(await cfKvUrl(STORE_KEY), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cfToken()}`,
        "Content-Type": "text/plain",
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sauvegarde Cloudflare KV impossible (${res.status}): ${text.slice(0, 180)}`);
    }
    return;
  }
  if (backend === "upstash") {
    const res = await fetch(upstashUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["SET", STORE_KEY, body]),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sauvegarde Upstash impossible (${res.status}): ${text.slice(0, 180)}`);
    }
  }
}

export async function durableLoad() {
  return remoteGet();
}

export async function durableSave(data: StoreShape) {
  if (!persistReady()) return;
  await remotePut(data);
}
