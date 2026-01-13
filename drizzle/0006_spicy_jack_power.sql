CREATE TABLE `payment_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`platformFee` decimal(10,2) NOT NULL,
	`sellerAmount` decimal(10,2) NOT NULL,
	`paymentMethod` enum('wechat','alipay') NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`transactionId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_orders_transactionId_unique` UNIQUE(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `platform_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalEarnings` decimal(15,2),
	`month` varchar(7) NOT NULL,
	`transactionCount` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platform_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_earnings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalEarnings` decimal(15,2),
	`withdrawnAmount` decimal(15,2),
	`availableAmount` decimal(15,2),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_earnings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_fileId_files_id_fk` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_orders` ADD CONSTRAINT `payment_orders_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_earnings` ADD CONSTRAINT `user_earnings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `file_id_idx` ON `payment_orders` (`fileId`);--> statement-breakpoint
CREATE INDEX `buyer_id_idx` ON `payment_orders` (`buyerId`);--> statement-breakpoint
CREATE INDEX `seller_id_idx` ON `payment_orders` (`sellerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payment_orders` (`status`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `payment_orders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `month_idx` ON `platform_earnings` (`month`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `user_earnings` (`userId`);