import { NextRequest } from "next/server";
import { requireApiSession, requireApiRole } from "@/lib/auth/api-guards";
import {
  createKnowledgeArticle,
  listAllKnowledgeArticlesForAdmin,
  listKnowledgeArticles,
  searchKnowledgeBase,
} from "@/lib/services/knowledge-service";
import { knowledgeSchema } from "@/lib/validation/schemas";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireApiSession();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const query = searchParams.get("q") ?? undefined;

  if (session.role === "admin" && searchParams.get("all") === "true") {
    const articles = await listAllKnowledgeArticlesForAdmin();
    return apiSuccess({ articles });
  }

  if (query) {
    const articles = await searchKnowledgeBase({ query, category, limit: 20 });
    return apiSuccess({ articles });
  }

  const articles = await listKnowledgeArticles(category);
  return apiSuccess({ articles });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  await requireApiRole("admin");
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);
  const input = knowledgeSchema.parse(body);
  const article = await createKnowledgeArticle(input);
  return apiSuccess({ article }, 201);
});
