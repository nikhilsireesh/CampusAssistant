import { requireRole } from "@/lib/auth/guards";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("admin");

  return (
    <DashboardShell role="admin" user={{ name: session.name, email: session.email, role: session.role }}>
      {children}
    </DashboardShell>
  );
}
