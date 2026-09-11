import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import {
  getAdminOverview,
  getStatusDistribution,
  getTicketsByCategory,
  getTicketsOverTime,
} from "@/lib/services/analytics-service";
import { listUnassignedTickets } from "@/lib/services/ticket-service";
import { generateAdminInsight } from "@/lib/ai/gemini";
import { StatCard } from "@/components/dashboard/stat-card";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { CategoryBarChart, StatusPieChart, TrendLineChart } from "@/components/analytics/charts";
import { TicketCard } from "@/components/tickets/ticket-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Ticket,
  Loader2,
  CheckCircle2,
  Sparkles,
  Clock,
  TrendingUp,
  Inbox,
  ArrowRight,
} from "lucide-react";

export default async function AdminDashboardPage() {
  await requireRole("admin");

  const [overview, byCategory, statusDistribution, overTime, newRequests] = await Promise.all([
    getAdminOverview(),
    getTicketsByCategory(),
    getStatusDistribution(),
    getTicketsOverTime(30),
    listUnassignedTickets(6),
  ]);

  const topCategory = byCategory[0];
  const { insight } = await generateAdminInsight({
    topCategory: topCategory?.name ?? "N/A",
    topCategoryCount: topCategory?.value ?? 0,
    totalTickets: overview.totalTickets,
    busiestDepartment: "—",
    aiResolutionRate: overview.aiResolutionRate,
  });

  return (
    <div className="space-y-8">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Campus-wide overview of requests and AI performance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Students" value={overview.totalStudents} icon={Users} accent="primary" />
        <StatCard label="Total Tickets" value={overview.totalTickets} icon={Ticket} accent="secondary" />
        <StatCard label="Open / Pending" value={overview.pendingTickets} icon={Loader2} accent="warning" />
        <StatCard label="Resolved" value={overview.resolvedTickets} icon={CheckCircle2} accent="success" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="AI Resolution Rate"
          value={`${Math.round(overview.aiResolutionRate * 100)}%`}
          icon={Sparkles}
          accent="info"
        />
        <StatCard label="AI-Escalated to Ticket" value={overview.escalatedCount} icon={TrendingUp} accent="destructive" />
        <StatCard label="Avg First Response" value={`${overview.avgResponseHours}h`} icon={Clock} accent="primary" />
        <StatCard label="Avg Resolution" value={`${overview.avgResolutionHours}h`} icon={Clock} accent="secondary" />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 px-5 py-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Insight</p>
            <p className="text-sm text-muted-foreground">{insight}</p>
          </div>
        </CardContent>
      </Card>

      {newRequests.length > 0 && (
        <div className="space-y-3">
          <Card className="border-info/30 bg-info/5">
            <CardContent className="flex items-center gap-3 px-5 py-4">
              <Inbox className="size-5 shrink-0 text-info" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {newRequests.length} new request{newRequests.length === 1 ? "" : "s"} awaiting review
                </p>
                <p className="text-xs text-muted-foreground">
                  Open one and click <strong>Accept request</strong> to start working on it.
                </p>
              </div>
              <Button variant="ghost" size="sm" render={<Link href="/admin/tickets">View all<ArrowRight className="size-3.5" /></Link>} />
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {newRequests.map((t) => (
              <TicketCard key={t.id} ticket={t} href={`/admin/tickets/${t.id}`} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Requests by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Ticket Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusDistribution} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Requests Over Time (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLineChart data={overTime.map((r) => ({ day: r.day.slice(5), value: r.value }))} />
        </CardContent>
      </Card>
    </div>
  );
}
