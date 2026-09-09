export const dynamic = "force-dynamic";

const MAINNET_KEY =
  "8bd15ec387ae01516f120eb4631da76d592d82a477413085cdaf208112b6cf629f4ddcdd321009729d6695d835208d6b0efdb141afb51100b5fd81b42124da58";

const TESTNET_KEY =
  "a95b6725f5b2defc8c7169a110ae881ab4c943181348d56be730c2a209b1d86bca0d76fdfb34a3c627591a9d94870a0cc6ad6d5f0826b51cde1ec6e0811b5964";

function keyForHost(host: string) {
  const name = host.split(":")[0].toLowerCase();
  if (name === "damiegamehub.com" || name === "www.damiegamehub.com") return MAINNET_KEY;
  return TESTNET_KEY;
}

export function GET(req: Request) {
  const host = req.headers.get("host") || "";
  return new Response(keyForHost(host), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
