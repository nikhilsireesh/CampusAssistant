"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTicketSchema, type CreateTicketInput } from "@/lib/validation/schemas";
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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function NewTicketDialog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { category: "Other", subject: "", description: "" },
  });

  useEffect(() => {
    if (searchParams.get("new") === "1") setOpen(true);
    const category = searchParams.get("category");
    if (category && (CATEGORIES as readonly string[]).includes(category)) {
      setValue("category", category as CreateTicketInput["category"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function onSubmit(values: CreateTicketInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not submit your request.");
        return;
      }
      toast.success(`Request submitted: ${json.data.ticket.ticketNumber}`);
      reset();
      setOpen(false);
      router.replace("/student/requests");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) router.replace("/student/requests");
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Submit Request
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit a new request</DialogTitle>
          <DialogDescription>
            Describe your issue and we&apos;ll route it to the right department.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="Brief summary of your issue" {...register("subject")} />
            {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Provide as much detail as possible..."
              {...register("description")}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Submit request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
