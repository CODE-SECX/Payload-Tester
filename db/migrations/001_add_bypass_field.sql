-- Add bypass_of_what column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'xss_patterns' 
        AND column_name = 'bypass_of_what'
    ) THEN
        ALTER TABLE xss_patterns 
        ADD COLUMN bypass_of_what text DEFAULT '';

        -- Create index for the new column
        CREATE INDEX IF NOT EXISTS idx_xss_patterns_bypass ON xss_patterns (bypass_of_what);

        -- Update existing records with bypass information
        UPDATE xss_patterns SET bypass_of_what = 
        CASE 
            WHEN category = 'script' THEN 'CSP script-src'
            WHEN category = 'events' THEN 'Event filtering'
            WHEN category = 'iframe' THEN 'Frame-src directive'
            WHEN category = 'object' THEN 'Object restriction'
            WHEN category = 'data-url' THEN 'URL scheme filtering'
            ELSE ''
        END;
    END IF;
END $$;
