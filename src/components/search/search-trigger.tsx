"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MapPin, Search, Sparkles, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/primitives";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Suggestion = {
  profiles: { slug: string; displayName: string; city: string | null; cover: string | null; verified: boolean }[];
  cities: { slug: string; name: string; count: number }[];
};

const QUICK = [
  { label: "Jetzt online", href: "/escorts?online=1" },
  { label: "Verifiziert", href: "/escorts?verified=1" },
  { label: "Neu dabei", href: "/escorts?sort=new" },
  { label: "Top bewertet", href: "/escorts?sort=rating" },
  { label: "Mit Video", href: "/escorts?withVideo=1" },
];

export function SearchTrigger() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Suggestion | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        setData(await res.json());
      } catch {
        /* abgebrochen */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/escorts?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "group flex h-10 items-center gap-2 rounded-xl border border-border bg-muted/40 pl-3 pr-2 text-sm text-muted-foreground transition-colors hover:bg-muted",
            "sm:w-56 lg:w-72",
          )}
          aria-label="Suche öffnen"
        >
          <Search className="size-4 shrink-0" />
          <span className="hidden flex-1 text-left sm:block">Name, Stadt, Service…</span>
          <kbd className="hidden rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] lg:block">
            ⌘K
          </kbd>
        </button>
      </DialogTrigger>

      <DialogContent className="top-[12%] max-w-2xl translate-y-0 p-0" hideClose>
        <DialogTitle className="sr-only">Suche</DialogTitle>
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Wonach suchst du? Name, Stadt, Service…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
          />
          {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        </form>

        <div className="max-h-[55vh] overflow-y-auto p-3">
          {!query.trim() && (
            <div className="space-y-4 p-2">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="size-3" /> Schnellfilter
                </p>
                <div className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <Link key={q.href} href={q.href} onClick={() => setOpen(false)}>
                      <Badge variant="neutral" size="lg" className="hover:border-primary hover:text-primary">
                        {q.label}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="size-3" /> Beliebte Städte
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Zürich", "Genf", "Basel", "Bern", "Lausanne", "Luzern", "Lugano"].map((c) => (
                    <Link
                      key={c}
                      href={`/escorts?city=${c.toLowerCase().replace("ü", "ue").replace("ö", "oe")}`}
                      onClick={() => setOpen(false)}
                    >
                      <Badge variant="neutral" size="lg" className="hover:border-primary hover:text-primary">
                        <MapPin className="size-3" /> {c}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {data?.cities?.length ? (
            <div className="mb-2">
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Städte
              </p>
              {data.cities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/escorts?city=${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                >
                  <MapPin className="size-4 text-muted-foreground" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.count} Profile</span>
                </Link>
              ))}
            </div>
          ) : null}

          {data?.profiles?.length ? (
            <div>
              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Profile
              </p>
              {data.profiles.map((p) => (
                <Link
                  key={p.slug}
                  href={`/escort/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.cover ?? "/placeholder.svg"}
                    alt=""
                    className="size-10 rounded-lg object-cover"
                    loading="lazy"
                  />
                  <span className="flex-1">
                    <span className="block font-medium">{p.displayName}</span>
                    <span className="block text-xs text-muted-foreground">{p.city ?? "—"}</span>
                  </span>
                  {p.verified && (
                    <Badge variant="success" size="sm">
                      Verifiziert
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          ) : null}

          {query.trim().length >= 2 && !loading && !data?.profiles?.length && !data?.cities?.length && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Keine Treffer für „{query}“.
            </p>
          )}
        </div>

        {query.trim() && (
          <button
            onClick={submit as never}
            className="flex w-full items-center justify-between gap-2 border-t border-border px-5 py-3.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <span>
              Alle Ergebnisse für <span className="text-primary">„{query}“</span>
            </span>
            <ArrowRight className="size-4" />
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}
