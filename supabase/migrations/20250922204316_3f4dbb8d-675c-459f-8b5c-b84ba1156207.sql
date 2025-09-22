-- Create storage bucket for clinic logos
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-logos', 'clinic-logos', true);

-- Create RLS policies for clinic logos bucket
CREATE POLICY "Clinic logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'clinic-logos');

CREATE POLICY "Authenticated users can upload clinic logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'clinic-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clinic logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'clinic-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete clinic logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'clinic-logos' AND auth.role() = 'authenticated');