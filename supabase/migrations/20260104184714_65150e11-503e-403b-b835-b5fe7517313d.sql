-- Fix overly permissive prescription_documents policy
-- Drop the "ALL" policy that doesn't check ownership
DROP POLICY IF EXISTS "Require authentication for prescription access" ON public.prescription_documents;

-- Add DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Add DELETE policy for drgreen_clients table
CREATE POLICY "Users can delete their own client record"
ON public.drgreen_clients
FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy for drgreen_orders table (business decision: allow users to delete their orders)
CREATE POLICY "Users can delete their own orders"
ON public.drgreen_orders
FOR DELETE
USING (auth.uid() = user_id);

-- Add admin-only write policies for generated_product_images
CREATE POLICY "Admins can insert product images"
ON public.generated_product_images
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update product images"
ON public.generated_product_images
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete product images"
ON public.generated_product_images
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));