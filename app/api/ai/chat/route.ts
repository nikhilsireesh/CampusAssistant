import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/auth/api-guards";
import { chatMessageSchema } from "@/lib/validation/schemas";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { handleCampusMessage } from "@/lib/services/ai-service";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await requireApiSession();

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);
  const input = chatMessageSchema.parse(body);

  const rateLimit = checkAiRateLimit(session.userId, input.message);
  if (!rateLimit.allowed) {
    const message =
      rateLimit.reason === "duplicate"
        ? "Please wait a moment before sending the same message again."
        : "You're sending messages too quickly. Please wait a minute and try again.";
    return apiError(message, 429, { retryAfterMs: rateLimit.retryAfterMs });
  }

  const result = await handleCampusMessage({
    userId: session.userId,
    conversationId: input.conversationId,
    message: input.message,
  });

  return apiSuccess(result);
});
