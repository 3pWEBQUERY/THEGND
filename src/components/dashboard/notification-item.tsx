"use client";

import * as React from "react";
import Link from "next/link";
import { markNotificationReadAction } from "@/server/actions/misc";
import { cn } from "@/lib/utils";

/**
 * Ein Eintrag in der Benachrichtigungsliste.
 *
 * Anklicken heisst gelesen: der Vermerk geht sofort an den Server, die
 * Hervorhebung verschwindet ohne Warten. Die Navigation läuft unverändert
 * weiter — der Aufruf bleibt dabei bestehen, weil der Wechsel im Browser
 * stattfindet und die Seite nicht neu geladen wird.
 */
export function NotificationItem({
  id,
  href,
  title,
  body,
  zeit,
  gelesen,
}: {
  id: string;
  href: string;
  title: string;
  body: string | null;
  /** Fertig formatierte Zeitangabe — auf dem Server gerechnet. */
  zeit: string;
  gelesen: boolean;
}) {
  const [istGelesen, setIstGelesen] = React.useState(gelesen);

  // Kommt der Eintrag nach dem Neurechnen als gelesen zurück, bleibt er es.
  React.useEffect(() => {
    if (gelesen) setIstGelesen(true);
  }, [gelesen]);

  return (
    <Link
      href={href}
      onClick={() => {
        if (istGelesen) return;
        setIstGelesen(true);
        void markNotificationReadAction(id);
      }}
      className={cn(
        "flex items-start gap-3 p-4 transition-colors hover:bg-muted/60",
        istGelesen ? "" : "bg-primary/4",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", istGelesen ? "font-normal" : "font-medium")}>{title}</span>
        {body && <span className="mt-0.5 block text-xs text-muted-foreground">{body}</span>}
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground">{zeit}</span>
      {!istGelesen && <span className="mt-1.5 size-2 shrink-0 rounded-xs bg-primary" />}
    </Link>
  );
}
