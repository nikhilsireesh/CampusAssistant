import "server-only";
import { db } from "@/lib/db";
import { aiInteractions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { classifyCampusQuery, generateCampusResponse, isGeminiConfigured } from "@/lib/ai/gemini";
import { searchKnowledgeBase } from "./knowledge-service";
import { createTicket } from "./ticket-service";
import {
  addChatMessage,
  createConversation,
  getConversation,
  getConversationMessages,
  touchConversation,
} from "./chat-service";
import { CATEGORY_TO_DEPARTMENT } from "@/lib/ai/category-map";

export interface HandleMessageInput {
  userId: number;
  conversationId?: number;
  message: string;
}

export interface HandleMessageResult {
  conversationId: number;
  answer: string;
  category: string;
  department: string;
  requiresTicket: boolean;
  clarificationNeeded: boolean;
  ticket?: { id: number; ticketNumber: string; status: string };
  usedFallback: boolean;
  aiEnabled: boolean;
}

const MODEL_LABEL = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

export async function handleCampusMessage(input: HandleMessageInput): Promise<HandleMessageResult> {
  const message = input.message.trim();

  const [student] = await db.select().from(users).where(eq(users.id, input.userId));
  if (!student) throw new Error("User not found");

  // Resolve or create the conversation this message belongs to.
  let conversationId = input.conversationId;
  if (conversationId) {
    const existing = await getConversation(conversationId, input.userId);
    if (!existing) conversationId = undefined;
  }
  if (!conversationId) {
    const conversation = await createConversation(input.userId, message);
    conversationId = conversation.id;
  }

  const history = await getConversationMessages(conversationId);
  const conversationSummary = history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  await addChatMessage({ conversationId, role: "user", content: message });

  // Step 1: classify (intent, category, requiresTicket)
  const { result: classification, usedFallback: classifyFallback } = await classifyCampusQuery({
    message,
    conversationSummary,
  });

  // Step 2: retrieve relevant knowledge (RAG) scoped to the detected category when confident
  const knowledge = await searchKnowledgeBase({
    query: message,
    category: classification.confidence >= 0.5 ? classification.category : undefined,
    limit: 3,
  });

  // Step 3: generate a grounded answer
  const { answer: aiAnswer, usedFallback: answerFallback } = await generateCampusResponse({
    message,
    knowledge,
    history: history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    studentFirstName: student.name.split(" ")[0],
  });

  const usedFallback = classifyFallback || answerFallback;

  let finalAnswer = aiAnswer;
  let ticket: HandleMessageResult["ticket"];

  // Step 4: create a ticket automatically when the classifier says this needs
  // administrative action and the question isn't just ambiguous.
  if (classification.requiresTicket && !classification.clarificationNeeded) {
    const department = CATEGORY_TO_DEPARTMENT[classification.category];
    const created = await createTicket({
      studentId: input.userId,
      category: classification.category,
      subject: message.length > 120 ? message.slice(0, 117) + "..." : message,
      description: message,
      departmentName: department,
      createdByAi: true,
      aiConfidence: classification.confidence,
    });

    ticket = { id: created.id, ticketNumber: created.ticketNumber, status: created.status };

    finalAnswer = `${aiAnswer}\n\nI've created ticket **${created.ticketNumber}** and submitted it to the ${department} department. You can track its status anytime from "My Requests".`;
  }

  await addChatMessage({
    conversationId,
    role: "assistant",
    content: finalAnswer,
    category: classification.category,
  });
  await touchConversation(conversationId);

  await db.insert(aiInteractions).values({
    conversationId,
    model: usedFallback ? "fallback-rules" : MODEL_LABEL,
    intent: classification.intent,
    category: classification.category,
    confidence: classification.confidence,
    requiresTicket: classification.requiresTicket,
    ticketId: ticket?.id,
    fallbackUsed: usedFallback,
  });

  return {
    conversationId,
    answer: finalAnswer,
    category: classification.category,
    department: CATEGORY_TO_DEPARTMENT[classification.category],
    requiresTicket: classification.requiresTicket,
    clarificationNeeded: classification.clarificationNeeded ?? false,
    ticket,
    usedFallback,
    aiEnabled: isGeminiConfigured(),
  };
}
