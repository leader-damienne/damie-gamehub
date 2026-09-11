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

/** false = Test-π partout (dépôts et retraits). true = vrais π sur damiegamehub.com. */
export const USE_MAINNET = false;

export function isMainnetHost(host: string) {
  return USE_MAINNET && host === "damiegamehub.com";
}

export function piApiKeyForHost(host: string) {
  if (isMainnetHost(host)) {
    return process.env.PI_API_KEY_MAINNET || process.env.PI_API_KEY || "";
  }
  return process.env.PI_API_KEY_TESTNET || process.env.PI_API_KEY || "";
}

export function requirePiKey(host: string) {
  if (piApiKeyForHost(host)) return null;
  return isMainnetHost(host)
    ? "Ajoutez PI_API_KEY_MAINNET dans Cloudflare : la clé du projet Mainnet (pas celle du Testnet)."
    : "Clé API Pi manquante. Ajoutez PI_API_KEY (Testnet) dans Cloudflare.";
}
