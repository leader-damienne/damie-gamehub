import Link from "next/link";

export const metadata = {
  title: "Conditions — Damie GameHub",
};

export default function TermsPage() {
  return (
    <main className="legal" style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <p>
        <Link href="/">Damie GameHub</Link>
      </p>
      <h1>Conditions d’utilisation</h1>
      <p>
        Damie GameHub est un hub de jeux HTML5 destiné aux Pioneers. L’accès et les paiements se
        font uniquement dans le Pi Browser, en π.
      </p>
      <p>
        Les mises et achats se paient en DGH (100 DGH = 1 π). Les gains se retirent après échange
        DGH → π vers le wallet Pi. Les jeux sont basés sur l’adresse, pas sur un tirage au sort.
      </p>
      <p>
        En utilisant l’app, vous acceptez les règles de Pi Network et le fait que les soldes en jeu
        dépendent des dépôts, échanges et résultats de parties.
      </p>
    </main>
  );
}
