"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { subscribeNewsletterAction } from "@/server/actions/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletterAction, {});

  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="email"
          name="email"
          required
          placeholder="deine@email.de"
          aria-label="E-Mail für Newsletter"
          className="h-10"
        />
        <Button type="submit" size="icon" variant="brand" loading={pending} aria-label="Abonnieren">
          {!pending && <Send className="size-4" />}
        </Button>
      </div>
      {state.message && (
        <p className={state.ok ? "text-xs text-success" : "text-xs text-danger"}>{state.message}</p>
      )}
    </form>
  );
}
