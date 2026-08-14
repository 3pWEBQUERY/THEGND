import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role, User } from "@prisma/client";

export const SESSION_COOKIE = "gnd_session";
export const AGE_COOKIE = "gnd_age_ok";
const SESSION_TTL_DAYS = 30;

// ── Passwörter ───────────────────────────────────────────────────────────────

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashIp(ip?: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(`${ip}:${process.env.AUTH_SECRET ?? "salt"}`).digest("hex").slice(0, 32);
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(userId: string) {
  const token = randomToken(48);
  const h = await headers();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 864e5);

  await db.session.create({
    data: {
      token,
      userId,
      expiresAt,
      ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  await db.user.update({ where: { id: userId }, data: { lastSeenAt: new Date() } });
  return token;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { token } });
  store.delete(SESSION_COOKIE);
}

export type SessionUser = Pick<
  User,
  "id" | "email" | "role" | "status" | "displayName" | "avatarUrl" | "credits" | "emailVerified" | "locale"
> & { profileId: string | null; profileSlug: string | null };

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          displayName: true,
          avatarUrl: true,
          credits: true,
          emailVerified: true,
          locale: true,
          profile: { select: { id: true, slug: true } },
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  const { profile, ...user } = session.user;
  if (user.status === "BANNED" || user.status === "DELETED") return null;

  return { ...user, profileId: profile?.id ?? null, profileSlug: profile?.slug ?? null };
});

export async function requireUser(redirectTo = "/login") {
  const user = await getCurrentUser();
  if (!user) redirect(`${redirectTo}?next=${encodeURIComponent(await currentPath())}`);
  return user;
}

export async function requireRole(roles: Role[], redirectTo = "/dashboard") {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect(redirectTo);
  return user;
}

export async function requireProfile() {
  const user = await requireUser();
  if (!user.profileId) redirect("/onboarding");
  const profile = await db.profile.findUnique({ where: { id: user.profileId } });
  if (!profile) redirect("/onboarding");
  return { user, profile };
}

async function currentPath() {
  const h = await headers();
  return h.get("x-pathname") ?? h.get("referer") ?? "/dashboard";
}

export async function touchPresence(userId: string) {
  await db.user
    .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
    .catch(() => null);
}

export function isStaff(role?: Role | null) {
  return role === "ADMIN" || role === "MODERATOR";
}
