import "server-only";

import { db } from "@/lib/db";

/** Auswahllisten für den Agentur-Editor. */
export async function agenturStammdaten() {
  const [cities, serviceCategories, languages] = await Promise.all([
    db.city.findMany({ select: { id: true, name: true, lat: true, lng: true }, orderBy: { name: "asc" }, take: 500 }),
    db.serviceCategory.findMany({
      // Persönliche Vorlieben gehören ins Inserat, nicht ins Haus.
      where: { scope: { in: ["BOTH", "AGENCY"] } },
      orderBy: { position: "asc" },
      select: { id: true, name: true, services: { orderBy: { position: "asc" }, select: { id: true, name: true } } },
    }),
    db.language.findMany({ orderBy: { name: "asc" }, select: { id: true, code: true, name: true } }),
  ]);
  return { cities, serviceCategories, languages };
}
