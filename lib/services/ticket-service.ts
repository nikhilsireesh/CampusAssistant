import "server-only";
import { db } from "@/lib/db";
import { tickets, ticketMessages, ticketEvents, users, departments } from "@/lib/db/schema";
import { and, desc, eq, sql, count, isNull } from "drizzle-orm";
import { createNotification, notifyAllAdmins } from "./notification-service";
import { getDepartmentByName } from "./department-service";
import type { TicketStatus } from "@/lib/constants/ticket";
export type { TicketStatus };

export const TICKET_PREFIXES: Record<string, string> = {
  Attendance: "ATT",
  Examinations: "EXM",
  Fees: "FEE",
  Scholarships: "SCH",
  Certificates: "CERT",
  Hostel: "HOST",
  Placements: "PLC",
  Admissions: "ADM",
  Transportation: "TRN",
  Library: "LIB",
  "General Information": "GEN",
  "Technical Support": "TECH",
  Other: "OTH",
};

async function nextSequenceValue(): Promise<number> {
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1`);
  const result = await db.execute<{ val: string }>(sql`SELECT nextval('ticket_seq') AS val`);
  const row = result.rows[0] as unknown as { val: string };
  return Number(row.val);
}

export async function generateTicketNumber(category: string): Promise<string> {
  const prefix = TICKET_PREFIXES[category] ?? "GEN";
  const year = new Date().getFullYear();
  const seq = await nextSequenceValue();
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export interface CreateTicketInput {
  studentId: number;
  category: string;
  subject: string;
  description: string;
  departmentName: string;
  createdByAi?: boolean;
  aiConfidence?: number;
}

/**
 * Every request goes straight to admin — there is no staff layer in
 * between. `department` is kept purely as an organizational/reporting tag
 * (shown as a badge, used in analytics) so it's still clear which campus
 * office a request relates to, even though admin handles all of it.
 */
export async function createTicket(input: CreateTicketInput) {
  const department = await getDepartmentByName(input.departmentName);
  const ticketNumber = await generateTicketNumber(input.category);

  const [ticket] = await db
    .insert(tickets)
    .values({
      ticketNumber,
      studentId: input.studentId,
      category: input.category as never,
      departmentId: department?.id,
      subject: input.subject,
      description: input.description,
      status: "Open",
      createdByAi: input.createdByAi ?? false,
      aiConfidence: input.aiConfidence,
    })
    .returning();

  await db.insert(ticketEvents).values({
    ticketId: ticket.id,
    eventType: "created",
    description: "Request submitted",
    actorId: input.studentId,
  });

  if (department) {
    await db.insert(ticketEvents).values({
      ticketId: ticket.id,
      eventType: "routed",
      description: `Routed to admin — ${department.name}`,
      actorId: input.studentId,
    });
  }

  await createNotification({
    userId: input.studentId,
    title: `Ticket ${ticket.ticketNumber} submitted`,
    message: "Your request has been submitted to the college administration.",
    link: `/student/requests/${ticket.id}`,
  });

  await notifyAllAdmins({
    title: `New request: ${ticket.ticketNumber}`,
    message: ticket.subject,
    link: `/admin/tickets/${ticket.id}`,
  });

  return ticket;
}

export interface TicketFilters {
  status?: string;
  category?: string;
  departmentId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

const TICKET_WITH_RELATIONS_COLUMNS = {
  id: tickets.id,
  ticketNumber: tickets.ticketNumber,
  category: tickets.category,
  subject: tickets.subject,
  description: tickets.description,
  status: tickets.status,
  createdAt: tickets.createdAt,
  updatedAt: tickets.updatedAt,
  resolvedAt: tickets.resolvedAt,
  studentId: tickets.studentId,
  assignedAdminId: tickets.assignedAdminId,
  departmentId: tickets.departmentId,
  createdByAi: tickets.createdByAi,
};

export async function listTicketsForStudent(studentId: number, filters: TicketFilters = {}) {
  const conditions = [eq(tickets.studentId, studentId)];
  if (filters.status) conditions.push(eq(tickets.status, filters.status as never));
  if (filters.category) conditions.push(eq(tickets.category, filters.category as never));

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 20;

  return db
    .select(TICKET_WITH_RELATIONS_COLUMNS)
    .from(tickets)
    .where(and(...conditions))
    .orderBy(desc(tickets.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

/** New requests nobody has accepted yet — surfaced prominently on the
 * admin dashboard so a student's ticket is never invisible. */
export async function listUnassignedTickets(limit = 5) {
  return db
    .select(TICKET_WITH_RELATIONS_COLUMNS)
    .from(tickets)
    .where(and(isNull(tickets.assignedAdminId), sql`${tickets.status} NOT IN ('Resolved', 'Closed')`))
    .orderBy(desc(tickets.createdAt))
    .limit(limit);
}

export async function countUnassignedTickets() {
  const [{ value }] = await db
    .select({ value: count() })
    .from(tickets)
    .where(and(isNull(tickets.assignedAdminId), sql`${tickets.status} NOT IN ('Resolved', 'Closed')`));
  return value;
}

export async function listAllTickets(filters: TicketFilters = {}) {
  const conditions = [];
  if (filters.status) conditions.push(eq(tickets.status, filters.status as never));
  if (filters.category) conditions.push(eq(tickets.category, filters.category as never));
  if (filters.departmentId) conditions.push(eq(tickets.departmentId, filters.departmentId));

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 25;

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select(TICKET_WITH_RELATIONS_COLUMNS)
    .from(tickets)
    .where(where)
    .orderBy(desc(tickets.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(tickets)
    .where(where);

  return { rows, total, page, pageSize };
}

export async function getTicketDetail(ticketId: number) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
  if (!ticket) return null;

  const [student] = await db.select().from(users).where(eq(users.id, ticket.studentId));
  const assignedAdmin = ticket.assignedAdminId
    ? (await db.select().from(users).where(eq(users.id, ticket.assignedAdminId)))[0]
    : null;
  const department = ticket.departmentId
    ? (await db.select().from(departments).where(eq(departments.id, ticket.departmentId)))[0]
    : null;

  const messages = await db
    .select({
      id: ticketMessages.id,
      message: ticketMessages.message,
      isInternal: ticketMessages.isInternal,
      createdAt: ticketMessages.createdAt,
      authorId: ticketMessages.authorId,
      authorName: users.name,
      authorRole: users.role,
    })
    .from(ticketMessages)
    .innerJoin(users, eq(ticketMessages.authorId, users.id))
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(ticketMessages.createdAt);

  const events = await db
    .select()
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, ticketId))
    .orderBy(ticketEvents.createdAt);

  return {
    ticket,
    student: student ? { id: student.id, name: student.name, email: student.email } : null,
    assignedAdmin: assignedAdmin ? { id: assignedAdmin.id, name: assignedAdmin.name } : null,
    department,
    messages,
    events,
  };
}

export async function addTicketMessage(ticketId: number, authorId: number, message: string, isInternal = false) {
  const [row] = await db
    .insert(ticketMessages)
    .values({ ticketId, authorId, message, isInternal })
    .returning();

  await db.update(tickets).set({ updatedAt: new Date() }).where(eq(tickets.id, ticketId));

  if (!isInternal) {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
    const [author] = await db.select().from(users).where(eq(users.id, authorId));
    if (ticket && author && author.id !== ticket.studentId) {
      await createNotification({
        userId: ticket.studentId,
        title: `New response on ${ticket.ticketNumber}`,
        message: `${author.name} replied to your request.`,
        link: `/student/requests/${ticket.id}`,
      });
    }
  }

  return row;
}

export async function updateTicketStatus(
  ticketId: number,
  status: TicketStatus,
  actorId: number,
  resolution?: string
) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
  if (!ticket) throw new Error("Ticket not found");

  const updates: Partial<typeof tickets.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };
  if (resolution) updates.resolution = resolution;
  // Only stamp resolvedAt the first time a ticket is actually resolved —
  // a student closing it afterward shouldn't overwrite when it was fixed.
  if (status === "Resolved" && !ticket.resolvedAt) updates.resolvedAt = new Date();

  await db.update(tickets).set(updates).where(eq(tickets.id, ticketId));

  const isStudentAction = actorId === ticket.studentId;
  const eventDescription =
    status === "Closed" && isStudentAction
      ? "Closed by student — issue confirmed resolved"
      : status === "Reopened" && isStudentAction
        ? "Reopened by student — issue not fully resolved"
        : `Status changed to ${status}`;

  await db.insert(ticketEvents).values({
    ticketId,
    eventType: "status_change",
    description: eventDescription,
    actorId,
  });

  if (isStudentAction) {
    // The student changed their own ticket — notify the admin who handled
    // it instead of notifying the student about their own action.
    if (ticket.assignedAdminId) {
      await createNotification({
        userId: ticket.assignedAdminId,
        title: `Ticket ${ticket.ticketNumber} ${status.toLowerCase()}`,
        message:
          status === "Closed"
            ? "The student confirmed this request is resolved and closed it."
            : "The student reopened this request — the issue isn't fully resolved.",
        link: `/admin/tickets/${ticket.id}`,
      });
    }
  } else {
    await createNotification({
      userId: ticket.studentId,
      title: `Ticket ${ticket.ticketNumber} updated`,
      message:
        status === "Resolved"
          ? "Your request has been resolved."
          : `Your ticket status changed to "${status}".`,
      link: `/student/requests/${ticket.id}`,
    });
  }

  return { ...ticket, ...updates };
}

/**
 * Admin accepts ownership of a ticket — self-assigns it and moves it into
 * "In Progress". This is the explicit first step: Accept -> Resolve.
 */
export async function acceptTicket(ticketId: number, adminId: number) {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.id, ticketId));
  if (!ticket) throw new Error("Ticket not found");

  const [adminUser] = await db.select().from(users).where(eq(users.id, adminId));

  await db
    .update(tickets)
    .set({
      assignedAdminId: adminId,
      status: "In Progress",
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId));

  await db.insert(ticketEvents).values({
    ticketId,
    eventType: "accepted",
    description: `Accepted by ${adminUser?.name ?? "admin"} and is now being worked on`,
    actorId: adminId,
  });

  await createNotification({
    userId: ticket.studentId,
    title: `Ticket ${ticket.ticketNumber} accepted`,
    message: `${adminUser?.name ?? "The college administration"} has accepted your request and is working on it.`,
    link: `/student/requests/${ticket.id}`,
  });
}

export function isTicketVisibleToUser(
  ticket: { studentId: number },
  userId: number,
  role: string
): boolean {
  if (role === "admin") return true;
  if (role === "student") return ticket.studentId === userId;
  return false;
}
