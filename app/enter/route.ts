import { PI_LOGIN_SCRIPT } from "@/lib/pi-login-script";

export const dynamic = "force-dynamic";

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Damie GameHub</title>
  <script src="https://sdk.minepi.com/pi-sdk.js"></script>
  <style>
    html,body{margin:0;min-height:100%;background:#fff;color:#111;font-family:Segoe UI,sans-serif}
    .splash{min-height:100dvh;padding:36px 24px 28px;display:flex;flex-direction:column;align-items:center;text-align:center}
    .pill{display:inline-flex;padding:7px 10px;border-radius:999px;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.22);color:#8a6a1a;font-size:12px;font-weight:700}
    img{width:min(78vw,320px);margin:18px 0 10px}
    p{color:#5c5648;line-height:1.5;font-size:14px;max-width:340px}
    .gold-btn{width:100%;max-width:320px;margin-top:auto;border:0;border-radius:14px;padding:13px 16px;font-weight:800;color:#161000;background:linear-gradient(180deg,#f3db7a,#c89b22)}
    .notice{margin-top:12px;font-size:12px;color:#7a7468}
    .warn{background:rgba(211,106,106,.12);color:#8a2f2f;border:1px solid rgba(211,106,106,.28);padding:10px 12px;border-radius:12px;font-size:12px;margin-top:12px}
  </style>
</head>
<body>
  <div class="splash">
    <div class="pill">GAME HUB</div>
    <img src="/logo-1024.png" alt="Damie GameHub" />
    <p>10 jeux instantanés, tournois, classements et boutique. Connexion et paiements uniquement avec Pi.</p>
    <p id="pi-error" class="warn" hidden></p>
    <button type="button" class="gold-btn" id="pi-enter" onclick="__damieLogin()">Entrer avec Pi</button>
    <div id="pi-hint" class="notice">Touchez Entrer avec Pi, puis Autoriser.</div>
  </div>
  <script>${PI_LOGIN_SCRIPT}</script>
</body>
</html>`;

export function GET() {
  return new Response(HTML, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
