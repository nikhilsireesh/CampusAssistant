ALTER TABLE "tickets" DROP CONSTRAINT "tickets_assigned_staff_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "tickets_assigned_idx";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "assigned_staff_id";