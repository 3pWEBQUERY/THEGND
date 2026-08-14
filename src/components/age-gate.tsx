"use client";

import * as React from "react";
import { ShieldCheck, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

const KEY = "gnd_age_ok";

export function AgeGate() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      if (!stored || Number(stored) < Date.now()) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const confirm = () => {
    try {
      localStorage.setItem(KEY, String(Date.now() + 30 * 864e5));
      document.cookie = `${KEY}=1; path=/; max-age=${30 * 86400}; samesite=lax`;
    } catch {}
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-4 backdrop-blur-xl">
      <div className="noise relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-surface-invert p-8 text-center shadow-2xl sm:p-10">
        <div className="surface-glow pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl brand-surface shadow-glow">
            <ShieldCheck className="size-8" />
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand">Nur für Erwachsene</p>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Bist du über 18?</h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
            {SITE.name} enthält Inhalte für Erwachsene. Mit dem Betreten bestätigst du, dass du volljährig bist, die{" "}
            <a href="/agb" className="underline underline-offset-2 hover:text-white">
              AGB
            </a>{" "}
            akzeptierst und diese Inhalte freiwillig ansiehst.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button size="lg" variant="brand" className="w-full" onClick={confirm}>
              Ich bin 18 Jahre oder älter — eintreten
            </Button>
            <a
              href="https://www.google.com"
              className="rounded-xl px-6 py-3 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
            >
              Ich bin unter 18 — verlassen
            </a>
          </div>

          <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 text-left sm:grid-cols-3">
            {[
              { icon: Lock, text: "Diskret & verschlüsselt" },
              { icon: ShieldCheck, text: "Verifizierte Profile" },
              { icon: Eye, text: "Keine Tracker Dritter" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-[11px] text-white/45">
                <Icon className="size-3.5 shrink-0 text-brand" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
