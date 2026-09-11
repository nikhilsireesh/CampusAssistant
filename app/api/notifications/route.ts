import { requireApiSession } from "@/lib/auth/api-guards";
import { countUnreadNotifications, listNotifications, markAllNotificationsRead } from "@/lib/services/notification-service";
import { apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async () => {
  const session = await requireApiSession();
  const [notifications, unreadCount] = await Promise.all([
    listNotifications(session.userId),
    countUnreadNotifications(session.userId),
  ]);
  return apiSuccess({ notifications, unreadCount });
});

export const PATCH = withErrorHandling(async () => {
  const session = await requireApiSession();
  await markAllNotificationsRead(session.userId);
  return apiSuccess({ ok: true });
});
