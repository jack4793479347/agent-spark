CREATE TABLE IF NOT EXISTS waitlist_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE waitlist_emails ENABLE ROW LEVEL SECURITY;
