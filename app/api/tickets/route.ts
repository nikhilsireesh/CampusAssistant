import { NextRequest } from "next/server";
import { requireApiSession } from "@/lib/auth/api-guards";
import { createTicketSchema } from "@/lib/validation/schemas";
import { CATEGORY_TO_DEPARTMENT } from "@/lib/ai/category-map";
import { createTicket, listAllTickets, listTicketsForStudent } from "@/lib/services/ticket-service";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireApiSession();
  const { searchParams } = new URL(req.url);
  const filters = {
    status: searchParams.get("status") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : undefined,
    pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : undefined,
  };

  if (session.role === "student") {
    const rows = await listTicketsForStudent(session.userId, filters);
    return apiSuccess({ tickets: rows });
  }

  // admin
  const departmentId = searchParams.get("departmentId") ? Number(searchParams.get("departmentId")) : undefined;
  const result = await listAllTickets({ ...filters, departmentId });
  return apiSuccess({ tickets: result.rows, total: result.total, page: result.page, pageSize: result.pageSize });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await requireApiSession();
  if (session.role !== "student") {
    return apiError("Only students can submit a new request.", 403);
  }

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);
  const input = createTicketSchema.parse(body);

  const ticket = await createTicket({
    studentId: session.userId,
    category: input.category,
    subject: input.subject,
    description: input.description,
    departmentName: CATEGORY_TO_DEPARTMENT[input.category],
    createdByAi: false,
  });

  return apiSuccess({ ticket }, 201);
});
