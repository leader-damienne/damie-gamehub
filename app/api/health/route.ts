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
  const mainnetKey = process.env.PI_API_KEY_MAINNET || "";
  const walletSeed = hasWalletSeed(mainnet);
  const hasDedicatedMainnet = Boolean(mainnetKey) && !(mainnetKey.trim().startsWith("S") && mainnetKey.trim().length === 56);
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
    hint: !walletSeed
      ? mainnet
        ? "Retraits : ajoutez PI_WALLET_SEED (graine S… du App Wallet Mainnet) dans Cloudflare Settings."
        : "Retraits Test-π : cliquez le crayon de PI_API_KEY_MAINNET, collez la graine S… (56 caractères) du App Wallet Testnet, puis Deploy. Cloudflare n’ajoute pas de nouvelle ligne sur ce Worker."
      : !ready
        ? persistHint()
        : mainnet && !hasDedicatedMainnet
          ? "Ajoutez PI_API_KEY_MAINNET dans Cloudflare (clé du projet Mainnet). PI_API_KEY seule est souvent celle du Testnet."
          : mainnet
            ? "Mainnet prêt. Déposez un petit montant depuis https://damiegamehub.com"
            : "Testnet : dépôts et retraits en Test-π uniquement.",
  });
}
