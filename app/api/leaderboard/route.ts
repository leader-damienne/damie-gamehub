import { NextResponse } from "next/server";
import { leaderboard } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gameId = new URL(req.url).searchParams.get("gameId") || undefined;
  return NextResponse.json({ board: await leaderboard(gameId) });
}
