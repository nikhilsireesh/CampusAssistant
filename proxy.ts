import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "sca_session";

const ROLE_PREFIXES: Record<string, string> = {
  "/student": "student",
  "/admin": "admin",
};

async function getRoleFromToken(token: string | undefined): Promise<string | null> {
  if (!token || !process.env.AUTH_SECRET) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return (payload.role as string) ?? null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matchedPrefix = Object.keys(ROLE_PREFIXES).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!matchedPrefix) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const role = await getRoleFromToken(token);

  const requiredRole = ROLE_PREFIXES[matchedPrefix];

  if (!role) {
    const loginUrl = new URL(`/login/${requiredRole}`, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (role !== requiredRole) {
    return NextResponse.redirect(new URL(`/${role}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/admin/:path*"],
};
