import { NextRequest } from "next/server";
import { loginSchema } from "@/lib/validation/schemas";
import { getUserByEmail } from "@/lib/services/user-service";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";
import { homeForRole } from "@/lib/auth/guards";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);

  const { email, password, portal } = loginSchema.parse(body);

  const user = await getUserByEmail(email);
  if (!user || !user.isActive) {
    return apiError("Invalid email or password", 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return apiError("Invalid email or password", 401);
  }

  if (portal && user.role !== portal) {
    const article = user.role === "admin" ? "an" : "a";
    return apiError(`This is ${article} ${user.role} account — use the ${user.role} sign-in page instead.`, 401);
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return apiSuccess({
    role: user.role,
    redirectTo: homeForRole(user.role),
  });
});
