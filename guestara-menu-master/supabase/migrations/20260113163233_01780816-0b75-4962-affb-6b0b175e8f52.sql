-- Fix function search path for handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drop the overly permissive booking insert policy and add rate-limiting consideration
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

-- Add a more controlled booking insert policy
-- Bookings require valid item_id and non-empty customer info
CREATE POLICY "Public can create valid bookings" ON public.bookings 
FOR INSERT 
WITH CHECK (
  item_id IS NOT NULL AND 
  customer_name IS NOT NULL AND 
  LENGTH(TRIM(customer_name)) > 0 AND
  booking_date >= CURRENT_DATE
);