import { requireApiSession } from "@/lib/auth/api-guards";
import { markNotificationRead } from "@/lib/services/notification-service";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const PATCH = withErrorHandling(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApiSession();
  const { id } = await params;
  const notificationId = Number(id);
  if (!Number.isInteger(notificationId)) return apiError("Invalid notification id", 400);

  await markNotificationRead(notificationId, session.userId);
  return apiSuccess({ ok: true });
});
