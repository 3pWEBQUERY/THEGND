import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { PUBLIC_SCOPES, getObject, ownerFromKey, s3Configured, scopeFromKey } from "@/lib/s3";

/**
 * Medien-Auslieferung aus dem Railway Bucket.
 *
 * Railway Buckets sind privat — deshalb streamt diese Route die Objekte mit
 * eigener Zugriffskontrolle:
 *   gallery|profile|agency|post|story|blog → öffentlich, unveränderlich gecacht
 *   verification                     → nur Eigentümer:in und Moderation
 *   message                          → nur Beteiligte der Unterhaltung
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  if (!s3Configured) return new NextResponse("Storage not configured", { status: 503 });

  const { key: segments } = await params;
  const key = segments.map(decodeURIComponent).join("/");

  if (key.includes("..") || key.startsWith("/")) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const scope = scopeFromKey(key);
  const isPublic = PUBLIC_SCOPES.includes(scope);

  if (!isPublic) {
    const allowed = await authorize(scope, key);
    if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const object = await getObject(key);
    const body = object.Body as ReadableStream | undefined;
    if (!body) return new NextResponse("Not found", { status: 404 });

    const etag = object.ETag;
    if (etag && request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(body, {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        ...(object.ContentLength ? { "Content-Length": String(object.ContentLength) } : {}),
        ...(etag ? { ETag: etag } : {}),
        // Keys enthalten einen Zufallshash → Inhalte ändern sich nie.
        "Cache-Control": isPublic
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

async function authorize(scope: string, key: string) {
  const user = await getCurrentUser();
  if (!user) return false;
  if (isStaff(user.role)) return true;

  const owner = ownerFromKey(key);
  if (owner === user.id) return true;

  if (scope === "verification") {
    // Nur Moderation (oben abgehandelt) und die Eigentümerin selbst.
    return false;
  }

  if (scope === "message" && owner) {
    const shared = await db.conversation.findFirst({
      where: {
        AND: [{ participants: { some: { userId: user.id } } }, { participants: { some: { userId: owner } } }],
      },
      select: { id: true },
    });
    return Boolean(shared);
  }

  return false;
}
