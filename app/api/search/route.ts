import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/auth/api-guards";
import { db } from "@/lib/db";
import { tickets, announcements } from "@/lib/db/schema";
import { and, eq, or, sql } from "drizzle-orm";
import { searchKnowledgeBase } from "@/lib/services/knowledge-service";
import { apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireApiSession();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q || q.length < 2) {
    return apiSuccess({ knowledge: [], tickets: [], announcements: [] });
  }

  const knowledge = await searchKnowledgeBase({ query: q, limit: 5 });

  const ticketConditions = [
    or(sql`${tickets.subject} ILIKE ${"%" + q + "%"}`, sql`${tickets.ticketNumber} ILIKE ${"%" + q + "%"}`),
  ];
  if (session.role === "student") {
    ticketConditions.push(eq(tickets.studentId, session.userId));
  }
  const ticketResults = await db
    .select({ id: tickets.id, ticketNumber: tickets.ticketNumber, subject: tickets.subject, status: tickets.status })
    .from(tickets)
    .where(and(...ticketConditions))
    .limit(5);

  const announcementResults = await db
    .select({ id: announcements.id, title: announcements.title, category: announcements.category })
    .from(announcements)
    .where(
      and(
        eq(announcements.isActive, true),
        or(eq(announcements.audience, "all"), eq(announcements.audience, session.role)),
        sql`${announcements.title} ILIKE ${"%" + q + "%"}`
      )
    )
    .limit(5);

  return apiSuccess({ knowledge, tickets: ticketResults, announcements: announcementResults });
});
