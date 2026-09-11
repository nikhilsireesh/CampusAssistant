import { NextRequest } from "next/server";
import { z } from "zod";
import { requireApiRole } from "@/lib/auth/api-guards";
import { deleteAnnouncement, updateAnnouncement } from "@/lib/services/announcement-service";
import { announcementSchema } from "@/lib/validation/schemas";
import { apiError, apiSuccess, withErrorHandling } from "@/lib/api/response";

const updateAnnouncementSchema = announcementSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const announcementId = Number(id);
  if (!Number.isInteger(announcementId)) return apiError("Invalid announcement id", 400);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid request body", 400);
  const input = updateAnnouncementSchema.parse(body);

  const announcement = await updateAnnouncement(announcementId, {
    ...input,
    publishDate: input.publishDate ? new Date(input.publishDate) : undefined,
    expiryDate: input.expiryDate === undefined ? undefined : input.expiryDate ? new Date(input.expiryDate) : null,
  });
  if (!announcement) return apiError("Announcement not found", 404);
  return apiSuccess({ announcement });
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireApiRole("admin");
  const { id } = await params;
  const announcementId = Number(id);
  if (!Number.isInteger(announcementId)) return apiError("Invalid announcement id", 400);

  await deleteAnnouncement(announcementId);
  return apiSuccess({ ok: true });
});
