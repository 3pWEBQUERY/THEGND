"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Ban, Coins, ShieldCheck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { grantCreditsAction, updateUserStatusAction } from "@/server/actions/admin";
import { ActionButton } from "@/components/admin/action-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/primitives";
import { formatDate, isOnline, timeAgo } from "@/lib/utils";

type AdminUser = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  credits: number;
  createdAt: string;
  lastSeenAt: string | null;
  emailVerified: string | null;
  profile: { slug: string; status: string } | null;
};

export function UserRow({ user }: { user: AdminUser }) {
  const [state, action, pending] = useActionState(grantCreditsAction, {});
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Gebucht");
      setOpen(false);
    } else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
      <div className="min-w-56 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{user.displayName ?? "—"}</span>
          <Badge size="sm" variant="neutral">
            {user.role}
          </Badge>
          <Badge
            size="sm"
            variant={user.status === "ACTIVE" ? "success" : user.status === "BANNED" ? "danger" : "warning"}
          >
            {user.status}
          </Badge>
          {isOnline(user.lastSeenAt) && (
            <Badge size="sm" variant="success">
              online
            </Badge>
          )}
          {!user.emailVerified && (
            <Badge size="sm" variant="warning">
              E-Mail offen
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {user.email} · seit {formatDate(user.createdAt)}
          {user.lastSeenAt ? ` · zuletzt ${timeAgo(user.lastSeenAt)}` : ""}
          {user.profile ? ` · Profil: ${user.profile.status}` : ""}
        </p>
      </div>

      <Badge variant="gold" size="sm">
        {user.credits} C
      </Badge>

      <div className="flex flex-wrap gap-2">
        {user.profile && (
          <Button asChild size="xs" variant="ghost">
            <Link href={`/escort/${user.profile.slug}`} target="_blank">
              Profil ↗
            </Link>
          </Button>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="xs" variant="outline">
              <Coins className="size-3.5" /> Credits
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Guthaben anpassen</DialogTitle>
            </DialogHeader>
            <form action={action} className="space-y-3">
              <input type="hidden" name="userId" value={user.id} />
              <Input name="amount" type="number" required placeholder="z. B. 100 oder -50" />
              <Input name="note" placeholder="Grund (optional)" />
              <DialogFooter>
                <Button type="submit" variant="brand" loading={pending} className="w-full">
                  Buchen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {user.status === "ACTIVE" ? (
          <>
            <ActionButton
              size="xs"
              variant="ghost"
              confirm="Konto sperren?"
              action={updateUserStatusAction.bind(null, user.id, "SUSPENDED")}
            >
              <Ban className="size-3.5" /> Sperren
            </ActionButton>
            <ActionButton
              size="xs"
              variant="ghost"
              confirm="Konto dauerhaft bannen?"
              action={updateUserStatusAction.bind(null, user.id, "BANNED")}
              className="text-danger"
            >
              Bannen
            </ActionButton>
          </>
        ) : (
          <ActionButton size="xs" variant="success" action={updateUserStatusAction.bind(null, user.id, "ACTIVE")}>
            <Undo2 className="size-3.5" /> Entsperren
          </ActionButton>
        )}
      </div>
    </div>
  );
}
