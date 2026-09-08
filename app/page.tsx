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
          <a className="gold-btn" href="/enter">
            Entrer avec Pi
          </a>
          <div className="notice">Touchez Entrer avec Pi, puis Autoriser.</div>
        </div>
      </div>
    </div>
  );
}
