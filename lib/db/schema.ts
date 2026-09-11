import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const roleEnum = pgEnum("role", ["student", "admin"]);

export const categoryEnum = pgEnum("category", [
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
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "Open",
  "Assigned",
  "In Progress",
  "Waiting for Student",
  "Resolved",
  "Closed",
  "Reopened",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant", "system"]);

export const audienceEnum = pgEnum("audience", ["all", "student", "admin"]);

// ============================================================
// USERS
// ============================================================

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: roleEnum("role").notNull().default("student"),
    phone: varchar("phone", { length: 20 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)]
);

// ============================================================
// STUDENTS (profile extension of users)
// ============================================================

export const students = pgTable(
  "students",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studentId: varchar("student_id", { length: 30 }).notNull(),
    department: varchar("department", { length: 120 }).notNull(),
    program: varchar("program", { length: 120 }).notNull(),
    year: varchar("year", { length: 20 }).notNull(),
    section: varchar("section", { length: 10 }).notNull(),
    admissionYear: integer("admission_year").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("students_user_id_idx").on(table.userId), uniqueIndex("students_student_id_idx").on(table.studentId)]
);

// ============================================================
// DEPARTMENTS
// ============================================================

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  email: varchar("email", { length: 255 }),
  contact: varchar("contact", { length: 30 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// KNOWLEDGE BASE
// ============================================================

export const knowledgeBase = pgTable(
  "knowledge_base",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    category: categoryEnum("category").notNull(),
    content: text("content").notNull(),
    keywords: text("keywords").notNull(), // comma separated
    department: varchar("department", { length: 120 }),
    priority: integer("priority").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("kb_category_idx").on(table.category),
    index("kb_published_idx").on(table.isPublished),
  ]
);

// ============================================================
// TICKETS
// ============================================================

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    ticketNumber: varchar("ticket_number", { length: 40 }).notNull(),
    studentId: integer("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: categoryEnum("category").notNull(),
    departmentId: integer("department_id").references(() => departments.id),
    subject: varchar("subject", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: ticketStatusEnum("status").notNull().default("Open"),
    assignedAdminId: integer("assigned_admin_id").references(() => users.id),
    resolution: text("resolution"),
    createdByAi: boolean("created_by_ai").notNull().default(false),
    aiConfidence: real("ai_confidence"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    uniqueIndex("tickets_number_idx").on(table.ticketNumber),
    index("tickets_student_idx").on(table.studentId),
    index("tickets_status_idx").on(table.status),
    index("tickets_department_idx").on(table.departmentId),
    index("tickets_assigned_idx").on(table.assignedAdminId),
  ]
);

// ============================================================
// TICKET MESSAGES (conversation on a ticket)
// ============================================================

export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    message: text("message").notNull(),
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("ticket_messages_ticket_idx").on(table.ticketId)]
);

// ============================================================
// TICKET EVENTS (timeline)
// ============================================================

export const ticketEvents = pgTable(
  "ticket_events",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 60 }).notNull(),
    description: text("description").notNull(),
    actorId: integer("actor_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("ticket_events_ticket_idx").on(table.ticketId)]
);

// ============================================================
// ANNOUNCEMENTS
// ============================================================

export const announcements = pgTable(
  "announcements",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    category: categoryEnum("category").notNull().default("General Information"),
    publishDate: timestamp("publish_date").notNull().defaultNow(),
    expiryDate: timestamp("expiry_date"),
    audience: audienceEnum("audience").notNull().default("all"),
    isActive: boolean("is_active").notNull().default(true),
    createdByAdminId: integer("created_by_admin_id").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("announcements_active_idx").on(table.isActive)]
);

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    link: varchar("link", { length: 255 }),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("notifications_user_idx").on(table.userId)]
);

// ============================================================
// CHAT CONVERSATIONS / MESSAGES / AI INTERACTIONS
// ============================================================

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("New conversation"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("chat_conversations_user_idx").on(table.userId)]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id")
      .notNull()
      .references(() => chatConversations.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 60 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("chat_messages_conversation_idx").on(table.conversationId)]
);

export const aiInteractions = pgTable(
  "ai_interactions",
  {
    id: serial("id").primaryKey(),
    conversationId: integer("conversation_id").references(() => chatConversations.id, {
      onDelete: "cascade",
    }),
    model: varchar("model", { length: 80 }).notNull(),
    intent: varchar("intent", { length: 80 }),
    category: varchar("category", { length: 60 }),
    confidence: real("confidence"),
    requiresTicket: boolean("requires_ticket").notNull().default(false),
    ticketId: integer("ticket_id").references(() => tickets.id),
    fallbackUsed: boolean("fallback_used").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("ai_interactions_conversation_idx").on(table.conversationId)]
);

// ============================================================
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  tickets: many(tickets),
  notifications: many(notifications),
  chatConversations: many(chatConversations),
}));

export const studentsRelations = relations(students, ({ one }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  student: one(users, { fields: [tickets.studentId], references: [users.id] }),
  department: one(departments, { fields: [tickets.departmentId], references: [departments.id] }),
  assignedAdmin: one(users, { fields: [tickets.assignedAdminId], references: [users.id] }),
  messages: many(ticketMessages),
  events: many(ticketEvents),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketMessages.ticketId], references: [tickets.id] }),
  author: one(users, { fields: [ticketMessages.authorId], references: [users.id] }),
}));

export const ticketEventsRelations = relations(ticketEvents, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketEvents.ticketId], references: [tickets.id] }),
  actor: one(users, { fields: [ticketEvents.actorId], references: [users.id] }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  user: one(users, { fields: [chatConversations.userId], references: [users.id] }),
  messages: many(chatMessages),
  interactions: many(aiInteractions),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [aiInteractions.conversationId],
    references: [chatConversations.id],
  }),
  ticket: one(tickets, { fields: [aiInteractions.ticketId], references: [tickets.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
