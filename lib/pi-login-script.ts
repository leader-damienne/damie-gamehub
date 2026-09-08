export const PI_LOGIN_SCRIPT = `(function () {
  if (location.pathname.indexOf("/hub") === 0) return;

  var sandbox =
    location.hostname !== "damiegamehub.com" &&
    location.hostname !== "www.damiegamehub.com";

  function byId(id) {
    return document.getElementById(id);
  }

  function showError(text) {
    var box = byId("pi-error");
    if (!box) return;
    box.textContent = text || "";
    box.hidden = !text;
  }

  function setBusy(busy) {
    var btn = byId("pi-enter");
    var hint = byId("pi-hint");
    if (btn) {
      btn.disabled = false;
      btn.textContent = busy ? "Autorisez dans Pi…" : "Entrer avec Pi";
    }
    if (hint) {
      hint.textContent = busy
        ? "Touchez Autoriser. Le lobby s'ouvre ensuite tout seul."
        : "Touchez Entrer avec Pi, puis Autoriser.";
    }
  }

  function bootInit() {
    if (!window.Pi) {
      setTimeout(bootInit, 50);
      return;
    }
    window.Pi.init({ version: "2.0", sandbox: sandbox }).catch(function () {});
  }
  bootInit();

  window.__damieLogin = function () {
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
          body: JSON.stringify({ accessToken: auth.accessToken }),
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
      .catch(function (err) {
        setBusy(false);
        showError(err && err.message ? err.message : String(err));
      });
  };

  if (localStorage.getItem("damie.session") && localStorage.getItem("damie.pioneer")) {
    location.replace("/hub");
  }
})();`;
