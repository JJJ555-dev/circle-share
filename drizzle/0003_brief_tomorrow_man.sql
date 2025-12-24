ALTER TABLE `circles` ADD `isPublic` tinyint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `circles` ADD `invitationCode` varchar(64);--> statement-breakpoint
ALTER TABLE `circles` ADD CONSTRAINT `circles_invitationCode_unique` UNIQUE(`invitationCode`);--> statement-breakpoint
CREATE INDEX `invitation_code_idx` ON `circles` (`invitationCode`);