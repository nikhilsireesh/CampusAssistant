import "server-only";
import { redirect } from "next/navigation";
import { getSession, type Role, type SessionPayload } from "./session";

/**
 * Require an authenticated session with one of the allowed roles.
 * Redirects to /login if unauthenticated, or to the user's own
 * dashboard if authenticated but not authorized for this route.
 *
 * This MUST be called at the top of every protected server
 * component/page/layout — never rely on hiding UI alone.
 */
export async function requireRole(...allowedRoles: Role[]): Promise<SessionPayload> {
  const session = await getSession();

  if (!session) {
    redirect(loginPathForRole(allowedRoles[0]));
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    redirect(homeForRole(session.role));
  }

  return session;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export function homeForRole(role: Role): string {
  return role === "admin" ? "/admin" : "/student";
}

/** The dedicated sign-in page for a role — student and admin sign in separately. */
export function loginPathForRole(role?: Role): string {
  return role === "admin" ? "/login/admin" : "/login/student";
}
