import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { getStudentProfile } from "@/lib/services/user-service";
import { listTicketsForStudent } from "@/lib/services/ticket-service";
import { listActiveAnnouncementsForAudience } from "@/lib/services/announcement-service";
import { StatCard } from "@/components/dashboard/stat-card";
import { TicketCard } from "@/components/tickets/ticket-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, Ticket, Megaphone, Clock, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function StudentDashboardPage() {
  const session = await requireRole("student");
  const [profile, tickets, announcements] = await Promise.all([
    getStudentProfile(session.userId),
    listTicketsForStudent(session.userId, { pageSize: 100 }),
    listActiveAnnouncementsForAudience("student"),
  ]);

  const open = tickets.filter((t) => !["Resolved", "Closed"].includes(t.status)).length;
  const resolved = tickets.filter((t) => ["Resolved", "Closed"].includes(t.status)).length;
  const recent = tickets.slice(0, 4);

  const quickActions = [
    { label: "Ask AI", href: "/student/assistant", icon: MessageSquareText },
    { label: "Submit Request", href: "/student/requests?new=1", icon: Ticket },
    { label: "Track Request", href: "/student/requests", icon: Clock },
    { label: "Announcements", href: "/student/announcements", icon: Megaphone },
  ];

  return (
    <div className="space-y-8">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {profile?.name.split(" ")[0] ?? session.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile ? `${profile.program} · ${profile.department} · ${profile.year} · Section ${profile.section}` : "Here's what's happening with your requests."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Requests" value={tickets.length} icon={Ticket} accent="primary" />
        <StatCard label="Open" value={open} icon={Loader2} accent="info" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} accent="success" />
        <StatCard label="Announcements" value={announcements.length} icon={Megaphone} accent="secondary" />
      </div>

      <Card className="border-border/70 bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-md">
        <CardContent className="flex flex-col items-start gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Have a question?</h2>
            <p className="text-sm text-primary-foreground/85">
              Ask the MIC Campus Assistant about attendance, fees, exams, hostel and more.
            </p>
          </div>
          <Button variant="secondary" render={<Link href="/student/assistant">Ask AI Assistant<ArrowRight className="size-4" /></Link>} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">QUICK ACTIONS</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center text-xs font-medium shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <action.icon className="size-4.5" />
              </div>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">RECENT REQUESTS</h2>
            <Link href="/student/requests" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No requests yet"
              description="Ask the AI Assistant a question or submit a request to get started."
            />
          ) : (
            <div className="space-y-3">
              {recent.map((t) => (
                <TicketCard key={t.id} ticket={t} href={`/student/requests/${t.id}`} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">ANNOUNCEMENTS</h2>
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="sr-only">Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No announcements right now.</p>
              ) : (
                announcements.slice(0, 5).map((a) => (
                  <div key={a.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">{formatDate(a.publishDate)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
