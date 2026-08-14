"use client";

import * as React from "react";
import Link from "next/link";
import { Calendar, Check, Clock, MapPin, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { updateBookingStatusAction } from "@/server/actions/interactions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BOOKING_STATUS_LABEL, PLACE_LABEL } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/utils";

type Booking = {
  id: string;
  startAt: string;
  minutes: number;
  place: string;
  address: string | null;
  note: string | null;
  price: number | null;
  currency: string;
  status: string;
  client: { id: string; displayName: string | null };
  profile: { displayName: string; slug: string };
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACCEPTED: "success",
  COMPLETED: "success",
  REQUESTED: "warning",
  DECLINED: "danger",
  CANCELLED: "neutral",
  NO_SHOW: "danger",
};

export function BookingRow({ booking, role }: { booking: Booking; role: "provider" | "client" }) {
  const [pending, startTransition] = React.useTransition();

  const setStatus = (status: string) =>
    startTransition(async () => {
      const res = await updateBookingStatusAction(booking.id, status);
      res.ok ? toast.success(res.message) : toast.error(res.message);
    });

  const isPast = new Date(booking.startAt).getTime() < Date.now();

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">
              {role === "provider" ? (booking.client.displayName ?? "Mitglied") : booking.profile.displayName}
            </p>
            <Badge size="sm" variant={STATUS_VARIANT[booking.status] ?? "neutral"}>
              {BOOKING_STATUS_LABEL[booking.status]}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-4" /> {formatDateTime(booking.startAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" /> {booking.minutes} Minuten
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> {PLACE_LABEL[booking.place]}
            </span>
            {booking.price && <span className="font-medium text-foreground">{formatPrice(booking.price, booking.currency)}</span>}
          </div>

          {booking.address && booking.status === "ACCEPTED" && (
            <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">📍 {booking.address}</p>
          )}
          {booking.note && (
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">„{booking.note}“</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {role === "provider" && booking.status === "REQUESTED" && (
            <>
              <Button size="sm" variant="success" onClick={() => setStatus("ACCEPTED")} loading={pending}>
                <Check className="size-4" /> Annehmen
              </Button>
              <Button size="sm" variant="outline" onClick={() => setStatus("DECLINED")} loading={pending}>
                <X className="size-4" /> Ablehnen
              </Button>
            </>
          )}
          {role === "provider" && booking.status === "ACCEPTED" && isPast && (
            <>
              <Button size="sm" variant="outline" onClick={() => setStatus("COMPLETED")} loading={pending}>
                Abgeschlossen
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setStatus("NO_SHOW")} loading={pending}>
                No-Show
              </Button>
            </>
          )}
          {role === "client" && ["REQUESTED", "ACCEPTED"].includes(booking.status) && (
            <Button size="sm" variant="outline" onClick={() => setStatus("CANCELLED")} loading={pending}>
              Stornieren
            </Button>
          )}
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard/nachrichten">
              <MessageCircle className="size-4" /> Chat
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
