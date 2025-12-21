CREATE TABLE `folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`circleId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `files` ADD `folderId` int;--> statement-breakpoint
ALTER TABLE `folders` ADD CONSTRAINT `folders_circleId_circles_id_fk` FOREIGN KEY (`circleId`) REFERENCES `circles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `folders` ADD CONSTRAINT `folders_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `folder_circle_idx` ON `folders` (`circleId`);--> statement-breakpoint
CREATE INDEX `folder_creator_idx` ON `folders` (`createdBy`);--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_folderId_folders_id_fk` FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `folder_idx` ON `files` (`folderId`);