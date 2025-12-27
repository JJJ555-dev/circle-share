CREATE TABLE `circle_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`circleId` int NOT NULL,
	`userId` int NOT NULL,
	`action` enum('member_joined','member_left','member_removed','file_uploaded','file_deleted','folder_created','folder_deleted','circle_updated') NOT NULL,
	`targetId` int,
	`targetType` enum('member','file','folder'),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `circle_activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `circle_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`circleId` int NOT NULL,
	`category` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `circle_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `file_share_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`expiresAt` timestamp,
	`downloadCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `file_share_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `file_share_links_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `circle_activity_logs` ADD CONSTRAINT `circle_activity_logs_circleId_circles_id_fk` FOREIGN KEY (`circleId`) REFERENCES `circles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `circle_activity_logs` ADD CONSTRAINT `circle_activity_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `circle_categories` ADD CONSTRAINT `circle_categories_circleId_circles_id_fk` FOREIGN KEY (`circleId`) REFERENCES `circles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `file_share_links` ADD CONSTRAINT `file_share_links_fileId_files_id_fk` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `file_share_links` ADD CONSTRAINT `file_share_links_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `circle_activity_idx` ON `circle_activity_logs` (`circleId`);--> statement-breakpoint
CREATE INDEX `user_activity_idx` ON `circle_activity_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `circle_activity_logs` (`action`);--> statement-breakpoint
CREATE INDEX `created_activity_idx` ON `circle_activity_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `circle_category_idx` ON `circle_categories` (`circleId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `circle_categories` (`category`);--> statement-breakpoint
CREATE INDEX `file_idx` ON `file_share_links` (`fileId`);--> statement-breakpoint
CREATE INDEX `token_idx` ON `file_share_links` (`token`);--> statement-breakpoint
CREATE INDEX `expires_idx` ON `file_share_links` (`expiresAt`);