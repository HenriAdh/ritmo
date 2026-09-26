CREATE TABLE `meal_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_id` integer NOT NULL,
	`weekday` integer NOT NULL,
	`time` text,
	FOREIGN KEY (`meal_id`) REFERENCES `meals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meal_schedules_meal_id_weekday_unique` ON `meal_schedules` (`meal_id`,`weekday`);--> statement-breakpoint
ALTER TABLE `meals` DROP COLUMN `time`;--> statement-breakpoint
ALTER TABLE `meals` DROP COLUMN `weekday`;