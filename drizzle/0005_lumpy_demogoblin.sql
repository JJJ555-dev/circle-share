CREATE TABLE `admin_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` enum('user_disabled','user_enabled','user_deleted','announcement_created','announcement_published','announcement_deleted','system_setting_changed') NOT NULL,
	`targetUserId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`createdBy` int NOT NULL,
	`isPublished` tinyint NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalUsers` int DEFAULT 0,
	`totalCircles` int DEFAULT 0,
	`totalFiles` bigint DEFAULT 0,
	`totalStorage` bigint DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `site_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `admin_logs` ADD CONSTRAINT `admin_logs_adminId_users_id_fk` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `admin_logs` ADD CONSTRAINT `admin_logs_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcements` ADD CONSTRAINT `announcements_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `admin_idx` ON `admin_logs` (`adminId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `admin_logs` (`action`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `admin_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `announcements` (`createdBy`);--> statement-breakpoint
CREATE INDEX `published_idx` ON `announcements` (`isPublished`);--> statement-breakpoint
CREATE INDEX `published_at_idx` ON `announcements` (`publishedAt`);