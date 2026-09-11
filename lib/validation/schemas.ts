import { z } from "zod";
import { CATEGORIES } from "@/lib/ai/types";
import { TICKET_STATUSES } from "@/lib/constants/ticket";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  // Which sign-in page the request came from. When present, the API rejects
  // a login whose account role doesn't match — so admin credentials can't
  // be used on the student sign-in page and vice versa.
  portal: z.enum(["student", "admin"]).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long (max 1000 characters)"),
  conversationId: z.number().int().positive().optional(),
});
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const createTicketSchema = z.object({
  category: z.enum(CATEGORIES),
  subject: z.string().min(3, "Subject is too short").max(200),
  description: z.string().min(10, "Please describe your issue in more detail").max(2000),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
  resolution: z.string().max(2000).optional(),
});
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;

export const ticketMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  isInternal: z.boolean().optional().default(false),
});

export const knowledgeSchema = z.object({
  title: z.string().min(3).max(255),
  category: z.enum(CATEGORIES),
  content: z.string().min(10),
  keywords: z.string().min(1),
  department: z.string().optional(),
  priority: z.number().int().min(0).max(10).optional(),
  isPublished: z.boolean().optional(),
});
export type KnowledgeInput = z.infer<typeof knowledgeSchema>;

export const announcementSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
  category: z.enum(CATEGORIES),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional().nullable(),
  audience: z.enum(["all", "student", "admin"]),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  phone: z
    .string()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
