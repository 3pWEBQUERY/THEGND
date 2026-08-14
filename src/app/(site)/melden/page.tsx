import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { ReportForm } from "@/components/report-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Inhalt melden",
  description: "Melde Profile, Nachrichten oder Inhalte, die gegen unsere Richtlinien verstossen.",
  alternates: { canonical: "/melden" },
  robots: { index: false, follow: false },
};

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <AlertTriangle className="mb-4 size-10 text-danger" />
        <h1 className="font-display text-4xl font-bold tracking-tight">Inhalt melden</h1>
        <p className="mt-3 text-muted-foreground">
          Deine Meldung wird vertraulich behandelt und in der Regel innerhalb von 24 Stunden geprüft. Bei akuter Gefahr
          wähle bitte zuerst den Notruf 110 bzw. 112.
        </p>
      </header>

      <Card className="p-6">
        <ReportForm />
      </Card>
    </div>
  );
}
