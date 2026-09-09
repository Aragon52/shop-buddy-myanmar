CREATE TABLE public.sellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL DEFAULT 'My shop',
  phone TEXT NOT NULL DEFAULT '',
  tiktok_handle TEXT NOT NULL UNIQUE,
  kbzpay_name TEXT NOT NULL DEFAULT '',
  kbzpay_number TEXT NOT NULL DEFAULT '',
  wavepay_name TEXT NOT NULL DEFAULT '',
  wavepay_number TEXT NOT NULL DEFAULT '',
  ayapay_name TEXT NOT NULL DEFAULT '',
  ayapay_number TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_mmk BIGINT NOT NULL DEFAULT 0 CHECK (price_mmk >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX products_seller_id_idx ON public.products(seller_id);

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_mmk BIGINT NOT NULL DEFAULT 0 CHECK (unit_price_mmk >= 0),
  payment_screenshot_path TEXT,
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','shipped','cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX orders_seller_created_idx ON public.orders(seller_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sellers TO authenticated;
GRANT SELECT ON public.sellers TO anon;
GRANT ALL ON public.sellers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage their own shop" ON public.sellers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view shops" ON public.sellers FOR SELECT TO anon USING (true);

CREATE POLICY "Sellers manage their own products" ON public.products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = products.seller_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = products.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "Public can view active products" ON public.products FOR SELECT TO anon USING (is_active);

CREATE POLICY "Sellers manage their own orders" ON public.orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = orders.seller_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = orders.seller_id AND s.user_id = auth.uid()));
CREATE POLICY "Buyers can place orders" ON public.orders FOR INSERT TO anon
  WITH CHECK (
    order_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = orders.product_id AND p.seller_id = orders.seller_id AND p.is_active
    )
  );

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER sellers_set_updated_at BEFORE UPDATE ON public.sellers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER products_set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();