"use client";

import * as React from "react";

/** Meldet regelmässig „online“ an den Server (alle 3 Minuten, nur bei sichtbarem Tab). */
export function PresenceTracker() {
  React.useEffect(() => {
    let cancelled = false;

    const ping = () => {
      if (document.visibilityState !== "visible" || cancelled) return;
      fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => null);
    };

    ping();
    const interval = setInterval(ping, 180_000);
    document.addEventListener("visibilitychange", ping);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  return null;
}
