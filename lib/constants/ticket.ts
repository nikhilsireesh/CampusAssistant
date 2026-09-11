/** Shared ticket status constants — safe to import from both server and
 * client code (unlike lib/services/ticket-service.ts, which is server-only). */
export const TICKET_STATUSES = [
  "Open",
  "Assigned",
  "In Progress",
  "Waiting for Student",
  "Resolved",
  "Closed",
  "Reopened",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
