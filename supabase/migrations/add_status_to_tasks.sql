-- Add status column to tasks table for Kanban board
-- Possible values: 'backlog', 'in_progress' (null defaults to backlog)
-- Done state is determined by is_completed = true

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'backlog';

-- Add index for efficient querying by status
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Comment for documentation
COMMENT ON COLUMN tasks.status IS 'Task status for Kanban board: backlog, in_progress. Done is determined by is_completed.';
