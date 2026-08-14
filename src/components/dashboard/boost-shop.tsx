"use client";

import * as React from "react";
import { useActionState } from "react";
import { ArrowUpCircle, Crown, Highlighter, Megaphone, Pin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { purchaseBoostAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CREDIT_COSTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const PRODUCTS = [
  {
    type: "BUMP",
    icon: ArrowUpCircle,
    title: "Nach oben schieben",
    text: "Dein Profil springt sofort an die Spitze der Standardsortierung.",
    price: CREDIT_COSTS.BUMP,
    unit: "einmalig",
    perDay: false,
  },
  {
    type: "TOP_LISTING",
    icon: Crown,
    title: "Top-Platzierung",
    text: "Fixe Position ganz oben in deiner Stadt — über allen anderen Profilen.",
    price: CREDIT_COSTS.TOP_LISTING_DAY,
    unit: "pro Tag",
    perDay: true,
    popular: true,
  },
  {
    type: "SPOTLIGHT",
    icon: Sparkles,
    title: "Startseiten-Spotlight",
    text: "Du erscheinst im Spotlight-Karussell auf der Startseite.",
    price: CREDIT_COSTS.SPOTLIGHT_DAY,
    unit: "pro Tag",
    perDay: true,
  },
  {
    type: "HIGHLIGHT",
    icon: Highlighter,
    title: "Farb-Highlight",
    text: "Goldener Rahmen in allen Listen — fällt sofort ins Auge.",
    price: CREDIT_COSTS.HIGHLIGHT_WEEK,
    unit: "pro Woche",
    perDay: true,
  },
  {
    type: "STORY_PIN",
    icon: Pin,
    title: "Story anheften",
    text: "Deine Story bleibt 24 h ganz vorne im Feed.",
    price: CREDIT_COSTS.STORY_PIN,
    unit: "pro Tag",
    perDay: true,
  },
  {
    type: "BANNER",
    icon: Megaphone,
    title: "Werbebanner",
    text: "Grossformatiges Banner in Suchergebnissen deiner Stadt.",
    price: CREDIT_COSTS.BANNER_DAY,
    unit: "pro Tag",
    perDay: true,
  },
] as const;

export function BoostShop({ credits, profileActive }: { credits: number; profileActive: boolean }) {
  const [state, action, pending] = useActionState(purchaseBoostAction, {});
  const [days, setDays] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (state.ok) toast.success(state.message ?? "Aktiviert");
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PRODUCTS.map((product) => {
        const selectedDays = days[product.type] ?? 1;
        const total = product.perDay ? product.price * selectedDays : product.price;
        const affordable = credits >= total;

        return (
          <form
            key={product.type}
            action={action}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-5",
              "popular" in product && product.popular ? "border-primary/50" : "border-border",
            )}
          >
            <input type="hidden" name="type" value={product.type} />
            <input type="hidden" name="days" value={selectedDays} />

            <div className="mb-3 flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <product.icon className="size-5" />
              </span>
              {"popular" in product && product.popular && (
                <Badge variant="solid" size="sm">
                  Bestseller
                </Badge>
              )}
            </div>

            <p className="text-sm font-semibold">{product.title}</p>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{product.text}</p>

            {product.perDay && (
              <label className="mt-4 block text-xs">
                <span className="text-muted-foreground">Laufzeit</span>
                <Select
                  value={String(selectedDays)}
                  onValueChange={(v) => setDays((d) => ({ ...d, [product.type]: Number(v) }))}
                  className="mt-1 h-9 rounded-lg px-3"
                >
                  {[1, 3, 7, 14, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} {product.unit.includes("Woche") ? (d === 1 ? "Woche" : "Wochen") : d === 1 ? "Tag" : "Tage"}
                    </option>
                  ))}
                </Select>
              </label>
            )}

            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-display text-xl font-bold">{total} C</span>
              <span className="text-[11px] text-muted-foreground">{product.unit}</span>
            </div>

            <Button
              type="submit"
              variant={affordable && profileActive ? "brand" : "outline"}
              className="mt-3 w-full"
              loading={pending}
              disabled={!affordable || !profileActive}
            >
              {!profileActive ? "Profil erst aktivieren" : affordable ? "Jetzt buchen" : "Guthaben zu niedrig"}
            </Button>
          </form>
        );
      })}
    </div>
  );
}
