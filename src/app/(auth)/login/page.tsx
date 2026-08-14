import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { next, registered } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Willkommen zurück</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Noch kein Konto?{" "}
        <Link href="/registrieren" className="font-medium text-primary hover:underline">
          Kostenlos registrieren
        </Link>
      </p>

      {registered && (
        <p className="mt-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Registrierung erfolgreich. Du kannst dich jetzt anmelden.
        </p>
      )}

      <LoginForm next={next} />
    </div>
  );
}
