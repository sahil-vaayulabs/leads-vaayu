#!/bin/bash
# deploy.sh — Quick deploy to VPS
# Usage: ./deploy.sh user@your-vps-ip

set -e

REMOTE_DIR="/var/www/quickcrm"

echo "▶ Syncing files to contabo:$REMOTE_DIR"
rsync -avz --exclude node_modules --exclude dist --exclude .git \
  --include .env.prod \
  ./ "contabo:$REMOTE_DIR/"

echo "▶ Verifying .env.prod synced"
ssh contabo "test -f $REMOTE_DIR/.env.prod && echo '  OK: .env.prod present' || { echo '  ERROR: .env.prod missing on remote' >&2; exit 1; }"

echo "▶ Building and starting containers"
ssh contabo "cd $REMOTE_DIR && docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d --build"

echo "▶ Setting up nginx (if first time, run manually):"
echo "  ssh contabo 'cd $REMOTE_DIR && npx tsx scripts/setup-nginx.ts'"

echo ""
echo "✅ Deployed — https://leads.vaayulabs.com"
