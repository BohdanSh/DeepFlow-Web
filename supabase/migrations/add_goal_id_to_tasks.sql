-- Add goal_id column to tasks table
-- Run this migration if you already have the tasks table

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS goal_id uuid REFERENCES goals(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS tasks_goal_id_idx ON tasks(goal_id);
