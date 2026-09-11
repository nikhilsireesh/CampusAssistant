import "server-only";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { and, desc, eq, or, sql } from "drizzle-orm";

export async function listActiveAnnouncementsForAudience(audience: "student" | "admin") {
  const now = new Date();
  return db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.isActive, true),
        or(eq(announcements.audience, "all"), eq(announcements.audience, audience)),
        sql`${announcements.publishDate} <= ${now}`,
        or(sql`${announcements.expiryDate} IS NULL`, sql`${announcements.expiryDate} >= ${now}`)
      )
    )
    .orderBy(desc(announcements.publishDate));
}

export async function listAllAnnouncements() {
  return db.select().from(announcements).orderBy(desc(announcements.publishDate));
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  category: string;
  publishDate?: Date;
  expiryDate?: Date | null;
  audience: string;
  createdByAdminId: number;
}

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const [row] = await db
    .insert(announcements)
    .values({
      title: input.title,
      content: input.content,
      category: input.category as never,
      publishDate: input.publishDate ?? new Date(),
      expiryDate: input.expiryDate,
      audience: input.audience as never,
      createdByAdminId: input.createdByAdminId,
    })
    .returning();
  return row;
}

export async function updateAnnouncement(id: number, input: Partial<CreateAnnouncementInput> & { isActive?: boolean }) {
  const [row] = await db
    .update(announcements)
    .set({ ...input, category: input.category as never, audience: input.audience as never })
    .where(eq(announcements.id, id))
    .returning();
  return row ?? null;
}

export async function deleteAnnouncement(id: number) {
  await db.delete(announcements).where(eq(announcements.id, id));
}
