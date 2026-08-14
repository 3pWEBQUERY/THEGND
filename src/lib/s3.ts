import "server-only";

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";

const endpoint = process.env.S3_ENDPOINT;
const bucket = process.env.S3_BUCKET ?? "";

/**
 * Railway Buckets sind privat — Objekte lassen sich weder per ACL noch per
 * Bucket-Policy öffentlich schalten. Deshalb liefert die App Medien über die
 * eigene Route `/media/<key>` aus (siehe `src/app/media/[...key]/route.ts`).
 *
 * Wer den Bucket hinter einem CDN mit öffentlichem Lesezugriff betreibt, setzt
 * `S3_PUBLIC_URL` — dann werden direkte URLs verwendet.
 */
const publicBase = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");

export const s3Configured = Boolean(endpoint && bucket && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);

export const s3 = new S3Client({
  region: process.env.S3_REGION ?? "auto",
  endpoint,
  // Railway/Tigris nutzt virtual-host-Style; path-style nur auf ausdrücklichen Wunsch.
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});

export const S3_BUCKET = bucket;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/heic"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export type UploadScope =
  | "profile"
  | "gallery"
  | "agency"
  | "verification"
  | "post"
  | "story"
  | "message"
  | "blog";

/** Präfixe, die über `/media` ohne Anmeldung ausgeliefert werden. */
export const PUBLIC_SCOPES: UploadScope[] = ["gallery", "profile", "agency", "post", "story", "blog"];
/** Präfixe mit Zugriffsprüfung. */
export const PRIVATE_SCOPES: UploadScope[] = ["verification", "message"];

export function buildKey(scope: UploadScope, ownerId: string, filename: string) {
  const ext = (filename.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const stamp = new Date().toISOString().slice(0, 10);
  return `${scope}/${ownerId}/${stamp}/${randomBytes(12).toString("hex")}.${ext}`;
}

/** Owner-ID aus einem Key lesen (`scope/ownerId/datum/datei`). */
export function ownerFromKey(key: string) {
  return key.split("/")[1] ?? null;
}

export function scopeFromKey(key: string) {
  return (key.split("/")[0] ?? "") as UploadScope;
}

/** Auslieferungs-URL für ein Objekt — CDN, falls konfiguriert, sonst App-Route. */
export function publicUrl(key: string) {
  return publicBase ? `${publicBase}/${key}` : `/media/${key}`;
}

/**
 * Umkehrung von `publicUrl` — der Objektschlüssel aus einer Auslieferungs-URL.
 * Gibt `null` zurück, wenn die Adresse nicht auf unseren Bucket zeigt.
 */
export function keyFromPublicUrl(url: string) {
  if (url.startsWith("/media/")) return url.slice("/media/".length);
  if (publicBase && url.startsWith(`${publicBase}/`)) return url.slice(publicBase.length + 1);
  return null;
}

/** Presigned PUT — der Browser lädt direkt in den Railway Bucket hoch. */
export async function createUploadUrl(key: string, contentType: string, expiresIn = 900) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, command, { expiresIn });
  return { url, key, publicUrl: publicUrl(key) };
}

/** Presigned GET für private Objekte (Verifizierungs-Dokumente etc.). */
export async function createDownloadUrl(key: string, expiresIn = 300) {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

export async function getObject(key: string) {
  return s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
}

export async function objectExists(key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function uploadBuffer(key: string, body: Buffer | Uint8Array, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
  return publicUrl(key);
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => null);
}

export async function s3Health() {
  if (!s3Configured) return { ok: false as const, reason: "not-configured" as const };
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, reason: (error as Error).message };
  }
}
