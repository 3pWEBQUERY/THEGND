import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="noise surface-glow relative w-full max-w-lg rounded-3xl border border-border bg-card p-10 text-center">
        <span className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl brand-surface">
          <Compass className="size-7" />
        </span>
        <p className="font-display text-6xl font-bold text-muted-foreground/25">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Seite nicht gefunden</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          Die Seite existiert nicht mehr oder wurde verschoben. Vielleicht findest du hier, was du suchst:
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="brand">
            <Link href="/">
              <Home className="size-4" /> Zur Startseite
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/escorts">
              <Search className="size-4" /> Profile durchsuchen
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
