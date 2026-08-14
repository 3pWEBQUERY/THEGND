import "server-only";

import { Resend } from "resend";
import { absoluteUrl } from "@/lib/utils";
import { EMAIL_THEME as T } from "@/lib/brand";

const apiKey = process.env.RESEND_API_KEY;
export const mailConfigured = Boolean(apiKey);
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? "THEGND <no-reply@thegnd.net>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? undefined;
const SITE = process.env.NEXT_PUBLIC_SITE_NAME ?? "THEGND";

type SendArgs = { to: string | string[]; subject: string; html: string; text?: string };

export async function sendMail({ to, subject, html, text }: SendArgs) {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`\n📧 [dev-mail] → ${to}\n   ${subject}\n   ${absoluteUrl("/")}\n`);
    }
    return { ok: false as const, skipped: true as const };
  }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text: text ?? stripHtml(html),
    replyTo: REPLY_TO,
  });
  if (error) {
    console.error("[resend]", error);
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, id: data?.id };
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Layout ───────────────────────────────────────────────────────────────────

function layout(opts: { title: string; preview?: string; body: string; cta?: { label: string; href: string } }) {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>${opts.title}</title></head>
<body style="margin:0;padding:0;background:${T.page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preview ?? ""}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${T.page};padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${T.card};border:1px solid ${T.border};border-radius:20px;overflow:hidden;">
    <tr><td style="padding:28px 32px 8px;">
      <div style="font-size:20px;font-weight:800;letter-spacing:2px;color:${T.heading};">
        <span style="color:${T.brand};">◆</span>&nbsp;${SITE}
      </div>
    </td></tr>
    <tr><td style="padding:8px 32px 4px;">
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:${T.heading};font-weight:700;">${opts.title}</h1>
      <div style="font-size:15px;line-height:1.65;color:${T.text};">${opts.body}</div>
    </td></tr>
    ${
      opts.cta
        ? `<tr><td style="padding:24px 32px 8px;">
      <a href="${opts.cta.href}" style="display:inline-block;background:${T.brand};color:${T.onBrand};text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">${opts.cta.label}</a>
      <p style="margin:16px 0 0;font-size:12px;color:${T.textMuted};word-break:break-all;">Oder Link kopieren: ${opts.cta.href}</p>
    </td></tr>`
        : ""
    }
    <tr><td style="padding:28px 32px 32px;">
      <hr style="border:none;border-top:1px solid ${T.border};margin:0 0 16px;">
      <p style="margin:0;font-size:12px;line-height:1.6;color:${T.textMuted};">
        Diese E-Mail wurde an dich gesendet, weil ein Konto bei ${SITE} damit verknüpft ist.<br>
        ${SITE} · Nur für Erwachsene (18+) · <a href="${absoluteUrl("/impressum")}" style="color:${T.link};">Impressum</a> ·
        <a href="${absoluteUrl("/datenschutz")}" style="color:${T.link};">Datenschutz</a>
      </p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

// ── Templates ────────────────────────────────────────────────────────────────

export const mailer = {
  verifyEmail: (to: string, token: string, name?: string | null) =>
    sendMail({
      to,
      subject: `${SITE}: Bitte bestätige deine E-Mail-Adresse`,
      html: layout({
        title: "Willkommen bei " + SITE,
        preview: "Nur noch ein Klick bis zu deinem Account.",
        body: `Hallo${name ? ` ${escapeHtml(name)}` : ""},<br><br>schön, dass du dabei bist. Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren. Der Link ist 24 Stunden gültig.`,
        cta: { label: "E-Mail bestätigen", href: absoluteUrl(`/verify-email?token=${token}`) },
      }),
    }),

  resetPassword: (to: string, token: string) =>
    sendMail({
      to,
      subject: `${SITE}: Passwort zurücksetzen`,
      html: layout({
        title: "Passwort zurücksetzen",
        preview: "Setze dein Passwort in 60 Sekunden neu.",
        body: "Du hast angefordert, dein Passwort zurückzusetzen. Der folgende Link ist 60 Minuten gültig. Falls du das nicht warst, kannst du diese E-Mail ignorieren.",
        cta: { label: "Neues Passwort setzen", href: absoluteUrl(`/reset-password?token=${token}`) },
      }),
    }),

  newMessage: (to: string, from: string, snippet: string) =>
    sendMail({
      to,
      subject: `Neue Nachricht von ${from}`,
      html: layout({
        title: `Neue Nachricht von ${escapeHtml(from)}`,
        body: `<blockquote style="margin:0;padding:12px 16px;border-left:3px solid ${T.brand};background:${T.cardAlt};border-radius:8px;color:${T.textStrong};">${escapeHtml(
          snippet,
        )}</blockquote>`,
        cta: { label: "Im Postfach antworten", href: absoluteUrl("/dashboard/nachrichten") },
      }),
    }),

  bookingRequest: (to: string, clientName: string, when: string, minutes: number) =>
    sendMail({
      to,
      subject: "Neue Buchungsanfrage",
      html: layout({
        title: "Neue Buchungsanfrage",
        body: `<b>${escapeHtml(clientName)}</b> möchte dich buchen.<br><br>Termin: <b>${escapeHtml(
          when,
        )}</b><br>Dauer: <b>${minutes} Minuten</b>`,
        cta: { label: "Anfrage ansehen", href: absoluteUrl("/dashboard/buchungen") },
      }),
    }),

  bookingStatus: (to: string, status: string, when: string) =>
    sendMail({
      to,
      subject: `Deine Buchung wurde ${status}`,
      html: layout({
        title: `Buchung ${escapeHtml(status)}`,
        body: `Deine Anfrage für <b>${escapeHtml(when)}</b> wurde <b>${escapeHtml(status)}</b>.`,
        cta: { label: "Buchungen öffnen", href: absoluteUrl("/dashboard/buchungen") },
      }),
    }),

  verificationResult: (to: string, approved: boolean, note?: string) =>
    sendMail({
      to,
      subject: approved ? "Dein Profil ist verifiziert ✅" : "Verifizierung: Rückfrage",
      html: layout({
        title: approved ? "Verifizierung erfolgreich" : "Wir brauchen noch etwas",
        body: approved
          ? "Glückwunsch! Dein Profil trägt ab sofort das Verified-Badge und wird in Suchergebnissen bevorzugt ausgespielt."
          : `Leider konnten wir deine Verifizierung nicht abschliessen.<br><br><i>${escapeHtml(
              note ?? "Bitte lade schärfere Aufnahmen hoch.",
            )}</i>`,
        cta: { label: "Zur Verifizierung", href: absoluteUrl("/dashboard/verifizierung") },
      }),
    }),

  newReview: (to: string, author: string, rating: number) =>
    sendMail({
      to,
      subject: `Neue Bewertung (${rating}/5)`,
      html: layout({
        title: "Du hast eine neue Bewertung",
        body: `<b>${escapeHtml(author)}</b> hat dich mit <b>${rating}/5</b> bewertet. Du kannst öffentlich darauf antworten.`,
        cta: { label: "Bewertung ansehen", href: absoluteUrl("/dashboard/bewertungen") },
      }),
    }),

  orderReceipt: (to: string, credits: number, amount: string, invoiceNo: string) =>
    sendMail({
      to,
      subject: `Zahlungsbestätigung ${invoiceNo}`,
      html: layout({
        title: "Danke für deinen Kauf",
        body: `Wir haben <b>${credits} Credits</b> deinem Konto gutgeschrieben.<br>Betrag: <b>${amount}</b><br>Rechnungsnummer: <b>${escapeHtml(
          invoiceNo,
        )}</b>`,
        cta: { label: "Guthaben ansehen", href: absoluteUrl("/dashboard/guthaben") },
      }),
    }),

  profileApproved: (to: string, slug: string) =>
    sendMail({
      to,
      subject: "Dein Profil ist online 🎉",
      html: layout({
        title: "Dein Profil ist freigeschaltet",
        body: "Ab sofort bist du in der Suche, in deiner Stadt und auf der Startseite auffindbar.",
        cta: { label: "Profil ansehen", href: absoluteUrl(`/escort/${slug}`) },
      }),
    }),
};

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
