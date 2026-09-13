import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/site";
import { persistBackend, persistHint, persistReady, probePersist } from "@/lib/durable-store";
import { hasApiKey, hasWalletSeed } from "@/lib/pi-server";
import { isMainnetHost, requestHost } from "@/lib/pi-host";
import { isWalletSeed } from "@/lib/pi-horizon";

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
  const walletSeed = hasWalletSeed(mainnet);
  const keyIsSeed = isWalletSeed(mainnetKey);
  const hasDedicatedMainnet = Boolean(mainnetKey) && !keyIsSeed;
  const ready = persistReady();
  return NextResponse.json({
    app: APP_NAME,
    ok: true,
    code: "wallet-v3",
    host,
    network: mainnet ? "mainnet" : "sandbox",
    paymentsReady: hasApiKey(req),
    hasMainnetApiKey: hasDedicatedMainnet,
    hasWalletSeed: walletSeed,
    persist: persistBackend(),
    persistReady: ready,
    mainnetKeyChars: mainnetKey.length,
    mainnetKeyStartsWith: mainnetKey ? mainnetKey[0] : "",
    mainnetKeyIsWalletSeed: keyIsSeed,
    hint: !mainnetKey
      ? "PI_API_KEY_MAINNET est vide sur cette version. Crayon → Rotate → colle l’API Key Mainnet → Deploy (pas Save version). Puis onglet Deployments : la version Active doit être celle-là."
      : keyIsSeed
        ? "PI_API_KEY_MAINNET contient une graine de portefeuille (S…). Il faut l’API Key : develop.pinet.com → API Key → Confirm → copier → Rotate PI_API_KEY_MAINNET → Deploy."
        : !hasApiKey(req)
          ? "Clé API Mainnet absente. Vérifiez le Deploy."
          : !walletSeed
            ? "Dépôts OK. Pour les retraits plus tard : graine S… du App Wallet Mainnet."
            : !ready
              ? persistHint()
              : mainnet
                ? "Mainnet prêt. Déposez un petit montant depuis https://damiegamehub.com"
                : "Testnet (workers.dev) : dépôts et retraits en Test-π uniquement.",
  });
}
