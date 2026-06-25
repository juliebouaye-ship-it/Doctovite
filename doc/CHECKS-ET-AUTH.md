# Table `checks` — faut-il tout historiser ?

## En bref

**Non, pas besoin de garder chaque scan « 0 créneau ».** Pour Doctovite, l'essentiel c'est :

- Dernière vérification (quand ?)
- Dernières places repérées (si any)
- Dernière alerte envoyée (si any)

À 1 scan / 15 min sans créneau → **~96 lignes/jour** qui n'apportent rien à l'UX.

## Modèle recommandé (léger)

| Donnée | Où la garder |
|--------|----------------|
| Dernière vérif + créneaux actuels | Colonnes sur `watches` (`last_checked_at`, `last_slots`…) |
| Historique utile | Table `checks` **seulement** si `slot_count > 0` ou `notified = true` |
| Alertes | Ligne `checks` avec `notified = true` + éventuellement `last_notified_at` sur `watch` |

→ Le dashboard lit surtout `watches`. `checks` devient un **journal d'événements**, pas un log technique.

## Ressources Supabase (free tier)

- 500 Mo de stockage — largement suffisant même avec historique complet pour 1 user
- Le vrai coût : **bruit** dans le cocon (tableau inutile) et requêtes plus lourdes, pas la facture
- Pour l'étape 2 multi-users : le modèle « événements seulement » devient important

## Où voir les connexions login ?

Les magic links **ne passent pas** par `checks`. Les comptes sont dans :

**Supabase → Authentication → Users** (et **Logs** pour les envois d'email).

## Login qui ne part pas — checklist

1. **Authentication → Providers → Email** : activé
2. **URL Configuration** :
   - Site URL = ton Netlify ou `http://127.0.0.1:8080`
   - Redirect URLs : `…/login.html` (Netlify + local)
3. **Authentication → Logs** : voir si l'envoi est refusé
4. Email intégré Supabase : **~3 emails/heure**, usage démo — pour la prod, SMTP perso (Resend, etc.)
5. Vérifier la console navigateur (F12) sur `/login.html` après envoi
6. Clé **anon / publishable** dans `supabase-config.js` — pas la `service_role`
