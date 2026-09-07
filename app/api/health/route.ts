import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    app: "Damie GameHub",
    ok: true,
    network: process.env.NEXT_PUBLIC_PI_SANDBOX === "false" ? "mainnet" : "sandbox",
  });
}
