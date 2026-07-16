#!/usr/bin/env npx tsx
/**
 * renew-certs.ts
 * Renews Let's Encrypt certificate for leads.vaayulabs.com and reloads nginx.
 *
 * Usage:
 *   npx tsx scripts/renew-certs.ts
 *   npx tsx scripts/renew-certs.ts --force
 *   npx tsx scripts/renew-certs.ts --list
 */

import { execSync } from "child_process";

const FORCE = process.argv.includes("--force");
const LIST_ONLY = process.argv.includes("--list");

function run(cmd: string, label?: string): string {
  console.log(`\n▶ ${label ?? cmd}`);
  return execSync(cmd, { stdio: "inherit", encoding: "utf8" }) ?? "";
}

run("certbot certificates", "List all certificates and expiry");

if (LIST_ONLY) process.exit(0);

const renewCmd = FORCE
  ? "certbot renew --force-renewal"
  : "certbot renew";

run(renewCmd, FORCE ? "Force-renew all certs" : "Renew all certs (skips if >30d remaining)");

run("nginx -t", "Test nginx config");
run("systemctl reload nginx", "Reload nginx");

console.log("\n✅ Done — all certificates renewed and nginx reloaded");
