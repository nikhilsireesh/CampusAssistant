import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "secondary" | "success" | "warning" | "info" | "destructive";
  hint?: string;
}) {
  const accentClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    info: "bg-info/15 text-info",
    destructive: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex items-center gap-4 px-5 py-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", accentClasses[accent])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{label}</p>
          {hint && <p className="text-[11px] text-muted-foreground/80">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
