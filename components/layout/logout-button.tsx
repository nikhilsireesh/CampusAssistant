"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, role }: { className?: string; role: "student" | "admin" }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push(`/login/${role}`);
      router.refresh();
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={loggingOut}
      className={cn("w-full justify-start text-muted-foreground hover:text-destructive", className)}
    >
      {loggingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
      Log out
    </Button>
  );
}
