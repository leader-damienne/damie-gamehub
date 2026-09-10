export function isMainnet() {
  return process.env.NEXT_PUBLIC_PI_SANDBOX === "false";
}

export function requirePiReady() {
  if (!process.env.PI_API_KEY) {
    return "Clé API Pi manquante. Ajoutez PI_API_KEY dans Cloudflare (Testnet et Mainnet ont des clés différentes).";
  }
  return null;
}
