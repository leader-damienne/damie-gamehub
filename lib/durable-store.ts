import type { StoreShape } from "./types";

const STORE_KEY = "damie-store";

export type PersistBackend = "cloudflare-kv" | "upstash" | "file" | "memory";

type KvLike = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
};

let boundKv: KvLike | null | undefined;

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

function hasKvRest() {
  return Boolean(cfAccount() && cfNamespace() && cfToken());
}

function dynImport(spec: string) {
  try {
    return (Function("s", "return import(s)") as (s: string) => Promise<Record<string, unknown>>)(spec);
  } catch {
    return Promise.resolve(null);
  }
}

async function getBoundKv(): Promise<KvLike | null> {
  const g = globalThis as {
    DAMIE_KV?: KvLike;
    env?: { DAMIE_KV?: KvLike };
  };
  if (g.DAMIE_KV && typeof g.DAMIE_KV.get === "function") return g.DAMIE_KV;
  if (g.env?.DAMIE_KV && typeof g.env.DAMIE_KV.get === "function") return g.env.DAMIE_KV;

  const openNext = await dynImport("@opennextjs/cloudflare").catch(() => null);
  if (openNext?.getCloudflareContext) {
    try {
      const ctx = await (openNext.getCloudflareContext as (opts: { async: true }) => Promise<{ env?: { DAMIE_KV?: KvLike } }>)({
        async: true,
      });
      if (ctx?.env?.DAMIE_KV && typeof ctx.env.DAMIE_KV.get === "function") return ctx.env.DAMIE_KV;
    } catch {
      /* not running under OpenNext */
    }
  }

  const workers = await dynImport("cloudflare:workers").catch(() => null);
  const env = workers?.env as { DAMIE_KV?: KvLike } | undefined;
  if (env?.DAMIE_KV && typeof env.DAMIE_KV.get === "function") return env.DAMIE_KV;

  return null;
}

export async function probePersist() {
  if (boundKv === undefined) {
    boundKv = await getBoundKv();
  }
  return persistBackend();
}

export function persistBackend(): PersistBackend {
  if (boundKv || hasKvRest()) return "cloudflare-kv";
  if (upstashUrl() && upstashToken()) return "upstash";
  if (process.env.VERCEL || process.env.CF_PAGES || process.env.CLOUDFLARE) return "memory";
  if (typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair !== "undefined") return "memory";
  return "file";
}

export function persistReady() {
  const backend = persistBackend();
  return backend === "cloudflare-kv" || backend === "upstash";
}

export function persistHint() {
  if (persistReady()) return "Soldes enregistrés dans Cloudflare KV.";
  return "Attendez la fin du build Cloudflare. Le KV DAMIE_KV est lié via wrangler.jsonc.";
}

async function cfKvUrl(key: string) {
  const encoded = encodeURIComponent(key);
  return `https://api.cloudflare.com/client/v4/accounts/${cfAccount()}/storage/kv/namespaces/${cfNamespace()}/values/${encoded}`;
}

async function kvGetText(): Promise<string | null> {
  if (boundKv === undefined) boundKv = await getBoundKv();
  if (boundKv) {
    return boundKv.get(STORE_KEY);
  }
  if (hasKvRest()) {
    const res = await fetch(await cfKvUrl(STORE_KEY), {
      headers: { Authorization: `Bearer ${cfToken()}` },
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Lecture KV impossible (${res.status})`);
    }
    return res.text();
  }
  if (upstashUrl() && upstashToken()) {
    const res = await fetch(upstashUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["GET", STORE_KEY]),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Lecture Upstash impossible (${res.status})`);
    const data = (await res.json()) as { result?: string | null };
    return data.result || null;
  }
  return null;
}

async function kvPutText(body: string) {
  if (boundKv === undefined) boundKv = await getBoundKv();
  if (boundKv) {
    await boundKv.put(STORE_KEY, body);
    return;
  }
  if (hasKvRest()) {
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
  if (upstashUrl() && upstashToken()) {
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

async function remoteGet(): Promise<StoreShape | null> {
  try {
    const raw = await kvGetText();
    if (!raw) return null;
    return JSON.parse(raw) as StoreShape;
  } catch {
    return null;
  }
}

async function remotePut(data: StoreShape) {
  await kvPutText(JSON.stringify(data));
}

export async function durableLoad() {
  return remoteGet();
}

export async function durableSave(data: StoreShape) {
  await probePersist();
  if (!persistReady()) return;
  await remotePut(data);
}
