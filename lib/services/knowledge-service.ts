import "server-only";
import { db } from "@/lib/db";
import { knowledgeBase } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import type { KnowledgeChunk } from "@/lib/ai/types";

export interface KnowledgeSearchOptions {
  query: string;
  category?: string;
  limit?: number;
}

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "am", "be", "been", "being",
  "i", "me", "my", "we", "us", "our", "you", "your", "he", "she", "it", "they",
  "them", "their", "this", "that", "these", "those", "and", "or", "but", "if",
  "of", "at", "by", "for", "with", "about", "against", "between", "into",
  "through", "during", "to", "from", "up", "down", "in", "out", "on", "off",
  "over", "under", "again", "further", "then", "once", "here", "there", "when",
  "where", "why", "how", "all", "any", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "can", "will", "just", "should", "now", "do", "does",
  "did", "have", "has", "had", "having", "yesterday", "today", "still",
  "please", "hi", "hello", "thanks", "thank",
]);

/**
 * Turns a free-form student question into a tsquery-friendly string where
 * significant words are OR-joined (rather than the implicit AND that
 * websearch_to_tsquery applies to plain words). Requiring every word in a
 * whole sentence to appear in a short knowledge article is too strict for
 * RAG-style retrieval — OR-joining lets ts_rank naturally favor articles
 * that match more of the significant terms, without requiring all of them.
 */
function buildSearchQuery(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const significant = words.length > 0 ? words : [text.trim()];
  return significant.slice(0, 12).join(" or ");
}

/**
 * Retrieval for the RAG pipeline. Uses PostgreSQL full-text search
 * (to_tsvector/websearch_to_tsquery) combined with a simple keyword/title
 * boost, so no external vector database is required. Falls back to a
 * trigram-free ILIKE scan if the FTS query returns nothing (e.g. very
 * short or unusual queries).
 */
export async function searchKnowledgeBase({
  query,
  category,
  limit = 3,
}: KnowledgeSearchOptions): Promise<KnowledgeChunk[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const categoryFilter = category ? eq(knowledgeBase.category, category as never) : undefined;

  const weightedVector = sql`(
    setweight(to_tsvector('english', ${knowledgeBase.title}), 'A') ||
    setweight(to_tsvector('english', coalesce(${knowledgeBase.keywords}, '')), 'A') ||
    setweight(to_tsvector('english', ${knowledgeBase.content}), 'B')
  )`;
  const tsQuery = sql`websearch_to_tsquery('english', ${buildSearchQuery(trimmed)})`;

  const ftsResults = await db
    .select({
      id: knowledgeBase.id,
      title: knowledgeBase.title,
      category: knowledgeBase.category,
      content: knowledgeBase.content,
      department: knowledgeBase.department,
    })
    .from(knowledgeBase)
    .where(
      and(
        eq(knowledgeBase.isPublished, true),
        categoryFilter,
        sql`${weightedVector} @@ ${tsQuery}`
      )
    )
    .orderBy(desc(sql`ts_rank(${weightedVector}, ${tsQuery})`))
    .limit(limit);

  if (ftsResults.length > 0) {
    return ftsResults;
  }

  // Fallback: naive ILIKE match against title/keywords/content, one
  // significant word at a time, so short or unusual queries still surface
  // something relevant even when full-text search finds nothing.
  const significantWords = buildSearchQuery(trimmed).split(" or ").filter(Boolean);
  const likeConditions = significantWords.map(
    (word) =>
      sql`(${knowledgeBase.title} ILIKE ${"%" + word + "%"} OR ${knowledgeBase.keywords} ILIKE ${"%" + word + "%"} OR ${knowledgeBase.content} ILIKE ${"%" + word + "%"})`
  );

  const likeResults = await db
    .select({
      id: knowledgeBase.id,
      title: knowledgeBase.title,
      category: knowledgeBase.category,
      content: knowledgeBase.content,
      department: knowledgeBase.department,
    })
    .from(knowledgeBase)
    .where(
      and(
        eq(knowledgeBase.isPublished, true),
        categoryFilter,
        likeConditions.length > 0 ? sql.join(likeConditions, sql` OR `) : undefined
      )
    )
    .orderBy(desc(knowledgeBase.priority))
    .limit(limit);

  return likeResults;
}

export async function listKnowledgeArticles(category?: string) {
  const where = category && category !== "All"
    ? and(eq(knowledgeBase.isPublished, true), eq(knowledgeBase.category, category as never))
    : eq(knowledgeBase.isPublished, true);

  return db
    .select()
    .from(knowledgeBase)
    .where(where)
    .orderBy(desc(knowledgeBase.priority), desc(knowledgeBase.updatedAt));
}

export async function listAllKnowledgeArticlesForAdmin() {
  return db.select().from(knowledgeBase).orderBy(desc(knowledgeBase.updatedAt));
}

export async function getKnowledgeArticle(id: number) {
  const [article] = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id));
  return article ?? null;
}

export interface CreateKnowledgeInput {
  title: string;
  category: string;
  content: string;
  keywords: string;
  department?: string;
  priority?: number;
  isPublished?: boolean;
}

export async function createKnowledgeArticle(input: CreateKnowledgeInput) {
  const [article] = await db
    .insert(knowledgeBase)
    .values({
      title: input.title,
      category: input.category as never,
      content: input.content,
      keywords: input.keywords,
      department: input.department,
      priority: input.priority ?? 0,
      isPublished: input.isPublished ?? true,
    })
    .returning();
  return article;
}

export async function updateKnowledgeArticle(id: number, input: Partial<CreateKnowledgeInput>) {
  const [article] = await db
    .update(knowledgeBase)
    .set({ ...input, category: input.category as never, updatedAt: new Date() })
    .where(eq(knowledgeBase.id, id))
    .returning();
  return article ?? null;
}

export async function deleteKnowledgeArticle(id: number) {
  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
}
