import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  return (
    <Badge variant="secondary" className={cn("font-medium", className)}>
      {category}
    </Badge>
  );
}

export function DepartmentBadge({ department, className }: { department: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {department}
    </Badge>
  );
}
