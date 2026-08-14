"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteAction } from "@/server/actions/interactions";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  profileId,
  initial,
  variant = "overlay",
  className,
}: {
  profileId: string;
  initial?: boolean;
  variant?: "overlay" | "solid";
  className?: string;
}) {
  const [active, setActive] = React.useState(Boolean(initial));
  const [pending, startTransition] = React.useTransition();

  React.useEffect(() => setActive(Boolean(initial)), [initial]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const res = await toggleFavoriteAction(profileId);
      if (!res.ok) {
        setActive(!next);
        toast.error(res.message ?? "Aktion fehlgeschlagen");
        return;
      }
      setActive(res.data?.favorited ?? next);
      toast.success(res.data?.favorited ? "Zu Favoriten hinzugefügt" : "Aus Favoriten entfernt");
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      className={cn(
        "grid place-items-center rounded-lg transition-all active:scale-90",
        variant === "overlay"
          ? "size-8 bg-black/45 text-white backdrop-blur-md hover:bg-black/65"
          : "size-11 border border-border bg-card hover:border-primary/50",
        className,
      )}
    >
      <Heart className={cn("size-4 transition-all", active && "fill-primary text-primary scale-110")} />
    </button>
  );
}
