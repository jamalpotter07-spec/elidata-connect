
-- Make user_id optional and add guest fields on orders
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS guest_email text;

-- Allow public (anon) insert for guest orders
DROP POLICY IF EXISTS "users create own orders" ON public.orders;
CREATE POLICY "anyone can create order"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- Add API base price to bundles
ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS cost_price_ghs numeric;
