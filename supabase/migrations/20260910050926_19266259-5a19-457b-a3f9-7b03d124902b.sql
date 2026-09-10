CREATE TABLE public.seller_alerts (
  seller_id uuid PRIMARY KEY REFERENCES public.sellers(id) ON DELETE CASCADE,
  telegram_chat_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_alerts TO authenticated;
GRANT ALL ON public.seller_alerts TO service_role;

ALTER TABLE public.seller_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers manage their own alert settings"
  ON public.seller_alerts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_alerts.seller_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = seller_alerts.seller_id AND s.user_id = auth.uid()));

CREATE TRIGGER seller_alerts_updated_at
  BEFORE UPDATE ON public.seller_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();