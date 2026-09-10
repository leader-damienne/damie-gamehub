import { NextResponse } from "next/server";
import { APP_NAME } from "@/lib/site";

export function GET() {
  return NextResponse.json({
    app: APP_NAME,
    ok: true,
    network: process.env.NEXT_PUBLIC_PI_SANDBOX === "false" ? "mainnet" : "sandbox",
  });
}
