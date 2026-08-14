"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { mailer } from "@/lib/mail";
import { bookingSchema, messageSchema, postSchema, reviewSchema } from "@/lib/validators";
import { formatDateTime } from "@/lib/utils";
import { CREDIT_COSTS } from "@/lib/constants";
import { type ActionState, fail, fromZod, rateLimit, str, success } from "@/server/action-utils";
import { spendCredits } from "@/server/credits";

// ── Favoriten & Follows ──────────────────────────────────────────────────────

export async function toggleFavoriteAction(profileId: string): Promise<ActionState<{ favorited: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an, um Favoriten zu speichern.");

  const existing = await db.favorite.findUnique({
    where: { userId_profileId: { userId: user.id, profileId } },
  });

  if (existing) {
    await db.$transaction([
      db.favorite.delete({ where: { id: existing.id } }),
      db.profile.update({ where: { id: profileId }, data: { favoriteCount: { decrement: 1 } } }),
    ]);
    revalidatePath("/dashboard/favoriten");
    return success(undefined, { favorited: false });
  }

  const profile = await db.profile.findUnique({ where: { id: profileId }, select: { userId: true, displayName: true } });
  await db.$transaction([
    db.favorite.create({ data: { userId: user.id, profileId } }),
    db.profile.update({ where: { id: profileId }, data: { favoriteCount: { increment: 1 } } }),
  ]);

  if (profile && profile.userId !== user.id) {
    await db.notification.create({
      data: {
        userId: profile.userId,
        type: "FAVORITE",
        title: "Neuer Favorit",
        body: `${user.displayName ?? "Jemand"} hat dein Profil favorisiert.`,
        href: "/dashboard/statistik",
      },
    });
  }

  revalidatePath("/dashboard/favoriten");
  return success(undefined, { favorited: true });
}

export async function toggleFollowAction(profileId: string): Promise<ActionState<{ following: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an.");

  const existing = await db.follow.findUnique({ where: { userId_profileId: { userId: user.id, profileId } } });
  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return success(undefined, { following: false });
  }
  await db.follow.create({ data: { userId: user.id, profileId } });
  return success(undefined, { following: true });
}

// ── Nachrichten ──────────────────────────────────────────────────────────────

export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an, um Nachrichten zu senden.");

  const limited = rateLimit(`msg:${user.id}`, 30, 60_000);
  if (!limited.ok) return fail("Du sendest zu schnell. Bitte warte einen Moment.");

  const parsed = messageSchema.safeParse({
    conversationId: str(formData, "conversationId"),
    recipientId: str(formData, "recipientId"),
    body: str(formData, "body"),
    attachmentUrl: str(formData, "attachmentUrl") || undefined,
    attachmentType: str(formData, "attachmentType") || undefined,
  });
  if (!parsed.success) return fromZod(parsed.error);
  const { conversationId, recipientId, body, attachmentUrl, attachmentType } = parsed.data;
  // Vorschau für Benachrichtigung und E-Mail, wenn nur ein Medium geschickt wurde.
  const vorschau = body || (attachmentType === "VIDEO" ? "🎥 Video" : "📷 Bild");

  let convId = conversationId;
  let otherUserId = recipientId;

  if (convId) {
    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId: convId, userId: user.id },
    });
    if (!participant) return fail("Kein Zugriff auf diese Unterhaltung.");
    const other = await db.conversationParticipant.findFirst({
      where: { conversationId: convId, userId: { not: user.id } },
      select: { userId: true },
    });
    otherUserId = other?.userId;
  } else {
    if (!otherUserId) return fail("Empfänger fehlt.");
    if (otherUserId === user.id) return fail("Du kannst dir nicht selbst schreiben.");

    const blocked = await db.block.findFirst({
      where: {
        OR: [
          { blockerId: otherUserId, blockedId: user.id },
          { blockerId: user.id, blockedId: otherUserId },
        ],
      },
    });
    if (blocked) return fail("Diese Unterhaltung ist nicht möglich.");

    const existing = await db.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      select: { id: true },
    });

    convId =
      existing?.id ??
      (
        await db.conversation.create({
          data: { participants: { create: [{ userId: user.id }, { userId: otherUserId }] } },
          select: { id: true },
        })
      ).id;
  }

  await db.$transaction([
    db.message.create({
      data: {
        conversationId: convId!,
        senderId: user.id,
        body,
        attachmentUrl,
        attachmentType: attachmentUrl ? (attachmentType ?? "IMAGE") : null,
      },
    }),
    db.conversation.update({ where: { id: convId! }, data: { lastMessageAt: new Date() } }),
  ]);

  if (otherUserId) {
    const recipient = await db.user.findUnique({
      where: { id: otherUserId },
      select: { email: true, lastSeenAt: true },
    });
    await db.notification.create({
      data: {
        userId: otherUserId,
        type: "MESSAGE",
        title: `Neue Nachricht von ${user.displayName ?? "einem Mitglied"}`,
        body: vorschau.slice(0, 120),
        href: `/dashboard/nachrichten/${convId}`,
      },
    });
    const offline = !recipient?.lastSeenAt || Date.now() - recipient.lastSeenAt.getTime() > 10 * 60_000;
    if (recipient && offline) {
      await mailer.newMessage(recipient.email, user.displayName ?? "Ein Mitglied", vorschau.slice(0, 200));
    }
  }

  revalidatePath("/dashboard/nachrichten");
  if (convId) revalidatePath(`/dashboard/nachrichten/${convId}`);
  return success("Nachricht gesendet.", { conversationId: convId });
}

export async function markConversationReadAction(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.$transaction([
    db.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    }),
    db.conversationParticipant.updateMany({
      where: { conversationId, userId: user.id },
      data: { lastReadAt: new Date() },
    }),
  ]);
  // "layout" deckt Liste und den ungelesen-Zähler im Header mit ab.
  revalidatePath("/dashboard", "layout");
}

export async function blockUserAction(targetId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");
  await db.block.upsert({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetId } },
    update: {},
    create: { blockerId: user.id, blockedId: targetId },
  });
  return success("Nutzer:in blockiert.");
}

// ── Bewertungen ──────────────────────────────────────────────────────────────

export async function createReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an, um zu bewerten.");

  const parsed = reviewSchema.safeParse({
    profileId: str(formData, "profileId"),
    rating: str(formData, "rating"),
    ratingLooks: str(formData, "ratingLooks") || undefined,
    ratingService: str(formData, "ratingService") || undefined,
    ratingCharm: str(formData, "ratingCharm") || undefined,
    ratingHygiene: str(formData, "ratingHygiene") || undefined,
    ratingValue: str(formData, "ratingValue") || undefined,
    title: str(formData, "title") || undefined,
    body: str(formData, "body"),
    metAt: str(formData, "metAt") || undefined,
  });
  if (!parsed.success) return fromZod(parsed.error);

  const profile = await db.profile.findUnique({
    where: { id: parsed.data.profileId },
    select: { id: true, userId: true, user: { select: { email: true } } },
  });
  if (!profile) return fail("Profil nicht gefunden.");
  if (profile.userId === user.id) return fail("Du kannst dich nicht selbst bewerten.");

  const existing = await db.review.findUnique({
    where: { profileId_authorId: { profileId: profile.id, authorId: user.id } },
  });
  if (existing) return fail("Du hast dieses Profil bereits bewertet.");

  const hadBooking = await db.booking.findFirst({
    where: { profileId: profile.id, clientId: user.id, status: "COMPLETED" },
    select: { id: true },
  });

  await db.review.create({
    data: {
      ...parsed.data,
      metAt: parsed.data.metAt ? new Date(parsed.data.metAt) : null,
      authorId: user.id,
      isVerifiedMeeting: Boolean(hadBooking),
      status: "PENDING",
    },
  });

  await db.notification.create({
    data: {
      userId: profile.userId,
      type: "REVIEW",
      title: "Neue Bewertung erhalten",
      body: `${user.displayName ?? "Ein Mitglied"} hat dich bewertet (${parsed.data.rating}/5).`,
      href: "/dashboard/bewertungen",
    },
  });
  await mailer.newReview(profile.user.email, user.displayName ?? "Ein Mitglied", parsed.data.rating);

  revalidatePath("/escort/[slug]", "page");
  return success("Danke! Deine Bewertung wird nach kurzer Prüfung veröffentlicht.");
}

export async function replyToReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user?.profileId) return fail("Kein Profil vorhanden.");

  const reviewId = str(formData, "reviewId");
  const reply = str(formData, "reply")?.trim();
  if (!reviewId || !reply) return fail("Antwort darf nicht leer sein.");

  const review = await db.review.findUnique({ where: { id: reviewId }, select: { profileId: true } });
  if (review?.profileId !== user.profileId) return fail("Kein Zugriff.");

  await db.review.update({
    where: { id: reviewId },
    data: { reply: reply.slice(0, 2000), repliedAt: new Date() },
  });
  revalidatePath("/dashboard/bewertungen");
  return success("Antwort veröffentlicht.");
}

// ── Buchungen ────────────────────────────────────────────────────────────────

export async function createBookingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an, um eine Anfrage zu senden.");

  const parsed = bookingSchema.safeParse({
    profileId: str(formData, "profileId"),
    date: str(formData, "date"),
    time: str(formData, "time"),
    minutes: str(formData, "minutes"),
    place: str(formData, "place"),
    address: str(formData, "address") || undefined,
    note: str(formData, "note") || undefined,
  });
  if (!parsed.success) return fromZod(parsed.error);

  const startAt = new Date(`${parsed.data.date}T${parsed.data.time}`);
  if (Number.isNaN(startAt.getTime())) return fail("Ungültiger Termin.");
  if (startAt.getTime() < Date.now()) return fail("Der Termin liegt in der Vergangenheit.");

  const profile = await db.profile.findUnique({
    where: { id: parsed.data.profileId },
    select: { id: true, userId: true, currency: true, priceHour: true, user: { select: { email: true } } },
  });
  if (!profile) return fail("Profil nicht gefunden.");

  const price = profile.priceHour ? Math.round((profile.priceHour * parsed.data.minutes) / 60) : null;

  const booking = await db.booking.create({
    data: {
      profileId: profile.id,
      clientId: user.id,
      startAt,
      minutes: parsed.data.minutes,
      place: parsed.data.place,
      address: parsed.data.address,
      note: parsed.data.note,
      price,
      currency: profile.currency,
    },
  });

  await db.notification.create({
    data: {
      userId: profile.userId,
      type: "BOOKING",
      title: "Neue Buchungsanfrage",
      body: `${user.displayName ?? "Ein Mitglied"} für ${formatDateTime(startAt)}`,
      href: "/dashboard/buchungen",
    },
  });
  await mailer.bookingRequest(
    profile.user.email,
    user.displayName ?? "Ein Mitglied",
    formatDateTime(startAt),
    parsed.data.minutes,
  );

  revalidatePath("/dashboard/buchungen");
  return success("Anfrage gesendet. Du erhältst eine Benachrichtigung, sobald geantwortet wurde.", {
    bookingId: booking.id,
  });
}

export async function updateBookingStatusAction(bookingId: string, status: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      profile: { select: { userId: true, displayName: true } },
      client: { select: { id: true, email: true } },
    },
  });
  if (!booking) return fail("Buchung nicht gefunden.");

  const isProvider = booking.profile.userId === user.id;
  const isClient = booking.clientId === user.id;
  if (!isProvider && !isClient) return fail("Kein Zugriff.");
  if (isClient && status !== "CANCELLED") return fail("Du kannst die Anfrage nur stornieren.");

  await db.booking.update({ where: { id: bookingId }, data: { status: status as never } });

  const labels: Record<string, string> = {
    ACCEPTED: "bestätigt",
    DECLINED: "abgelehnt",
    CANCELLED: "storniert",
    COMPLETED: "abgeschlossen",
    NO_SHOW: "als No-Show markiert",
  };

  const notifyUserId = isProvider ? booking.clientId : booking.profile.userId;
  await db.notification.create({
    data: {
      userId: notifyUserId,
      type: "BOOKING",
      title: `Buchung ${labels[status] ?? status}`,
      body: `${formatDateTime(booking.startAt)} — ${booking.profile.displayName}`,
      href: "/dashboard/buchungen",
    },
  });
  if (isProvider) {
    await mailer.bookingStatus(booking.client.email, labels[status] ?? status, formatDateTime(booking.startAt));
  }

  revalidatePath("/dashboard/buchungen");
  return success(`Buchung ${labels[status] ?? "aktualisiert"}.`);
}

// ── Feed ─────────────────────────────────────────────────────────────────────

export async function createPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user?.profileId) return fail("Nur Profile mit Inserat können posten.");

  const parsed = postSchema.safeParse({
    body: str(formData, "body"),
    mediaUrl: str(formData, "mediaUrl") || undefined,
    visibility: str(formData, "visibility") ?? "PUBLIC",
    unlockCost: str(formData, "unlockCost") ?? 0,
  });
  if (!parsed.success) return fromZod(parsed.error);

  await db.post.create({
    data: {
      profileId: user.profileId,
      body: parsed.data.body,
      mediaUrl: parsed.data.mediaUrl,
      mediaType: parsed.data.mediaUrl ? "IMAGE" : null,
      visibility: parsed.data.visibility,
      unlockCost: parsed.data.unlockCost,
    },
  });

  revalidatePath("/feed");
  revalidatePath("/dashboard/feed");
  return success("Beitrag veröffentlicht.");
}

export async function togglePostLikeAction(postId: string): Promise<ActionState<{ liked: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an.");

  const existing = await db.postLike.findUnique({ where: { postId_userId: { postId, userId: user.id } } });
  if (existing) {
    await db.$transaction([
      db.postLike.delete({ where: { postId_userId: { postId, userId: user.id } } }),
      db.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return success(undefined, { liked: false });
  }
  await db.$transaction([
    db.postLike.create({ data: { postId, userId: user.id } }),
    db.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
  ]);
  return success(undefined, { liked: true });
}

export async function createCommentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an.");

  const postId = str(formData, "postId");
  const body = str(formData, "body")?.trim();
  if (!postId || !body) return fail("Kommentar darf nicht leer sein.");

  await db.$transaction([
    db.comment.create({ data: { postId, authorId: user.id, body: body.slice(0, 1000) } }),
    db.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
  ]);

  revalidatePath("/feed");
  return success();
}

// ── Geschenke ────────────────────────────────────────────────────────────────

export async function sendGiftAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an.");

  const itemId = str(formData, "itemId");
  const profileId = str(formData, "profileId");
  const message = str(formData, "message");
  if (!itemId || !profileId) return fail("Ungültige Anfrage.");

  const [item, profile] = await Promise.all([
    db.giftItem.findUnique({ where: { id: itemId } }),
    db.profile.findUnique({ where: { id: profileId }, select: { userId: true, displayName: true } }),
  ]);
  if (!item || !profile) return fail("Geschenk oder Profil nicht gefunden.");

  const spent = await spendCredits(user.id, item.credits, `Geschenk: ${item.name}`);
  if (!spent.ok) return fail(spent.message);

  await db.$transaction([
    db.gift.create({
      data: {
        itemId: item.id,
        senderId: user.id,
        receiverId: profile.userId,
        profileId,
        credits: item.credits,
        message: message?.slice(0, 300),
      },
    }),
    db.user.update({ where: { id: profile.userId }, data: { credits: { increment: Math.floor(item.credits * 0.7) } } }),
    db.notification.create({
      data: {
        userId: profile.userId,
        type: "GIFT",
        title: `${item.emoji} Geschenk erhalten`,
        body: `${user.displayName ?? "Jemand"} hat dir ${item.name} geschenkt.`,
        href: "/dashboard/guthaben",
      },
    }),
  ]);

  return success(`${item.emoji} ${item.name} gesendet!`);
}

// ── Profilaufruf zählen ──────────────────────────────────────────────────────

export async function trackProfileViewAction(profileId: string, ipHash?: string) {
  const user = await getCurrentUser();
  const recent = await db.profileView.findFirst({
    where: {
      profileId,
      ...(user ? { userId: user.id } : { ipHash: ipHash ?? "anon" }),
      createdAt: { gte: new Date(Date.now() - 6 * 36e5) },
    },
    select: { id: true },
  });
  if (recent) return;

  await db.$transaction([
    db.profileView.create({ data: { profileId, userId: user?.id ?? null, ipHash: ipHash ?? null } }),
    db.profile.update({ where: { id: profileId }, data: { viewCount: { increment: 1 } } }),
  ]);
}

// ── Private Medien freischalten ──────────────────────────────────────────────

export async function unlockMediaAction(mediaId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an.");

  const media = await db.media.findUnique({
    where: { id: mediaId },
    select: { unlockCost: true, profile: { select: { userId: true, displayName: true } } },
  });
  if (!media) return fail("Medium nicht gefunden.");

  const cost = media.unlockCost || CREDIT_COSTS.UNLOCK_PRIVATE_MEDIA;
  const spent = await spendCredits(user.id, cost, `Freischaltung Medien (${media.profile.displayName})`);
  if (!spent.ok) return fail(spent.message);

  await db.user.update({ where: { id: media.profile.userId }, data: { credits: { increment: Math.floor(cost * 0.7) } } });
  return success("Freigeschaltet.");
}
