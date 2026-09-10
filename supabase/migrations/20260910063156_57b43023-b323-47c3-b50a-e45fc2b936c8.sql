ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS shop_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS shop_lat double precision,
  ADD COLUMN IF NOT EXISTS shop_lng double precision;