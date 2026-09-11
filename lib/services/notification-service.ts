import "server-only";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function createNotification(input: {
  userId: number;
  title: string;
  message: string;
  link?: string;
}) {
  const [notification] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      title: input.title,
      message: input.message,
      link: input.link,
    })
    .returning();
  return notification;
}

/** Notifies every admin account — used when a ticket is escalated and needs
 * the college administration's attention rather than one specific admin. */
export async function notifyAllAdmins(input: { title: string; message: string; link?: string }) {
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  await Promise.all(
    admins.map((admin) =>
      createNotification({ userId: admin.id, title: input.title, message: input.message, link: input.link })
    )
  );
}

export async function listNotifications(userId: number, limit = 20) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(userId: number) {
  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return rows.length;
}

export async function markNotificationRead(id: number, userId: number) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}
