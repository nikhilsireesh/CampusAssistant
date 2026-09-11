"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.data.notifications);
      setUnread(json.data.unreadCount);
    } catch {
      // Silent failure — notifications are non-critical UI
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    load();
  }

  async function handleClick(item: NotificationItem) {
    if (!item.isRead) {
      await fetch(`/api/notifications/${item.id}`, { method: "PATCH" });
    }
    setOpen(false);
    if (item.link) router.push(item.link);
    load();
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Notifications"
      >
        <Bell className="size-4.5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          </DropdownMenuGroup>
          {unread > 0 && (
            <Button variant="ghost" size="xs" onClick={markAllRead}>
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </div>
        ) : (
          <div className="flex max-h-80 flex-col overflow-y-auto">
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => handleClick(item)}
                className={cn("flex-col items-start gap-0.5 py-2", !item.isRead && "bg-accent/40")}
              >
                <div className="flex w-full items-center gap-1.5">
                  {!item.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className="font-medium">{item.title}</span>
                </div>
                <span className="line-clamp-2 text-xs text-muted-foreground">{item.message}</span>
                <span className="text-[11px] text-muted-foreground">{timeAgo(item.createdAt)}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
