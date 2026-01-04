-- Add explicit policy to ensure only authenticated users can access prescription documents
-- This adds an extra layer of security by checking auth.uid() IS NOT NULL

-- First, create a restrictive policy that requires authentication for ALL operations
-- This will act as an additional check on top of existing policies

CREATE POLICY "Require authentication for prescription access"
ON public.prescription_documents
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);