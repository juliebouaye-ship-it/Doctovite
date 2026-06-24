# API ClicRDV — notes techniques

Base utilisée par l'app : `https://api-hads.clicrdv.com/v3`

Headers requis (comme le front officiel) :
```
Accept: application/json
Origin: https://user.clicrdv.com
```

Query params communs : `locale=fr`, `apikey=…`, `results=all`

## Endpoints utiles (par cabinet)

Une fois `GROUP_ID` + `API_KEY` connus :

| Endpoint | Données |
|----------|---------|
| `GET /groups/{id}` | Nom, adresse, ville, `sector`, `urlname`, liens calendar↔intervention |
| `GET /groups/{id}/calendars` | Médecins (`publicname`) |
| `GET /groups/{id}/interventions` | Motifs de RDV (`publicname`, `description`) |
| `GET /groups/{id}/availabletimeslots` | Créneaux **libres** uniquement |

Params timeslots : `intervention_ids[]`, `calendar_ids[]`, `start`, `nDays`

## Ce qui n'existe PAS

- `GET /groups` → **403** (pas d'annuaire public)
- Pas de recherche par ville/spécialité
- Pas d'apikey universelle — **1 clé par cabinet**, extraite de la page booking

## Découverte d'un nouveau cabinet (scraping)

Pipeline prévu :

```
1. Trouver des URLs user.clicrdv.com/{slug}
   → Google site:user.clicrdv.com + mot-clé + département
   → Pages Jaunes / Solocal

2. Charger la page (SPA React) avec Playwright
   → Intercepter le premier appel API → récupérer group_id + apikey

3. Enrichir via API :
   GET /groups/{id}
   GET /groups/{id}/calendars
   GET /groups/{id}/interventions

4. Ajouter entrée dans data/catalog.json
   (plus tard : flag pollable, last_slot_count, department dérivé du CP)
```

Scripts de probe existants dans `scripts/` (exploration manuelle, pas prod).

## Test de contrôle (diagnostic)

Si le motif cible a 0 créneau, le diagnostic teste aussi la **photothérapie** (`PROBE_INTERVENTION_ID` / `PROBE_CALENDAR_ID` dans `clicrdv.js`) — presque toujours des créneaux libres → preuve que l'API répond.

## Données non disponibles

L'API publique ne donne **pas** les RDV déjà pris — seulement les créneaux libres. Impossible de savoir « combien de personnes attendent ».

## Zone grise

- Clés API = celles du widget public (déjà dans le navigateur des patients).
- Scraping d'index = même zone que la surveillance actuelle.
- Ne pas stocker de données patients.

## Cabinet de référence (Confluent)

| Champ | Valeur |
|-------|--------|
| GROUP_ID | 187459 |
| urlname | clinique-dermatologique-du-confluent |
| INTERVENTION grains de beauté | 5016905 |
| Calendars | 690685, 690687, 690689, 691103 |
