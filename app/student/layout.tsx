import { requireRole } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("student");

  return (
    <DashboardShell role="student" user={{ name: session.name, email: session.email, role: session.role }}>
      {children}
    </DashboardShell>
  );
}
