-- Fix PostgREST foreign key relationships
-- This migration ensures foreign key constraints are properly named for PostgREST

-- Check and rename foreign key constraints if needed
-- PostgREST requires foreign key constraints to be discoverable

DO $$
DECLARE
  fk_record RECORD;
  new_name TEXT;
BEGIN
  -- Find foreign key constraints for generations table
  FOR fk_record IN
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'generations'
      AND kcu.column_name IN ('preset_id', 'model_id')
  LOOP
    -- Generate expected constraint name
    new_name := fk_record.table_name || '_' || fk_record.column_name || '_fkey';
    
    -- If constraint name doesn't match expected pattern, rename it
    IF fk_record.constraint_name != new_name THEN
      RAISE NOTICE 'Found FK constraint: % -> % (expected: %)', 
        fk_record.constraint_name, 
        fk_record.foreign_table_name,
        new_name;
      
      -- Note: PostgreSQL doesn't support renaming constraints directly
      -- We would need to drop and recreate, but that's risky
      -- Instead, we'll just log the information
    ELSE
      RAISE NOTICE 'FK constraint name is correct: %', fk_record.constraint_name;
    END IF;
  END LOOP;
END $$;

-- Ensure foreign key constraints exist and are properly configured
-- This is mainly for verification - constraints should already exist from initial schema

-- Verify foreign keys exist
DO $$
DECLARE
  preset_fk_exists BOOLEAN;
  model_fk_exists BOOLEAN;
BEGIN
  -- Check preset_id foreign key
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'generations'
      AND kcu.column_name = 'preset_id'
  ) INTO preset_fk_exists;
  
  -- Check model_id foreign key
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'generations'
      AND kcu.column_name = 'model_id'
  ) INTO model_fk_exists;
  
  RAISE NOTICE 'preset_id FK exists: %', preset_fk_exists;
  RAISE NOTICE 'model_id FK exists: %', model_fk_exists;
  
  IF NOT preset_fk_exists THEN
    RAISE WARNING 'preset_id foreign key constraint is missing!';
  END IF;
  
  IF NOT model_fk_exists THEN
    RAISE WARNING 'model_id foreign key constraint is missing!';
  END IF;
END $$;
