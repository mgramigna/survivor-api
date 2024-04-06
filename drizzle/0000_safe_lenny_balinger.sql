CREATE TABLE `castaways` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(64) NOT NULL,
	`link` text,
	`image` text
);
--> statement-breakpoint
CREATE TABLE `season_membership` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`castaway_id` integer NOT NULL,
	`castaway_season_number` integer NOT NULL,
	FOREIGN KEY (`castaway_id`) REFERENCES `castaways`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`castaway_season_number`) REFERENCES `seasons`(`season_number`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `seasons` (
	`season_number` integer PRIMARY KEY NOT NULL,
	`name` text(128),
	`location` text(128),
	`start_date` integer,
	`num_episodes` integer,
	`num_castaways` integer,
	`num_days` integer
);
--> statement-breakpoint
CREATE TABLE `tribe_membership` (
	`id` integer PRIMARY KEY NOT NULL,
	`castaway_id` integer NOT NULL,
	`tribe_id` integer NOT NULL,
	FOREIGN KEY (`castaway_id`) REFERENCES `castaways`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tribe_id`) REFERENCES `tribes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tribes` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text(64) NOT NULL,
	`type` text,
	`tribe_season_number` integer NOT NULL,
	FOREIGN KEY (`tribe_season_number`) REFERENCES `seasons`(`season_number`) ON UPDATE no action ON DELETE no action
);
