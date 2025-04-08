-- Add new fields to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS revenue NUMERIC;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS year_founded INTEGER;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS num_employees INTEGER;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS point_of_contact_id UUID REFERENCES contacts(id);

-- Add is_point_of_contact field to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_point_of_contact BOOLEAN DEFAULT FALSE;

-- Enable realtime for the updated tables
alter publication supabase_realtime add table businesses;
alter publication supabase_realtime add table contacts;
