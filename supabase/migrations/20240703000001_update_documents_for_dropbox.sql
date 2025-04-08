-- Update documents table to replace Google Drive with Dropbox

-- Add dropbox_id column
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS dropbox_id TEXT;

-- Copy data from google_drive_id to dropbox_id (optional, might need manual migration)
-- UPDATE documents SET dropbox_id = google_drive_id WHERE google_drive_id IS NOT NULL;

-- Add dropbox_path column to store the full path in Dropbox
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS dropbox_path TEXT;

-- Add dropbox_shared_url column to store the shared URL
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS dropbox_shared_url TEXT;

-- We'll keep google_drive_id for now to ensure backward compatibility
-- It can be removed later after all data is migrated

-- Update system_settings table to replace Google Drive settings with Dropbox settings
DO $$
BEGIN
  -- Check if there's an existing Google Drive settings entry
  IF EXISTS (SELECT 1 FROM system_settings WHERE key = 'google_drive_settings') THEN
    -- Create a new entry for Dropbox settings
    INSERT INTO system_settings (key, value, updated_at, updated_by)
    VALUES (
      'dropbox_settings',
      jsonb_build_object(
        'app_key', '',
        'app_secret', '',
        'access_token', '',
        'is_configured', false,
        'last_updated', now()
      ),
      now(),
      (SELECT id FROM users LIMIT 1)
    )
    ON CONFLICT (key) DO NOTHING;
  END IF;
END
$$;

-- Make sure the tables are in the realtime publication
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if documents table is already in the publication
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'documents'
  ) INTO table_exists;
  
  -- If not, add it
  IF NOT table_exists THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE documents';
  END IF;
  
  -- Check if system_settings table is already in the publication
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'system_settings'
  ) INTO table_exists;
  
  -- If not, add it
  IF NOT table_exists THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE system_settings';
  END IF;
END
$$;
