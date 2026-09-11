import { requireRole } from "@/lib/auth/guards";
import {
  getAdminOverview,
  getFrequentCategories,
  getTicketsByCategory,
  getTicketsByDepartment,
} from "@/lib/services/analytics-service";
import { generateAdminInsight } from "@/lib/ai/gemini";
import { isGeminiConfigured } from "@/lib/ai/gemini";
import { CategoryBarChart } from "@/components/analytics/charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquareText, TrendingUp, Wand2, WifiOff } from "lucide-react";

export default async function AdminAnalyticsPage() {
  await requireRole("admin");

  const [overview, byCategory, byDepartment, frequentCategories] = await Promise.all([
    getAdminOverview(),
    getTicketsByCategory(),
    getTicketsByDepartment(),
    getFrequentCategories(6),
  ]);

  const topCategory = byCategory[0];
  const topDepartment = byDepartment[0];
  const { insight, usedFallback } = await generateAdminInsight({
    topCategory: topCategory?.name ?? "N/A",
    topCategoryCount: topCategory?.value ?? 0,
    totalTickets: overview.totalTickets,
    busiestDepartment: topDepartment?.name ?? "N/A",
    aiResolutionRate: overview.aiResolutionRate,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Analytics</h1>
          <p className="text-sm text-muted-foreground">How the MIC Campus Assistant is performing.</p>
        </div>
        <Badge variant={isGeminiConfigured() ? "default" : "outline"} className="gap-1.5">
          {isGeminiConfigured() ? <Wand2 className="size-3" /> : <WifiOff className="size-3" />}
          {isGeminiConfigured() ? "Gemini connected" : "Fallback mode (no API key)"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="AI Conversations" value={overview.aiInteractionCount} icon={MessageSquareText} accent="primary" />
        <StatCard label="Resolved by AI" value={overview.aiResolvedCount} icon={Sparkles} accent="success" />
        <StatCard label="Escalated to Ticket" value={overview.escalatedCount} icon={TrendingUp} accent="warning" />
        <StatCard
          label="AI Resolution Rate"
          value={`${Math.round(overview.aiResolutionRate * 100)}%`}
          icon={Wand2}
          accent="info"
        />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 px-5 py-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">
              Insight {usedFallback && <span className="font-normal text-muted-foreground">(rule-based)</span>}
            </p>
            <p className="text-sm text-muted-foreground">{insight}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Requests by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBarChart data={byDepartment} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Most Frequent Question Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {frequentCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enough chat data yet.</p>
            ) : (
              frequentCategories.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <span className="text-sm font-medium text-muted-foreground">{c.value} questions</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
