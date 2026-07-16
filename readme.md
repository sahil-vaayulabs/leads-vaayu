# QuickCRM — Lead Tracker

Lightweight lead tracker for solo cold outreach. Hono API + MongoDB + single HTML frontend.

Log calls, mark status (Not Contacted → No Answer → Interested → Follow-up → Rejected → Won), set next-action dates, filter/search.

## Stack

- **Server:** Hono (Node.js)
- **DB:** MongoDB 7 (Docker)
- **Frontend:** Single HTML file (no framework)
- **Deploy:** Docker Compose + nginx reverse proxy

## Project Structure

```
src/index.ts          — Hono server (API + static files)
public/index.html     — Frontend (mobile-friendly)
docker-compose.yml    — App + MongoDB
Dockerfile            — Multi-stage build
nginx/                — Nginx config for leads.vaayulabs.com
scripts/              — Nginx setup + cert renewal
deploy.sh             — One-command deploy to VPS
```

## API

```
GET    /api/leads       — List all leads
POST   /api/leads       — Create lead
PUT    /api/leads/:id   — Update lead
DELETE /api/leads/:id   — Delete lead
```

## Local Development

```bash
# Start MongoDB + app
docker compose up -d --build

# Open in browser
open http://localhost:3100
```

To run without Docker (needs a local MongoDB on 27017):

```bash
npm install
MONGODB_URI=mongodb://localhost:27017 npm run dev
```

## Deploy to VPS

VPS is accessed via `ssh contabo` (configured in ~/.ssh/config).

### First time setup

```bash
# 1. Deploy files + build containers
./deploy.sh

# 2. Setup nginx + SSL on VPS
ssh contabo 'cd /var/wwwquickcrm && npx tsx scripts/setup-nginx.ts'
```

### Subsequent deploys

```bash
./deploy.sh
```

### Cert renewal (run periodically or via cron)

```bash
ssh contabo 'cd /var/wwwquickcrm && npx tsx scripts/renew-certs.ts'

# Check cert status
ssh contabo 'cd /var/wwwquickcrm && npx tsx scripts/renew-certs.ts --list'

# Force renewal
ssh contabo 'cd /var/wwwquickcrm && npx tsx scripts/renew-certs.ts --force'
```

## Outreach Templates

**WhatsApp opener:**

> Hi, I came across [Business Name] on Google — noticed your website isn't loading properly / isn't ranking well for solar searches in [city]. I build fast, SEO-ready websites specifically for solar installers that help you show up in local search and get more inquiries. Setup takes just a few days. Would you be open to a quick look at a sample?

**Cold call opener:**

> Hi, this is [Name] calling — I found your business on Google while searching for solar installers in [city], and noticed your current website has some loading/SEO issues that are likely costing you leads. I build websites specifically for solar companies — quick turnaround, built to rank. Do you have 2 minutes?

**Follow-up (no answer):**

> Hi, tried calling regarding your website — no worries if you're busy. Quick summary: I noticed [specific issue] which is likely losing you inquiries. I build ranking-ready sites for solar installers, ₹15-25K one-time setup. Happy to share a sample anytime.

Keep the "specific issue observed" line different per business — that's what separates this from a template blast.
