import Link from "next/link";
import { FileText } from "lucide-react";

export type LegalSection = { heading: string; paragraphs?: string[]; bullets?: string[] };

export function LegalPage({
  title,
  updated,
  intro,
  sections,
  notice,
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
  notice?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10">
        <FileText className="mb-4 size-8 text-primary" />
        <h1 className="font-display text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Stand: {updated}</p>
        {intro && <p className="mt-5 leading-relaxed text-muted-foreground">{intro}</p>}
      </header>

      {notice && (
        <p className="mb-10 rounded-2xl border border-warning/30 bg-warning/8 p-4 text-sm leading-relaxed">
          {notice}
        </p>
      )}

      <div className="space-y-9">
        {sections.map((section, i) => (
          <section key={section.heading}>
            <h2 className="mb-3 font-display text-xl font-bold tracking-tight">
              {i + 1}. {section.heading}
            </h2>
            {section.paragraphs?.map((paragraph, j) => (
              <p key={j} className="mb-3 leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="ml-5 list-disc space-y-1.5 text-muted-foreground">
                {section.bullets.map((bullet, j) => (
                  <li key={j} className="leading-relaxed">
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <nav className="mt-14 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
        {[
          { href: "/agb", label: "AGB" },
          { href: "/datenschutz", label: "Datenschutz" },
          { href: "/impressum", label: "Impressum" },
          { href: "/richtlinien", label: "Community-Richtlinien" },
          { href: "/2257", label: "18 U.S.C. 2257" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
