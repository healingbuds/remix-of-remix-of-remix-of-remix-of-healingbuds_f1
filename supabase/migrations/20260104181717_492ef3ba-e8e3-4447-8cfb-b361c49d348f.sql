-- Create prescription-documents storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescription-documents',
  'prescription-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies for prescription-documents bucket if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their own prescription files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own prescription files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own prescription files" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view all prescription files" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create RLS policies for prescription-documents bucket
-- Policy: Users can only view their own prescription files (based on folder structure user_id/*)
CREATE POLICY "Users can view their own prescription files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescription-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can upload to their own folder only
CREATE POLICY "Users can upload their own prescription files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescription-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own prescription files
CREATE POLICY "Users can delete their own prescription files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prescription-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Admins can view all prescription files
CREATE POLICY "Admins can view all prescription files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescription-documents' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);