CREATE TABLE IF NOT EXISTS "tribe_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"castaway_id" integer NOT NULL,
	"tribe_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tribe_membership" ADD CONSTRAINT "tribe_membership_castaway_id_castaways_id_fk" FOREIGN KEY ("castaway_id") REFERENCES "castaways"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tribe_membership" ADD CONSTRAINT "tribe_membership_tribe_id_tribes_id_fk" FOREIGN KEY ("tribe_id") REFERENCES "tribes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
