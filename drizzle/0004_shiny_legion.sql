CREATE TABLE IF NOT EXISTS "season_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"castaway_id" integer,
	"castaway_season_number" integer
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "season_membership" ADD CONSTRAINT "season_membership_castaway_id_castaways_id_fk" FOREIGN KEY ("castaway_id") REFERENCES "castaways"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "season_membership" ADD CONSTRAINT "season_membership_castaway_season_number_seasons_season_number_fk" FOREIGN KEY ("castaway_season_number") REFERENCES "seasons"("season_number") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
