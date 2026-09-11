"use client";

import { useCallback, useEffect, useState } from "react";
import { AnnouncementCard } from "./announcement-card";
import { AnnouncementFormDialog } from "./announcement-form-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: string;
  publishDate: string;
  audience: string;
  isActive: boolean;
}

export function AdminAnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/announcements?all=true");
    if (res.ok) {
      const json = await res.json();
      setAnnouncements(json.data.announcements);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(a: Announcement) {
    const res = await fetch(`/api/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !a.isActive }),
    });
    if (res.ok) {
      toast.success(a.isActive ? "Announcement hidden" : "Announcement activated");
      load();
    }
  }

  async function remove(id: number) {
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Announcement deleted");
      load();
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AnnouncementFormDialog onSaved={load} />
      </div>
      <div className="space-y-3">
        {announcements.map((a) => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            actions={
              <div className="flex items-center gap-2">
                <Switch checked={a.isActive} onCheckedChange={() => toggleActive(a)} aria-label="Toggle active" />
                <Button variant="ghost" size="icon-sm" onClick={() => setPendingDeleteId(a.id)} aria-label="Delete">
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            }
          />
        ))}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete this announcement?"
        description="Students will no longer see it."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDeleteId !== null) remove(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
