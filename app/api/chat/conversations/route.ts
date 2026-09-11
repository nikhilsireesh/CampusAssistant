import { requireApiSession } from "@/lib/auth/api-guards";
import { listConversations } from "@/lib/services/chat-service";
import { apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async () => {
  const session = await requireApiSession();
  const conversations = await listConversations(session.userId);
  return apiSuccess({ conversations });
});
