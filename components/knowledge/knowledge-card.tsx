import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge } from "@/components/tickets/category-badge";
import { ChevronRight } from "lucide-react";

export interface KnowledgeCardData {
  id: number;
  title: string;
  category: string;
  content: string;
}

export function KnowledgeCard({ article, href }: { article: KnowledgeCardData; href: string }) {
  return (
    <Link href={href}>
      <Card className="h-full border-border/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-2 px-5 py-4">
          <div className="flex items-start justify-between gap-2">
            <CategoryBadge category={article.category} />
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </div>
          <p className="font-medium leading-snug">{article.title}</p>
          <p className="line-clamp-3 text-sm text-muted-foreground">{article.content}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
