# Damie GameHub

Hub de jeux HTML5 pour Pioneers. Auth Pi uniquement, paiements en π uniquement, sans redirection externe.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Local : http://localhost:3314

Pour le **Mainnet** (Pi Browser), déployer en HTTPS et mettre :

```
PI_API_KEY=clé_du_portail
NEXT_PUBLIC_PI_SANDBOX=false
```

Sur Cloudflare Workers, les soldes doivent survivre entre les requêtes. Ajoutez un KV (ou Upstash) :

```
CF_ACCOUNT_ID=
CF_KV_NAMESPACE_ID=
CF_API_TOKEN=
```

Le wallet de l’app dans develop.pinet.com ne doit pas rester sur **None**, sinon les retraits A2U échouent.
