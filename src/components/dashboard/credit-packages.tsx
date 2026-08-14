"use client";

import * as React from "react";
import { useActionState } from "react";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { completeOrderAction, createOrderAction } from "@/server/actions/payments";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/primitives";
import { cn, formatCents } from "@/lib/utils";

type Package = {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  bonus: number;
  priceCents: number;
  currency: string;
  popular: boolean;
};

export function CreditPackages({ packages }: { packages: Package[] }) {
  const [selected, setSelected] = React.useState<Package | null>(null);
  const [state, action, pending] = useActionState(createOrderAction, {});
  const [orderId, setOrderId] = React.useState<string | null>(null);
  const [confirming, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Bestellung angelegt");
      setOrderId((state.data as { orderId?: string } | undefined)?.orderId ?? null);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  if (!packages.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
        Aktuell sind keine Pakete verfügbar.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages.map((pkg) => {
          const total = pkg.credits + pkg.bonus;
          const perCredit = pkg.priceCents / total;
          return (
            <div
              key={pkg.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-5 transition-colors",
                pkg.popular ? "border-primary" : "border-border hover:border-foreground/25",
              )}
            >
              {pkg.popular && (
                <Badge className="absolute -top-2.5 left-5" variant="solid" size="sm">
                  <Sparkles className="size-3" /> Beliebt
                </Badge>
              )}
              <p className="text-sm font-semibold">{pkg.name}</p>
              <p className="mt-3 font-display text-3xl font-bold">
                {total}
                <span className="ml-1 text-sm font-normal text-muted-foreground">Credits</span>
              </p>
              {pkg.bonus > 0 && (
                <p className="mt-1 text-xs font-medium text-success">inkl. {pkg.bonus} Bonus-Credits</p>
              )}
              <p className="mt-3 text-lg font-semibold">{formatCents(pkg.priceCents, pkg.currency)}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatCents(Math.round(perCredit * 100) / 100, pkg.currency)} pro Credit
              </p>
              {pkg.description && <p className="mt-3 text-xs text-muted-foreground">{pkg.description}</p>}
              <Button
                variant={pkg.popular ? "brand" : "outline"}
                className="mt-5 w-full"
                onClick={() => {
                  setSelected(pkg);
                  setOrderId(null);
                }}
              >
                Auswählen
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected && (
                <>
                  {selected.credits + selected.bonus} Credits für{" "}
                  {formatCents(selected.priceCents, selected.currency)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {orderId ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-success">
                  <Check className="size-4" /> Bestellung angelegt
                </p>
                <p className="mt-2 text-muted-foreground">
                  Nach Zahlungseingang schreiben wir die Credits automatisch gut. Die Rechnung findest du unten in der
                  Übersicht.
                </p>
              </div>

              {process.env.NODE_ENV !== "production" && (
                <Button
                  variant="outline"
                  className="w-full"
                  loading={confirming}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await completeOrderAction(orderId);
                      res.ok ? toast.success(res.message) : toast.error(res.message);
                      setSelected(null);
                    })
                  }
                >
                  Zahlung simulieren (nur Entwicklung)
                </Button>
              )}
            </div>
          ) : (
            <form action={action} className="space-y-4">
              <input type="hidden" name="packageId" value={selected?.id ?? ""} />
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Zahlungsart</span>
                <Select name="provider" defaultValue="banktransfer">
                  <option value="banktransfer">Überweisung / SEPA</option>
                  <option value="crypto">Krypto (BTC / ETH / USDT)</option>
                  <option value="paysafe">Paysafecard</option>
                  <option value="card">Kreditkarte</option>
                </Select>
              </label>
              <p className="rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                Die Abbuchung erfolgt diskret ohne Hinweis auf THEGND. Es entstehen keine Abos oder Folgekosten.
              </p>
              <DialogFooter>
                <Button type="submit" variant="brand" loading={pending} className="w-full">
                  <CreditCard className="size-4" /> Kostenpflichtig bestellen
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
