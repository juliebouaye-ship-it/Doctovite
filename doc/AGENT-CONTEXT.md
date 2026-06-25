# Contexte produit (pour agents)

## Qu'est-ce que c'est ?

**Doctovite** (ex. Veille Créneau) surveille les créneaux libres sur **ClicRDV** et envoie une **notification ntfy** quand de nouveaux créneaux apparaissent.

## Phases produit

Voir [ROADMAP.md](./ROADMAP.md) pour le détail des **deux grandes étapes**.

**État actuel (juin 2026)** :
- Cocon sur **Netlify** + données **Supabase**
- Worker **VPS OVH** → écrit les scans dans Supabase + alertes ntfy
- Dashboard accessible **sans tunnel SSH**
- Login / RLS : **pas encore** (cocon public si on a l'URL)

Cas d'usage initial :
- **Cabinet** : Clinique dermatologique du Confluent (Nantes)
- **Motif** : 1ère consultation pour examen des grains de beauté
- **4 médecins** surveillés en parallèle
- Les **premières alertes ont fonctionné** (juin 2026)
- **Pont Supabase** opérationnel (juin 2026)

## Positionnement

- **Pas Doctolib** : concurrence gratuite (Doctolib Tracker), APIs verrouillées.
- **Niche** : cabinets sur ClicRDV (ou petits systèmes pollables), spécialités saturées (dermato, etc.).
- **Micro-business**, pas licorne : dizaines à centaines de clients/an réalistes.

## Décisions produit (ne pas contredire sans demande explicite)

| Sujet | Décision |
|-------|----------|
| Prix / offres | Hypothèse ~**2,99 €** forfait — **à formaliser** (options, grilles) → voir étape 2 dans `ROADMAP.md` |
| Abonnement | **Non** pour l'instant — à revalider dans le modèle économique |
| Inclus | **2 alertes** max + dashboard perso + veille ~90 jours |
| Promesse | **Alerte**, pas RDV garanti — plafond d'abonnés par cabinet à prévoir |
| Découverte cabinets | **Scraping** + demandes manuelles via formulaire — **pas** « collez votre URL » (les users ne l'ont pas) |
| Pub display | Non viable à cette échelle |
| Paiement | Pas encore — **après** étape 1 ; modèle économique à définir avant Stripe |

## Utilisatrice / contraintes

- Projet perso qui peut devenir service payant léger.
- Préfère **petit prix, peu de déception** si ça ne marche pas.
- VPS OVH ~4 €/mois **à la demande** (pas d'engagement annuel — voir `ROADMAP.md`)
- Communication en **français**.

## Fichiers de données sensibles

- `data/checks.json` — historique des scans (ne pas committer)
- `data/cabinet-requests.json` — demandes utilisateurs (créé à la volée)
- `.env` — topic ntfy privé
