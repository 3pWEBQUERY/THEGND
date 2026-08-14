import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  Eye,
  EyeOff,
  Inbox,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AGENCY_KIND_LABEL } from "@/lib/constants";
import type { HausKennzahlen } from "@/server/queries/agency-access";
import { cn, formatNumber } from "@/lib/utils";

/**
 * Dashboard-Bereich für Häuser.
 *
 * Ein Agenturkonto hat kein eigenes Escort-Profil — die Profilkacheln blieben
 * dort leer. Hier stehen stattdessen die Zahlen, die ein Haus betreffen:
 * Team, Reichweite über alle Models und offene Entscheidungen.
 */
export function AgencyOverview({ daten, ungeleseneNachrichten }: { daten: HausKennzahlen; ungeleseneNachrichten: number }) {
  const { haus, schritte, fortschritt } = daten;
  const offen = schritte.filter((s) => !s.erledigt);

  return (
    <div className="space-y-6">
      {/* Kopf: Status des Inserats */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              {haus.name}
              <Badge variant="neutral" size="sm">
                {AGENCY_KIND_LABEL[haus.kind] ?? haus.kind}
              </Badge>
              {haus.isVerified && (
                <Badge variant="success" size="sm">
                  <BadgeCheck className="size-3" /> geprüft
                </Badge>
              )}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {haus.isPublished ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              {haus.isPublished ? "öffentlich sichtbar" : "noch nicht veröffentlicht"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {haus.isPublished && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/agenturen/${haus.slug}`} target="_blank">
                Ansehen <ArrowUpRight className="size-3.5" />
              </Link>
            </Button>
          )}
          <Button asChild variant="brand" size="sm">
            <Link href="/dashboard/agentur">Haus bearbeiten</Link>
          </Button>
        </div>
      </Card>

      {/* Offene Entscheidungen zuerst — das ist das Einzige, was drängt. */}
      {daten.anfragen > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
          <p className="flex items-center gap-2.5 text-sm">
            <Inbox className="size-4 shrink-0 text-primary" />
            <span>
              <span className="font-semibold">
                {daten.anfragen} {daten.anfragen === 1 ? "Beitrittsanfrage" : "Beitrittsanfragen"}
              </span>{" "}
              <span className="text-muted-foreground">wartet auf deine Entscheidung.</span>
            </span>
          </p>
          <Button asChild variant="brand" size="sm">
            <Link href="/dashboard/agentur/models">Ansehen</Link>
          </Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Models"
          value={formatNumber(daten.models)}
          hint={`${daten.aktiveModels} aktiv${daten.einladungen > 0 ? ` · ${daten.einladungen} eingeladen` : ""}`}
          icon={Users}
        />
        <StatCard
          label="Profilaufrufe (7 T.)"
          value={formatNumber(daten.aufrufe7)}
          hint="alle Models zusammen"
          icon={Eye}
        />
        <StatCard label="Bewertungen" value={formatNumber(daten.bewertungen)} icon={Star} />
        <StatCard label="Ungelesene Nachrichten" value={ungeleseneNachrichten} icon={MessageCircle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Vollständigkeit */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Inserat vervollständigen</h2>
            <span className="text-sm font-medium tabular-nums">{fortschritt} %</span>
          </div>

          <div className="mb-5 h-2 overflow-hidden rounded-xs bg-input">
            <div className="h-full bg-primary transition-all" style={{ width: `${fortschritt}%` }} />
          </div>

          {offen.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 text-success" /> Alles erledigt — dein Inserat ist vollständig.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {schritte.map((schritt) => (
                <li key={schritt.key} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-md",
                      schritt.erledigt ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {schritt.erledigt ? <Check className="size-3" /> : <span className="size-1.5 rounded-xs bg-current" />}
                  </span>
                  <span className={cn(schritt.erledigt && "text-muted-foreground line-through")}>
                    {schritt.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Schnellzugriff */}
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold">Schnellzugriff</h2>
          <ul className="space-y-2">
            {[
              { href: "/dashboard/agentur", label: "Stammdaten & Standort", icon: Building2 },
              { href: "/dashboard/agentur/models", label: "Models verwalten", icon: Users, badge: daten.anfragen },
              { href: "/dashboard/agentur/pruefung", label: "Prüfung beantragen", icon: ShieldCheck },
              { href: "/dashboard/buchungen", label: "Buchungen", icon: Calendar },
            ].map(({ href, label, icon: Icon, badge }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5 text-sm transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1">{label}</span>
                  {badge ? <Badge size="sm">{badge}</Badge> : <ArrowUpRight className="size-3.5 opacity-50" />}
                </Link>
              </li>
            ))}
          </ul>

          {!haus.isVerified && (
            <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
              {haus.verification?.status === "SUBMITTED" || haus.verification?.status === "IN_REVIEW"
                ? "Dein Prüfantrag liegt bei uns."
                : "Mit dem Geprüft-Siegel wirst du in der Suche deutlich häufiger angeklickt."}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
