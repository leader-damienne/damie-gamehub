import Link from "next/link";

export const metadata = {
  title: "Confidentialité — Damie GameHub",
};

export default function PrivacyPage() {
  return (
    <main className="legal" style={{ maxWidth: 520, margin: "0 auto", padding: 24 }}>
      <p>
        <Link href="/">Damie GameHub</Link>
      </p>
      <h1>Politique de confidentialité</h1>
      <p>
        Damie GameHub est une application Pi. La connexion se fait uniquement via le SDK Pi dans le
        Pi Browser. Aucun e-mail, numéro de téléphone, Google, Apple ou autre compte tiers n’est
        demandé.
      </p>
      <p>
        Données conservées : identifiant d’application Pi, nom Pioneer, scores, tickets, couronnes,
        soldes π et DGH, historique des échanges nécessaires au jeu, aux tournois et aux
        classements.
      </p>
      <p>
        Les π déposés sont échangés en jetons DGH pour jouer. Pour retirer, les DGH sont
        reconvertis en π puis envoyés vers le wallet Pi du Pioneer. Aucune monnaie fiat n’est
        utilisée.
      </p>
      <p>
        Les paiements sont traités par la plateforme Pi (User-to-App et App-to-User). Nous ne
        stockons pas votre phrase secrète de wallet.
      </p>
      <p>Contact développeur : via l’application Damie GameHub sur le portail Pi Develop.</p>
    </main>
  );
}
