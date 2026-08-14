import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Registrieren" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { role } = await searchParams;
  const validRole = ["MEMBER", "ESCORT", "AGENCY"].includes(role ?? "") ? role : "MEMBER";

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Konto erstellen</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Bereits registriert?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Jetzt anmelden
        </Link>
      </p>
      <RegisterForm defaultRole={validRole} />
    </div>
  );
}
