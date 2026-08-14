import { NextResponse } from "next/server";
import { getCurrentUser, touchPresence } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  await touchPresence(user.id);
  if (user.profileId) {
    await db.profile
      .update({ where: { id: user.profileId }, data: { lastActiveAt: new Date() } })
      .catch(() => null);
  }

  return NextResponse.json({ ok: true });
}
