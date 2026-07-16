#!/bin/bash
# deploy.sh — Quick deploy to VPS
# Usage: ./deploy.sh user@your-vps-ip

set -e

VPS=${1:?Usage: ./deploy.sh user@vps-ip}
REMOTE_DIR="/opt/quickcrm"

echo "▶ Syncing files to $VPS:$REMOTE_DIR"
rsync -avz --exclude node_modules --exclude dist --exclude .git \
  ./ "$VPS:$REMOTE_DIR/"

echo "▶ Building and starting containers"
ssh "$VPS" "cd $REMOTE_DIR && docker compose up -d --build"

echo "▶ Setting up nginx (if first time, run manually):"
echo "  ssh $VPS 'cd $REMOTE_DIR && npx tsx scripts/setup-nginx.ts'"

echo ""
echo "✅ Deployed — https://leads.vaayulabs.com"
