CREATE TABLE IF NOT EXISTS "castaways" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64)
);
--> statement-breakpoint
ALTER TABLE "seasons" ALTER COLUMN "name" SET DATA TYPE varchar(64);--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "location" varchar(64);--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "num_episodes" integer;--> statement-breakpoint
ALTER TABLE "seasons" ADD COLUMN "num_castaways" integer;