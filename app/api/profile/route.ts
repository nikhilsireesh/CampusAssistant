import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/auth/api-guards";
import { updateProfileSchema } from "@/lib/validation/schemas";
import { getStudentProfile, updateUserProfile } from "@/lib/services/user-service";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async () => {
  const session = await requireApiSession();

  if (session.role === "student") {
    const profile = await getStudentProfile(session.userId);
    return apiSuccess({ profile });
  }
  return apiSuccess({ profile: { name: session.name, email: session.email } });
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const session = await requireApiSession();
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);
  const input = updateProfileSchema.parse(body);

  const updated = await updateUserProfile(session.userId, {
    name: input.name,
    phone: input.phone || undefined,
  });
  return apiSuccess({ user: updated });
});
