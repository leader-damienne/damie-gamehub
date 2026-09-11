import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/site";
import { persistBackend, persistHint, persistReady, probePersist } from "@/lib/durable-store";
import { hasApiKey, hasWalletSeed } from "@/lib/pi-server";
import { isMainnetHost, requestHost } from "@/lib/pi-host";

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
  const hasDedicatedMainnet = Boolean(mainnetKey) && !mainnetKey.startsWith("S");
  const ready = persistReady();
  return NextResponse.json({
    app: APP_NAME,
    ok: true,
    code: "wallet-v2",
    host,
    network: mainnet ? "mainnet" : "sandbox",
    paymentsReady: hasApiKey(req),
    hasMainnetApiKey: hasDedicatedMainnet,
    hasWalletSeed: walletSeed,
    persist: persistBackend(),
    persistReady: ready,
    hint: !walletSeed
      ? mainnet
        ? "Retraits : ajoutez PI_WALLET_SEED (graine S… du App Wallet Mainnet) dans Cloudflare Settings."
        : "Onglet Deployments : Retry / Deploy la dernière version. Puis crayon PI_API_KEY_MAINNET, graine S…, bouton Deploy (pas seulement Save version)."
      : !ready
        ? persistHint()
        : mainnet && !hasDedicatedMainnet
          ? "Ajoutez PI_API_KEY_MAINNET dans Cloudflare (clé du projet Mainnet). PI_API_KEY seule est souvent celle du Testnet."
          : mainnet
            ? "Mainnet prêt. Déposez un petit montant depuis https://damiegamehub.com"
            : "Testnet : dépôts et retraits en Test-π uniquement.",
  });
}
