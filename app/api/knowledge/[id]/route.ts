import { NextRequest } from "next/server";
import { requireApiSession, requireApiRole } from "@/lib/auth/api-guards";
import { deleteKnowledgeArticle, getKnowledgeArticle, updateKnowledgeArticle } from "@/lib/services/knowledge-service";
import { knowledgeSchema } from "@/lib/validation/schemas";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireApiSession();
  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) return apiError("Invalid article id", 400);

  const article = await getKnowledgeArticle(articleId);
  if (!article) return apiError("Article not found", 404);
  return apiSuccess({ article });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) return apiError("Invalid article id", 400);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);
  const input = knowledgeSchema.partial().parse(body);

  const article = await updateKnowledgeArticle(articleId, input);
  if (!article) return apiError("Article not found", 404);
  return apiSuccess({ article });
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) return apiError("Invalid article id", 400);

  await deleteKnowledgeArticle(articleId);
  return apiSuccess({ ok: true });
});
