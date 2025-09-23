/*
  # XSS Pattern Storage Schema

  1. New Tables
    - `xss_patterns`
      - `id` (uuid, primary key)
      - `name` (text) - Pattern name/description
      - `pattern` (text) - The regex pattern
      - `description` (text) - Description of what this pattern catches
      - `severity` (text) - HIGH, MEDIUM, LOW
      - `category` (text) - script, iframe, javascript, etc.
      - `is_active` (boolean) - Whether pattern is enabled
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `xss_patterns` table
    - Add policies for public read access (since this is a testing tool)
    - Add policies for authenticated users to manage patterns

  3. Sample Data
    - Insert common XSS detection patterns for immediate testing
*/

-- Create the xss_patterns table
CREATE TABLE IF NOT EXISTS xss_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pattern text NOT NULL,
  description text DEFAULT '',
  severity text DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  bypass_of_what text DEFAULT '',
  flags text DEFAULT 'gi'
);

-- Enable RLS
ALTER TABLE xss_patterns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to patterns" ON xss_patterns;
DROP POLICY IF EXISTS "Allow authenticated users to insert patterns" ON xss_patterns;
DROP POLICY IF EXISTS "Allow authenticated users to update patterns" ON xss_patterns;
DROP POLICY IF EXISTS "Allow authenticated users to delete patterns" ON xss_patterns;

-- Create new public access policies
CREATE POLICY "Allow public access to patterns"
  ON xss_patterns
  FOR ALL -- This covers SELECT, INSERT, UPDATE, and DELETE
  TO public -- This includes both authenticated and anonymous users
  USING (true)
  WITH CHECK (true);

-- Insert sample XSS detection patterns
INSERT INTO xss_patterns (name, pattern, description, severity, category, is_active) VALUES
  ('Basic Script Tag', '<script[^>]*>.*?</script>', 'Detects basic script tags with any content', 'HIGH', 'script', true),
  ('Script Tag Variations', '<script[\\s\\S]*?>.*?</script>', 'Detects script tags with various formatting', 'HIGH', 'script', true),
  ('JavaScript Protocol', 'javascript:', 'Detects javascript: protocol usage', 'HIGH', 'javascript', true),
  ('Event Handlers', 'on\\w+\\s*=', 'Detects HTML event handlers like onclick, onload', 'MEDIUM', 'events', true),
  ('Iframe Tag', '<iframe[^>]*>', 'Detects iframe tags', 'MEDIUM', 'iframe', true),
  ('Object/Embed Tags', '<(object|embed)[^>]*>', 'Detects object and embed tags', 'MEDIUM', 'object', true),
  ('Data URLs with Script', 'data:.*script', 'Detects data URLs containing script', 'HIGH', 'data-url', true),
  ('Base64 Encoded Scripts', 'data:.*base64.*script', 'Detects base64 encoded scripts in data URLs', 'HIGH', 'encoding', true),
  ('SVG with Script', '<svg[^>]*>.*<script', 'Detects SVG tags containing scripts', 'HIGH', 'svg', true),
  ('Expression Function', 'expression\\s*\\(', 'Detects CSS expression function usage', 'MEDIUM', 'css', true),
  ('Vbscript Protocol', 'vbscript:', 'Detects vbscript: protocol usage', 'MEDIUM', 'vbscript', true),
  ('Meta Refresh XSS', '<meta[^>]*http-equiv.*refresh', 'Detects meta refresh XSS attempts', 'MEDIUM', 'meta', true);

-- Add new column
ALTER TABLE xss_patterns 
ADD COLUMN bypass_of_what text DEFAULT '';

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_xss_patterns_bypass ON xss_patterns (bypass_of_what);

-- Update sample data to include bypass information
UPDATE xss_patterns SET bypass_of_what = 
  CASE 
    WHEN category = 'script' THEN 'CSP script-src'
    WHEN category = 'events' THEN 'Event filtering'
    WHEN category = 'iframe' THEN 'Frame-src directive'
    WHEN category = 'object' THEN 'Object restriction'
    WHEN category = 'data-url' THEN 'URL scheme filtering'
    ELSE ''
  END;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_xss_patterns_active ON xss_patterns (is_active);
CREATE INDEX IF NOT EXISTS idx_xss_patterns_category ON xss_patterns (category);

-- Add flags column to xss_patterns table
ALTER TABLE xss_patterns 
ADD COLUMN IF NOT EXISTS flags text DEFAULT 'gi';