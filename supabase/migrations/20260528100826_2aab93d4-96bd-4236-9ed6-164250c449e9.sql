
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'manager', 'warehouse', 'viewer');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "roles_select_self_or_admin" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Auto-create profile + assign first user as super_admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INTEGER;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- API Credentials Vault (super_admin only)
CREATE TABLE public.api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  label TEXT NOT NULL,
  credential_key TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_credentials TO authenticated;
GRANT ALL ON public.api_credentials TO service_role;
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vault_admin_only" ON public.api_credentials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- App settings (global key/value)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_all_auth" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_write_admin" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

INSERT INTO public.app_settings (key, value) VALUES ('aed_rate', '16000'::jsonb);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  brand TEXT,
  model TEXT,
  image_url TEXT,
  currency TEXT NOT NULL DEFAULT 'TOMAN' CHECK (currency IN ('TOMAN','AED')),
  cost_original NUMERIC NOT NULL DEFAULT 0,
  fixed_costs NUMERIC NOT NULL DEFAULT 0,
  profit_percent NUMERIC NOT NULL DEFAULT 20,
  commission_percent NUMERIC NOT NULL DEFAULT 10,
  stock INTEGER NOT NULL DEFAULT 0,
  digikala_dkp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select_auth" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_write_own_or_manager" ON public.products FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

CREATE INDEX idx_products_owner ON public.products(owner_id);

-- Sale transactions for financial reports
CREATE TABLE public.sale_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  gross_revenue NUMERIC NOT NULL DEFAULT 0,
  cogs NUMERIC NOT NULL DEFAULT 0,
  commission NUMERIC NOT NULL DEFAULT 0,
  fixed_costs NUMERIC NOT NULL DEFAULT 0,
  net_profit NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'settled' CHECK (status IN ('pending','settled','penalty','discount')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_transactions TO authenticated;
GRANT ALL ON public.sale_transactions TO service_role;
ALTER TABLE public.sale_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_select_auth" ON public.sale_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "tx_write_own_or_manager" ON public.sale_transactions FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

CREATE INDEX idx_tx_occurred ON public.sale_transactions(occurred_at DESC);
CREATE INDEX idx_tx_owner ON public.sale_transactions(owner_id);
