import "server-only";
import { getSession, type Role, type SessionPayload } from "./session";
import { ApiError } from "@/lib/api/response";

/**
 * Session/role checks for API route handlers. Unlike `requireRole` (used in
 * server components/pages, which redirects), these throw an ApiError so
 * route handlers can return a proper 401/403 JSON response instead of a
 * redirect — important for fetch() callers that expect JSON.
 */
export async function requireApiSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new ApiError("You must be signed in to do this.", 401);
  }
  return session;
}

export async function requireApiRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await requireApiSession();
  if (roles.length > 0 && !roles.includes(session.role)) {
    throw new ApiError("You do not have permission to perform this action.", 403);
  }
  return session;
}
