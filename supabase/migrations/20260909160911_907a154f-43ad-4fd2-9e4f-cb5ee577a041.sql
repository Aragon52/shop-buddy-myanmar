CREATE OR REPLACE FUNCTION public.owns_seller_folder(folder TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sellers s
    WHERE s.user_id = auth.uid() AND s.id::text = folder
  );
$$;

CREATE OR REPLACE FUNCTION public.seller_folder_exists(folder TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.sellers s WHERE s.id::text = folder);
$$;

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "Sellers upload their product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.owns_seller_folder((storage.foldername(name))[1]));
CREATE POLICY "Sellers update their product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.owns_seller_folder((storage.foldername(name))[1]));
CREATE POLICY "Sellers delete their product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.owns_seller_folder((storage.foldername(name))[1]));

CREATE POLICY "Buyers upload payment screenshots" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots' AND public.seller_folder_exists((storage.foldername(name))[1]));
CREATE POLICY "Sellers view their payment screenshots" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.owns_seller_folder((storage.foldername(name))[1]));
CREATE POLICY "Sellers delete their payment screenshots" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND public.owns_seller_folder((storage.foldername(name))[1]));