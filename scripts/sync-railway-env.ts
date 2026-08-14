/**
 * Holt Postgres- und Bucket-Zugangsdaten aus Railway und schreibt sie in `.env`.
 *
 *   npm run railway:env                 # aktualisiert .env
 *   npm run railway:env -- --print      # nur anzeigen, nichts schreiben
 *
 * Voraussetzung: `railway login` und `railway link` sind erledigt.
 * Bestehende Werte, die nicht aus Railway stammen (AUTH_SECRET, RESEND_API_KEY …),
 * bleiben erhalten.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const PRINT_ONLY = process.argv.includes("--print");
const ENV_FILE = ".env";

function railway<T>(args: string[]): T {
  const raw = execFileSync("railway", [...args, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(raw) as T;
}

function mask(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : "***";
}

function main() {
  console.info("\n→ Railway-Variablen synchronisieren\n");

  let pg: Record<string, string>;
  try {
    pg = railway<Record<string, string>>(["variables", "--service", "Postgres"]);
  } catch {
    console.error("  ✗ Postgres-Service nicht gefunden. Erst `railway link` ausführen.\n");
    process.exit(1);
  }

  const publicUrl = pg.DATABASE_PUBLIC_URL ?? "";
  const internalUrl = pg.DATABASE_URL ?? "";
  const hasProxy = /@[^:]+:\d+/.test(publicUrl);

  if (!hasProxy) {
    console.error("  ✗ Kein öffentlicher TCP-Proxy für Postgres aktiv.");
    console.error("    Anlegen mit:  railway tcp-proxy create --port 5432 --service Postgres\n");
    process.exit(1);
  }
  console.info(`  ✓ Postgres  ${publicUrl.split("@")[1]}`);

  const buckets = railway<{ id: string; name: string }[]>(["bucket", "list"]);
  if (!buckets.length) {
    console.error("  ✗ Kein Bucket im Projekt. Anlegen mit:  railway bucket create thegnd\n");
    process.exit(1);
  }
  const bucketName = process.env.RAILWAY_BUCKET ?? buckets[0].name;
  const creds = railway<{
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint: string;
    region: string;
    urlStyle: string;
  }>(["bucket", "credentials", "--bucket", bucketName]);

  console.info(`  ✓ Bucket    ${creds.bucketName} @ ${creds.endpoint} (${creds.urlStyle})`);
  console.info(`  ✓ Key       ${mask(creds.accessKeyId)}\n`);

  const values: Record<string, string> = {
    DATABASE_URL: publicUrl,
    DIRECT_URL: publicUrl,
    S3_ENDPOINT: creds.endpoint.replace(/\/$/, ""),
    S3_REGION: creds.region || "auto",
    S3_BUCKET: creds.bucketName,
    S3_ACCESS_KEY_ID: creds.accessKeyId,
    S3_SECRET_ACCESS_KEY: creds.secretAccessKey,
    S3_FORCE_PATH_STYLE: creds.urlStyle === "path" ? "true" : "false",
  };

  if (PRINT_ONLY) {
    for (const [key, value] of Object.entries(values)) {
      console.info(`${key}=${key.includes("SECRET") || key.includes("URL") ? mask(value) : value}`);
    }
    console.info(`\n  (interne DB-URL fürs Deployment: ${internalUrl.split("@")[1] ?? "?"})\n`);
    return;
  }

  const existing = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, "utf8") : "";
  let next = existing;

  for (const [key, value] of Object.entries(values)) {
    const line = `${key}="${value}"`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    next = pattern.test(next) ? next.replace(pattern, line) : `${next.trimEnd()}\n${line}\n`;
  }

  writeFileSync(ENV_FILE, next);
  console.info(`  ✓ ${ENV_FILE} aktualisiert\n`);
  console.info("  Nächster Schritt:  npm run db:deploy && npm run s3:setup\n");
}

main();
