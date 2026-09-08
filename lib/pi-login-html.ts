export function piLoginHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Damie GameHub</title>
  <script src="https://sdk.minepi.com/pi-sdk.js"></script>
  <style>
    html,body{margin:0;background:#fff;color:#111;font-family:Segoe UI,sans-serif}
    .splash{min-height:100dvh;padding:24px 20px 28px;display:flex;flex-direction:column;align-items:center;text-align:center;box-sizing:border-box}
    .pill{display:inline-flex;padding:7px 10px;border-radius:999px;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.22);color:#8a6a1a;font-size:12px;font-weight:700}
    img{width:120px;height:120px;object-fit:contain;margin:16px 0 8px}
    p{color:#5c5648;line-height:1.45;font-size:14px;max-width:320px;margin:0 0 16px}
    #pi-error{display:none;width:100%;max-width:320px;background:rgba(211,106,106,.12);color:#8a2f2f;border:1px solid rgba(211,106,106,.28);padding:10px 12px;border-radius:12px;font-size:13px;margin:0 0 12px;box-sizing:border-box}
    #pi-enter{width:100%;max-width:320px;border:0;border-radius:14px;padding:16px;font-size:16px;font-weight:800;color:#161000;background:linear-gradient(180deg,#f3db7a,#c89b22)}
    .notice{margin-top:12px;font-size:12px;color:#7a7468}
  </style>
</head>
<body>
  <div class="splash">
    <div class="pill">GAME HUB</div>
    <img src="/logo-1024.png" alt="Damie GameHub" />
    <p>10 jeux instantanés, tournois, classements et boutique. Connexion et paiements uniquement avec Pi.</p>
    <div id="pi-error"></div>
    <button type="button" id="pi-enter">Entrer avec Pi</button>
    <div id="pi-hint" class="notice">Touchez Entrer avec Pi, puis Autoriser.</div>
  </div>
  <script>
    (function () {
      var sandbox = location.hostname !== "damiegamehub.com" && location.hostname !== "www.damiegamehub.com";
      var btn = document.getElementById("pi-enter");
      var err = document.getElementById("pi-error");
      var hint = document.getElementById("pi-hint");

      function showError(text) {
        err.textContent = text || "";
        err.style.display = text ? "block" : "none";
      }

      function setBusy(busy) {
        btn.textContent = busy ? "Autorisez dans Pi…" : "Entrer avec Pi";
        hint.textContent = busy
          ? "Touchez Autoriser. Le lobby s'ouvre ensuite tout seul."
          : "Touchez Entrer avec Pi, puis Autoriser.";
      }

      function boot() {
        if (!window.Pi) {
          setTimeout(boot, 40);
          return;
        }
        window.Pi.init({ version: "2.0", sandbox: sandbox }).catch(function () {});
      }
      boot();

      function login() {
        showError("");
        setBusy(true);
        if (!window.Pi) {
          setBusy(false);
          showError("Ouvrez cette page dans le Pi Browser, pas Chrome.");
          return;
        }
        window.Pi.authenticate(["username"], function () {})
          .then(function (auth) {
            if (!auth || !auth.accessToken) throw new Error("Pi n'a pas renvoye de jeton.");
            return fetch("/api/auth/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken: auth.accessToken })
            }).then(function (res) {
              return res.text().then(function (raw) {
                var data = {};
                try { data = JSON.parse(raw); } catch (e) {}
                if (!res.ok) throw new Error(data.error || ("Erreur serveur " + res.status));
                return data;
              });
            });
          })
          .then(function (data) {
            localStorage.setItem("damie.session", data.session);
            localStorage.setItem("damie.pioneer", JSON.stringify(data.pioneer));
            location.replace("/hub");
          })
          .catch(function (e) {
            setBusy(false);
            showError(e && e.message ? e.message : String(e));
          });
      }

      btn.onclick = login;

      if (localStorage.getItem("damie.session") && localStorage.getItem("damie.pioneer")) {
        location.replace("/hub");
      }
    })();
  </script>
</body>
</html>`;
}
