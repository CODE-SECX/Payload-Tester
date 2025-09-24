-- Create bypass_records table
CREATE TABLE IF NOT EXISTS bypass_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload text NOT NULL,
  waf_names text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bypass_records ENABLE ROW LEVEL SECURITY;

-- Create public access policy
CREATE POLICY "Allow public access to bypass_records"
  ON bypass_records
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
