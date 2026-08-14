import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
const db = new PrismaClient();
async function main() {
  const u = await db.user.findUniqueOrThrow({ where: { email: process.argv[2] }, select: { id: true, role: true, profile: { select: { slug: true } } } });
  const token = randomBytes(32).toString("hex");
  await db.session.create({ data: { token, userId: u.id, expiresAt: new Date(Date.now() + 7200_000) } });
  console.error(`  Rolle=${u.role} Profil=${u.profile?.slug ?? "keins"}`);
  console.log(token);
}
main().finally(() => db.$disconnect());
