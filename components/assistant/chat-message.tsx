import { cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/tickets/category-badge";
import { FormatMessage } from "./format-message";
import { GraduationCap, User, Ticket } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export interface DisplayMessage {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  category?: string | null;
  createdAt: string | Date;
  ticket?: { id: number; ticketNumber: string; status: string } | null;
}

export function ChatMessage({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {isUser ? <User className="size-4" /> : <GraduationCap className="size-4" />}
      </div>
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm shadow-sm",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm border border-border bg-card"
          )}
        >
          <FormatMessage content={message.content} />
        </div>
        <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
          <span>{formatDateTime(message.createdAt)}</span>
          {message.category && !isUser && <CategoryBadge category={message.category} className="h-4.5" />}
        </div>
        {message.ticket && (
          <Link
            href={`/student/requests/${message.ticket.id}`}
            className="mt-1 flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <Ticket className="size-3.5" />
            View ticket {message.ticket.ticketNumber}
          </Link>
        )}
      </div>
    </div>
  );
}
