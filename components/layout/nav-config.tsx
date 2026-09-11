import {
  LayoutDashboard,
  MessageSquareText,
  Ticket,
  BookOpenCheck,
  Megaphone,
  UserCircle,
  Users,
  Building2,
  BarChart3,
  Settings,
} from "lucide-react";
import type { NavItem } from "./sidebar-nav";

/** Icon components can't cross the server->client boundary as props, so the
 * nav config (icons included) lives in a client-safe module that both the
 * server layouts and the client DashboardShell can import by role name. */
export const NAV_CONFIG: Record<"student" | "admin", NavItem[]> = {
  student: [
    { label: "Dashboard", href: "/student", icon: LayoutDashboard },
    { label: "AI Assistant", href: "/student/assistant", icon: MessageSquareText },
    { label: "My Requests", href: "/student/requests", icon: Ticket },
    { label: "Announcements", href: "/student/announcements", icon: Megaphone },
    { label: "Profile", href: "/student/profile", icon: UserCircle },
  ],
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Tickets", href: "/admin/tickets", icon: Ticket },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Departments", href: "/admin/departments", icon: Building2 },
    { label: "Knowledge Base", href: "/admin/knowledge", icon: BookOpenCheck },
    { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
    { label: "AI Analytics", href: "/admin/analytics", icon: BarChart3 },
    { label: "System Settings", href: "/admin/settings", icon: Settings },
  ],
};

export const PROFILE_HREF: Record<"student" | "admin", string> = {
  student: "/student/profile",
  admin: "/admin/settings",
};
