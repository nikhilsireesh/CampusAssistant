import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/guards";
import { LoginForm } from "@/components/auth/login-form";
import { LoginShell } from "@/components/auth/login-shell";

export default async function StudentLoginPage() {
  const session = await getSession();
  if (session) redirect(homeForRole(session.role));

  return (
    <LoginShell portal="student">
      <Suspense>
        <LoginForm portal="student" />
      </Suspense>
    </LoginShell>
  );
}
