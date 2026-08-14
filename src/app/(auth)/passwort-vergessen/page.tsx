import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Passwort vergessen" };

export default function ForgotPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Passwort vergessen?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Kein Problem. Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
      </p>
      <ForgotForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
