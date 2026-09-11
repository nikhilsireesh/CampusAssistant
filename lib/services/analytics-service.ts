import "server-only";
import { db } from "@/lib/db";
import { tickets, users, aiInteractions, chatMessages } from "@/lib/db/schema";
import { sql, eq, count, gte } from "drizzle-orm";

export async function getAdminOverview() {
  const [[{ value: totalStudents }], [{ value: totalTickets }], [{ value: openTickets }], [{ value: resolvedTickets }], [{ value: pendingTickets }]] =
    await Promise.all([
      db.select({ value: count() }).from(users).where(eq(users.role, "student")),
      db.select({ value: count() }).from(tickets),
      db.select({ value: count() }).from(tickets).where(eq(tickets.status, "Open")),
      db
        .select({ value: count() })
        .from(tickets)
        .where(sql`${tickets.status} IN ('Resolved', 'Closed')`),
      db
        .select({ value: count() })
        .from(tickets)
        .where(sql`${tickets.status} IN ('Open', 'Assigned', 'In Progress', 'Waiting for Student', 'Reopened')`),
    ]);

  const [{ value: aiInteractionCount }] = await db.select({ value: count() }).from(aiInteractions);
  const [{ value: aiResolvedCount }] = await db
    .select({ value: count() })
    .from(aiInteractions)
    .where(eq(aiInteractions.requiresTicket, false));
  const [{ value: escalatedCount }] = await db
    .select({ value: count() })
    .from(aiInteractions)
    .where(eq(aiInteractions.requiresTicket, true));

  const avgResolutionRow = await db.execute<{ avg_hours: number | null }>(sql`
    SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0) AS avg_hours
    FROM tickets
    WHERE resolved_at IS NOT NULL
  `);
  const avgResolutionHours = Number(avgResolutionRow.rows[0]?.avg_hours ?? 0) || 0;

  const avgFirstResponseRow = await db.execute<{ avg_hours: number | null }>(sql`
    SELECT AVG(EXTRACT(EPOCH FROM (fm.first_message_at - t.created_at)) / 3600.0) AS avg_hours
    FROM tickets t
    JOIN (
      SELECT ticket_id, MIN(created_at) AS first_message_at
      FROM ticket_messages
      GROUP BY ticket_id
    ) fm ON fm.ticket_id = t.id
  `);
  const avgResponseHours = Number(avgFirstResponseRow.rows[0]?.avg_hours ?? 0) || 0;

  return {
    totalStudents,
    totalTickets,
    openTickets,
    resolvedTickets,
    pendingTickets,
    aiInteractionCount,
    aiResolvedCount,
    escalatedCount,
    aiResolutionRate: aiInteractionCount > 0 ? aiResolvedCount / aiInteractionCount : 0,
    avgResolutionHours: Math.round(avgResolutionHours * 10) / 10,
    avgResponseHours: Math.round(avgResponseHours * 10) / 10,
  };
}

export async function getTicketsByCategory() {
  const rows = await db
    .select({ category: tickets.category, value: count() })
    .from(tickets)
    .groupBy(tickets.category)
    .orderBy(sql`count(*) DESC`);
  return rows.map((r) => ({ name: r.category, value: r.value }));
}

export async function getTicketsByDepartment() {
  const rows = await db.execute<{ name: string; value: number }>(sql`
    SELECT d.name AS name, COUNT(t.id)::int AS value
    FROM departments d
    LEFT JOIN tickets t ON t.department_id = d.id
    GROUP BY d.name
    ORDER BY value DESC
  `);
  return rows.rows;
}

export async function getTicketsOverTime(days = 30) {
  const rows = await db.execute<{ day: string; value: number }>(sql`
    SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS value
    FROM tickets
    WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days'
    GROUP BY 1
    ORDER BY 1
  `);
  return rows.rows;
}

export async function getStatusDistribution() {
  const rows = await db
    .select({ status: tickets.status, value: count() })
    .from(tickets)
    .groupBy(tickets.status);
  return rows.map((r) => ({ name: r.status, value: r.value }));
}

export async function getFrequentCategories(limit = 5) {
  const rows = await db
    .select({ category: chatMessages.category, value: count() })
    .from(chatMessages)
    .where(sql`${chatMessages.category} IS NOT NULL`)
    .groupBy(chatMessages.category)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);
  return rows.map((r) => ({ name: r.category, value: r.value }));
}

export async function getRecentTicketCount(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [{ value }] = await db.select({ value: count() }).from(tickets).where(gte(tickets.createdAt, since));
  return value;
}
