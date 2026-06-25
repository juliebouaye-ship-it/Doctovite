# Documentation agents — Veille Créneau

Dossier de contexte pour les agents Cursor qui travaillent sur ce projet.

## Par où commencer

| Fichier | Contenu |
|---------|---------|
| [AGENT-CONTEXT.md](./AGENT-CONTEXT.md) | Vision produit, décisions business, état actuel |
| [CONFIGURATION.md](./CONFIGURATION.md) | `.env`, `config.js`, catalogue — quoi modifier |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Structure du code, routes API, front |
| [API-CLICRDV.md](./API-CLICRDV.md) | API publique, indexation, scraping |
| [ROADMAP.md](./ROADMAP.md) | **Deux grandes étapes** + backlog |
| [VEILLE.md](./VEILLE.md) | Pause veille, VPS, login Supabase |

## Démarrage rapide (agent)

```powershell
cd "c:\Users\JulieJeltsch\Documents\Résa"
.\run.ps1
```

- Accueil : http://127.0.0.1:8080
- Connexion : http://127.0.0.1:8080/login.html
- Cocon : http://127.0.0.1:8080/dashboard.html (après login)

Si `Cannot GET /dashboard.html` → **redémarrer le serveur** (`.\run.ps1` tue l'ancienne instance sur le port). Le fichier existe dans `public/dashboard.html` ; une instance Node lancée avant sa création ne le sert pas.

## Règles pour les agents

- **Ne pas committer** `.env` ni `data/checks.json` (données perso).
- **Minimiser la portée** : micro-service de niche, pas de sur-ingénierie.
- **Pas d'abonnement mensuel** (décision produit) — forfait ~2,99 €, 2 alertes max.
- **Promesse honnête** : alerte, pas garantie de réservation.
- Le README utilisateur reste à la racine ; ce dossier `doc/` est pour les agents.
