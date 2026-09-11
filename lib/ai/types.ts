import { z } from "zod";

export const CATEGORIES = [
  "Attendance",
  "Examinations",
  "Fees",
  "Scholarships",
  "Certificates",
  "Hostel",
  "Placements",
  "Admissions",
  "Transportation",
  "Library",
  "General Information",
  "Technical Support",
  "Other",
] as const;

export const classificationSchema = z.object({
  intent: z.string().min(1).max(80),
  category: z.enum(CATEGORIES),
  department: z.string().min(1).max(120),
  requiresTicket: z.boolean(),
  confidence: z.number().min(0).max(1),
  clarificationNeeded: z.boolean().optional().default(false),
  clarificationQuestion: z.string().optional().nullable(),
});

export type Classification = z.infer<typeof classificationSchema>;

export interface KnowledgeChunk {
  id: number;
  title: string;
  category: string;
  content: string;
  department: string | null;
}

export interface CampusAiResult {
  answer: string;
  classification: Classification;
  usedFallback: boolean;
  knowledgeUsed: KnowledgeChunk[];
  ticketSuggested: boolean;
}
