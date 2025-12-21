CREATE TABLE `circle_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`circleId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `circle_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `circles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`creatorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `circles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`circleId` int NOT NULL,
	`uploaderId` int NOT NULL,
	`filename` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`fileSize` bigint NOT NULL,
	`fileType` enum('video','audio','image') NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `circle_members` ADD CONSTRAINT `circle_members_circleId_circles_id_fk` FOREIGN KEY (`circleId`) REFERENCES `circles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `circle_members` ADD CONSTRAINT `circle_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `circles` ADD CONSTRAINT `circles_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_circleId_circles_id_fk` FOREIGN KEY (`circleId`) REFERENCES `circles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_uploaderId_users_id_fk` FOREIGN KEY (`uploaderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `circle_idx` ON `circle_members` (`circleId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `circle_members` (`userId`);--> statement-breakpoint
CREATE INDEX `unique_membership` ON `circle_members` (`circleId`,`userId`);--> statement-breakpoint
CREATE INDEX `creator_idx` ON `circles` (`creatorId`);--> statement-breakpoint
CREATE INDEX `circle_idx` ON `files` (`circleId`);--> statement-breakpoint
CREATE INDEX `uploader_idx` ON `files` (`uploaderId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `files` (`fileType`);