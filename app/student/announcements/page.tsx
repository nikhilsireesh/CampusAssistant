import { requireRole } from "@/lib/auth/guards";
import { listActiveAnnouncementsForAudience } from "@/lib/services/announcement-service";
import { AnnouncementCard } from "@/components/announcements/announcement-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Megaphone } from "lucide-react";

export default async function StudentAnnouncementsPage() {
  await requireRole("student");
  const announcements = await listActiveAnnouncementsForAudience("student");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-sm text-muted-foreground">Official updates from the college administration.</p>
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements" description="Check back later for updates." />
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}
    </div>
  );
}
