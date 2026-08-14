import "server-only";

import { db } from "@/lib/db";
import type { TxType } from "@prisma/client";

type Result = { ok: true; balance: number } | { ok: false; message: string };

export async function spendCredits(userId: string, amount: number, note: string, reference?: string): Promise<Result> {
  if (amount <= 0) return { ok: true, balance: 0 };

  return db
    .$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { credits: true } });
      if (!user) throw new Error("NO_USER");
      if (user.credits < amount) throw new Error("INSUFFICIENT");

      const updated = await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: amount }, lifetimeSpend: { increment: amount } },
        select: { credits: true },
      });

      await tx.transaction.create({
        data: { userId, type: "SPEND", amount: -amount, balance: updated.credits, note, reference },
      });

      return { ok: true as const, balance: updated.credits };
    })
    .catch((error: Error) => {
      if (error.message === "INSUFFICIENT")
        return { ok: false as const, message: "Nicht genügend Credits. Bitte lade dein Guthaben auf." };
      return { ok: false as const, message: "Transaktion fehlgeschlagen." };
    });
}

export async function grantCredits(
  userId: string,
  amount: number,
  type: TxType = "BONUS",
  note?: string,
  reference?: string,
) {
  const updated = await db.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
    select: { credits: true },
  });
  await db.transaction.create({
    data: { userId, type, amount, balance: updated.credits, note, reference },
  });
  return updated.credits;
}

export async function getBalance(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { credits: true } });
  return user?.credits ?? 0;
}
