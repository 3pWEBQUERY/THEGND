/**
 * Richtet den Railway Bucket (S3-kompatibel) für THEGND ein.
 *
 *   npm run s3:setup
 *
 * Der Befehl ist idempotent und macht Folgendes:
 *   1. Erreichbarkeit und Zugangsdaten prüfen
 *   2. CORS-Regeln setzen (nötig für Direkt-Uploads aus dem Browser)
 *   3. Auslieferungsweg bestimmen (App-Route oder CDN)
 *   4. Presigned Up-/Download mit einem Testobjekt verifizieren
 */
import {
  DeleteObjectCommand,
  GetBucketCorsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const publicBase = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");
const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

/** Präfixe, die öffentlich lesbar sein müssen (Galerie, Feed, Stories, Blog). */
const PUBLIC_PREFIXES = ["gallery", "profile", "post", "story", "blog"];
/** Bleibt privat — Ausweisdokumente und Chat-Anhänge. */
const PRIVATE_PREFIXES = ["verification", "message"];

const ok = (msg: string) => console.info(`  \x1b[32m✓\x1b[0m ${msg}`);
const warn = (msg: string) => console.info(`  \x1b[33m!\x1b[0m ${msg}`);
const fail = (msg: string) => console.info(`  \x1b[31m✗\x1b[0m ${msg}`);

async function main() {
  console.info("\n→ Railway Bucket einrichten\n");

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    fail("S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID und S3_SECRET_ACCESS_KEY müssen gesetzt sein.");
    console.info("\n  Werte holen mit:  railway bucket credentials --bucket <name> --json\n");
    process.exit(1);
  }

  const s3 = new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });

  console.info(`  Endpoint : ${endpoint}`);
  console.info(`  Bucket   : ${bucket}`);
  console.info(`  Public   : ${publicBase || "(nicht gesetzt)"}`);
  console.info(`  URL-Stil : ${forcePathStyle ? "path-style" : "virtual-host"}\n`);

  // ── 1. Erreichbarkeit ──────────────────────────────────────────────────────
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    ok("Bucket erreichbar, Zugangsdaten gültig");
  } catch (error) {
    fail(`Bucket nicht erreichbar: ${(error as Error).message}`);
    process.exit(1);
  }

  // ── 2. CORS ────────────────────────────────────────────────────────────────
  const origins = [
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    ...(process.env.S3_EXTRA_CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? []),
  ];
  const allowedOrigins = [...new Set(origins)];

  try {
    await s3.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
              AllowedOrigins: allowedOrigins,
              AllowedHeaders: ["*"],
              ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    );
    ok(`CORS gesetzt für: ${allowedOrigins.join(", ")}`);
  } catch (error) {
    warn(`CORS konnte nicht gesetzt werden: ${(error as Error).message}`);
    warn("Direkt-Uploads aus dem Browser funktionieren evtl. nicht — im Railway-Dashboard prüfen.");
  }

  try {
    const cors = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
    ok(`CORS aktiv (${cors.CORSRules?.length ?? 0} Regel(n))`);
  } catch {
    /* manche Anbieter erlauben GetBucketCors nicht */
  }

  // ── 3. Auslieferungsweg ────────────────────────────────────────────────────
  if (publicBase) {
    ok(`Direkte Auslieferung über ${publicBase} (CDN / öffentlicher Bucket)`);
  } else {
    ok("Auslieferung über die App-Route /media/<key> (Railway Buckets sind privat)");
    console.info(`     öffentlich : ${PUBLIC_PREFIXES.map((p) => `${p}/`).join(", ")}`);
    console.info(`     geschützt  : ${PRIVATE_PREFIXES.map((p) => `${p}/`).join(", ")}`);
  }

  // ── 4. Funktionstest ───────────────────────────────────────────────────────
  const probeKey = `gallery/_healthcheck/${Date.now()}.txt`;
  const body = `thegnd bucket check ${new Date().toISOString()}`;

  // Presigned PUT — exakt der Weg, den der Browser beim Upload nutzt.
  let uploaded = false;
  try {
    const putUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: bucket, Key: probeKey, ContentType: "text/plain" }),
      { expiresIn: 120 },
    );
    const res = await fetch(putUrl, { method: "PUT", headers: { "Content-Type": "text/plain" }, body });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    uploaded = true;
    ok("Presigned Upload funktioniert (Browser-Direktupload)");
  } catch (error) {
    fail(`Presigned Upload fehlgeschlagen: ${(error as Error).message}`);
  }

  if (uploaded) {
    try {
      const getUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: probeKey }), {
        expiresIn: 120,
      });
      const res = await fetch(getUrl);
      if (res.ok && (await res.text()) === body) ok("Presigned Download funktioniert (Moderations-Ansicht)");
      else warn(`Presigned Download lieferte HTTP ${res.status}`);
    } catch (error) {
      warn(`Presigned Download fehlgeschlagen: ${(error as Error).message}`);
    }

    if (publicBase) {
      const res = await fetch(`${publicBase}/${probeKey}`).catch(() => null);
      if (res?.ok) ok("Anonymer Abruf über die öffentliche URL funktioniert");
      else warn(`Anonymer Abruf nicht möglich (HTTP ${res?.status ?? "n/a"}) — S3_PUBLIC_URL besser leer lassen.`);
    }

    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: probeKey })).catch(() => null);
    ok("Testobjekt wieder gelöscht");
  }

  console.info("\n✅ Bucket-Setup abgeschlossen.\n");
}

main().catch((error) => {
  fail(String(error));
  process.exit(1);
});
