import { extractApiKey } from "./pi-horizon";

function cleanHost(raw: string | null | undefined) {
  if (!raw) return "";
  return raw.split(",")[0].trim().split(":")[0].replace(/^www\./, "").toLowerCase();
}

function hostFromUrl(value: string) {
  try {
    return cleanHost(new URL(value).host);
  } catch {
    return "";
  }
}

export function requestHost(req: Request) {
  const forwarded = cleanHost(req.headers.get("x-forwarded-host"));
  if (forwarded) return forwarded;

  const headerHost = cleanHost(req.headers.get("host"));
  if (headerHost && !headerHost.endsWith(".workers.dev") && headerHost !== "localhost") {
    return headerHost;
  }

  const fromOrigin = hostFromUrl(req.headers.get("origin") || "") || hostFromUrl(req.headers.get("referer") || "");
  if (fromOrigin) return fromOrigin;

  if (headerHost) return headerHost;
  return cleanHost(new URL(req.url).hostname);
}

/** true = vrais π sur damiegamehub.com. workers.dev reste en Testnet. */
export const USE_MAINNET = true;

export function isMainnetHost(host: string) {
  return USE_MAINNET && host === "damiegamehub.com";
}

function envRaw(name: string) {
  const fromProcess = String((process.env as Record<string, string | undefined>)[name] || "").trim();
  if (fromProcess) return fromProcess;
  const g = globalThis as { env?: Record<string, string | undefined> };
  return String(g.env?.[name] || "").trim();
}

function firstApiKey(...names: string[]) {
  for (const name of names) {
    const value = extractApiKey(envRaw(name));
    if (value) return value;
  }
  return "";
}

export function piApiKeyForHost(host: string) {
  const mainnetKey = extractApiKey(envRaw("PI_API_KEY_MAINNET"));
  if (isMainnetHost(host)) {
    return firstApiKey("PI_API_KEY_MAINNET", "PI_API_KEY");
  }
  for (const name of ["PI-TESTNET-KEY", "PI_API_KEY_TESTNET", "PI_API_KEY"]) {
    const value = extractApiKey(envRaw(name));
    if (value && value !== mainnetKey) return value;
  }
  return "";
}

export function requirePiKey(host: string) {
  if (piApiKeyForHost(host)) return null;
  return isMainnetHost(host)
    ? "Ajoutez PI_API_KEY_MAINNET dans Cloudflare : la clé du projet Mainnet (pas celle du Testnet)."
    : "Clé API Pi manquante. Ajoutez PI_API_KEY (Testnet) dans Cloudflare.";
}
