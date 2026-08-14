import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Camera, FileCheck, Lock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Verifizierung",
  description: "So funktioniert die kostenlose Identitätsprüfung auf THEGND — und warum sie sich lohnt.",
  alternates: { canonical: "/verifizierung" },
};

export default function VerificationInfoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-12 text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-success/12 text-success">
          <BadgeCheck className="size-7" />
        </span>
        <Badge variant="success" className="mb-4">
          Kostenlos
        </Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight">Das blaue Badge</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Vertrauen ist die härteste Währung in dieser Branche. Die Verifizierung schafft sie — in unter 24 Stunden
          und ohne einen Cent.
        </p>
      </header>

      <div className="mb-12 grid gap-4 sm:grid-cols-3">
        {[
          { icon: TrendingUp, title: "Mehr Anfragen", text: "Verifizierte Profile erhalten im Schnitt deutlich mehr Kontakte." },
          { icon: FileCheck, title: "Besseres Ranking", text: "Das Badge fliesst direkt in die Sortierung der Suche ein." },
          { icon: Lock, title: "Volle Diskretion", text: "Dokumente sind nie öffentlich und werden nach 90 Tagen gelöscht." },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} className="p-5">
            <Icon className="mb-3 size-5 text-primary" />
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
          </Card>
        ))}
      </div>

      <Card className="p-8">
        <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">So läuft es ab</h2>
        <ol className="space-y-6">
          {[
            { icon: FileCheck, title: "Ausweis hochladen", text: "Personalausweis, Reisepass oder Führerschein — gut lesbar. Die Seriennummer darfst du schwärzen." },
            { icon: Camera, title: "Selfie mit Code", text: "Ein Foto von dir mit handschriftlichem Zettel: THEGND, dein Profilname und das heutige Datum." },
            { icon: BadgeCheck, title: "Prüfung & Freigabe", text: "Unser Team gleicht die Angaben manuell ab. In der Regel bist du binnen 24 Stunden verifiziert." },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl brand-surface text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{step.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-6">
          <Button asChild variant="brand">
            <Link href="/dashboard/verifizierung">Jetzt verifizieren</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/datenschutz">Datenschutz nachlesen</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
