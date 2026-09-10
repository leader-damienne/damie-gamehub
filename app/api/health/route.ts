import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/site";
import { persistBackend, persistReady } from "@/lib/durable-store";
import { hasApiKey } from "@/lib/pi-server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    app: APP_NAME,
    ok: true,
    network: process.env.NEXT_PUBLIC_PI_SANDBOX === "false" ? "mainnet" : "sandbox",
    paymentsReady: hasApiKey(),
    persist: persistBackend(),
    persistReady: persistReady(),
  });
}
