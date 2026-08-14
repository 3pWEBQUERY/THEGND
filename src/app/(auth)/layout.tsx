import Link from "next/link";
import { ArrowLeft, BadgeCheck, Lock, Sparkles } from "lucide-react";
import { SITE } from "@/lib/constants";
import { ThemeToggleCompact } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Zurück
          </Link>
          <ThemeToggleCompact />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/agb" className="hover:text-foreground">
            AGB
          </Link>
          {" · "}
          <Link href="/datenschutz" className="hover:text-foreground">
            Datenschutz
          </Link>
          {" · "}
          <Link href="/impressum" className="hover:text-foreground">
            Impressum
          </Link>
        </p>
      </div>

      <aside className="noise surface-glow relative hidden overflow-hidden border-l border-border bg-surface lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="relative max-w-md">
          <span className="grid size-12 place-items-center rounded-2xl brand-surface shadow-glow">
            <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
              <path d="M12 2.5 21 12l-9 9.5L3 12z" opacity=".9" />
              <path d="M12 7.2 16.6 12 12 16.8 7.4 12z" fill="currentColor" opacity=".5" />
            </svg>
          </span>

          <h2 className="mt-8 font-display text-4xl font-bold leading-tight tracking-tight">
            Willkommen bei
            <br />
            <span className="text-brand">{SITE.name}</span>
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{SITE.description}</p>

          <ul className="mt-10 space-y-5">
            {[
              { icon: BadgeCheck, title: "Verifizierte Profile", text: "Ausweis- und Fotoprüfung durch unser Team." },
              { icon: Lock, title: "Maximale Diskretion", text: "Keine Tracker Dritter, verschlüsselte Kommunikation." },
              { icon: Sparkles, title: "25 Credits geschenkt", text: "Direkt nach der Registrierung, ohne Bedingungen." },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
