import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { s3Health } from "@/lib/s3";
import { mailConfigured } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  const [database, storage] = await Promise.all([
    db
      .$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    s3Health(),
  ]);

  const healthy = database && storage.ok;

  return NextResponse.json(
    {
      status: healthy ? "ok" : database ? "degraded" : "down",
      uptimeMs: Math.round(process.uptime() * 1000),
      latencyMs: Date.now() - started,
      services: {
        database,
        storage: storage.ok,
        storageReason: storage.ok ? undefined : storage.reason,
        mail: mailConfigured,
      },
      version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
      environment: process.env.RAILWAY_ENVIRONMENT_NAME ?? process.env.NODE_ENV,
    },
    // Datenbank ist das harte Kriterium für den Railway-Healthcheck.
    { status: database ? 200 : 503 },
  );
}
