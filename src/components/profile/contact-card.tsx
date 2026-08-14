"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  Copy,
  Gift,
  MessageCircle,
  Phone,
  Send,
  Share2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {Input, Textarea, Field} from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/ui/brand-icons";
import { FavoriteButton } from "@/components/profile/favorite-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/primitives";
import { createBookingAction, sendGiftAction, sendMessageAction } from "@/server/actions/interactions";
import { reportAction } from "@/server/actions/misc";
import { DURATIONS, PLACE_LABEL, REPORT_REASON_LABEL } from "@/lib/constants";
import { cn, formatPrice } from "@/lib/utils";

type Props = {
  profileId: string;
  profileUserId: string;
  displayName: string;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  showPhone: boolean;
  contactNote: string | null;
  priceHour: number | null;
  currency: string;
  meetingPlace: string;
  isFavorited: boolean;
  isLoggedIn: boolean;
  isOwner: boolean;
  gifts: { id: string; name: string; emoji: string; credits: number }[];
};

export function ContactCard(props: Props) {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-5">
        {props.priceHour ? (
          <div className="mb-4 flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-bold">{formatPrice(props.priceHour, props.currency)}</span>
            <span className="text-sm text-muted-foreground">/ Stunde</span>
          </div>
        ) : (
          <p className="mb-4 text-sm text-muted-foreground">Preise auf Anfrage</p>
        )}

        <Badge variant="neutral" className="mb-4">
          {PLACE_LABEL[props.meetingPlace] ?? "Treffpunkt auf Anfrage"}
        </Badge>

        {props.isOwner ? (
          <Button asChild variant="outline" className="w-full">
            <Link href="/dashboard/profil">Profil bearbeiten</Link>
          </Button>
        ) : (
          <div className="space-y-2">
            {props.showPhone && props.phone && (
              <Button
                variant={revealed ? "outline" : "brand"}
                className="w-full"
                onClick={() => {
                  if (!revealed) {
                    setRevealed(true);
                    return;
                  }
                  navigator.clipboard?.writeText(props.phone!).then(() => toast.success("Nummer kopiert"));
                }}
              >
                <Phone className="size-4" />
                {revealed ? props.phone : "Telefonnummer anzeigen"}
                {revealed && <Copy className="size-3.5 opacity-60" />}
              </Button>
            )}

            <MessageDialog {...props} />
            <BookingDialog {...props} />

            <div className="flex gap-2">
              <GiftDialog {...props} />
              <FavoriteButton profileId={props.profileId} initial={props.isFavorited} variant="solid" />
              <ShareButton displayName={props.displayName} />
            </div>
          </div>
        )}

        {props.contactNote && (
          <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            {props.contactNote}
          </p>
        )}

        {(props.whatsapp || props.telegram) && !props.isOwner && (
          <div className="mt-3 flex gap-2">
            {props.whatsapp && (
              <a
                href={`https://wa.me/${props.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-whatsapp py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon className="size-4 shrink-0" />
                WhatsApp
              </a>
            )}
            {props.telegram && (
              <a
                href={`https://t.me/${props.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium transition-colors hover:border-info/50 hover:text-info"
              >
                Telegram
              </a>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="flex items-center gap-2 text-xs font-semibold">
          <ShieldAlert className="size-4 text-warning" /> Sicherheitshinweis
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Sende niemals Vorauszahlungen, Gutscheincodes oder Ausweiskopien. Melde verdächtige Profile sofort.
        </p>
        <ReportDialog targetId={props.profileId} className="mt-3" />
      </div>
    </div>
  );
}

function MessageDialog(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(sendMessageAction, {});

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Nachricht gesendet");
      setOpen(false);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  if (!props.isLoggedIn) {
    return (
      <Button asChild variant="default" className="w-full">
        <Link href="/login">
          <MessageCircle className="size-4" /> Nachricht senden
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <MessageCircle className="size-4" /> Nachricht senden
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nachricht an {props.displayName}</DialogTitle>
          <DialogDescription>Sei respektvoll und konkret — so bekommst du schneller eine Antwort.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="recipientId" value={props.profileUserId} />
          <Textarea
            name="body"
            required
            rows={5}
            maxLength={4000}
            placeholder={`Hallo ${props.displayName}, ich interessiere mich für …`}
          />
          <DialogFooter>
            <Button type="submit" variant="brand" loading={pending} className="w-full">
              <Send className="size-4" /> Senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookingDialog(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(createBookingAction, {});

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Anfrage gesendet");
      setOpen(false);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  if (!props.isLoggedIn) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="/login">
          <CalendarPlus className="size-4" /> Termin anfragen
        </Link>
      </Button>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <CalendarPlus className="size-4" /> Termin anfragen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Termin bei {props.displayName} anfragen</DialogTitle>
          <DialogDescription>Unverbindliche Anfrage — die Bestätigung erfolgt direkt im Chat.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="profileId" value={props.profileId} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum" required>
              <Input type="date" name="date" min={today} required />
            </Field>
            <Field label="Uhrzeit" required>
              <Input type="time" name="time" required />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dauer" required>
              <Select name="minutes" defaultValue="60">
                {DURATIONS.map((d) => (
                  <option key={d.minutes} value={d.minutes}>
                    {d.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Treffpunkt" required>
              <Select name="place" defaultValue={props.meetingPlace === "BOTH" ? "INCALL" : props.meetingPlace}>
                <option value="INCALL">Bei ihr/ihm</option>
                <option value="OUTCALL">Hausbesuch / Hotel</option>
              </Select>
            </Field>
          </div>
          <Field label="Adresse (bei Hausbesuch)" hint="Wird erst nach Bestätigung sichtbar.">
            <Input name="address" placeholder="Hotel, Strasse, Stadt" />
          </Field>
          <Field label="Nachricht">
            <Textarea name="note" rows={3} placeholder="Wünsche, Anlass, Besonderheiten …" />
          </Field>
          <DialogFooter>
            <Button type="submit" variant="brand" loading={pending} className="w-full">
              Anfrage senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GiftDialog(props: Props) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [state, action, pending] = useActionState(sendGiftAction, {});

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Geschenk gesendet");
      setOpen(false);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  if (!props.isLoggedIn || !props.gifts.length) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-lg" className="size-11" aria-label="Geschenk senden">
          <Gift className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Geschenk an {props.displayName}</DialogTitle>
          <DialogDescription>Zeig Wertschätzung — 70 % der Credits gehen direkt an das Profil.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="profileId" value={props.profileId} />
          <input type="hidden" name="itemId" value={selected ?? ""} />
          <div className="grid grid-cols-4 gap-2">
            {props.gifts.map((gift) => (
              <button
                key={gift.id}
                type="button"
                onClick={() => setSelected(gift.id)}
                className={`rounded-xl border p-3 text-center transition-colors ${
                  selected === gift.id ? "border-primary bg-primary/10" : "border-border hover:border-foreground/30"
                }`}
              >
                <span className="block text-2xl">{gift.emoji}</span>
                <span className="mt-1 block text-[10px] font-medium">{gift.name}</span>
                <span className="block text-[10px] text-muted-foreground">{gift.credits} C</span>
              </button>
            ))}
          </div>
          <Textarea name="message" rows={2} maxLength={300} placeholder="Persönliche Nachricht (optional)" />
          <DialogFooter>
            <Button type="submit" variant="brand" loading={pending} disabled={!selected} className="w-full">
              Geschenk senden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShareButton({ displayName }: { displayName: string }) {
  const [copied, setCopied] = React.useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: displayName, url }).catch(() => null);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="icon-lg" className="size-11" onClick={share} aria-label="Profil teilen">
      {copied ? <Check className="size-4 text-success" /> : <Share2 className="size-4" />}
    </Button>
  );
}

export function ReportDialog({
  targetId,
  targetType = "PROFILE",
  label = "Profil melden",
  className,
}: {
  targetId: string;
  targetType?: string;
  label?: string;
  /** Abstände setzt die aufrufende Stelle — der Auslöser steht in ganz
   *  unterschiedlichen Umgebungen (Seitenleiste, Zeile im Chat). */
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(reportAction, {});

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Meldung gesendet");
      setOpen(false);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-danger hover:underline",
            className,
          )}
        >
          <AlertTriangle className="size-3.5 shrink-0" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Inhalt melden</DialogTitle>
          <DialogDescription>Deine Meldung wird vertraulich behandelt und binnen 24 h geprüft.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />
          <Field label="Grund" required>
            <Select name="reason" required defaultValue="">
              <option value="" disabled>
                Bitte wählen
              </option>
              {Object.entries(REPORT_REASON_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Details">
            <Textarea name="details" rows={4} placeholder="Was ist passiert?" />
          </Field>
          <DialogFooter>
            <Button type="submit" variant="danger" loading={pending} className="w-full">
              Meldung absenden
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
