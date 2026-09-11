DROP TABLE "staff" CASCADE;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "audience" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "audience" SET DEFAULT 'all'::text;--> statement-breakpoint
DROP TYPE "public"."audience";--> statement-breakpoint
CREATE TYPE "public"."audience" AS ENUM('all', 'student', 'admin');--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "audience" SET DEFAULT 'all'::"public"."audience";--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "audience" SET DATA TYPE "public"."audience" USING "audience"::"public"."audience";--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "category" SET DEFAULT 'General Information'::text;--> statement-breakpoint
ALTER TABLE "knowledge_base" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."category";--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('Attendance', 'Examinations', 'Fees', 'Scholarships', 'Certificates', 'Hostel', 'Placements', 'Admissions', 'Transportation', 'Library', 'General Information', 'Technical Support', 'Other');--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "category" SET DEFAULT 'General Information'::"public"."category";--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "knowledge_base" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "category" SET DATA TYPE "public"."category" USING "category"::"public"."category";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student'::text;--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'admin');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student'::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'Open'::text;--> statement-breakpoint
DROP TYPE "public"."ticket_status";--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('Open', 'Assigned', 'In Progress', 'Waiting for Student', 'Resolved', 'Closed', 'Reopened');--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'Open'::"public"."ticket_status";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "status" SET DATA TYPE "public"."ticket_status" USING "status"::"public"."ticket_status";