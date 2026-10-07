CREATE TABLE `journal` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`as_of` integer NOT NULL,
	`mode` text NOT NULL,
	`decision` text NOT NULL,
	`payload` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `journal_created` ON `journal` (`created_at`);--> statement-breakpoint
CREATE INDEX `journal_symbol_time` ON `journal` (`symbol`,`as_of`);--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`symbol` text NOT NULL,
	`mode` text NOT NULL,
	`state` text NOT NULL,
	`risk_amount` real NOT NULL,
	`payload` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `positions_state` ON `positions` (`state`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watchlist` (
	`symbol` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
