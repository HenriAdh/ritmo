CREATE TABLE `meal_log_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_log_id` integer NOT NULL,
	`ingredient_id` integer NOT NULL,
	`quantity` real,
	FOREIGN KEY (`meal_log_id`) REFERENCES `meal_logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meal_log_items_meal_log_id_ingredient_id_unique` ON `meal_log_items` (`meal_log_id`,`ingredient_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `meal_logs_meal_id_date_unique` ON `meal_logs` (`meal_id`,`date`);