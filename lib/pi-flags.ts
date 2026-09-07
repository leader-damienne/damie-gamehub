export function isMainnet() {
  return process.env.NEXT_PUBLIC_PI_SANDBOX === "false";
}

export function requirePiReady() {
  if (!process.env.PI_API_KEY) {
    return isMainnet()
      ? "Clé API Pi manquante pour le Mainnet"
      : null;
  }
  return null;
}
