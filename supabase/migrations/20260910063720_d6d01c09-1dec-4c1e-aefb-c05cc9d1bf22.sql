DROP POLICY IF EXISTS "Public can view shops" ON public.sellers;
DROP POLICY IF EXISTS "Buyers can place orders" ON public.orders;

REVOKE ALL ON public.sellers FROM anon;
REVOKE ALL ON public.orders FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sellers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.sellers TO service_role;
GRANT ALL ON public.orders TO service_role;