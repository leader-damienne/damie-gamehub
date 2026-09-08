(function () {
  if (location.pathname.indexOf("/hub") === 0) return;

  var sandbox =
    location.hostname !== "damiegamehub.com" && location.hostname !== "www.damiegamehub.com";

  function el(id) {
    return document.getElementById(id);
  }

  function showError(text) {
    var box = el("pi-error");
    if (!box) return;
    box.textContent = text || "";
    box.hidden = !text;
  }

  function setBusy(busy) {
    var btn = el("pi-enter");
    var hint = el("pi-hint");
    if (btn) btn.textContent = busy ? "Autorisez dans Pi…" : "Entrer avec Pi";
    if (hint) {
      hint.textContent = busy
        ? "Touchez Autoriser. Le lobby s’ouvre ensuite tout seul."
        : "Touchez Entrer avec Pi, puis Autoriser.";
    }
  }

  function waitForPi(ms) {
    return new Promise(function (resolve) {
      var start = Date.now();
      (function tick() {
        if (window.Pi) return resolve(true);
        if (Date.now() - start > ms) return resolve(false);
        setTimeout(tick, 30);
      })();
    });
  }

  async function login() {
    showError("");
    setBusy(true);
    try {
      var ready = await waitForPi(8000);
      if (!ready || !window.Pi) {
        throw new Error("Ouvrez cette page dans le Pi Browser, pas Chrome.");
      }
      try {
        await window.Pi.init({ version: "2.0", sandbox: sandbox });
      } catch (initErr) {}
      var auth = await window.Pi.authenticate(["username"], function () {});
      if (!auth || !auth.accessToken) {
        throw new Error("Pi n’a pas renvoyé de jeton. Retouchez Entrer avec Pi.");
      }
      var res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: auth.accessToken }),
      });
      var data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Erreur serveur " + res.status);
      }
      if (!res.ok) throw new Error(data.error || "Auth Pi impossible");
      localStorage.setItem("damie.session", data.session);
      localStorage.setItem("damie.pioneer", JSON.stringify(data.pioneer));
      location.replace("/hub");
    } catch (err) {
      setBusy(false);
      showError(err && err.message ? err.message : String(err));
    }
  }

  window.__damieLogin = login;

  if (localStorage.getItem("damie.session") && localStorage.getItem("damie.pioneer")) {
    location.replace("/hub");
    return;
  }

  function bind() {
    var btn = el("pi-enter");
    if (!btn) return;
    btn.onclick = function (event) {
      if (event) event.preventDefault();
      login();
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
