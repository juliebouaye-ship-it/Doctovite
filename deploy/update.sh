#!/usr/bin/env bash
# Met a jour et redemarre l'app apres un changement de code
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/resa-rdv}"
cd "$APP_DIR"

git pull 2>/dev/null || true
npm install --omit=dev
pm2 restart resa-rdv
pm2 status
