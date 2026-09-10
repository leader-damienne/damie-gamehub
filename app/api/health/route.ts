import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/site";
import { persistBackend, persistReady } from "@/lib/durable-store";
import { hasApiKey } from "@/lib/pi-server";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const host = new URL(req.url).hostname.replace(/^www\./, "");
  const mainnetHost = host === "damiegamehub.com";
  return NextResponse.json({
    app: APP_NAME,
    ok: true,
    host,
    network: mainnetHost ? "mainnet" : "sandbox",
    envSandbox: process.env.NEXT_PUBLIC_PI_SANDBOX !== "false",
    paymentsReady: hasApiKey(),
    persist: persistBackend(),
    persistReady: persistReady(),
    hint: mainnetHost
      ? "Mainnet : PI_API_KEY doit être la clé du projet Mainnet, NEXT_PUBLIC_PI_SANDBOX=false, wallet développeur KYC migré."
      : "Testnet / sandbox.",
  });
}
