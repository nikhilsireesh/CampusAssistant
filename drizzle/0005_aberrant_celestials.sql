ALTER TABLE "announcements" ALTER COLUMN "priority" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "priority" SET DEFAULT 'urgent'::text;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DEFAULT 'urgent'::text;--> statement-breakpoint
DROP TYPE "public"."priority";--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('urgent');--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "priority" SET DEFAULT 'urgent'::"public"."priority";--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DEFAULT 'urgent'::"public"."priority";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";