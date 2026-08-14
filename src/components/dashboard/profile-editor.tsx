"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Building2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateAppearanceAction,
  updateBasicsAction,
  updateContactAction,
  updateLanguagesAction,
  updateLocationAction,
  updatePricingAction,
  updateSeoAction,
  updateServicesAction,
} from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FlagAvatar } from "@/components/ui/flag-avatar";
import { LocationPicker } from "@/components/map/location-picker";
import { Checkbox, Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import {
  BODY_LABEL,
  BREAST_LABEL,
  CUP_SIZES,
  DRESS_SIZES,
  DURATIONS,
  ETHNICITY_LABEL,
  EYE_LABEL,
  GENDER_LABEL,
  HAIR_LABEL,
  HAIR_LENGTH_LABEL,
  KIND_LABEL,
  PROFILE_KIND_LABEL,
  ORIENTATION_LABEL,
  PLACE_LABEL,
  PUBIC_LABEL,
  SHOE_SIZES,
  SMOKER_LABEL,
} from "@/lib/constants";
import type { ActionState } from "@/server/action-utils";

type Rate = { id: string; minutes: number; price: number; place: string };
type ProfileData = {
  [key: string]: unknown;
  rates: Rate[];
  services: { serviceId: string; extraCost: number | null }[];
  languages: { languageId: string; level: number }[];
};

/**
 * Ziel-Inserat für alle Formulare dieses Editors.
 *
 * Leer, wenn jemand das eigene Inserat bearbeitet — dann verhalten sich die
 * Aktionen wie bisher. Gesetzt, wenn eine Agentur das Inserat eines Models
 * pflegt; das versteckte Feld reist dann in jedem Formular mit.
 */
const ZielProfil = React.createContext<string | undefined>(undefined);

function ZielProfilFeld() {
  const profileId = React.useContext(ZielProfil);
  return profileId ? <input type="hidden" name="profileId" value={profileId} /> : null;
}

type Props = {
  profile: ProfileData;
  cities: { id: string; name: string }[];
  serviceCategories: {
    id: string;
    name: string;
    services: { id: string; name: string }[];
  }[];
  languages: { id: string; name: string; code: string; flag: string | null }[];
  /** Gesetzt, wenn eine Agentur das Inserat eines Models bearbeitet. */
  profileId?: string;
  /**
   * Standort des Hauses. Models arbeiten in der Regel dort — deshalb ist er
   * bei einem noch leeren Inserat voreingestellt und lässt sich jederzeit
   * per Knopf übernehmen.
   */
  hausStandort?: HausStandort | null;
};

export type HausStandort = {
  cityId: string | null;
  cityName: string | null;
  district: string | null;
  street: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
};

const TABS = [
  { value: "basis", label: "Grunddaten" },
  { value: "aussehen", label: "Aussehen" },
  { value: "standort", label: "Standort" },
  { value: "preise", label: "Preise" },
  { value: "services", label: "Services & Sprachen" },
  { value: "kontakt", label: "Kontakt & SEO" },
];

export function ProfileEditor({
  profile,
  cities,
  serviceCategories,
  languages,
  profileId,
  hausStandort,
}: Props) {
  // Die Checkliste auf dem Dashboard verlinkt gezielt auf einzelne Tabs
  // (…/profil?tab=preise). Ohne das hier landete man immer auf "Grunddaten".
  const searchParams = useSearchParams();
  const wunschTab = searchParams.get("tab");
  const startTab = TABS.some((t) => t.value === wunschTab) ? wunschTab! : "basis";

  /**
   * Prisma aktualisiert `updatedAt` bei jedem Schreibvorgang. Der Wert dient als
   * Version: ändert er sich, sind frische Serverdaten da und die Formularfelder
   * werden neu aufgebaut (`key`), damit sie den gespeicherten Stand zeigen —
   * inklusive der Werte, die der Server selbst berechnet oder normalisiert hat.
   */
  const version = String(profile.updatedAt ?? "");

  return (
    <ZielProfil.Provider value={profileId}>
      <Tabs defaultValue={startTab}>
        <div className="no-scrollbar -mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="basis">
          <BasicsForm profile={profile} version={version} />
        </TabsContent>
        <TabsContent value="aussehen">
          <AppearanceForm profile={profile} version={version} />
        </TabsContent>
        <TabsContent value="standort">
          <LocationForm profile={profile} cities={cities} version={version} hausStandort={hausStandort} />
        </TabsContent>
        <TabsContent value="preise">
          <PricingForm profile={profile} version={version} />
        </TabsContent>
        <TabsContent value="services">
          <ServicesForm
            profile={profile}
            serviceCategories={serviceCategories}
            languages={languages}
            version={version}
          />
        </TabsContent>
        <TabsContent value="kontakt">
          <ContactForm profile={profile} version={version} />
        </TabsContent>
      </Tabs>
    </ZielProfil.Provider>
  );
}

function useFormAction(action: (prev: ActionState, fd: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState(action, {});
  React.useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);
  return { state, dispatch, pending };
}

function SaveBar({ pending }: { pending: boolean }) {
  return (
    <div className="flex justify-end border-t border-border pt-5">
      <Button type="submit" variant="brand" loading={pending}>
        <Save className="size-4" /> Speichern
      </Button>
    </div>
  );
}

function str(v: unknown) {
  return typeof v === "string" ? v : "";
}
function numv(v: unknown) {
  return typeof v === "number" ? String(v) : "";
}
function dateStr(v: unknown) {
  return typeof v === "string" ? v.slice(0, 10) : "";
}

// ── Grunddaten ───────────────────────────────────────────────────────────────

function BasicsForm({ profile, version }: { profile: ProfileData; version: string }) {
  const { state, dispatch, pending } = useFormAction(updateBasicsAction);

  return (
    <Card className="p-6">
      <form key={version} action={dispatch} className="space-y-5">
        <ZielProfilFeld />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Anzeigename" required error={state.errors?.displayName?.[0]}>
            <Input name="displayName" defaultValue={str(profile.displayName)} required maxLength={40} />
          </Field>
          <Field label="Slogan / Headline" hint="Erscheint direkt unter deinem Namen.">
            <Input name="headline" defaultValue={str(profile.headline)} maxLength={90} />
          </Field>
        </div>

        <Field label="Über mich" required hint="Mindestens 50 Zeichen. Erzähl, was dich ausmacht.">
          <Textarea name="about" defaultValue={str(profile.about)} rows={8} maxLength={5000} />
        </Field>

        <Field label="Über mich (English)" hint="Optional — verbessert internationale Sichtbarkeit.">
          <Textarea name="aboutEn" defaultValue={str(profile.aboutEn)} rows={4} maxLength={5000} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Geschlecht" required>
            <Select name="gender" defaultValue={str(profile.gender)}>
              {Object.entries(GENDER_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Kategorie" required>
            <Select name="kind" defaultValue={str(profile.kind)}>
              {Object.entries(PROFILE_KIND_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
              {/* Bestandswert erhalten: Profile aus der Zeit, in der Haus-
                  Kategorien wählbar waren, sollen beim Speichern nicht
                  stillschweigend umgeschrieben werden. */}
              {!PROFILE_KIND_LABEL[str(profile.kind)] && str(profile.kind) && (
                <option value={str(profile.kind)}>
                  {KIND_LABEL[str(profile.kind)] ?? str(profile.kind)}
                </option>
              )}
            </Select>
          </Field>
          <Field label="Orientierung">
            <Select name="orientation" defaultValue={str(profile.orientation)}>
              <option value="">Keine Angabe</option>
              {Object.entries(ORIENTATION_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field
            label="Geburtsdatum"
            hint="Wird nie öffentlich gezeigt."
            error={state.errors?.birthDate?.[0]}
          >
            <Input type="date" name="birthDate" defaultValue={dateStr(profile.birthDate)} />
          </Field>
          <Field label="Angezeigtes Alter" hint="Optional abweichend.">
            <Input
              type="number"
              name="displayAge"
              min={18}
              max={99}
              defaultValue={numv(profile.displayAge)}
            />
          </Field>
          <Field label="Nationalität">
            <Input name="nationality" defaultValue={str(profile.nationality)} maxLength={60} />
          </Field>
        </div>

        <SaveBar pending={pending} />
      </form>
    </Card>
  );
}

// ── Aussehen ─────────────────────────────────────────────────────────────────

function AppearanceForm({ profile, version }: { profile: ProfileData; version: string }) {
  const { dispatch, pending } = useFormAction(updateAppearanceAction);

  const selects: [string, string, Record<string, string>][] = [
    ["bodyType", "Figur", BODY_LABEL],
    ["hairColor", "Haarfarbe", HAIR_LABEL],
    ["hairLength", "Haarlänge", HAIR_LENGTH_LABEL],
    ["eyeColor", "Augenfarbe", EYE_LABEL],
    ["ethnicity", "Herkunft", ETHNICITY_LABEL],
    ["pubicHair", "Intimbereich", PUBIC_LABEL],
    ["breastType", "Oberweite", BREAST_LABEL],
    ["smoker", "Raucher:in", SMOKER_LABEL],
  ];

  return (
    <Card className="p-6">
      <form key={version} action={dispatch} className="space-y-5">
        <ZielProfilFeld />
        <div className="grid gap-5 sm:grid-cols-4">
          <Field label="Grösse (cm)">
            <Input type="number" name="heightCm" min={120} max={230} defaultValue={numv(profile.heightCm)} />
          </Field>
          <Field label="Gewicht (kg)">
            <Input type="number" name="weightKg" min={35} max={250} defaultValue={numv(profile.weightKg)} />
          </Field>
          <Field label="Körbchengrösse">
            <Select name="cupSize" defaultValue={str(profile.cupSize)}>
              <option value="">—</option>
              {CUP_SIZES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Konfektion">
            <Select name="dressSize" defaultValue={str(profile.dressSize)}>
              <option value="">—</option>
              {DRESS_SIZES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-4">
          {selects.map(([name, label, dict]) => (
            <Field key={name} label={label}>
              <Select name={name} defaultValue={str(profile[name])}>
                <option value="">—</option>
                {Object.entries(dict).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Schuhgrösse">
            <Select name="shoeSize" defaultValue={str(profile.shoeSize)}>
              <option value="">—</option>
              {SHOE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </Field>
          {/* `self-end` setzt die Schalter auf die Grundlinie des Auswahlfelds,
              das durch sein Label weiter unten beginnt; `h-11` gleicht die Höhe an. */}
          <label className="flex h-11 items-center justify-between self-end rounded-xl border border-border px-4 text-sm">
            Tattoos
            <Switch name="tattoos" defaultChecked={Boolean(profile.tattoos)} />
          </label>
          <label className="flex h-11 items-center justify-between self-end rounded-xl border border-border px-4 text-sm">
            Piercings
            <Switch name="piercings" defaultChecked={Boolean(profile.piercings)} />
          </label>
        </div>

        <SaveBar pending={pending} />
      </form>
    </Card>
  );
}

// ── Standort ─────────────────────────────────────────────────────────────────

function LocationForm({
  profile,
  cities,
  version,
  hausStandort,
}: {
  profile: ProfileData;
  cities: { id: string; name: string }[];
  version: string;
  hausStandort?: HausStandort | null;
}) {
  const { dispatch, pending } = useFormAction(updateLocationAction);

  /**
   * Hat dieses Inserat eine eigene Adresse? Die Stadt allein zählt nicht: Sie
   * wird beim Anlegen ohnehin vom Haus geerbt. Ohne Strasse, PLZ und Punkt
   * auf der Karte gibt es also noch keinen eigenen Standort — dann ist der
   * des Hauses die richtige Vorbelegung, denn dort arbeitet das Model.
   */
  const ohneEigenen = profile.lat == null && !str(profile.street) && !str(profile.zip);
  const start = ohneEigenen && hausStandort ? hausStandort : profile;

  // Die Karte darf PLZ, Ort und Strasse befüllen — deshalb sind diese drei
  // Felder hier gesteuert statt frei laufend.
  const [zip, setZip] = React.useState(str(start.zip));
  const [street, setStreet] = React.useState(str(start.street));
  const [district, setDistrict] = React.useState(str(start.district));
  const [cityId, setCityId] = React.useState(str(start.cityId));

  // Punkt und Neuaufbau-Schlüssel der Karte: „Standort übernehmen“ muss auch
  // den Marker versetzen, und der lebt in der Karte selbst.
  const [punkt, setPunkt] = React.useState<{ lat: number | null; lng: number | null }>({
    lat: (start.lat as number | null) ?? null,
    lng: (start.lng as number | null) ?? null,
  });
  const [kartenSchluessel, setKartenSchluessel] = React.useState(0);

  React.useEffect(() => {
    setZip(str(start.zip));
    setStreet(str(start.street));
    setDistrict(str(start.district));
    setCityId(str(start.cityId));
    setPunkt({ lat: (start.lat as number | null) ?? null, lng: (start.lng as number | null) ?? null });
    setKartenSchluessel((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const hausUebernehmen = () => {
    if (!hausStandort) return;
    setZip(str(hausStandort.zip));
    setStreet(str(hausStandort.street));
    setDistrict(str(hausStandort.district));
    setCityId(str(hausStandort.cityId));
    setPunkt({ lat: hausStandort.lat, lng: hausStandort.lng });
    setKartenSchluessel((k) => k + 1);
  };

  const hausAdresse = hausStandort
    ? [hausStandort.street, [hausStandort.zip, hausStandort.cityName].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : "";

  const adresseUebernehmen = React.useCallback(
    (adresse: { stadt?: string; plz?: string; strasse?: string; stadtteil?: string }) => {
      if (adresse.plz) setZip(adresse.plz);
      if (adresse.strasse) setStreet(adresse.strasse);
      if (adresse.stadtteil) setDistrict(adresse.stadtteil);
      // Ortsname auf eine bekannte Stadt abbilden, sonst bleibt die Auswahl.
      if (adresse.stadt) {
        const treffer = cities.find((c) => c.name.toLowerCase() === adresse.stadt!.toLowerCase());
        if (treffer) setCityId(treffer.id);
      }
    },
    [cities],
  );

  return (
    <Card className="p-6">
      <form key={version} action={dispatch} className="space-y-5">
        <ZielProfilFeld />

        {hausStandort && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <p className="min-w-0 text-sm">
              <span className="block font-medium">Standort des Hauses</span>
              <span className="text-muted-foreground">
                {hausAdresse || "noch nicht gesetzt"}
                {ohneEigenen && hausAdresse ? " — bereits übernommen, Speichern genügt." : ""}
              </span>
            </p>
            <Button type="button" variant="outline" size="sm" onClick={hausUebernehmen}>
              <Building2 className="size-4" /> Standort übernehmen
            </Button>
          </div>
        )}

        <Field
          label="Auf der Karte"
          hint="Suche deine Adresse oder ziehe den Marker. Die Felder darunter füllen sich automatisch."
        >
          <LocationPicker
            key={kartenSchluessel}
            start={{
              lat: punkt.lat,
              lng: punkt.lng,
              radiusKm: (profile.radiusKm as number | null) ?? 25,
              label: [street, [zip, cities.find((c) => c.id === cityId)?.name].filter(Boolean).join(" ")]
                .filter(Boolean)
                .join(", "),
            }}
            onAdresse={adresseUebernehmen}
            hinweis="Solange „Adresse öffentlich anzeigen“ aus ist, wird deine Position auf der öffentlichen Karte nur auf rund 500 m genau gezeigt — gefunden wirst du trotzdem."
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
          <Field label="Stadtteil">
            <Input
              name="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              maxLength={60}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="PLZ">
            <Input name="zip" value={zip} onChange={(e) => setZip(e.target.value)} maxLength={10} />
          </Field>
          <Field label="Strasse" hint="Nur sichtbar, wenn du es unten freigibst.">
            <Input name="street" value={street} onChange={(e) => setStreet(e.target.value)} maxLength={120} />
          </Field>
        </div>

        <Field label="Treffpunkt" required>
          <Select name="meetingPlace" defaultValue={str(profile.meetingPlace) || "BOTH"}>
            {Object.entries(PLACE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              name: "showAddress",
              label: "Adresse öffentlich anzeigen",
              value: profile.showAddress,
            },
            {
              name: "travelsWorldwide",
              label: "Weltweit buchbar",
              value: profile.travelsWorldwide,
            },
            {
              name: "hasCar",
              label: "Eigenes Auto vorhanden",
              value: profile.hasCar,
            },
            {
              name: "acceptsCouples",
              label: "Paare willkommen",
              value: profile.acceptsCouples,
            },
          ].map((item) => (
            <label
              key={item.name}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              {item.label}
              <Switch name={item.name} defaultChecked={Boolean(item.value)} />
            </label>
          ))}
        </div>

        <SaveBar pending={pending} />
      </form>
    </Card>
  );
}

// ── Preise ───────────────────────────────────────────────────────────────────

function PricingForm({ profile, version }: { profile: ProfileData; version: string }) {
  const { dispatch, pending } = useFormAction(updatePricingAction);

  const ratesFromServer = React.useCallback(
    () =>
      profile.rates.length
        ? profile.rates.map((r) => ({
            minutes: r.minutes,
            price: r.price,
            place: r.place,
          }))
        : [{ minutes: 60, price: 0, place: "BOTH" }],
    [profile.rates],
  );

  const [rates, setRates] = React.useState(ratesFromServer);

  // Der Server verwirft Zeilen ohne Preis — nach dem Speichern den echten Stand zeigen.
  React.useEffect(() => {
    setRates(ratesFromServer());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <Card className="p-6">
      <form key={version} action={dispatch} className="space-y-6">
        <ZielProfilFeld />
        <div className="grid gap-5 sm:grid-cols-5">
          <Field label="Währung" hint="Wir starten in der Schweiz.">
            <Select name="currency" defaultValue="CHF" disabled>
              <option value="CHF">CHF Fr.</option>
            </Select>
            <input type="hidden" name="currency" value="CHF" />
          </Field>
          <Field label="30 Minuten">
            <Input type="number" name="priceHalfHour" min={0} defaultValue={numv(profile.priceHalfHour)} />
          </Field>
          <Field label="1 Stunde">
            <Input type="number" name="priceHour" min={0} defaultValue={numv(profile.priceHour)} />
          </Field>
          <Field label="2 Stunden">
            <Input type="number" name="priceTwoHours" min={0} defaultValue={numv(profile.priceTwoHours)} />
          </Field>
          <Field label="Übernachtung">
            <Input type="number" name="priceNight" min={0} defaultValue={numv(profile.priceNight)} />
          </Field>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium">Weitere Preisstaffeln</p>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setRates((r) => [...r, { minutes: 90, price: 0, place: "BOTH" }])}
            >
              <Plus className="size-3.5" /> Zeile
            </Button>
          </div>

          <div className="space-y-2">
            {rates.map((rate, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    name="rateMinutes"
                    value={rate.minutes}
                    onChange={(e) =>
                      setRates((r) =>
                        r.map((x, j) => (j === i ? { ...x, minutes: Number(e.target.value) } : x)),
                      )
                    }
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.minutes} value={d.minutes}>
                        {d.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    name="ratePrice"
                    min={0}
                    value={rate.price}
                    onChange={(e) =>
                      setRates((r) =>
                        r.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)),
                      )
                    }
                  />
                </div>
                <div className="w-40">
                  <Select
                    name="ratePlace"
                    value={rate.place}
                    onChange={(e) =>
                      setRates((r) => r.map((x, j) => (j === i ? { ...x, place: e.target.value } : x)))
                    }
                  >
                    {Object.entries(PLACE_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRates((r) => r.filter((_, j) => j !== i))}
                  aria-label="Zeile entfernen"
                >
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Field label="Hinweise zu Preisen" hint="z. B. Anfahrt, Mindestbuchung, Zahlungsarten.">
          <Textarea name="priceNote" defaultValue={str(profile.priceNote)} rows={4} maxLength={1000} />
        </Field>

        <SaveBar pending={pending} />
      </form>
    </Card>
  );
}

// ── Services & Sprachen ──────────────────────────────────────────────────────

function ServicesForm({
  profile,
  serviceCategories,
  languages,
  version,
}: {
  profile: ProfileData;
  serviceCategories: Props["serviceCategories"];
  languages: Props["languages"];
  version: string;
}) {
  const servicesAction = useFormAction(updateServicesAction);
  const languagesAction = useFormAction(updateLanguagesAction);

  const selectedServices = new Set(profile.services.map((s) => s.serviceId));
  const selectedLanguages = new Map(profile.languages.map((l) => [l.languageId, l.level]));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form key={version} action={servicesAction.dispatch} className="space-y-6">
          <ZielProfilFeld />
          <div>
            <h2 className="text-base font-semibold">Services</h2>
            <p className="text-sm text-muted-foreground">
              Wähle aus, was du anbietest. Optional kannst du Aufpreise hinterlegen.
            </p>
          </div>

          {serviceCategories.map((category) => (
            <div key={category.id}>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category.name}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service) => (
                  <ServiceRow
                    key={service.id}
                    service={service}
                    defaultChecked={selectedServices.has(service.id)}
                    defaultExtra={profile.services.find((s) => s.serviceId === service.id)?.extraCost ?? null}
                  />
                ))}
              </div>
            </div>
          ))}

          <SaveBar pending={servicesAction.pending} />
        </form>
      </Card>

      <Card className="p-6">
        <form key={version} action={languagesAction.dispatch} className="space-y-5">
          <ZielProfilFeld />
          <div>
            <h2 className="text-base font-semibold">Sprachen</h2>
            <p className="text-sm text-muted-foreground">Level 1 = Grundkenntnisse, 5 = Muttersprache.</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {languages.map((language) => (
              <LanguageRow
                key={language.id}
                language={language}
                defaultChecked={selectedLanguages.has(language.id)}
                defaultLevel={selectedLanguages.get(language.id) ?? 3}
              />
            ))}
          </div>

          <SaveBar pending={languagesAction.pending} />
        </form>
      </Card>
    </div>
  );
}

function ServiceRow({
  service,
  defaultChecked,
  defaultExtra,
}: {
  service: { id: string; name: string };
  defaultChecked: boolean;
  defaultExtra: number | null;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
      <Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
      {checked && <input type="hidden" name="serviceId" value={service.id} />}
      <span className="flex-1 truncate text-sm">{service.name}</span>
      {checked && (
        <input
          type="number"
          name={`extra_${service.id}`}
          defaultValue={defaultExtra ?? ""}
          placeholder="+CHF"
          min={0}
          className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-right text-xs outline-none"
        />
      )}
    </div>
  );
}

function LanguageRow({
  language,
  defaultChecked,
  defaultLevel,
}: {
  language: { id: string; name: string; code: string; flag: string | null };
  defaultChecked: boolean;
  defaultLevel: number;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
      <Checkbox checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
      {checked && <input type="hidden" name="languageId" value={language.id} />}
      <FlagAvatar flag={language.flag} code={language.code} label={language.name} size="md" />
      <span className="flex-1 truncate text-sm">{language.name}</span>
      {checked && (
        <Select
          name={`level_${language.id}`}
          defaultValue={String(defaultLevel)}
          className="h-8 w-auto gap-1 rounded-lg px-2 text-xs"
          contentClassName="min-w-20"
        >
          {[1, 2, 3, 4, 5].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}

// ── Kontakt & SEO ────────────────────────────────────────────────────────────

function ContactForm({ profile, version }: { profile: ProfileData; version: string }) {
  const contact = useFormAction(updateContactAction);
  const seo = useFormAction(updateSeoAction);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form key={version} action={contact.dispatch} className="space-y-5">
          <ZielProfilFeld />
          <h2 className="text-base font-semibold">Kontaktdaten</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Telefon">
              <Input name="phone" type="tel" defaultValue={str(profile.phone)} maxLength={30} />
            </Field>
            <label className="flex items-center justify-between self-end rounded-xl border border-border px-4 py-3 text-sm">
              Telefonnummer öffentlich zeigen
              <Switch name="showPhone" defaultChecked={profile.showPhone !== false} />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp">
              <Input name="whatsapp" defaultValue={str(profile.whatsapp)} placeholder="+41…" />
            </Field>
            <Field label="Telegram">
              <Input name="telegram" defaultValue={str(profile.telegram)} placeholder="@username" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Website">
              <Input name="website" defaultValue={str(profile.website)} placeholder="https://" />
            </Field>
            <Field label="Instagram">
              <Input name="instagram" defaultValue={str(profile.instagram)} placeholder="@handle" />
            </Field>
            <Field label="OnlyFans / Fansly">
              <Input name="onlyfans" defaultValue={str(profile.onlyfans)} />
            </Field>
          </div>

          <Field label="Kontakthinweis" hint="z. B. Erreichbarkeit, bevorzugter Kanal, Vorlaufzeit.">
            <Textarea name="contactNote" defaultValue={str(profile.contactNote)} rows={3} maxLength={300} />
          </Field>

          <SaveBar pending={contact.pending} />
        </form>
      </Card>

      <Card className="p-6">
        <form key={version} action={seo.dispatch} className="space-y-5">
          <ZielProfilFeld />
          <div>
            <h2 className="text-base font-semibold">Suchmaschinen-Optimierung</h2>
            <p className="text-sm text-muted-foreground">
              Optional — wenn leer, generieren wir Titel und Beschreibung automatisch.
            </p>
          </div>

          <Field label="Meta-Titel" hint="Max. 60 Zeichen.">
            <Input name="metaTitle" defaultValue={str(profile.metaTitle)} maxLength={60} />
          </Field>
          <Field label="Meta-Beschreibung" hint="Max. 160 Zeichen.">
            <Textarea
              name="metaDescription"
              defaultValue={str(profile.metaDescription)}
              rows={3}
              maxLength={160}
            />
          </Field>

          <SaveBar pending={seo.pending} />
        </form>
      </Card>
    </div>
  );
}
