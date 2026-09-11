import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { CategoryBadge } from "./category-badge";
import { formatDateTime } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export interface TicketCardData {
  id: number;
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string | Date;
  createdByAi?: boolean;
}

export function TicketCard({ ticket, href }: { ticket: TicketCardData; href: string }) {
  return (
    <Link href={href}>
      <Card className="border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardContent className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="font-mono">{ticket.ticketNumber}</span>
                {ticket.createdByAi && (
                  <span className="inline-flex items-center gap-0.5 text-primary">
                    <Sparkles className="size-3" /> AI
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate font-medium">{ticket.subject}</p>
            </div>
            <StatusBadge status={ticket.status} className="shrink-0" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={ticket.category} />
            <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(ticket.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
