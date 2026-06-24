# Architecture

## Stack

- **Node.js 22** (ES modules)
- **Express** — API + fichiers statiques
- **node-cron** — vérif auto toutes les N minutes
- **Front** : HTML/CSS/JS vanilla (pas de bundler)
- **Stockage** : JSON fichiers dans `data/`

## Arborescence utile

```
Résa/
├── doc/                    ← ce dossier (agents)
├── public/
│   ├── index.html          ← landing + catalogue + formulaire demande
│   ├── dashboard.html      ← tableau de bord surveillance
│   ├── css/app.css
│   └── js/
│       ├── landing.js
│       └── dashboard.js
├── src/
│   ├── server.js           ← routes + cron
│   ├── config.js           ← constantes cabinet (à généraliser)
│   ├── clicrdv.js          ← client API ClicRDV
│   ├── checker.js          ← logique scan + détection nouveaux créneaux
│   ├── notify.js           ← envoi ntfy
│   ├── storage.js          ← checks.json
│   ├── diagnostic.js       ← test API (~2 min)
│   └── catalog.js          ← catalog.json + cabinet-requests
├── data/
│   ├── catalog.json
│   ├── checks.json         ← historique (gitignore recommandé)
│   └── cabinet-requests.json
└── scripts/                ← probes API (exploration scraping)
```

## Flux surveillance

```
cron (*/15 * * * *)
  → runCheck()
    → fetchAllSlots()     # balaie SCAN_DAYS par fenêtres de 7j
    → compare knownSlots  # storage.js
    → si nouveaux slots + NTFY_TOPIC → notifySlots()
    → saveCheck()
```

Une **alerte** = 1 envoi ntfy même si plusieurs créneaux dans le même check.

## Routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/status` | État + historique + métadonnées cabinet |
| POST | `/api/check` | Scan manuel immédiat |
| GET | `/api/diagnostic` | Test long (grains de beauté + photothérapie) |
| POST | `/api/test-ntfy` | Notification test |
| GET | `/api/catalog` | Liste cabinets (front) |
| POST | `/api/cabinet-requests` | Demande ajout cabinet |

Fichiers statiques : tout `public/` dont `/dashboard.html`.

## Limitations actuelles (à connaître avant de coder)

1. **Un seul watch actif** — config hardcodée dans `config.js`, pas multi-utilisateurs.
2. **Pas d'auth** — dashboard ouvert si le port est accessible.
3. **Pas de paiement** — affiché « à venir » sur la landing.
4. **Catalogue ≠ surveillance** — plusieurs cabinets dans le JSON, mais un seul est réellement scanné.

## Évolution architecture cible (non implémentée)

```
catalog.json  ← alimenté par scraper
watches table ← user + group_id + intervention_id + alerts_remaining
workers       ← un job cron par watch (ou queue)
```

Ne pas tout construire d'un coup — itérer.
