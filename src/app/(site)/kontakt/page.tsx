import type { Metadata } from "next";
import Link from "next/link";
import { Clock, LifeBuoy, Mail, MessageSquare, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Support, Presse und rechtliche Anfragen — so erreichst du uns.",
  alternates: { canonical: "/kontakt" },
};

const CHANNELS = [
  {
    icon: LifeBuoy,
    title: "Support",
    text: "Fragen zu Konto, Profil, Verifizierung oder Credits.",
    contact: SITE.email,
    time: "Antwort meist innerhalb von 24 Stunden",
  },
  {
    icon: Shield,
    title: "Missbrauch & Recht",
    text: "Meldungen zu illegalen Inhalten, Auskunftsersuchen von Behörden.",
    contact: "abuse@thegnd.net",
    time: "Bearbeitung binnen 24 Stunden",
  },
  {
    icon: MessageSquare,
    title: "Presse & Kooperationen",
    text: "Interviewanfragen, Partnerschaften, Werbung.",
    contact: "presse@thegnd.net",
    time: "Antwort innerhalb von 3 Werktagen",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-10 text-center">
        <Mail className="mx-auto mb-4 size-10 text-primary" />
        <h1 className="font-display text-4xl font-bold tracking-tight">Kontakt</h1>
        <p className="mt-3 text-muted-foreground">
          Wir sind ein kleines Team und lesen jede Nachricht selbst. Vorher lohnt oft ein Blick in die{" "}
          <Link href="/faq" className="text-primary hover:underline">
            FAQ
          </Link>
          .
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, title, text, contact, time }) => (
          <Card key={title} className="p-6">
            <Icon className="mb-3 size-5 text-primary" />
            <p className="text-base font-semibold">{title}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            <a href={`mailto:${contact}`} className="mt-4 block break-all text-sm font-medium text-primary hover:underline">
              {contact}
            </a>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3" /> {time}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-base font-semibold">Postanschrift</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {SITE.name} — Betreibergesellschaft
          <br />
          Musterstrasse 1
          <br />
          8001 Zürich, Schweiz
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Vollständige Angaben findest du im{" "}
          <Link href="/impressum" className="text-primary hover:underline">
            Impressum
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
