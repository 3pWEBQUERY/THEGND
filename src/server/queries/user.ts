import "server-only";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function getFavoriteIds() {
  const user = await getCurrentUser();
  if (!user) return [];
  const rows = await db.favorite.findMany({ where: { userId: user.id }, select: { profileId: true } });
  return rows.map((r) => r.profileId);
}

export async function getUnreadCounts(userId: string) {
  const [messages, notifications, bookings] = await Promise.all([
    db.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation: { participants: { some: { userId } } },
      },
    }),
    db.notification.count({ where: { userId, readAt: null } }),
    db.booking.count({ where: { profile: { userId }, status: "REQUESTED" } }),
  ]);
  return { messages, notifications, bookings };
}

export async function getConversations(userId: string) {
  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
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
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return conversations.map((c) => {
    const other = c.participants.find((p) => p.userId !== userId)?.user;
    const me = c.participants.find((p) => p.userId === userId);
    const last = c.messages[0];
    const unread = Boolean(last && last.senderId !== userId && (!me?.lastReadAt || last.createdAt > me.lastReadAt));
    return { id: c.id, other, last, unread, lastMessageAt: c.lastMessageAt };
  });
}

export async function getNotifications(userId: string, take = 50) {
  return db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
}

export async function getProfileStats(profileId: string) {
  const now = new Date();
  const start7 = new Date(now.getTime() - 7 * 864e5);
  const start30 = new Date(now.getTime() - 30 * 864e5);

  const [views7, views30, viewsTotal, favorites, reviews, bookings, rows] = await Promise.all([
    db.profileView.count({ where: { profileId, createdAt: { gte: start7 } } }),
    db.profileView.count({ where: { profileId, createdAt: { gte: start30 } } }),
    db.profileView.count({ where: { profileId } }),
    db.favorite.count({ where: { profileId } }),
    db.review.count({ where: { profileId, status: "PUBLISHED" } }),
    db.booking.count({ where: { profileId } }),
    db.profileView.findMany({
      where: { profileId, createdAt: { gte: start30 } },
      select: { createdAt: true },
    }),
  ]);

  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 864e5).toISOString().slice(0, 10);
    byDay.set(d, 0);
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  return {
    views7,
    views30,
    viewsTotal,
    favorites,
    reviews,
    bookings,
    series: [...byDay.entries()].map(([date, count]) => ({ date, count })),
  };
}
