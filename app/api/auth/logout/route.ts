import { clearSessionCookie } from "@/lib/auth/session";
import { apiSuccess, withErrorHandling } from "@/lib/api/response";

export const POST = withErrorHandling(async () => {
  await clearSessionCookie();
  return apiSuccess({ ok: true });
});
