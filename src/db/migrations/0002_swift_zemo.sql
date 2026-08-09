PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_exercise_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`workout_id` integer,
	`exercise_id` integer,
	`exercise_name` text,
	`date` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`weight_used` real,
	`actual_sets` integer,
	`actual_reps` text,
	`notes` text,
	FOREIGN KEY (`workout_id`) REFERENCES `workouts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_exercise_logs`("id", "workout_id", "exercise_id", "exercise_name", "date", "done", "weight_used", "actual_sets", "actual_reps", "notes") SELECT "id", "workout_id", "exercise_id", "exercise_name", "date", "done", "weight_used", "actual_sets", "actual_reps", "notes" FROM `exercise_logs`;--> statement-breakpoint
DROP TABLE `exercise_logs`;--> statement-breakpoint
ALTER TABLE `__new_exercise_logs` RENAME TO `exercise_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;