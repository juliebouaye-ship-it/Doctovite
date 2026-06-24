# Surveillance des créneaux ClicRDV

Surveille les créneaux « 1ère consultation pour examen des grains de beauté » à la Clinique dermatologique du Confluent, et envoie une notification ntfy quand de nouveaux créneaux apparaissent.

## Prérequis

- [Node.js](https://nodejs.org/) (déjà installé chez vous : v22)

## Démarrage rapide

1. Copier `.env.example` vers `.env` si besoin
2. Choisir un topic ntfy **unique** dans `NTFY_TOPIC`
3. Installer l'app **ntfy** sur votre téléphone et vous **abonner** à ce topic
4. Lancer :

```powershell
.\run.ps1
```

5. Ouvrir http://127.0.0.1:8080

## Deploiement VPS (24h/24, ~4 EUR/mois)

Voir **[DEPLOY.md](DEPLOY.md)** pour le guide complet (Hetzner, OVH, installation, PM2).

## Notifications ntfy

- Bouton **Tester notification ntfy** sur le dashboard
- Une alerte n'est envoyée **uniquement quand de nouveaux créneaux** apparaissent

## Périmètre de recherche

- **Tous les médecins** : Dr Kogge, Dr Vildy, Dr Hello, Dr Daguze
- **90 prochains jours** (configurable via `SCAN_DAYS` dans `.env`)
- Balayage par tranches de 7 jours (limite API ClicRDV)

## Test diagnostic

Pour vérifier que l'API fonctionne (même sans créneaux grains de beauté) :

```powershell
npm test
```

Ou bouton **Test diagnostic API** sur le dashboard.

Le test balaie les grains de beauté (0 libre = normal) puis interroge la photothérapie du même cabinet, qui a presque toujours des créneaux libres — preuve que la connexion API marche.

Note : l'API publique ne donne pas les RDV déjà pris (données protégées), seulement les créneaux libres.

## Si ntfy ne marche pas

On pourra basculer sur Telegram — dites-le moi.

## Documentation agents (Cursor)

Voir le dossier **[doc/](doc/README.md)** pour le contexte produit, la configuration, l'architecture et la roadmap scraping.
