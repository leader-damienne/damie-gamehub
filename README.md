# Damie GameHub

Hub de jeux HTML5 pour Pioneers. Auth Pi uniquement, paiements en π uniquement, sans redirection externe.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Local : http://localhost:3314

## Réseaux Pi

Deux URLs, deux clés API (develop.pinet.com) :

| URL | Réseau | Variable Cloudflare |
| --- | --- | --- |
| https://damiegamehub.elisabethadilehou571.workers.dev | Testnet | `PI_API_KEY` |
| https://damiegamehub.com | Mainnet | `PI_API_KEY_MAINNET` |

`PI_API_KEY` seule (clé Testnet) ne peut pas approuver un dépôt Mainnet. Sans `PI_API_KEY_MAINNET`, le dernier point de la checklist Pi (transaction U2A) reste bloqué.

Dans develop.pinet.com, le wallet de l’app ne doit pas rester sur **None**. Le compte développeur doit être KYC avec un wallet Mainnet migré.

Sur Cloudflare Workers, les soldes doivent survivre entre les requêtes. Ajoutez un KV (ou Upstash) :

```
CF_ACCOUNT_ID=
CF_KV_NAMESPACE_ID=
CF_API_TOKEN=
```
