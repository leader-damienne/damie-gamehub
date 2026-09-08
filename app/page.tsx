export default function HomePage() {
  return (
    <div className="app-root">
      <div className="phone">
        <div className="splash">
          <div className="pill">GAME HUB</div>
          <img src="/logo-1024.png" alt="Damie GameHub" />
          <p>
            10 jeux instantanés, tournois, classements et boutique. Connexion et paiements
            uniquement avec Pi.
          </p>
          <p id="pi-error" className="warn" hidden></p>
          <button id="pi-enter" type="button" className="gold-btn">
            Entrer avec Pi
          </button>
          <div id="pi-hint" className="notice">
            Touchez Entrer avec Pi, puis Autoriser.
          </div>
        </div>
      </div>
    </div>
  );
}
