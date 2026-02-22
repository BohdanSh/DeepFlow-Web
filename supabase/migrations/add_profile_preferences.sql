-- Add preferences columns to profiles table
-- Run this migration if you already have the profiles table

-- Language preference
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'uk'));

-- Time and date preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS week_starts_on TEXT DEFAULT 'monday' CHECK (week_starts_on IN ('monday', 'sunday'));

-- Notification preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_digest BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS task_reminders BOOLEAN DEFAULT true;
