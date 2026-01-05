-- Add email and full_name columns to drgreen_clients for manual email sending
ALTER TABLE public.drgreen_clients 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_drgreen_clients_email ON public.drgreen_clients(email);

-- Comment explaining purpose
COMMENT ON COLUMN public.drgreen_clients.email IS 'Client email stored for manual email triggers when auth lookup fails';
COMMENT ON COLUMN public.drgreen_clients.full_name IS 'Client full name stored for email personalization';