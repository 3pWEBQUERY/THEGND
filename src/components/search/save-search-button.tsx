"use client";

import * as React from "react";
import { useActionState } from "react";
import { BellPlus } from "lucide-react";
import { toast } from "sonner";
import { saveSearchAction } from "@/server/actions/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Switch } from "@/components/ui/primitives";

export function SaveSearchButton({ query }: { query: string }) {
  const [open, setOpen] = React.useState(false);
  const [state, action, pending] = useActionState(saveSearchAction, {});

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Suche gespeichert.");
      setOpen(false);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <BellPlus className="size-4" />
          <span className="hidden sm:inline">Suche speichern</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Suchauftrag anlegen</DialogTitle>
          <DialogDescription>
            Wir benachrichtigen dich, sobald neue Profile zu diesen Filtern passen.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="query" value={query} />
          <Input name="name" required placeholder="z. B. Zürich · verifiziert · bis CHF 300" maxLength={60} />
          <label className="flex items-center justify-between text-sm">
            E-Mail-Benachrichtigung
            <Switch name="alertMail" defaultChecked />
          </label>
          <DialogFooter>
            <Button type="submit" variant="brand" loading={pending} className="w-full">
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
