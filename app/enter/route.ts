import { piLoginHtml } from "@/lib/pi-login-html";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(piLoginHtml(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
