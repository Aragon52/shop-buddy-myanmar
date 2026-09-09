DROP POLICY "Sellers upload their product images" ON storage.objects;
DROP POLICY "Sellers update their product images" ON storage.objects;
DROP POLICY "Sellers delete their product images" ON storage.objects;
DROP POLICY "Buyers upload payment screenshots" ON storage.objects;
DROP POLICY "Sellers view their payment screenshots" ON storage.objects;
DROP POLICY "Sellers delete their payment screenshots" ON storage.objects;
DROP FUNCTION public.owns_seller_folder(TEXT);
DROP FUNCTION public.seller_folder_exists(TEXT);

CREATE POLICY "Sellers upload their product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]));
CREATE POLICY "Sellers update their product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]));
CREATE POLICY "Sellers delete their product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]));

CREATE POLICY "Buyers upload payment screenshots" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-screenshots' AND EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.id::text = (storage.foldername(name))[1]));
CREATE POLICY "Sellers view their payment screenshots" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-screenshots' AND EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]));
CREATE POLICY "Sellers delete their payment screenshots" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-screenshots' AND EXISTS (
    SELECT 1 FROM public.sellers s WHERE s.user_id = auth.uid() AND s.id::text = (storage.foldername(name))[1]));