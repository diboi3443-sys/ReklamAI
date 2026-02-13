-- Fix generations status constraint to include 'processing'
-- This migration ensures the constraint allows all required status values

-- First drop the existing constraint
ALTER TABLE generations DROP CONSTRAINT IF EXISTS generations_status_check;

-- Create the new constraint with all required values
ALTER TABLE generations ADD CONSTRAINT generations_status_check 
  CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled'));

-- Also fix provider_tasks status constraint if needed
ALTER TABLE provider_tasks DROP CONSTRAINT IF EXISTS provider_tasks_status_check;
ALTER TABLE provider_tasks ADD CONSTRAINT provider_tasks_status_check
  CHECK (status IN ('pending', 'queued', 'processing', 'succeeded', 'failed'));
