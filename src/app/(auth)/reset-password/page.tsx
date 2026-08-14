import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Neues Passwort" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Ungültiger Link</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Dieser Link ist unvollständig. Fordere einen neuen an.
        </p>
        <Link href="/passwort-vergessen" className="mt-4 inline-block text-sm text-primary hover:underline">
          Neuen Link anfordern
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">Neues Passwort setzen</h1>
      <p className="mt-2 text-sm text-muted-foreground">Wähle ein sicheres Passwort, das du nirgends sonst nutzt.</p>
      <ResetForm token={token} />
    </div>
  );
}
