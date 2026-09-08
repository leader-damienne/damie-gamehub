export const dynamic = "force-dynamic";

const KEY =
  "8bd15ec387ae01516f120eb4631da76d592d82a477413085cdaf208112b6cf629f4ddcdd321009729d6695d835208d6b0efdb141afb51100b5fd81b42124da58";

export function GET() {
  return new Response(KEY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
