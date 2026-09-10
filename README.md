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

Sur Cloudflare, liez un KV au Worker pour garder les soldes :

1. Onglet **Bindings** du Worker `damiegamehub`
2. **Add** → **KV Namespace**
3. Variable name : `DAMIE_KV`
4. Créer un namespace `damie-gamehub`, puis **Deploy**

Sans ce binding, les soldes peuvent disparaître entre deux requêtes.
