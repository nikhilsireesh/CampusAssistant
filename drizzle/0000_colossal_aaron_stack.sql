CREATE TYPE "public"."audience" AS ENUM('all', 'student', 'staff', 'admin');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('Attendance', 'Examinations', 'Fees', 'Scholarships', 'Certificates', 'Hostel', 'Placements', 'Academics', 'Admissions', 'Transportation', 'Library', 'General Information', 'Technical Support', 'Other');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'staff', 'admin');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('Open', 'Assigned', 'In Progress', 'Waiting for Student', 'Resolved', 'Closed', 'Reopened');--> statement-breakpoint
CREATE TABLE "ai_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"model" varchar(80) NOT NULL,
	"intent" varchar(80),
	"category" varchar(60),
	"confidence" real,
	"requires_ticket" boolean DEFAULT false NOT NULL,
	"ticket_id" integer,
	"fallback_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"category" "category" DEFAULT 'General Information' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"publish_date" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp,
	"audience" "audience" DEFAULT 'all' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by_admin_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) DEFAULT 'New conversation' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"category" varchar(60),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"email" varchar(255),
	"contact" varchar(30),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" "category" NOT NULL,
	"content" text NOT NULL,
	"keywords" text NOT NULL,
	"department" varchar(120),
	"priority" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"link" varchar(255),
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"department_id" integer,
	"designation" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"student_id" varchar(30) NOT NULL,
	"department" varchar(120) NOT NULL,
	"program" varchar(120) NOT NULL,
	"year" varchar(20) NOT NULL,
	"section" varchar(10) NOT NULL,
	"admission_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"event_type" varchar(60) NOT NULL,
	"description" text NOT NULL,
	"actor_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"message" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_number" varchar(40) NOT NULL,
	"student_id" integer NOT NULL,
	"category" "category" NOT NULL,
	"department_id" integer,
	"subject" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"status" "ticket_status" DEFAULT 'Open' NOT NULL,
	"assigned_staff_id" integer,
	"resolution" text,
	"created_by_ai" boolean DEFAULT false NOT NULL,
	"ai_confidence" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'student' NOT NULL,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_admin_id_users_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversation_id_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_events" ADD CONSTRAINT "ticket_events_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_events" ADD CONSTRAINT "ticket_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_staff_id_users_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_interactions_conversation_idx" ON "ai_interactions" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "announcements_active_idx" ON "announcements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "chat_conversations_user_idx" ON "chat_conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_messages_conversation_idx" ON "chat_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "kb_category_idx" ON "knowledge_base" USING btree ("category");--> statement-breakpoint
CREATE INDEX "kb_published_idx" ON "knowledge_base" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_user_id_idx" ON "staff" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_user_id_idx" ON "students" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_student_id_idx" ON "students" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "ticket_events_ticket_idx" ON "ticket_events" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_messages_ticket_idx" ON "ticket_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_number_idx" ON "tickets" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "tickets_student_idx" ON "tickets" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_department_idx" ON "tickets" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "tickets_assigned_idx" ON "tickets" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");