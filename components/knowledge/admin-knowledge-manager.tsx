"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CategoryBadge } from "@/components/tickets/category-badge";
import { KnowledgeFormDialog, type KnowledgeArticleForEdit } from "./knowledge-form-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Article extends KnowledgeArticleForEdit {
  isPublished: boolean;
  updatedAt: string;
}

export function AdminKnowledgeManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/knowledge?all=true");
    if (res.ok) {
      const json = await res.json();
      setArticles(json.data.articles);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function togglePublished(article: Article) {
    const res = await fetch(`/api/knowledge/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !article.isPublished }),
    });
    if (res.ok) {
      toast.success(article.isPublished ? "Article unpublished" : "Article published");
      load();
    }
  }

  async function deleteArticle(id: number) {
    const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Article deleted");
      load();
    }
  }

  if (loading) {
    return <div className="flex h-40 items-center justify-center text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <KnowledgeFormDialog onSaved={load} />
      </div>
      <div className="space-y-3">
        {articles.map((a) => (
          <Card key={a.id} className="border-border/70 shadow-sm">
            <CardContent className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={a.category} />
                  <Badge variant={a.isPublished ? "default" : "outline"}>
                    {a.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <p className="font-medium">{a.title}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{a.content}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={a.isPublished} onCheckedChange={() => togglePublished(a)} aria-label="Toggle published" />
                <KnowledgeFormDialog article={a} onSaved={load} />
                <Button variant="ghost" size="icon-sm" onClick={() => setPendingDeleteId(a.id)} aria-label="Delete article">
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this article?"
        description="This cannot be undone. Students and the AI Assistant will no longer see it."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDeleteId !== null) deleteArticle(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
