#!/usr/bin/env npx tsx
/**
 * setup-nginx.ts
 * Sets up nginx reverse proxy + SSL for leads.vaayulabs.com
 *
 * Usage (run on VPS as root):
 *   npx tsx scripts/setup-nginx.ts
 *   npx tsx scripts/setup-nginx.ts --dry-run
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const DOMAIN = "leads.vaayulabs.com";
const PORT = "3100";
const CONF_NAME = `${DOMAIN}.conf`;
const DRY_RUN = process.argv.includes("--dry-run");

const CONF_SRC = resolve(dirname(new URL(import.meta.url).pathname), "../nginx", CONF_NAME);
const CONF_DEST = `/etc/nginx/sites-available/${CONF_NAME}`;
const CONF_LINK = `/etc/nginx/sites-enabled/${CONF_NAME}`;
const CERT_PATH = `/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`;
const WEBROOT = "/var/www/certbot";

function run(cmd: string, label?: string): string {
  console.log(`\n▶ ${label ?? cmd}`);
  if (DRY_RUN) { console.log("  (dry-run — skipped)"); return ""; }
  return execSync(cmd, { stdio: "inherit", encoding: "utf8" }) ?? "";
}

function writeFile(path: string, content: string, label: string) {
  console.log(`\n▶ Write ${label}`);
  if (DRY_RUN) { console.log("  (dry-run — skipped)"); return; }
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, content);
  console.log(`  ✔ Written`);
}

// ── Validate template exists ──────────────────────────────────────────────

if (!existsSync(CONF_SRC)) {
  console.error(`✗ Template not found: ${CONF_SRC}`);
  process.exit(1);
}

console.log(`\nDomain:  ${DOMAIN}`);
console.log(`Port:    ${PORT}`);
console.log(`Template: ${CONF_SRC}`);
if (DRY_RUN) console.log("Mode:    DRY RUN\n");

// ── Phase 1: HTTP-only config for certbot ─────────────────────────────────

const httpOnly = `
server {
    listen 80;
    server_name ${DOMAIN};
    location /.well-known/acme-challenge/ { root ${WEBROOT}; }
    location / { return 200 "waiting for cert"; }
}
`.trim();

if (!existsSync(CERT_PATH)) {
  console.log("\n── Phase 1: Obtain SSL cert ──");

  run(`mkdir -p ${WEBROOT}`, "Create certbot webroot");
  writeFile(CONF_DEST, httpOnly, `${CONF_DEST} (HTTP-only)`);
  run(`ln -sf ${CONF_DEST} ${CONF_LINK}`, "Enable site symlink");
  run("nginx -t", "Test nginx config (HTTP)");
  run("systemctl reload nginx", "Reload nginx (HTTP)");
  run(
    `certbot certonly --webroot -w ${WEBROOT} -d ${DOMAIN} --non-interactive --agree-tos --email admin@vaayulabs.com`,
    "Obtain SSL certificate"
  );
  console.log("✔ SSL cert obtained");
} else {
  console.log(`✔ SSL cert already exists: ${CERT_PATH}`);
}

// ── Phase 2: Full HTTPS config ────────────────────────────────────────────

console.log("\n── Phase 2: Deploy full HTTPS config ──");

const template = DRY_RUN
  ? "# (template not read in dry-run)"
  : readFileSync(CONF_SRC, "utf8");
const rendered = template.replaceAll("{{PORT}}", PORT);

writeFile(CONF_DEST, rendered, `${CONF_DEST} (full HTTPS)`);
run(`ln -sf ${CONF_DEST} ${CONF_LINK}`, "Enable site symlink");
run("nginx -t", "Test full nginx config");
run("systemctl reload nginx", "Reload nginx (HTTPS)");

console.log(`\n✅ Done — https://${DOMAIN} → 127.0.0.1:${PORT}`);
