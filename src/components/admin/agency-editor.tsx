"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAgencyAction } from "@/server/actions/admin";
import { LocationPicker } from "@/components/map/location-picker";
import { ImageUploadField } from "@/components/dashboard/image-upload";
import { AgencyHoursEditor } from "@/components/dashboard/agency-hours-editor";
import { AgencyOfferPicker } from "@/components/dashboard/agency-offer-picker";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { AGENCY_AMENITIES, AGENCY_KIND_LABEL } from "@/lib/constants";
import type { ActionState } from "@/server/action-utils";

export type AgencyFormData = {
  id?: string;
  slug: string;
  name: string;
  kind: string;
  headline: string | null;
  about: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  street: string | null;
  zip: string | null;
  district: string | null;
  cityId: string | null;
  lat: number | null;
  lng: number | null;
  priceFrom: number | null;
  isOpen24h: boolean;
  hasParking: boolean;
  hasBar: boolean;
  acceptsCards: boolean;
  barrierFree: boolean;
  isVerified: boolean;
  isPublished: boolean;
  serviceIds: string[];
  languageIds: string[];
  hours: { weekday: number; opensAt: string | null; closesAt: string | null; closed: boolean }[];
};

const TABS = [
  { value: "stammdaten", label: "Stammdaten" },
  { value: "standort", label: "Standort" },
  { value: "zeiten", label: "Öffnungszeiten" },
  { value: "angebot", label: "Angebot" },
];

const str = (v: unknown) => (v == null ? "" : String(v));

/**
 * Editor für ein Haus — im Admin und im Dashboard derselbe.
 *
 * Der Unterschied liegt in `variant`: Betreiberinnen sehen weder das
 * Geprüft-Siegel (das vergibt die Moderation) noch die Löschfunktion, und
 * `MANAGER`/`STAFF` bekommen nur, was ihre Rolle hergibt.
 */
export function AgencyEditor({
  agency,
  cities,
  serviceCategories,
  languages,
  action,
  variant = "admin",
  nurLesen = false,
  version,
}: {
  agency: AgencyFormData;
  cities: { id: string; name: string; lat: number | null; lng: number | null }[];
  serviceCategories: { id: string; name: string; services: { id: string; name: string }[] }[];
  languages: { id: string; code: string; name: string }[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  variant?: "admin" | "betreiber";
  nurLesen?: boolean;
  /**
   * Ändert sich mit jedem gespeicherten Stand (`updatedAt`) und dient als
   * `key` des Formulars.
   *
   * React 19 setzt ein Formular nach einer Server Action automatisch zurück —
   * und zwar auf die `defaultValue`/`defaultChecked` vom Zeitpunkt des
   * Aufbaus. Der Schalter „Veröffentlicht“ sprang dadurch nach dem Speichern
   * auf seinen alten Wert zurück, obwohl korrekt gespeichert wurde. Mit einem
   * neuen `key` wird das Formular mit den frischen Werten neu aufgebaut.
   */
  version?: string;
}) {
  const router = useRouter();
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(action, {});
  const [tab, setTab] = React.useState(TABS[0].value);
  const [loescht, setLoescht] = React.useState(false);

  // Diese drei Felder darf die Karte befüllen.
  const [logoUrl, setLogoUrl] = React.useState<string | null>(agency.logoUrl);
  const [coverUrl, setCoverUrl] = React.useState<string | null>(agency.coverUrl);

  const [zip, setZip] = React.useState(str(agency.zip));
  const [street, setStreet] = React.useState(str(agency.street));
  const [district, setDistrict] = React.useState(str(agency.district));
  const [cityId, setCityId] = React.useState(str(agency.cityId));

  // Nach dem Speichern die gesteuerten Felder auf das übernehmen, was der
  // Server tatsächlich gespeichert hat.
  React.useEffect(() => {
    setLogoUrl(agency.logoUrl);
    setCoverUrl(agency.coverUrl);
    setZip(str(agency.zip));
    setStreet(str(agency.street));
    setDistrict(str(agency.district));
    setCityId(str(agency.cityId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  React.useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      toast.success(state.message);
      const neu = state.data as { id?: string } | undefined;
      // Nach dem Anlegen auf die Bearbeitungsseite wechseln.
      if (!agency.id && neu?.id) router.replace(`/admin/agenturen/${neu.id}`);
      else router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, agency.id, router]);

  const loeschen = async () => {
    if (!agency.id || !confirm(`„${agency.name}“ wirklich löschen? Zugeordnete Profile bleiben bestehen.`)) return;
    setLoescht(true);
    const res = await deleteAgencyAction(agency.id);
    if (res.ok) {
      toast.success(res.message ?? "Gelöscht.");
      router.push("/admin/agenturen");
    } else {
      toast.error(res.message ?? "Fehlgeschlagen.");
      setLoescht(false);
    }
  };

  const istAdmin = variant === "admin";

  return (
    <form
      key={version}
      action={dispatch}
      className={nurLesen ? "pointer-events-none opacity-60" : undefined}
    >
      {agency.id && <input type="hidden" name="id" value={agency.id} />}

      {/*
        `forceMount` an jedem Tab-Inhalt: Radix hängt inaktive Tabs sonst aus
        dem DOM aus. Da alle vier Tabs in *einem* Formular liegen, fehlten die
        Felder der gerade nicht sichtbaren Tabs beim Absenden — Speichern aus
        „Stammdaten“ löschte dadurch Services und Sprachen, und Speichern aus
        einem anderen Tab scheiterte an fehlendem Namen und Slug.
        Ausgeblendet wird weiterhin von Radix per `hidden`; versteckte Felder
        werden trotzdem übermittelt.
      */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Stammdaten ──────────────────────────────────────────────────── */}
        <TabsContent value="stammdaten" forceMount>
          <Card className="space-y-5 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" required error={state.errors?.name?.[0]}>
                <Input name="name" defaultValue={agency.name} required maxLength={120} />
              </Field>
              <Field label="Adresse (Slug)" required hint="/agenturen/…" error={state.errors?.slug?.[0]}>
                <Input name="slug" defaultValue={agency.slug} required maxLength={80} pattern="[a-z0-9-]+" />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Art des Hauses" required>
                <Select name="kind" defaultValue={agency.kind || "AGENCY"}>
                  {Object.entries(AGENCY_KIND_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ab-Preis / Eintritt (CHF)" hint="Leer lassen, wenn kein Fixpreis gilt.">
                <Input type="number" name="priceFrom" min={0} defaultValue={str(agency.priceFrom)} />
              </Field>
            </div>

            <Field label="Kurzbeschreibung" hint="Eine Zeile für die Trefferliste.">
              <Input name="headline" defaultValue={str(agency.headline)} maxLength={160} />
            </Field>

            <Field label="Über uns">
              <Textarea name="about" defaultValue={str(agency.about)} rows={6} maxLength={5000} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Telefon">
                <Input name="phone" defaultValue={str(agency.phone)} placeholder="+41 …" />
              </Field>
              <Field label="WhatsApp">
                <Input name="whatsapp" defaultValue={str(agency.whatsapp)} placeholder="+41 …" />
              </Field>
              <Field label="E-Mail">
                <Input type="email" name="email" defaultValue={str(agency.email)} />
              </Field>
              <Field label="Website">
                <Input name="website" defaultValue={str(agency.website)} placeholder="https://…" />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
              <ImageUploadField
                label="Logo"
                hint="Quadratisch, mindestens 200 × 200 px."
                name="logoUrl"
                wert={logoUrl}
                onChange={setLogoUrl}
                format="quadratisch"
                error={state.errors?.logoUrl?.[0]}
              />
              <ImageUploadField
                label="Titelbild"
                hint="Breitformat, mindestens 1600 × 900 px — steht oben auf deiner Seite."
                name="coverUrl"
                wert={coverUrl}
                onChange={setCoverUrl}
                format="breit"
                error={state.errors?.coverUrl?.[0]}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                <span>
                  Veröffentlicht
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Aus bedeutet: nicht in der Suche sichtbar.
                  </span>
                </span>
                <Switch name="isPublished" defaultChecked={agency.isPublished} />
              </label>

              {istAdmin ? (
                <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm">
                  Geprüft-Siegel
                  <Switch name="isVerified" defaultChecked={agency.isVerified} />
                </label>
              ) : (
                <div className="rounded-xl border border-border px-4 py-3 text-sm">
                  Geprüft-Siegel
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {agency.isVerified
                      ? "Dein Haus ist geprüft."
                      : "Wird von der Moderation vergeben — schreib uns, wenn du geprüft werden möchtest."}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ── Standort ────────────────────────────────────────────────────── */}
        <TabsContent value="standort" forceMount>
          <Card className="space-y-5 p-6">
            <Field label="Auf der Karte" hint="Adresse suchen oder Marker ziehen — die Felder füllen sich selbst.">
              <LocationPicker
                karteAktiv={tab === "standort"}
                start={{
                  lat: agency.lat,
                  lng: agency.lng,
                  label: [agency.street, [agency.zip, cities.find((c) => c.id === agency.cityId)?.name]
                    .filter(Boolean)
                    .join(" ")]
                    .filter(Boolean)
                    .join(", "),
                }}
                mitRadius={false}
                onAdresse={(adresse) => {
                  if (adresse.plz) setZip(adresse.plz);
                  if (adresse.strasse) setStreet(adresse.strasse);
                  if (adresse.stadtteil) setDistrict(adresse.stadtteil);
                  if (adresse.stadt) {
                    const treffer = cities.find((c) => c.name.toLowerCase() === adresse.stadt!.toLowerCase());
                    if (treffer) setCityId(treffer.id);
                  }
                }}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Stadt" required>
                <Select name="cityId" value={cityId} onValueChange={setCityId}>
                  <option value="">Bitte wählen</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Quartier">
                <Input
                  name="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  maxLength={60}
                />
              </Field>
              <Field label="Strasse">
                <Input name="street" value={street} onChange={(e) => setStreet(e.target.value)} maxLength={120} />
              </Field>
              <Field label="PLZ">
                <Input name="zip" value={zip} onChange={(e) => setZip(e.target.value)} maxLength={10} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {AGENCY_AMENITIES.filter((a) => a.key !== "isOpen24h").map((a) => (
                <label
                  key={a.key}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
                >
                  {a.label}
                  <Switch name={a.key} defaultChecked={Boolean(agency[a.key as keyof AgencyFormData])} />
                </label>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ── Öffnungszeiten ──────────────────────────────────────────────── */}
        <TabsContent value="zeiten" forceMount>
          <Card className="p-6">
            <AgencyHoursEditor stunden={agency.hours} isOpen24h={agency.isOpen24h} />
          </Card>
        </TabsContent>

        {/* ── Angebot ─────────────────────────────────────────────────────── */}
        <TabsContent value="angebot" forceMount>
          <Card className="p-6">
            <AgencyOfferPicker
              kategorien={serviceCategories}
              sprachen={languages}
              gewaehlteServices={agency.serviceIds}
              gewaehlteSprachen={agency.languageIds}
            />
          </Card>
        </TabsContent>

      </Tabs>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button type="submit" variant="brand" loading={pending} disabled={nurLesen}>
          {!pending && <Save className="size-4" />} {agency.id ? "Speichern" : "Anlegen"}
        </Button>

        {istAdmin && agency.id && (
          <Button type="button" variant="ghost" onClick={loeschen} disabled={loescht}>
            {loescht ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Löschen
          </Button>
        )}
      </div>
    </form>
  );
}
