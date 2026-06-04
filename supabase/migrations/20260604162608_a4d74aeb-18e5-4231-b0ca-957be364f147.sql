
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS shipping_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cpu text,
  ADD COLUMN IF NOT EXISTS ram text,
  ADD COLUMN IF NOT EXISTS storage text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS base_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_threshold integer NOT NULL DEFAULT 2;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS products_touch_updated_at ON public.products;
CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
