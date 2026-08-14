/**
 * Einmalige Datenmigration: Bestand auf die Schweiz umstellen.
 *   npx tsx --env-file=.env scripts/migrate-schweiz.ts
 *
 * 1. Alle Währungen auf CHF (Profile, Buchungen, Bestellungen, Pakete).
 * 2. Zeitzone der Nutzer:innen von Europe/Berlin auf Europe/Zurich.
 * 3. Profile, Touren und Agenturen aus DE/AT auf Schweizer Städte umhängen —
 *    deterministisch, damit ein zweiter Lauf dasselbe Ergebnis liefert.
 * 4. Erst danach die nicht-schweizerischen Länder samt Städten löschen.
 *
 * Nichts wird gelöscht, solange noch etwas darauf zeigt: Schritt 3 läuft
 * vollständig vor Schritt 4, und die Zuordnung wird vorher gezählt.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.info("→ Migration auf die Schweiz\n");

  // ── 1. Währungen ───────────────────────────────────────────────────────────
  const p = await db.profile.updateMany({ where: { currency: { not: "CHF" } }, data: { currency: "CHF" } });
  const b = await db.booking.updateMany({ where: { currency: { not: "CHF" } }, data: { currency: "CHF" } });
  const o = await db.order.updateMany({ where: { currency: { not: "CHF" } }, data: { currency: "CHF" } });
  const k = await db.package.updateMany({ where: { currency: { not: "CHF" } }, data: { currency: "CHF" } });
  console.info(`  ✓ CHF: ${p.count} Profile, ${b.count} Buchungen, ${o.count} Bestellungen, ${k.count} Pakete`);

  // ── 2. Zeitzone ────────────────────────────────────────────────────────────
  const tz = await db.user.updateMany({
    where: { timezone: { in: ["Europe/Berlin", "Europe/Vienna"] } },
    data: { timezone: "Europe/Zurich" },
  });
  console.info(`  ✓ Zeitzone: ${tz.count} Konten auf Europe/Zurich`);

  // ── 3. Standorte umhängen ──────────────────────────────────────────────────
  const schweiz = await db.country.findUnique({ where: { code: "CH" } });
  if (!schweiz) throw new Error("Land CH fehlt — bitte zuerst `npm run db:seed` ausführen.");

  const chStaedte = await db.city.findMany({
    where: { countryId: schweiz.id },
    orderBy: [{ isPopular: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });
  if (chStaedte.length === 0) throw new Error("Keine Schweizer Städte vorhanden — bitte zuerst seeden.");

  const fremdeStaedte = await db.city.findMany({
    where: { countryId: { not: schweiz.id } },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  // Deterministische Zuordnung: n-te fremde Stadt → n-te Schweizer Stadt.
  const zuordnung = new Map(fremdeStaedte.map((stadt, i) => [stadt.id, chStaedte[i % chStaedte.length]]));

  let profileUmgezogen = 0;
  let tourenUmgezogen = 0;
  for (const [altId, neu] of zuordnung) {
    const pr = await db.profile.updateMany({ where: { cityId: altId }, data: { cityId: neu.id } });
    const to = await db.tour.updateMany({ where: { cityId: altId }, data: { cityId: neu.id } });
    profileUmgezogen += pr.count;
    tourenUmgezogen += to.count;
  }
  console.info(`  ✓ Umgezogen: ${profileUmgezogen} Profile, ${tourenUmgezogen} Touren`);

  // Agenturen führen Stadt und Land als Text, nicht als Relation.
  const agenturen = await db.agency.findMany({
    where: { countryCode: { not: "CH" } },
    select: { id: true, cityName: true },
  });
  for (const [i, agentur] of agenturen.entries()) {
    const ziel = chStaedte[i % chStaedte.length];
    await db.agency.update({
      where: { id: agentur.id },
      data: { countryCode: "CH", cityName: ziel.name },
    });
  }
  if (agenturen.length) console.info(`  ✓ ${agenturen.length} Agentur(en) auf Schweizer Standorte gesetzt`);

  // ── 4. Kontrolle vor dem Löschen ───────────────────────────────────────────
  const restProfile = await db.profile.count({ where: { city: { countryId: { not: schweiz.id } } } });
  const restTouren = await db.tour.count({ where: { city: { countryId: { not: schweiz.id } } } });
  if (restProfile || restTouren) {
    throw new Error(`Abbruch: es hängen noch ${restProfile} Profile und ${restTouren} Touren an Nicht-CH-Städten.`);
  }

  const geloescht = await db.country.deleteMany({ where: { code: { not: "CH" } } });
  console.info(`  ✓ ${geloescht.count} Land/Länder samt Städten entfernt`);

  const uebrig = await db.city.count();
  console.info(`\n✅ Fertig — ${uebrig} Schweizer Städte, alles in CHF.\n`);
}

main()
  .catch((error) => {
    console.error("❌", error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
