ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS shop_category text NOT NULL DEFAULT 'general';