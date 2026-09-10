import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/site";
import { persistBackend, persistReady } from "@/lib/durable-store";
import { hasApiKey } from "@/lib/pi-server";
import { isMainnetHost, requestHost } from "@/lib/pi-host";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const host = requestHost(req);
  const mainnet = isMainnetHost(host);
  const hasDedicatedMainnet = Boolean(process.env.PI_API_KEY_MAINNET);
  return NextResponse.json({
    app: APP_NAME,
    ok: true,
    host,
    network: mainnet ? "mainnet" : "sandbox",
    paymentsReady: hasApiKey(req),
    hasMainnetApiKey: hasDedicatedMainnet,
    persist: persistBackend(),
    persistReady: persistReady(),
    hint: mainnet && !hasDedicatedMainnet
      ? "Ajoutez PI_API_KEY_MAINNET dans Cloudflare (clé du projet Mainnet). PI_API_KEY seule est souvent celle du Testnet."
      : mainnet
        ? "Mainnet prêt. Déposez un petit montant depuis https://damiegamehub.com"
        : "Testnet / sandbox.",
  });
}
