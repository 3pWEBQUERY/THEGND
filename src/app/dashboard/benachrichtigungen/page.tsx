import type { Metadata } from "next";
import { BellOff } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getNotifications } from "@/server/queries/user";
import { markNotificationsReadAction } from "@/server/actions/misc";
import { PageHeader, EmptyState } from "@/components/dashboard/page-header";
import { NotificationItem } from "@/components/dashboard/notification-item";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Benachrichtigungen" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getNotifications(user.id);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        title="Benachrichtigungen"
        description={unread > 0 ? `${unread} ungelesen` : "Alles gelesen."}
        action={
          unread > 0 ? (
            <form
              action={async () => {
                "use server";
                await markNotificationsReadAction();
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Alle als gelesen markieren
              </Button>
            </form>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title="Keine Benachrichtigungen" description="Hier landen Nachrichten, Buchungen und Bewertungen." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationItem
                id={n.id}
                href={n.href ?? "/dashboard"}
                title={n.title}
                body={n.body}
                zeit={timeAgo(n.createdAt)}
                gelesen={Boolean(n.readAt)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
