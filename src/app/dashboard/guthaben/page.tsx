import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, Coins, Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, StatCard } from "@/components/dashboard/page-header";
import { CreditPackages } from "@/components/dashboard/credit-packages";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CREDIT_COSTS } from "@/lib/constants";
import { formatCents, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Guthaben" };

export default async function CreditsPage() {
  const user = await requireUser();

  const [packages, transactions, orders, account] = await Promise.all([
    db.package.findMany({ where: { active: true }, orderBy: { position: "asc" } }),
    db.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 40 }),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.user.findUnique({ where: { id: user.id }, select: { credits: true, lifetimeSpend: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Guthaben & Credits"
        description="Mit Credits buchst du Sichtbarkeit, schaltest Inhalte frei und verschickst Geschenke."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Aktuelles Guthaben" value={`${account?.credits ?? 0}`} hint="Credits" icon={Coins} />
        <StatCard label="Insgesamt ausgegeben" value={`${account?.lifetimeSpend ?? 0}`} hint="Credits" />
        <StatCard label="Bestellungen" value={orders.length} icon={Receipt} />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Credits aufladen</h2>
        <CreditPackages packages={JSON.parse(JSON.stringify(packages))} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold">Was kostet was?</h2>
          <ul className="space-y-2 text-sm">
            {[
              ["Profil nach oben schieben", CREDIT_COSTS.BUMP],
              ["Top-Platzierung (24 h)", CREDIT_COSTS.TOP_LISTING_DAY],
              ["Startseiten-Spotlight (24 h)", CREDIT_COSTS.SPOTLIGHT_DAY],
              ["Farb-Highlight (7 Tage)", CREDIT_COSTS.HIGHLIGHT_WEEK],
              ["Werbebanner (24 h)", CREDIT_COSTS.BANNER_DAY],
              ["Privates Medium freischalten", CREDIT_COSTS.UNLOCK_PRIVATE_MEDIA],
            ].map(([label, cost]) => (
              <li key={label as string} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <Badge variant="gold" size="sm">
                  {cost} Credits
                </Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-base font-semibold">Letzte Bewegungen</h2>
          {transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Noch keine Transaktionen.</p>
          ) : (
            <ul className="space-y-1">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                      tx.amount >= 0 ? "bg-success/12 text-success" : "bg-danger/12 text-danger"
                    }`}
                  >
                    {tx.amount >= 0 ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{tx.note ?? tx.type}</span>
                    <span className="block text-[11px] text-muted-foreground">{formatDateTime(tx.createdAt)}</span>
                  </span>
                  <span className={`shrink-0 text-sm font-semibold ${tx.amount >= 0 ? "text-success" : ""}`}>
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {orders.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-xl font-bold tracking-tight">Bestellungen</h2>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Rechnung</th>
                  <th className="px-5 py-3 text-left font-medium">Datum</th>
                  <th className="px-5 py-3 text-left font-medium">Credits</th>
                  <th className="px-5 py-3 text-left font-medium">Betrag</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-5 py-3 font-mono text-xs">{order.invoiceNo}</td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                    <td className="px-5 py-3">{order.credits}</td>
                    <td className="px-5 py-3">{formatCents(order.amountCents, order.currency)}</td>
                    <td className="px-5 py-3">
                      <Badge
                        size="sm"
                        variant={order.status === "PAID" ? "success" : order.status === "PENDING" ? "warning" : "neutral"}
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}
    </>
  );
}
