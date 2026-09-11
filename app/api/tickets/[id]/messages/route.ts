import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/auth/api-guards";
import { addTicketMessage, getTicketDetail } from "@/lib/services/ticket-service";
import { ticketMessageSchema } from "@/lib/validation/schemas";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const POST = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireApiSession();
  const { id } = await params;
  const ticketId = Number(id);
  if (!Number.isInteger(ticketId)) return apiError("Invalid ticket id", 400);

  const detail = await getTicketDetail(ticketId);
  if (!detail) return apiError("Ticket not found", 404);

  const allowed = session.role === "admin" || detail.ticket.studentId === session.userId;
  if (!allowed) return apiError("You do not have permission to reply to this ticket.", 403);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);
  const input = ticketMessageSchema.parse(body);

  // Students can never post internal-only notes.
  const isInternal = session.role !== "student" && input.isInternal;

  const message = await addTicketMessage(ticketId, session.userId, input.message, isInternal);
  return apiSuccess({ message }, 201);
});
