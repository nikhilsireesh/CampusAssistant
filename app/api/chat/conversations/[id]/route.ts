import { requireApiSession } from "@/lib/auth/api-guards";
import { deleteConversation, getConversation, getConversationMessages } from "@/lib/services/chat-service";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApiSession();
  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return apiError("Invalid conversation id", 400);

  const conversation = await getConversation(conversationId, session.userId);
  if (!conversation) return apiError("Conversation not found", 404);

  const messages = await getConversationMessages(conversationId);
  return apiSuccess({ conversation, messages });
});

export const DELETE = withErrorHandling(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApiSession();
  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) return apiError("Invalid conversation id", 400);

  await deleteConversation(conversationId, session.userId);
  return apiSuccess({ ok: true });
});
