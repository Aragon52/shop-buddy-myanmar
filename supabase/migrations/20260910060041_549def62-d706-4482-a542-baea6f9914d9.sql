ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS cod_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cod_cities text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'prepaid',
  ADD COLUMN IF NOT EXISTS delivery_lat double precision,
  ADD COLUMN IF NOT EXISTS delivery_lng double precision,
  ADD COLUMN IF NOT EXISTS delivery_place_label text;

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IN ('prepaid','cod'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;