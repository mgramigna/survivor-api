ALTER TABLE "seasons" RENAME COLUMN "id" TO "season_number";--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "season_number" SET DATA TYPE integer;