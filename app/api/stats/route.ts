import { NextResponse } from "next/server";
import { gameStats } from "@/lib/store";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ games: gameStats() });
}
