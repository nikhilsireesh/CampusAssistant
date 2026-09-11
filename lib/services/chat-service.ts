import "server-only";
import { db } from "@/lib/db";
import { chatConversations, chatMessages } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";

export async function listConversations(userId: number) {
  return db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt));
}

export async function getConversation(conversationId: number, userId: number) {
  const [conversation] = await db
    .select()
    .from(chatConversations)
    .where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)));
  return conversation ?? null;
}

export async function getConversationMessages(conversationId: number) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(asc(chatMessages.createdAt));
}

export async function createConversation(userId: number, firstMessage: string) {
  const title = firstMessage.length > 60 ? firstMessage.slice(0, 57) + "..." : firstMessage;
  const [conversation] = await db
    .insert(chatConversations)
    .values({ userId, title })
    .returning();
  return conversation;
}

export async function touchConversation(conversationId: number) {
  await db
    .update(chatConversations)
    .set({ updatedAt: new Date() })
    .where(eq(chatConversations.id, conversationId));
}

export async function addChatMessage(input: {
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  category?: string;
}) {
  const [row] = await db
    .insert(chatMessages)
    .values({
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      category: input.category,
    })
    .returning();
  return row;
}

export async function deleteConversation(conversationId: number, userId: number) {
  await db
    .delete(chatConversations)
    .where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)));
}
