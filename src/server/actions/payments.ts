"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { mailer } from "@/lib/mail";
import { grantCredits } from "@/server/credits";
import { formatCents } from "@/lib/utils";
import { type ActionState, fail, str, success } from "@/server/action-utils";

function invoiceNumber() {
  const now = new Date();
  return `GND-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}

export async function createOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Bitte melde dich an.");

  const packageId = str(formData, "packageId");
  const provider = str(formData, "provider") ?? "banktransfer";
  if (!packageId) return fail("Kein Paket ausgewählt.");

  const pkg = await db.package.findUnique({ where: { id: packageId } });
  if (!pkg?.active) return fail("Dieses Paket ist nicht verfügbar.");

  const order = await db.order.create({
    data: {
      userId: user.id,
      packageId: pkg.id,
      amountCents: pkg.priceCents,
      currency: pkg.currency,
      credits: pkg.credits + pkg.bonus,
      provider,
      invoiceNo: invoiceNumber(),
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/guthaben");
  return success(
    "Bestellung angelegt. Nach Zahlungseingang schreiben wir die Credits sofort gut.",
    { orderId: order.id, invoiceNo: order.invoiceNo },
  );
}

/**
 * Schliesst eine Bestellung ab und schreibt Credits gut.
 * Wird vom Zahlungs-Webhook aufgerufen — in der Entwicklung auch manuell.
 */
export async function completeOrderAction(orderId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");
  if (process.env.NODE_ENV === "production" && user.role !== "ADMIN") {
    return fail("Zahlungen werden über den Zahlungsanbieter bestätigt.");
  }

  const order = await db.order.findFirst({ where: { id: orderId, status: "PENDING" } });
  if (!order) return fail("Bestellung nicht gefunden oder bereits abgeschlossen.");
  if (order.userId !== user.id && user.role !== "ADMIN") return fail("Kein Zugriff.");

  await db.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: new Date() } });
  await grantCredits(order.userId, order.credits, "PURCHASE", `Kauf ${order.invoiceNo}`, order.id);

  const buyer = await db.user.findUnique({ where: { id: order.userId }, select: { email: true } });
  if (buyer) {
    await mailer.orderReceipt(
      buyer.email,
      order.credits,
      formatCents(order.amountCents, order.currency),
      order.invoiceNo ?? order.id,
    );
  }

  await db.notification.create({
    data: {
      userId: order.userId,
      type: "SYSTEM",
      title: "Credits gutgeschrieben",
      body: `${order.credits} Credits wurden deinem Konto hinzugefügt.`,
      href: "/dashboard/guthaben",
    },
  });

  revalidatePath("/dashboard/guthaben");
  return success(`${order.credits} Credits gutgeschrieben.`);
}

export async function cancelOrderAction(orderId: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return fail("Nicht angemeldet.");

  await db.order.updateMany({
    where: { id: orderId, userId: user.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/dashboard/guthaben");
  return success("Bestellung storniert.");
}
