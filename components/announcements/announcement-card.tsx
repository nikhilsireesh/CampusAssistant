import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/tickets/category-badge";
import { formatDate } from "@/lib/utils";
import { Megaphone } from "lucide-react";

export interface AnnouncementData {
  id: number;
  title: string;
  content: string;
  category: string;
  publishDate: string | Date;
  audience?: string;
  isActive?: boolean;
}

export function AnnouncementCard({ announcement, actions }: { announcement: AnnouncementData; actions?: React.ReactNode }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex gap-4 px-5 py-4">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          <Megaphone className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{announcement.title}</p>
            <CategoryBadge category={announcement.category} />
          </div>
          <p className="text-sm text-muted-foreground">{announcement.content}</p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground/80">{formatDate(announcement.publishDate)}</p>
            {actions}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
