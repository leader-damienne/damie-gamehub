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
    #pi-error{display:none;width:100%;max-width:320px;background:rgba(211,106,106,.12);color:#8a2f2f;border:1px solid rgba(211,106,106,.28);padding:10px 12px;border-radius:12px;font-size:13px;margin:0 0 12px;box-sizing:border-box;white-space:pre-wrap}
    #pi-enter{width:100%;max-width:320px;border:0;border-radius:14px;padding:16px;font-size:16px;font-weight:800;color:#161000;background:linear-gradient(180deg,#f3db7a,#c89b22)}
    .notice{margin-top:12px;font-size:12px;color:#7a7468;max-width:320px}
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
      var errBox = document.getElementById("pi-error");
      var hint = document.getElementById("pi-hint");
      var inited = false;

      function showError(text) {
        errBox.textContent = text || "";
        errBox.style.display = text ? "block" : "none";
      }

      function withTimeout(promise, ms, message) {
        return new Promise(function (resolve, reject) {
          var t = setTimeout(function () { reject(new Error(message)); }, ms);
          promise.then(
            function (v) { clearTimeout(t); resolve(v); },
            function (e) { clearTimeout(t); reject(e); }
          );
        });
      }

      function initPi() {
        if (!window.Pi) {
          return Promise.reject(new Error("Ouvrez cette page dans le Pi Browser, pas Chrome."));
        }
        if (inited) return Promise.resolve();
        return withTimeout(
          window.Pi.init({ version: "2.0", sandbox: sandbox }),
          4000,
          "Pi.init bloque. URL Develop = " + location.origin
        ).then(function () { inited = true; });
      }

      window.Pi && initPi().catch(function () {});

      btn.onclick = function () {
        showError("");
        btn.textContent = "Autorisez dans Pi…";
        hint.textContent = "Touchez Autoriser.";
        if (!window.Pi) {
          btn.textContent = "Entrer avec Pi";
          showError("Ouvrez cette page dans le Pi Browser, pas Chrome.");
          return;
        }
        var done = false;
        setTimeout(function () {
          if (!done) showError("Pas de fenetre Pi ? Dans Develop, l'URL Testnet doit etre exactement " + location.origin);
        }, 5000);
        function doAuth() {
          return window.Pi.authenticate(["username"], function () {});
        }
        var run = inited ? doAuth() : initPi().then(doAuth);
        withTimeout(run, 20000, "Pi n'a pas repondu. Retouchez Entrer avec Pi.")
          .then(function (auth) {
            done = true;
            if (!auth || !auth.accessToken) throw new Error("Pi n'a pas renvoye de jeton.");
            sessionStorage.setItem("damie.piToken", auth.accessToken);
            location.replace("/hub");
          })
          .catch(function (e) {
            done = true;
            btn.textContent = "Entrer avec Pi";
            hint.textContent = "Touchez Entrer avec Pi, puis Autoriser.";
            showError((e && e.message ? e.message : String(e)) + "\\n" + location.origin);
          });
      };
    })();
  </script>
</body>
</html>`;
}
