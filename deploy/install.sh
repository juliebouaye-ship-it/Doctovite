#!/usr/bin/env bash
# Installation sur un VPS Ubuntu/Debian frais
# Usage : bash deploy/install.sh
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/resa-rdv}"
REPO_URL="${REPO_URL:-}"

echo "==> Mise a jour du systeme"
sudo apt-get update
sudo apt-get install -y curl git ufw

echo "==> Installation de Node.js 22"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Installation de PM2"
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

if [ -n "$REPO_URL" ] && [ ! -d "$APP_DIR/.git" ]; then
  echo "==> Clone du depot"
  git clone "$REPO_URL" "$APP_DIR"
fi

if [ ! -d "$APP_DIR" ]; then
  echo "Erreur : le dossier $APP_DIR n'existe pas."
  echo "Copiez le projet sur le VPS (scp/rsync/git) puis relancez."
  exit 1
fi

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "IMPORTANT : editez $APP_DIR/.env (NTFY_TOPIC, etc.) puis relancez :"
  echo "  nano .env"
  echo "  bash deploy/install.sh"
  exit 0
fi

echo "==> Installation des dependances"
npm install --omit=dev

echo "==> Demarrage avec PM2"
pm2 start ecosystem.config.cjs
pm2 save

echo "==> Demarrage automatique au boot"
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | bash || true

echo "==> Pare-feu (SSH uniquement)"
sudo ufw allow OpenSSH
sudo ufw --force enable

echo ""
echo "Installation terminee."
echo "Dashboard local sur le VPS : http://127.0.0.1:8080"
echo "Depuis votre PC : ssh -L 8080:127.0.0.1:8080 user@votre-ip"
echo "Puis ouvrez http://127.0.0.1:8080"
echo ""
pm2 status
