# Deploiement VPS

Guide pour faire tourner l'app 24h/24 sur un serveur cloud pendant ~1 mois.

## C'est quoi un VPS ?

**VPS** = *Virtual Private Server* = un **petit serveur Linux** qui tourne dans un datacenter, accessible via Internet.

En pratique :
- Vous louez une **machine virtuelle** (souvent 1 vCPU, 2 Go RAM)
- Elle reste **allumee 24h/24**
- Vous vous y connectez en **SSH** (terminal distant)
- Vous y installez Node.js + votre app
- Vous payez **a l'heure ou au mois** (~3-6 EUR/mois)

C'est l'equivalent d'un Raspberry Pi dans un datacenter, sans acheter le materiel.

## Faut-il benchmarker tous les hebergeurs ?

**Non, pas pour votre cas.** Votre app est tres legere (quelques requetes HTTP toutes les 15 min). N'importe quel VPS d'entree de gamme suffit.

| Hebergeur | Prix ~ | Datacenter | Verdict |
|-----------|--------|------------|---------|
| **Hetzner CX22** | ~4 EUR/mois | Allemagne/Finlande | **Recommande** — meilleur rapport qualite/prix |
| **OVH VPS** | ~4-6 EUR/mois | France | Bon si vous voulez du FR |
| **Scaleway DEV1-S** | ~4 EUR/mois | France | Alternative FR correcte |
| **Fly.io / Railway** | variable | EU possible | Plus simple mais facturation moins previsible |
| **Oracle Cloud Free** | 0 EUR | variable | Gratuit mais setup penible |

**Mon conseil** : prenez **Hetzner CX22** ou **OVH VPS Starter**, Ubuntu 24.04, c'est regle en 15 min. Pas besoin de comparer 10 sites.

## Etapes de deploiement

### 1. Creer le VPS

- OS : **Ubuntu 24.04 LTS**
- Taille : le **plus petit** suffit (1-2 vCPU, 2 Go RAM)
- Notez l'**adresse IP** et connectez-vous en SSH

### 2. Copier le projet sur le VPS

Depuis votre PC (PowerShell), dans le dossier du projet :

```powershell
scp -r . votre-user@IP_DU_VPS:~/resa-rdv
```

Ou via git si le projet est sur GitHub :

```bash
git clone https://github.com/vous/resa-rdv.git ~/resa-rdv
```

### 3. Configurer

```bash
ssh votre-user@IP_DU_VPS
cd ~/resa-rdv
cp .env.example .env
nano .env
```

Verifiez au minimum :
```
NTFY_TOPIC=resa-derm-confluent-julie-2026
HOST=127.0.0.1
CHECK_INTERVAL_MINUTES=15
SCAN_DAYS=90
```

### 4. Installer et lancer

Si `bash deploy/install.sh` affiche `pipefail: invalid option`, corrigez les fins de ligne Windows :

```bash
sed -i 's/\r$//' deploy/install.sh deploy/update.sh
```

Puis :

```bash
bash deploy/install.sh
```

Le script installe Node.js, PM2, demarre l'app et configure le redemarrage automatique.

### 5. Verifier

```bash
pm2 status
pm2 logs resa-rdv
npm test
```

### 6. Acceder au dashboard depuis votre PC

Le dashboard n'est **pas expose sur Internet** par defaut (plus securise). Utilisez un tunnel SSH :

```powershell
ssh -L 8080:127.0.0.1:8080 votre-user@IP_DU_VPS
```

Puis ouvrez http://127.0.0.1:8080 sur votre PC.

### 7. Quand vous avez votre RDV

```bash
pm2 stop resa-rdv
```

Puis **supprimez le VPS** depuis le panel de l'hebergeur pour ne plus payer.

## Commandes utiles

```bash
pm2 status          # etat de l'app
pm2 logs resa-rdv   # logs en direct
pm2 restart resa-rdv
bash deploy/update.sh   # apres une mise a jour du code
```

## Securite

- Par defaut : `HOST=127.0.0.1` → dashboard accessible uniquement via tunnel SSH
- Le pare-feu n'ouvre que le port SSH (22)
- Les notifications passent par **ntfy** (pas besoin d'exposer l'app)
- Ne commitez jamais le fichier `.env`

## Cout total estime

~4 EUR pour 1 mois de surveillance. Resiliez des que vous avez reserve.
