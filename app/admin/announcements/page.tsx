import { requireRole } from "@/lib/auth/guards";
import { AdminAnnouncementManager } from "@/components/announcements/admin-announcement-manager";

export default async function AdminAnnouncementsPage() {
  await requireRole("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-sm text-muted-foreground">Publish updates for students, admins, or everyone.</p>
      </div>
      <AdminAnnouncementManager />
    </div>
  );
}
