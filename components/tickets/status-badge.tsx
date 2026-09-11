import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-info/15 text-info border-info/30",
  Assigned: "bg-secondary/15 text-secondary border-secondary/30",
  "In Progress": "bg-warning/15 text-warning-foreground border-warning/40",
  Escalated: "bg-destructive/15 text-destructive border-destructive/40",
  "Waiting for Student": "bg-muted text-muted-foreground border-border",
  Resolved: "bg-success/15 text-success border-success/30",
  Closed: "bg-muted text-muted-foreground border-border",
  Reopened: "bg-destructive/15 text-destructive border-destructive/30",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status] ?? "bg-muted text-muted-foreground", className)}
    >
      {status}
    </Badge>
  );
}
