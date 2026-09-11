"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { NAV_CONFIG, PROFILE_HREF } from "./nav-config";
import { UserMenu } from "./user-menu";
import { LogoutButton } from "./logout-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";

export function DashboardShell({
  role,
  user,
  children,
}: {
  role: "student" | "admin";
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = NAV_CONFIG[role];
  const profileHref = PROFILE_HREF[role];

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:overflow-y-auto">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2 font-semibold text-sidebar-foreground">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" />
          </div>
          <span className="text-sm leading-tight">
            MIC Campus
            <br />
            Assistant
          </span>
        </Link>
        <SidebarNav items={navItems} />
        <div className="mt-auto space-y-3 pt-6">
          <LogoutButton role={role} />
          <p className="text-xs text-muted-foreground">DVR &amp; Dr. HS MIC College of Technology</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar px-4 py-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2">
              <Link href="/" className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="size-4.5" />
                </div>
                <span className="text-sm">MIC Campus</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-4.5" />
              </Button>
            </div>
            <SidebarNav items={navItems} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto pt-6">
              <LogoutButton role={role} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu name={user.name} email={user.email} role={user.role} profileHref={profileHref} />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
