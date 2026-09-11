import { requireApiRole } from "@/lib/auth/api-guards";
import {
  getAdminOverview,
  getFrequentCategories,
  getStatusDistribution,
  getTicketsByCategory,
  getTicketsByDepartment,
  getTicketsOverTime,
} from "@/lib/services/analytics-service";
import { generateAdminInsight } from "@/lib/ai/gemini";
import { apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async () => {
  await requireApiRole("admin");

  const [overview, byCategory, byDepartment, overTime, statusDistribution, frequentCategories] = await Promise.all([
    getAdminOverview(),
    getTicketsByCategory(),
    getTicketsByDepartment(),
    getTicketsOverTime(30),
    getStatusDistribution(),
    getFrequentCategories(5),
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

  return apiSuccess({
    overview,
    byCategory,
    byDepartment,
    overTime,
    statusDistribution,
    frequentCategories,
    insight,
    insightUsedFallback: usedFallback,
  });
});
