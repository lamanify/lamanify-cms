-- Add unit_of_measure column to medications table
ALTER TABLE medications 
ADD COLUMN unit_of_measure TEXT DEFAULT 'Tablet';