#!/bin/bash
# deploy.sh — Quick deploy to VPS
# Usage: ./deploy.sh user@your-vps-ip

set -e

REMOTE_DIR="/opt/quickcrm"

echo "▶ Syncing files to contabo:$REMOTE_DIR"
rsync -avz --exclude node_modules --exclude dist --exclude .git \
  ./ "contabo:$REMOTE_DIR/"

echo "▶ Building and starting containers"
ssh contabo "cd $REMOTE_DIR && docker compose up -d --build"

echo "▶ Setting up nginx (if first time, run manually):"
echo "  ssh contabo 'cd $REMOTE_DIR && npx tsx scripts/setup-nginx.ts'"

echo ""
echo "✅ Deployed — https://leads.vaayulabs.com"
