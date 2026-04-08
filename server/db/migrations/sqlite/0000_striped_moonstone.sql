CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`location` text,
	`image_key` text,
	`submitter_email` text NOT NULL,
	`submitter_name` text,
	`status` text DEFAULT 'unconfirmed' NOT NULL,
	`confirmation_token` text,
	`token_expires_at` text,
	`moderator_notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `moderators` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moderators_email_unique` ON `moderators` (`email`);