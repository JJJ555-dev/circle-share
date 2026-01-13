ALTER TABLE `files` ADD `price` decimal(10,2);--> statement-breakpoint
ALTER TABLE `files` ADD `isPaid` tinyint DEFAULT 0 NOT NULL;