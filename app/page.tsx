export const dynamic = "force-dynamic";
export const revalidate = 0;

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
          <div
            className="pi-enter-wrap"
            dangerouslySetInnerHTML={{
              __html:
                '<button type="button" class="gold-btn" id="pi-enter" onclick="__damieLogin()">Entrer avec Pi</button>',
            }}
          />
          <div id="pi-hint" className="notice">
            Touchez Entrer avec Pi, puis Autoriser.
          </div>
        </div>
      </div>
    </div>
  );
}
