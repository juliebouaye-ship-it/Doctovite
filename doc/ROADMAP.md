# Roadmap — deux grandes étapes

État actuel : **étape 1 quasi terminée** — cocon Doctovite sur Netlify + Supabase, worker VPS branché, dashboard à jour sans SSH.

---

## Étape 1 — Appli autonome pour moi (mon cocon)

**Objectif** : ton petit espace perso sur Internet — **même sans VPS**, même si tu ne fais jamais l'étape 2.

| | Métaphore | Rôle | Quand c'est allumé |
|---|-----------|------|-------------------|
| **Le cocon** | Salle / accueil | Dashboard, historique, catalogue | **Toujours** (~0 €) |
| **La cuisine** | Worker scrape | Surveillance ClicRDV + alertes ntfy | **À la demande** (~4 €/mois) |

### Déjà fait

- [x] Surveillance ClicRDV Confluent / grains de beauté
- [x] Notifications ntfy
- [x] **Doctovite** — landing + cocon (UI chaleureuse, pas mode dev)
- [x] Front hébergé sur **Netlify** (`public/`)
- [x] **Supabase** : cabinets, watches, checks
- [x] Migration catalogue + watch + historique local
- [x] Worker VPS écrit dans Supabase à chaque scan
- [x] Dashboard lit Supabase (Netlify + local, sans tunnel SSH)
- [x] VPS relié à GitHub (`git pull` possible)
- [x] Landing → catalogue Supabase

### Reste pour dire « étape 1 bouclée »

- [x] **Login perso** (magic link) — `login.html`
- [x] **RLS Supabase** — `supabase/auth-policies.sql`
### Boutons pause / reprise

Masqués en étape 1 (`#watch-controls hidden` dans `dashboard.html`). À réactiver à l'étape 2.
- [x] **Doc** allumer / éteindre — `doc/VEILLE.md`
- [ ] Config Supabase Auth + `auth-policies.sql` exécutés en prod
- [ ] **Un deploy Netlify** avec login + `ALLOWED_EMAIL`
- [ ] **Sauvegarde `.env` local** avant résiliation VPS

### Peaufinage optionnel (confort, pas bloquant)

- [ ] Clé SSH sur le VPS (à la place du mot de passe)
- [ ] Nom de domaine perso (quand clients — pas prioritaire)

### Critère « c'est fait »

> J'ouvre mon cocon depuis mon téléphone (sans SSH, sans VPS). Je vois mon historique à jour. Quand je veux surveiller, j'allume le VPS ; quand j'ai fini, je le coupe — **mon espace reste**.

**Verdict juin 2026** : le cœur fonctionne (cocon + Supabase + VPS). Il manque surtout la **sécurisation** (login + RLS) pour cocher sereinement.

### Coût

- **Cocon** : 0 €/mois (Supabase + Netlify free tier)
- **Cuisine** : ~4 €/mois uniquement pendant une veille active

---

## Étape 2 — Appli avec utilisateurs

**On démarre quand** : étape 1 validée + signal réel que des gens paieraient.

Ajoute surtout : multi-users, modèle économique, Stripe, VPS allumé par client.

→ Voir section modèle économique et `doc/MODELE-ECONOMIQUE.md` (à créer).

---

## Vue d'ensemble

```
FAIT (étape 1)              PEUFINAGE                  ÉTAPE 2
──────────────              ─────────                  ───────
Netlify + Supabase    →     Login + RLS          →     Users + Stripe
VPS → Supabase              Domaine / SSH              Multi-cocons
Cocon Doctovite             Doc résiliation VPS
```

---

## Backlog produit (après étape 1)

### Scraping / indexation

- Script `index-cabinet`, crawl ciblé, pas de masse

### Front / produit

- Filtres catalogue, page par cabinet, compteur places restantes

## Hors scope (sauf demande)

- Doctolib, pub AdSense, plateforme générique tous sites de RDV
