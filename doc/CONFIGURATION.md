# Configuration

## 1. Fichier `.env` (obligatoire)

Copier depuis `.env.example` :

```env
NTFY_TOPIC=resa-derm-confluent-votre-nom-unique   # UNIQUE — topic privé ntfy
NTFY_SERVER=https://ntfy.sh
CHECK_INTERVAL_MINUTES=15
SCAN_DAYS=90
PORT=8080
HOST=127.0.0.1    # 127.0.0.1 local ; 0.0.0.0 si exposé (déconseillé sans tunnel)
```

**ntfy** : installer l'app mobile, s'abonner au même `NTFY_TOPIC`. Sans topic configuré, pas de notifications.

## 2. Fichier `src/config.js` (cible ClicRDV actuelle)

Constantes **par cabinet surveillé** (aujourd'hui une seule cible hardcodée) :

| Constante | Valeur actuelle | Rôle |
|-----------|-----------------|------|
| `GROUP_ID` | `187459` | ID cabinet ClicRDV |
| `API_KEY` | `71a07e0…` | Clé publique embarquée dans la page booking (par cabinet) |
| `INTERVENTION_ID` | `5016905` | Motif « grains de beauté » |
| `CALENDAR_IDS` | 4 IDs | Agendas médecins à surveiller |
| `CALENDAR_NAMES` | map id → nom | Affichage dashboard |
| `BOOKING_URL` | URL user.clicrdv.com | Lien dans les notifs |

Pour **changer de cabinet** aujourd'hui : modifier ces valeurs + mettre à jour `data/catalog.json`.

> **Important** : chaque cabinet a son propre `GROUP_ID` + `API_KEY`. La clé du Confluent ne marche pas pour un autre groupe.

## 3. Fichier `data/catalog.json` (catalogue front)

Liste des cabinets affichés sur la landing (`GET /api/catalog`).

Structure d'une entrée :

```json
{
  "id": "slug-url",
  "name": "Nom affiché",
  "city": "Nantes",
  "department": "44",
  "sector": "Dermatologie",
  "booking_url": "https://user.clicrdv.com/...",
  "status": "active",
  "interventions": [{ "id": 5016905, "name": "...", "featured": true }],
  "calendars": [{ "id": 690685, "name": "Dr ..." }],
  "note": "Texte libre"
}
```

Le serveur lie la surveillance active au cabinet dont `booking_url` === `BOOKING_URL` dans `config.js`.

## 4. Demandes de nouveaux cabinets

Formulaire sur `/` → `POST /api/cabinet-requests` → fichier `data/cabinet-requests.json`.

Champs : `cabinet_name`, `city`, `motif`, `department`, `details`, `email`.

## 5. Déploiement VPS

Voir `DEPLOY.md` à la racine. PM2, tunnel SSH pour le dashboard, `HOST=127.0.0.1` par défaut.

## Checklist nouvel agent

- [ ] `.env` existe avec `NTFY_TOPIC` unique
- [ ] `npm install` fait
- [ ] `.\run.ps1` démarre sans erreur port occupé
- [ ] `/` et `/dashboard.html` répondent 200
- [ ] `npm test` ou diagnostic API OK
