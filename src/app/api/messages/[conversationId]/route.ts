import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** Long-poll-freundlicher Endpunkt: liefert neue Nachrichten seit `after`. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const participant = await db.conversationParticipant.findFirst({
    where: { conversationId, userId: user.id },
    select: { id: true },
  });
  if (!participant) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const after = request.nextUrl.searchParams.get("after");
  const messages = await db.message.findMany({
    where: {
      conversationId,
      deletedAt: null,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      body: true,
      senderId: true,
      attachmentUrl: true,
      attachmentType: true,
      readAt: true,
      createdAt: true,
    },
  });

  if (messages.some((m) => m.senderId !== user.id)) {
    await db.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ messages, now: new Date().toISOString() });
}
