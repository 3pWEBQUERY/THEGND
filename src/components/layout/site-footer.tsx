import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { FOOTER_NAV, SITE } from "@/lib/constants";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-border bg-surface">
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl brand-surface">
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                  <path d="M12 2.5 21 12l-9 9.5L3 12z" opacity=".9" />
                  <path d="M12 7.2 16.6 12 12 16.8 7.4 12z" fill="currentColor" opacity=".5" />
                </svg>
              </span>
              <span className="text-lg font-extrabold tracking-[0.16em]">{SITE.name}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{SITE.description}</p>

            <div className="mt-6 space-y-3">
              <p className="text-sm font-semibold">Newsletter</p>
              <p className="text-xs text-muted-foreground">
                Neue Profile, Touren und Angebote — maximal einmal pro Woche, jederzeit abbestellbar.
              </p>
              <NewsletterForm />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-2.5 py-1">
                <ShieldCheck className="size-3.5 text-success" /> SSL-verschlüsselt
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border px-2.5 py-1">
                18+ RTA-gelabelt
              </span>
              <a
                href={`mailto:${SITE.email}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-2.5 py-1 transition-colors hover:text-foreground"
              >
                <Mail className="size-3.5" /> {SITE.email}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-sm font-semibold">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE.name}. Alle Rechte vorbehalten. Diese Website enthält Inhalte für
            Erwachsene (18+).
          </p>
          <p className="text-xs text-muted-foreground">
            Menschenhandel und Zwangsprostitution werden konsequent gemeldet.{" "}
            <Link href="/sicherheit" className="underline underline-offset-2 hover:text-foreground">
              Mehr erfahren
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
