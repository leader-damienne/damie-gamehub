import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/site";
import { persistBackend, persistHint, persistReady, probePersist } from "@/lib/durable-store";
import { hasApiKey, hasWalletSeed } from "@/lib/pi-server";
import { isMainnetHost, requestHost } from "@/lib/pi-host";
import { extractApiKey, extractWalletSeed, isWalletSeed } from "@/lib/pi-horizon";

export const dynamic = "force-dynamic";

function envValue(name: string) {
  return String((process.env as Record<string, string | undefined>)[name] || "")
    .replace(/\s+/g, "")
    .trim();
}

export async function GET(req: Request) {
  await probePersist();
  const host = requestHost(req);
  const mainnet = isMainnetHost(host);
  const mainnetKey = envValue("PI_API_KEY_MAINNET");
  const apiKey = extractApiKey(mainnetKey);
  const bundledSeed = extractWalletSeed(mainnetKey);
  const walletSeed = hasWalletSeed(mainnet);
  const keyIsSeed = isWalletSeed(mainnetKey) && !apiKey;
  const hasDedicatedMainnet = Boolean(apiKey);
  const ready = persistReady();
  return NextResponse.json({
    app: APP_NAME,
    ok: true,
    code: "wallet-v8",
    host,
    network: mainnet ? "mainnet" : "sandbox",
    paymentsReady: hasApiKey(req),
    hasMainnetApiKey: hasDedicatedMainnet,
    hasWalletSeed: walletSeed,
    persist: persistBackend(),
    persistReady: ready,
    mainnetKeyChars: apiKey.length || mainnetKey.length,
    mainnetKeyStartsWith: (apiKey || mainnetKey)[0] || "",
    mainnetKeyIsWalletSeed: keyIsSeed,
    hint: !mainnetKey
      ? "PI_API_KEY_MAINNET est vide sur cette version. Crayon → Rotate → colle l’API Key Mainnet → Deploy (pas Save version). Puis onglet Deployments : la version Active doit être celle-là."
      : keyIsSeed
        ? "PI_API_KEY_MAINNET contient une graine de portefeuille (S…). Il faut la clé API et la graine : clé|S… (une seule variable) ou PI_WALLET_SEED à part."
        : !hasApiKey(req)
          ? mainnet
            ? "Clé API Mainnet absente. Vérifiez le Deploy."
            : "Clé API Testnet refusée ou identique à la Mainnet. Add PI-TESTNET-KEY (API Key de l’app Testnet), type Variable, puis Deploy."
          : !walletSeed
            ? bundledSeed
              ? "Graine vue dans PI_API_KEY_MAINNET mais pas encore lue. Rechargez après le deploy wallet-v5."
              : mainnet
                ? "Dépôts OK. Retraits : graine dans PI-SEED."
                : "Dépôts Testnet : Add variable PI-TESTNET-KEY = API Key de l’app Testnet (pas la clé Mainnet, pas une graine)."
            : !ready
              ? persistHint()
              : mainnet
                ? "Mainnet prêt. Dépôts et retraits depuis https://damiegamehub.com"
                : "Testnet (workers.dev) : dépôts et retraits en Test-π uniquement.",
  });
}
