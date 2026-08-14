import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  buildKey,
  createUploadUrl,
  s3Configured,
  type UploadScope,
} from "@/lib/s3";

const schema = z.object({
  scope: z.enum(["profile", "gallery", "agency", "verification", "post", "story", "message", "blog"]),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(3).max(100),
  size: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  if (!s3Configured) {
    return NextResponse.json(
      { error: "Speicher ist nicht konfiguriert. Bitte S3-Umgebungsvariablen setzen." },
      { status: 503 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });

  const { scope, filename, contentType, size } = parsed.data;
  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Dateityp nicht erlaubt." }, { status: 415 });
  }
  if (isImage && size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Bild ist zu gross (max. 12 MB)." }, { status: 413 });
  }
  if (isVideo && size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "Video ist zu gross (max. 200 MB)." }, { status: 413 });
  }
  if (scope === "verification" && !isImage) {
    return NextResponse.json({ error: "Für Verifizierungen sind nur Bilder erlaubt." }, { status: 415 });
  }
  if (scope === "agency" && !isImage) {
    return NextResponse.json({ error: "Für Logo und Titelbild sind nur Bilder erlaubt." }, { status: 415 });
  }

  const key = buildKey(scope as UploadScope, user.id, filename);
  const upload = await createUploadUrl(key, contentType);

  return NextResponse.json({ ...upload, type: isVideo ? "VIDEO" : "IMAGE" });
}
