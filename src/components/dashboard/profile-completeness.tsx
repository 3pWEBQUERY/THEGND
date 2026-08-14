"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Circle, Rocket } from "lucide-react";
import { toast } from "sonner";
import { publishProfileAction, toggleProfileStatusAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type ProfileState = {
  hasAbout: boolean;
  hasCity: boolean;
  mediaCount: number;
  serviceCount: number;
  languageCount: number;
  hasPrice: boolean;
  hasPhone: boolean;
  isVerified: boolean;
  verificationStatus: string;
  status: string;
};

export function ProfileCompleteness({ profile }: { profile: ProfileState }) {
  const [pending, startTransition] = React.useTransition();

  const steps = [
    { done: profile.hasAbout, label: "Beschreibung (50+ Zeichen)", href: "/dashboard/profil" },
    { done: profile.mediaCount >= 3, label: "Mindestens 3 Fotos", href: "/dashboard/medien" },
    { done: profile.hasCity, label: "Stadt hinterlegt", href: "/dashboard/profil?tab=standort" },
    { done: profile.hasPrice, label: "Preise angegeben", href: "/dashboard/profil?tab=preise" },
    { done: profile.serviceCount >= 3, label: "Services ausgewählt", href: "/dashboard/profil?tab=services" },
    { done: profile.languageCount >= 1, label: "Sprachen angegeben", href: "/dashboard/profil?tab=services" },
    { done: profile.hasPhone, label: "Kontaktmöglichkeit", href: "/dashboard/profil?tab=kontakt" },
    { done: profile.isVerified, label: "Verifizierung abgeschlossen", href: "/dashboard/verifizierung" },
  ];

  const done = steps.filter((s) => s.done).length;
  const percent = Math.round((done / steps.length) * 100);

  const publish = () =>
    startTransition(async () => {
      const res = await publishProfileAction();
      res.ok ? toast.success(res.message) : toast.error(res.message);
    });

  const toggle = () =>
    startTransition(async () => {
      const res = await toggleProfileStatusAction();
      res.ok ? toast.success(res.message) : toast.error(res.message);
    });

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Profil-Vollständigkeit</h2>
          <p className="text-xs text-muted-foreground">
            Vollständige Profile erhalten bis zu 4× mehr Anfragen.
          </p>
        </div>
        <span className="font-display text-2xl font-bold">{percent}%</span>
      </div>

      <Progress value={percent} className="mb-5" />

      <ul className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              {step.done ? (
                <span className="grid size-5 shrink-0 place-items-center rounded-md bg-success text-white">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground/40" />
              )}
              <span className={cn("flex-1", step.done ? "text-muted-foreground line-through" : "font-medium")}>
                {step.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        {profile.status === "DRAFT" || profile.status === "REJECTED" ? (
          <Button variant="brand" onClick={publish} loading={pending}>
            <Rocket className="size-4" /> Profil einreichen
          </Button>
        ) : profile.status === "ACTIVE" || profile.status === "PAUSED" ? (
          <Button variant="outline" onClick={toggle} loading={pending}>
            {profile.status === "ACTIVE" ? "Profil pausieren" : "Profil aktivieren"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Dein Profil wird gerade geprüft.</p>
        )}
      </div>
    </Card>
  );
}
