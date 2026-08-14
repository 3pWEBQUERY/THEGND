"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
        <span className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl bg-danger/12 text-danger">
          <AlertOctagon className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight">Da ist etwas schiefgelaufen</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          Der Fehler wurde protokolliert. Versuche es erneut — falls es weiterhin klemmt, melde dich beim Support.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">Referenz: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="brand" onClick={reset}>
            <RotateCw className="size-4" /> Erneut versuchen
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="size-4" /> Zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
