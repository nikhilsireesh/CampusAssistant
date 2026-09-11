ALTER TABLE "announcements" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "priority";--> statement-breakpoint
DROP TYPE "public"."priority";