import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/auth/api-guards";
import { acceptTicket, getTicketDetail, updateTicketStatus } from "@/lib/services/ticket-service";
import { updateTicketStatusSchema } from "@/lib/validation/schemas";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

function canView(session: { userId: number; role: string }, ticket: { studentId: number }) {
  if (session.role === "admin") return true;
  if (session.role === "student") return ticket.studentId === session.userId;
  return false;
}

export const GET = withErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApiSession();
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) return apiError("Invalid ticket id", 400);

  const detail = await getTicketDetail(ticketId);
  if (!detail) return apiError("Ticket not found", 404);

  if (!canView(session, detail.ticket)) {
    return apiError("You do not have permission to view this ticket.", 403);
  }

  // Students never see admin's internal notes.
  const messages =
    session.role === "student" ? detail.messages.filter((m) => !m.isInternal) : detail.messages;

  return apiSuccess({ ...detail, messages });
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApiSession();
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) return apiError("Invalid ticket id", 400);

  const detail = await getTicketDetail(ticketId);
  if (!detail) return apiError("Ticket not found", 404);
  if (!canView(session, detail.ticket)) {
    return apiError("You do not have permission to modify this ticket.", 403);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.action !== "string") return apiError("Invalid request body", 400);

  // A student's only allowed action is closing or reopening their OWN
  // already-resolved ticket — the final "I confirm this is done" step.
  // Every other action stays admin-only.
  if (session.role === "student") {
    const isCloseOrReopen =
      body.action === "status" && (body.status === "Closed" || body.status === "Reopened");
    if (!isCloseOrReopen) {
      return apiError("Students can only close or reopen a resolved ticket.", 403);
    }
    if (detail.ticket.status !== "Resolved") {
      return apiError("You can only close or reopen a ticket once it has been resolved.", 400);
    }
  }

  switch (body.action) {
    case "status": {
      const input = updateTicketStatusSchema.parse(body);
      const updated = await updateTicketStatus(ticketId, input.status, session.userId, input.resolution);
      return apiSuccess({ ticket: updated });
    }
    case "accept": {
      if (session.role !== "admin") {
        return apiError("Only an admin can accept a ticket.", 403);
      }
      if (["Resolved", "Closed"].includes(detail.ticket.status)) {
        return apiError("This ticket is already closed.", 400);
      }
      await acceptTicket(ticketId, session.userId);
      return apiSuccess({ ok: true });
    }
    default:
      return apiError("Unknown action", 400);
  }
});
