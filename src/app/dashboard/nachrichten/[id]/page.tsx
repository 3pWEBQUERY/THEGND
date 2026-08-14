import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChatThread } from "@/components/dashboard/chat-thread";
import { ReportDialog } from "@/components/profile/contact-card";
import { AvatarFallback, AvatarImage, AvatarRoot } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials, isOnline, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Unterhaltung" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const conversation = await db.conversation.findFirst({
    where: { id, participants: { some: { userId: user.id } } },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              lastSeenAt: true,
              profile: { select: { slug: true, isVerified: true } },
            },
          },
        },
      },
      messages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, take: 200 },
    },
  });

  if (!conversation) notFound();

  const other = conversation.participants.find((p) => p.userId !== user.id)?.user;

  // Als gelesen markieren passiert bewusst im Client (ChatThread, nach dem Mount):
  // `revalidatePath` darf nicht während des Renderns laufen.

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="lg:hidden">
          <Link href="/dashboard/nachrichten" aria-label="Zurück">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>

        <AvatarRoot className="size-11">
          {other?.avatarUrl && <AvatarImage src={other.avatarUrl} alt="" />}
          <AvatarFallback>{initials(other?.displayName)}</AvatarFallback>
        </AvatarRoot>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate font-semibold">
            {other?.displayName ?? "Gelöschtes Konto"}
            {other?.profile?.isVerified && (
              <Badge variant="success" size="sm">
                Verifiziert
              </Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {isOnline(other?.lastSeenAt) ? "Jetzt online" : other?.lastSeenAt ? `zuletzt ${timeAgo(other.lastSeenAt)}` : "—"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {other?.profile?.slug && (
            <Button asChild variant="ghost" size="icon" aria-label="Profil öffnen">
              <Link href={`/escort/${other.profile.slug}`} target="_blank">
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <ChatThread
        conversationId={id}
        currentUserId={user.id}
        otherName={other?.displayName ?? "dein Gegenüber"}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          attachmentUrl: m.attachmentUrl,
          attachmentType: m.attachmentType,
          readAt: m.readAt,
          createdAt: m.createdAt,
        }))}
      />

      {other && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Ban className="size-3.5" /> Fühlst du dich unwohl? Melde die Unterhaltung.
          </span>
          <ReportDialog targetId={id} targetType="MESSAGE" label="Unterhaltung melden" className="shrink-0" />
        </div>
      )}
    </>
  );
}
