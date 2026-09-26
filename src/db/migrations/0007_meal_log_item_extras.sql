PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_meal_log_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meal_log_id` integer NOT NULL,
	`ingredient_id` integer,
	`name` text,
	`quantity` real,
	FOREIGN KEY (`meal_log_id`) REFERENCES `meal_logs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_meal_log_items`("id", "meal_log_id", "ingredient_id", "name", "quantity") SELECT "id", "meal_log_id", "ingredient_id", "name", "quantity" FROM `meal_log_items`;--> statement-breakpoint
DROP TABLE `meal_log_items`;--> statement-breakpoint
ALTER TABLE `__new_meal_log_items` RENAME TO `meal_log_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `meal_log_items_meal_log_id_ingredient_id_unique` ON `meal_log_items` (`meal_log_id`,`ingredient_id`);