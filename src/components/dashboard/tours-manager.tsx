"use client";

import * as React from "react";
import { useActionState } from "react";
import { CalendarRange, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createTourAction, deleteTourAction } from "@/server/actions/profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { CityPicker, type StadtOption } from "@/components/map/city-picker";
import { EmptyState } from "@/components/dashboard/page-header";
import { formatDate } from "@/lib/utils";

type Tour = {
  id: string;
  from: string;
  to: string;
  note: string | null;
  city: { name: string };
};

export function ToursManager({
  tours,
  cities,
  profileId,
}: {
  tours: Tour[];
  cities: StadtOption[];
  /** Gesetzt, wenn eine Agentur den Tourplan eines Models pflegt. */
  profileId?: string;
}) {
  const [state, action, pending] = useActionState(createTourAction, {});
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Tour gespeichert");
      formRef.current?.reset();
    } else if (state.message) toast.error(state.message);
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="mb-4 text-base font-semibold">Neue Tour</h2>
        <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-4">
          {profileId && <input type="hidden" name="profileId" value={profileId} />}
          <Field label="Reiseziel" required className="sm:col-span-1">
            <CityPicker staedte={cities} required />
          </Field>
          <Field label="Von" required>
            <Input type="date" name="from" min={today} required />
          </Field>
          <Field label="Bis" required>
            <Input type="date" name="to" min={today} required />
          </Field>
          <Field label="Hinweis">
            <Input name="note" maxLength={120} placeholder="z. B. Hotelbesuche" />
          </Field>
          <div className="sm:col-span-4">
            <Button type="submit" variant="brand" loading={pending}>
              <Plus className="size-4" /> Tour hinzufügen
            </Button>
          </div>
        </form>
      </Card>

      {tours.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="Keine Touren geplant"
          description="Trage Reisen ein, damit du in der Zielstadt gefunden wirst."
        />
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => (
            <Card key={tour.id} className="flex items-center gap-4 p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{tour.city.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tour.from)} – {formatDate(tour.to)}
                  {tour.note ? ` · ${tour.note}` : ""}
                </p>
              </div>
              <form action={deleteTourAction.bind(null, tour.id)}>
                {profileId && <input type="hidden" name="profileId" value={profileId} />}
                <Button type="submit" size="icon-sm" variant="ghost" aria-label="Tour löschen">
                  <Trash2 className="size-4 text-danger" />
                </Button>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
