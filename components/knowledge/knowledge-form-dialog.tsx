"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { knowledgeSchema, type KnowledgeInput } from "@/lib/validation/schemas";
import { CATEGORIES } from "@/lib/ai/types";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

export interface KnowledgeArticleForEdit {
  id: number;
  title: string;
  category: string;
  content: string;
  keywords: string;
  department: string | null;
  priority: number;
}

export function KnowledgeFormDialog({
  article,
  onSaved,
}: {
  article?: KnowledgeArticleForEdit;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!article;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<KnowledgeInput>({
    resolver: zodResolver(knowledgeSchema),
    defaultValues: article
      ? {
          title: article.title,
          category: article.category as KnowledgeInput["category"],
          content: article.content,
          keywords: article.keywords,
          department: article.department ?? "",
          priority: article.priority,
        }
      : { title: "", category: "General Information", content: "", keywords: "", department: "", priority: 0 },
  });

  useEffect(() => {
    if (open && article) {
      reset({
        title: article.title,
        category: article.category as KnowledgeInput["category"],
        content: article.content,
        keywords: article.keywords,
        department: article.department ?? "",
        priority: article.priority,
      });
    }
  }, [open, article, reset]);

  async function onSubmit(values: KnowledgeInput) {
    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/knowledge/${article!.id}` : "/api/knowledge", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not save article.");
        return;
      }
      toast.success(isEdit ? "Article updated" : "Article created");
      setOpen(false);
      if (!isEdit) reset();
      onSaved();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Edit article">
              <Pencil className="size-3.5" />
            </Button>
          ) : (
            <Button>
              <Plus className="size-4" />
              New Article
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit article" : "New knowledge base article"}</DialogTitle>
          <DialogDescription>
            This information is used by the AI Assistant to answer student questions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="e.g. Accounts" {...register("department")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="keywords">Keywords (comma separated)</Label>
            <Input id="keywords" placeholder="fee, payment, transaction" {...register("keywords")} />
            {errors.keywords && <p className="text-sm text-destructive">{errors.keywords.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" rows={6} {...register("content")} />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create article"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
