-- Create drgreen_clients table to link Supabase users to Dr Green clients
CREATE TABLE public.drgreen_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drgreen_client_id TEXT NOT NULL UNIQUE,
  country_code TEXT NOT NULL DEFAULT 'PT',
  is_kyc_verified BOOLEAN DEFAULT FALSE,
  admin_approval TEXT DEFAULT 'PENDING',
  kyc_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.drgreen_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own drgreen client"
ON public.drgreen_clients
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drgreen client"
ON public.drgreen_clients
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drgreen client"
ON public.drgreen_clients
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_drgreen_clients_updated_at
BEFORE UPDATE ON public.drgreen_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create drgreen_cart table for local cart management
CREATE TABLE public.drgreen_cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strain_id TEXT NOT NULL,
  strain_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, strain_id)
);

-- Enable RLS for cart
ALTER TABLE public.drgreen_cart ENABLE ROW LEVEL SECURITY;

-- Cart RLS Policies
CREATE POLICY "Users can view their own cart"
ON public.drgreen_cart
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own cart"
ON public.drgreen_cart
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
ON public.drgreen_cart
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own cart"
ON public.drgreen_cart
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for cart updated_at
CREATE TRIGGER update_drgreen_cart_updated_at
BEFORE UPDATE ON public.drgreen_cart
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();