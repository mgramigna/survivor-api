DO $$ BEGIN
 CREATE TYPE "tribe_tybe" AS ENUM('starting', 'merge', 'swap', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tribes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"type" "tribe_tybe" NOT NULL,
	"tribe_season_number" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "castaways" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "season_membership" ALTER COLUMN "castaway_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "season_membership" ALTER COLUMN "castaway_season_number" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tribes" ADD CONSTRAINT "tribes_tribe_season_number_seasons_season_number_fk" FOREIGN KEY ("tribe_season_number") REFERENCES "seasons"("season_number") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
