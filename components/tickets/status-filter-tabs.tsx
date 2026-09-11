import Link from "next/link";
import { cn } from "@/lib/utils";
import { TICKET_STATUSES } from "@/lib/constants/ticket";

export function StatusFilterTabs({ basePath, activeStatus }: { basePath: string; activeStatus?: string }) {
  const options = ["All", ...TICKET_STATUSES];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((status) => {
        const isActive = (status === "All" && !activeStatus) || activeStatus === status;
        return (
          <Link
            key={status}
            href={status === "All" ? basePath : `${basePath}?status=${encodeURIComponent(status)}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {status}
          </Link>
        );
      })}
    </div>
  );
}
