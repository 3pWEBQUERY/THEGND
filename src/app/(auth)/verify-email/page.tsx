import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "E-Mail bestätigen" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { ok: false, message: "Kein Bestätigungstoken gefunden." };

  return (
    <div className="text-center">
      {result.ok ? (
        <CheckCircle2 className="mx-auto mb-4 size-12 text-success" />
      ) : (
        <XCircle className="mx-auto mb-4 size-12 text-danger" />
      )}
      <h1 className="font-display text-2xl font-bold tracking-tight">
        {result.ok ? "E-Mail bestätigt" : "Bestätigung fehlgeschlagen"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
      <Button asChild variant="brand" className="mt-6 w-full">
        <Link href={result.ok ? "/dashboard" : "/login"}>{result.ok ? "Zum Dashboard" : "Zur Anmeldung"}</Link>
      </Button>
    </div>
  );
}
