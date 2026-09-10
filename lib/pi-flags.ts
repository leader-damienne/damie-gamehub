import { isMainnetHost, piApiKeyForHost, requestHost, requirePiKey } from "./pi-host";

export function isMainnet() {
  return process.env.NEXT_PUBLIC_PI_SANDBOX === "false";
}

export function requirePiReady(req?: Request) {
  if (req) return requirePiKey(requestHost(req));
  if (piApiKeyForHost("damiegamehub.com") || piApiKeyForHost("workers.dev")) return null;
  return "Clé API Pi manquante. Testnet : PI_API_KEY. Mainnet : PI_API_KEY_MAINNET.";
}

export { isMainnetHost, requestHost };
