"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  randomToken,
  verifyPassword,
} from "@/lib/auth";
import { mailer } from "@/lib/mail";
import { loginSchema, registerSchema, forgotSchema, resetSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { type ActionState, bool, fail, fromZod, rateLimit, str, success } from "@/server/action-utils";

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return `${prefix}:${ip}`;
}

// ── Registrierung ────────────────────────────────────────────────────────────

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limited = rateLimit(await clientKey("register"), 5, 10 * 60_000);
  if (!limited.ok) return fail("Zu viele Versuche. Bitte versuche es später erneut.");

  const parsed = registerSchema.safeParse({
    email: str(formData, "email"),
    password: str(formData, "password"),
    passwordConfirm: str(formData, "passwordConfirm"),
    displayName: str(formData, "displayName"),
    role: str(formData, "role") ?? "MEMBER",
    ageConfirmed: bool(formData, "ageConfirmed"),
    termsAccepted: bool(formData, "termsAccepted"),
    newsletter: bool(formData, "newsletter"),
  });
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) return fail("Für diese E-Mail existiert bereits ein Konto.", { email: ["Bereits registriert."] });

  const user = await db.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      displayName: input.displayName,
      role: input.role,
      status: "ACTIVE",
      ageConfirmedAt: new Date(),
      termsAcceptedAt: new Date(),
      newsletterOptIn: input.newsletter ?? false,
      referralCode: `${slugify(input.displayName).slice(0, 12)}-${randomToken(4).toLowerCase().slice(0, 6)}`,
      credits: 25,
      transactions: {
        create: { type: "BONUS", amount: 25, balance: 25, note: "Willkommensbonus" },
      },
      notifications: {
        create: {
          type: "SYSTEM",
          title: "Willkommen bei THEGND",
          body: "Vervollständige dein Profil, um sichtbar zu werden.",
          href: "/dashboard",
        },
      },
    },
  });

  const token = randomToken();
  await db.token.create({
    data: { token, type: "EMAIL_VERIFY", userId: user.id, expiresAt: new Date(Date.now() + 864e5) },
  });
  await mailer.verifyEmail(user.email, token, user.displayName);

  await createSession(user.id);

  // Agenturen legen ein Haus an, Anbieterinnen ein Inserat, Mitglieder
  // richten ihr Konto ein — drei Wege, jeder mit eigenem Schritt.
  if (input.role === "AGENCY") redirect("/onboarding/agentur");
  if (input.role === "ESCORT") redirect("/onboarding");
  redirect("/onboarding/mitglied");
}

// ── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limited = rateLimit(await clientKey("login"), 10, 5 * 60_000);
  if (!limited.ok) return fail("Zu viele Login-Versuche. Bitte warte einen Moment.");

  const parsed = loginSchema.safeParse({
    email: str(formData, "email"),
    password: str(formData, "password"),
    remember: bool(formData, "remember"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail("E-Mail oder Passwort ist falsch.");
  }
  if (user.status === "BANNED") return fail("Dieses Konto wurde gesperrt. Bitte kontaktiere den Support.");
  if (user.status === "DELETED") return fail("Dieses Konto existiert nicht mehr.");

  await createSession(user.id);

  const next = str(formData, "next");
  redirect(next && next.startsWith("/") ? next : "/dashboard");
}

// ── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction() {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}

// ── Passwort vergessen / zurücksetzen ────────────────────────────────────────

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const limited = rateLimit(await clientKey("forgot"), 5, 15 * 60_000);
  if (!limited.ok) return fail("Zu viele Anfragen. Bitte versuche es später erneut.");

  const parsed = forgotSchema.safeParse({ email: str(formData, "email") });
  if (!parsed.success) return fromZod(parsed.error);

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true } });
  if (user) {
    const token = randomToken();
    await db.token.create({
      data: { token, type: "PASSWORD_RESET", userId: user.id, expiresAt: new Date(Date.now() + 36e5) },
    });
    await mailer.resetPassword(user.email, token);
  }

  return success("Falls ein Konto existiert, haben wir dir eine E-Mail geschickt.");
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: str(formData, "token"),
    password: str(formData, "password"),
    passwordConfirm: str(formData, "passwordConfirm"),
  });
  if (!parsed.success) return fromZod(parsed.error);

  const record = await db.token.findUnique({ where: { token: parsed.data.token } });
  if (!record || record.type !== "PASSWORD_RESET" || record.usedAt || record.expiresAt < new Date()) {
    return fail("Dieser Link ist ungültig oder abgelaufen.");
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    db.token.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return success("Passwort geändert. Du kannst dich jetzt anmelden.");
}

// ── E-Mail bestätigen ────────────────────────────────────────────────────────

export async function verifyEmailAction(token: string) {
  const record = await db.token.findUnique({ where: { token } });
  if (!record || record.type !== "EMAIL_VERIFY" || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false as const, message: "Dieser Bestätigungslink ist ungültig oder abgelaufen." };
  }
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { emailVerified: new Date(), status: "ACTIVE" } }),
    db.token.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true as const, message: "E-Mail bestätigt. Willkommen!" };
}

export async function resendVerificationAction(): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");
  if (user.emailVerified) return success("Deine E-Mail ist bereits bestätigt.");

  const limited = rateLimit(`resend:${user.id}`, 3, 15 * 60_000);
  if (!limited.ok) return fail("Bitte warte ein paar Minuten, bevor du es erneut versuchst.");

  const token = randomToken();
  await db.token.create({
    data: { token, type: "EMAIL_VERIFY", userId: user.id, expiresAt: new Date(Date.now() + 864e5) },
  });
  await mailer.verifyEmail(user.email, token, user.displayName);
  return success("Bestätigungsmail wurde erneut gesendet.");
}

// ── Konto ────────────────────────────────────────────────────────────────────

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) return fail("Nicht angemeldet.");

  const current = str(formData, "currentPassword") ?? "";
  const next = str(formData, "password") ?? "";
  const confirm = str(formData, "passwordConfirm") ?? "";
  if (next !== confirm) return fail("Passwörter stimmen nicht überein.", { passwordConfirm: ["Stimmt nicht überein."] });
  if (next.length < 8) return fail("Neues Passwort muss mindestens 8 Zeichen haben.", { password: ["Zu kurz."] });

  const user = await db.user.findUnique({ where: { id: sessionUser.id }, select: { passwordHash: true } });
  if (!user?.passwordHash || !(await verifyPassword(current, user.passwordHash))) {
    return fail("Aktuelles Passwort ist falsch.", { currentPassword: ["Falsch."] });
  }

  await db.user.update({ where: { id: sessionUser.id }, data: { passwordHash: await hashPassword(next) } });
  return success("Passwort aktualisiert.");
}

export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");
  if (str(formData, "confirm") !== "LÖSCHEN") return fail('Bitte tippe "LÖSCHEN" zur Bestätigung.');

  await db.user.update({
    where: { id: user.id },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
      email: `deleted+${user.id}@thegnd.invalid`,
      passwordHash: null,
      displayName: "Gelöschtes Konto",
      avatarUrl: null,
      phone: null,
    },
  });
  await db.profile.updateMany({ where: { userId: user.id }, data: { status: "ARCHIVED" } });
  await destroySession();
  redirect("/");
}
