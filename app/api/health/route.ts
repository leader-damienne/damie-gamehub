import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/site";
import { persistBackend, persistHint, persistReady, probePersist } from "@/lib/durable-store";
import { hasApiKey, hasWalletSeed } from "@/lib/pi-server";
import { isMainnetHost, requestHost } from "@/lib/pi-host";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await probePersist();
  const host = requestHost(req);
  const mainnet = isMainnetHost(host);
  const hasDedicatedMainnet = Boolean(process.env.PI_API_KEY_MAINNET);
  const walletSeed = hasWalletSeed(mainnet);
  const ready = persistReady();
  return NextResponse.json({
    app: APP_NAME,
    ok: true,
    host,
    network: mainnet ? "mainnet" : "sandbox",
    paymentsReady: hasApiKey(req),
    hasMainnetApiKey: hasDedicatedMainnet,
    hasWalletSeed: walletSeed,
    persist: persistBackend(),
    persistReady: ready,
    hint: !ready
      ? persistHint()
      : mainnet && !hasDedicatedMainnet
        ? "Ajoutez PI_API_KEY_MAINNET dans Cloudflare (clé du projet Mainnet). PI_API_KEY seule est souvent celle du Testnet."
        : mainnet && !walletSeed
          ? "Retraits : ajoutez PI_WALLET_SEED (graine S… du App Wallet Mainnet, develop.pinet.com) dans Cloudflare Settings."
          : mainnet
            ? "Mainnet prêt. Déposez un petit montant depuis https://damiegamehub.com"
            : "Testnet / sandbox.",
  });
}
