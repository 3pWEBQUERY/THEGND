"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ActionState } from "@/server/action-utils";

export function ActionButton({
  action,
  confirm,
  children,
  ...props
}: ButtonProps & { action: () => Promise<ActionState>; confirm?: string }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      {...props}
      loading={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          const res = await action();
          res.ok ? toast.success(res.message ?? "Erledigt") : toast.error(res.message ?? "Fehler");
        });
      }}
    >
      {children}
    </Button>
  );
}
