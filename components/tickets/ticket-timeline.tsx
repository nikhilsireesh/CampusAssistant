import { formatDateTime } from "@/lib/utils";
import { CheckCircle2, Circle, UserPlus, RefreshCcw, MessageCircle, ThumbsUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const EVENT_ICONS: Record<string, LucideIcon> = {
  created: Circle,
  routed: RefreshCcw,
  assigned: UserPlus,
  accepted: ThumbsUp,
  status_change: RefreshCcw,
  message: MessageCircle,
  resolved: CheckCircle2,
};

export interface TimelineEvent {
  id: number;
  eventType: string;
  description: string;
  createdAt: string | Date;
}

export function TicketTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {events.map((event) => {
        const Icon = EVENT_ICONS[event.eventType] ?? Circle;
        return (
          <li key={event.id} className="relative">
            <span className="absolute -left-[27px] flex size-5 items-center justify-center rounded-full bg-background ring-2 ring-primary/30 text-primary">
              <Icon className="size-3" />
            </span>
            <p className="text-sm font-medium">{event.description}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
          </li>
        );
      })}
    </ol>
  );
}
