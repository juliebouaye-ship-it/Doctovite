# Roadmap — deux grandes étapes

État actuel : **MVP fonctionnel** (alertes ntfy OK, VPS OVH) — dashboard accessible via **tunnel SSH** uniquement, données sur le VPS.

---

## Étape 1 — Appli autonome pour moi (mon cocon)

**Objectif** : ton petit espace perso sur Internet — **même sans VPS**, même si tu ne fais jamais l'étape 2.

Deux morceaux distincts :

| | Métaphore | Rôle | Quand c'est allumé |
|---|-----------|------|-------------------|
| **Le cocon** | Salle / accueil | Dashboard, historique, catalogue, « chez moi » | **Toujours** (~0 €) |
| **La cuisine** | Worker scrape | Surveillance ClicRDV + alertes ntfy | **À la demande** (~4 €/mois) |

Tu peux supprimer le VPS : le cocon reste. La cuisine s'éteint — plus d'alertes, mais ton historique et ton espace sont là.

### Déjà fait

- [x] Surveillance ClicRDV Confluent / grains de beauté
- [x] Notifications ntfy sur nouveaux créneaux
- [x] Dashboard avec historique + diagnostic
- [x] Landing « Veille Créneau » + catalogue JSON
- [x] Formulaire demande de cabinet
- [x] Premières alertes réelles validées
- [x] App sur VPS OVH (worker + cron 24h/24)

### À faire

**Le cocon (permanent, survit au VPS)**

- [ ] Héberger le front ailleurs que sur le VPS (Netlify ou Cloudflare Pages — gratuit)
- [ ] Supabase : stocker historique des scans, config de ta watch, catalogue
- [ ] Login perso simple (magic link sur ton email — un seul user : toi)
- [ ] Dashboard branché sur Supabase : consulter l'historique **sans** VPS

**La cuisine (VPS à la demande)**

- [ ] Worker sur VPS qui lit ta watch *active* dans Supabase
- [ ] Allumer le VPS quand tu lances une veille ; l'éteindre quand c'est fini
- [ ] Sauvegarder `.env` en local avant toute résiliation OVH

**Transition depuis l'existant**

- [ ] Migrer `checks.json` et le catalogue vers Supabase
- [ ] Retirer la dépendance au tunnel SSH pour le cocon

### Coût

- **Cocon** : 0 €/mois (Supabase free tier + Netlify/Cloudflare Pages)
- **Cuisine** : ~4 €/mois **uniquement** pendant une veille active, puis résiliation OVH

### Hors scope

- Pas d'autres utilisateurs
- Pas de paiement
- Pas de multi-cabinets automatisé à grande échelle

### Critère « c'est fait »

> J'ouvre mon cocon depuis mon téléphone (sans SSH, sans VPS). Je vois mon historique. Quand je veux surveiller, j'allume le VPS ; quand j'ai fini, je le coupe — **mon espace reste**.

### Infra — qui fait quoi ? (version simple)

| Outil | C'est quoi ? | Dans ton projet |
|-------|--------------|-----------------|
| **Netlify / Cloudflare Pages** | Vitrine toujours ouverte | Ton cocon (HTML/CSS/JS du dashboard) |
| **Supabase** | Armoire permanente | Historique, config, catalogue |
| **VPS OVH** | Cuisine | Worker qui scanne — **seulement** quand tu veilles |
| **Caddy / Cloudflare Tunnel** | Portier temporaire | Utile *pendant* la transition ; plus nécessaire une fois le cocon ailleurs |

---

## Étape 2 — Appli avec utilisateurs

**Objectif** : ouvrir le même modèle à d'autres — plusieurs cocons, paiement, VPS allumé par client.

**On démarre quand** : étape 1 validée + signal réel que des gens paieraient.

L'architecture est **la même** qu'à l'étape 1 (cocon permanent + cuisine à la demande). L'étape 2 ajoute surtout :

- Plusieurs users (pas juste toi)
- Modèle économique + Stripe
- Onboarding client

### Modèle économique (à définir proprement — avant le code Stripe)

Hypothèse de départ (non figée) : forfait ~2,99 €, 2 alertes, pas d'abonnement.

À trancher avant implémentation :

- [ ] Grille tarifaire (1 formule vs plusieurs options : nb d'alertes, durée de veille, etc.)
- [ ] Ce qui est inclus dans chaque offre (dashboard, historique, relance)
- [ ] Politique de remboursement / alerte non déclenchée
- [ ] Plafond d'abonnés par cabinet (promesse honnête)
- [ ] Intégration paiement (Stripe Checkout, liens de paiement, etc.)

→ Documenter les choix dans `doc/MODELE-ECONOMIQUE.md` quand la réflexion sera mûre.

### Scénario type

```
User paie → watch activée → VPS allumé → alertes ntfy
  → quota atteint ou RDV trouvé → VPS éteint
  → user garde son cocon et peut relancer plus tard
```

### À faire (ordre indicatif)

1. Valider l'intérêt réel (qui paie ? même manuellement au début)
2. **Modèle économique** — options, grilles, promesses
3. Multi-users Supabase + auth
4. Stripe selon le modèle retenu
5. Allumer / éteindre le VPS selon les watches actives (manuel → scripté)

### Coût

VPS couvert par les clients (2 clients ≈ 1 mois de VPS). Cocons toujours sur le free tier.

### Critère « c'est fait »

> Un inconnu paie, reçoit ses alertes, consulte son cocon. Quand c'est fini, le VPS s'arrête. Il peut revenir plus tard et relancer une recherche.

---

## Vue d'ensemble

```
AUJOURD'HUI              ÉTAPE 1 — Mon cocon           ÉTAPE 2 — Service
────────────             ─────────────────             ─────────────────
Tunnel SSH         →     Cocon toujours en ligne   →   Cocons multi-users
Tout sur le VPS          Cuisine VPS à la demande       + paiement Stripe
JSON sur le VPS          Supabase (données perso)       Même architecture
Pas de paiement          Pas de paiement                Modèle éco à définir
Coût : ~4 € utile        Coût cocon : 0 €               Coût : auto-financé
                         Coût cuisine : ~4 € si veille
```

L'étape 2 **réutilise** l'architecture de l'étape 1. Si tu t'arrêtes à l'étape 1, tu gardes quand même ton cocon.

---

## Backlog produit (après le cocon, avant ou pendant étape 2)

### Scraping / indexation

- Script `index-cabinet` : URL → credentials → enrichissement API → catalogue
- Crawl ciblé par département / spécialité
- **Ne pas** indexer 2000 cabinets d'un coup

### Front / produit

- Filtres catalogue : département, spécialité, motif
- Page par cabinet
- Compteur « places surveillance restantes » par cabinet

## Explicitement hors scope (sauf demande)

- Doctolib / billetterie concerts
- Pub AdSense
- Plateforme générique tous sites de RDV
