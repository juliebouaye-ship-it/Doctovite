# Gérer sa veille (cuisine + cocon)

Guide pour **allumer**, **mettre en pause** et **éteindre** la surveillance Doctovite.

## Les deux boutons

| Où | Action | Effet |
|----|--------|-------|
| **Cocon** (Netlify) | Mettre en pause / Reprendre | Change le statut dans Supabase — le worker **arrête les scans** |
| **VPS OVH** | `pm2 stop` / résiliation | Arrête la facturation serveur |

La pause dans le cocon **ne coupe pas** le VPS tout seule — vous économisez les scans, pas encore les ~4 €/mois.

---

## Allumer la veille

1. **VPS allumé** (OVH actif, `pm2 status` → online)
2. Dans le cocon → **Reprendre la veille**
3. Vérifier : nouvelle ligne dans Supabase → table `checks` (~15 min)

---

## Mettre en pause (sans résilier le VPS)

1. Cocon → **Mettre la veille en pause**
2. Le worker ignore les prochains scans (`Veille en pause — scan ignoré` dans les logs)
3. Votre historique reste visible dans le cocon

---

## Éteindre complètement (plus de facture VPS)

Quand vous avez votre RDV ou plus besoin de surveiller :

```bash
ssh ubuntu@VOTRE_IP
cd ~/resa-rdv
pm2 stop resa-rdv
```

Puis **résilier le VPS** depuis le panel OVH.

**Avant de résilier** : sauvegardez votre `.env` local (ntfy, clés Supabase).

Le **cocon reste en ligne** sur Netlify — historique inclus.

---

## Connexion sécurisée (étape 1.5)

### Configuration Supabase (une fois)

1. **Authentication** → **Providers** → activer **Email**
2. **URL Configuration** :
   - Site URL : `https://votre-site.netlify.app`
   - Redirect URLs : ajouter  
     `https://votre-site.netlify.app/login.html`  
     `http://127.0.0.1:8080/login.html` (dev local)
3. SQL Editor → exécuter `supabase/auth-policies.sql`

### Première connexion

1. Ouvrir `/login.html`
2. Entrer votre email → lien magique
3. Au premier login, votre watch est **rattachée** à votre compte

### Restreindre à votre email (recommandé)

Dans Netlify → Environment variables :

```
ALLOWED_EMAIL=votre@email.fr
```

Puis redéployer (régénère `supabase-config.js`).

---

## Commandes VPS utiles

```bash
pm2 status
pm2 logs resa-rdv --lines 20
pm2 restart resa-rdv --update-env
cd ~/resa-rdv && git pull && npm install --omit=dev && pm2 restart resa-rdv
```
