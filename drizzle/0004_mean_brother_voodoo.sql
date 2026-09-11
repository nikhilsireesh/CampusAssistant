ALTER TABLE "tickets" ADD COLUMN "assigned_admin_id" integer;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tickets_assigned_idx" ON "tickets" USING btree ("assigned_admin_id");