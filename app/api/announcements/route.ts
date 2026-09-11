import { NextRequest } from "next/server";
import { requireApiSession, requireApiRole } from "@/lib/auth/api-guards";
import {
  createAnnouncement,
  listActiveAnnouncementsForAudience,
  listAllAnnouncements,
} from "@/lib/services/announcement-service";
import { announcementSchema } from "@/lib/validation/schemas";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = await requireApiSession();
  const { searchParams } = new URL(req.url);

  if (session.role === "admin" && searchParams.get("all") === "true") {
    const announcements = await listAllAnnouncements();
    return apiSuccess({ announcements });
  }

  const announcements = await listActiveAnnouncementsForAudience(session.role);
  return apiSuccess({ announcements });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await requireApiRole("admin");
  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);
  const input = announcementSchema.parse(body);

  const announcement = await createAnnouncement({
    ...input,
    publishDate: input.publishDate ? new Date(input.publishDate) : undefined,
    expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
    createdByAdminId: session.userId,
  });
  return apiSuccess({ announcement }, 201);
});
