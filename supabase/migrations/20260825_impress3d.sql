-- Migration file for IMPRESS 3D module
-- Creates dedicated tables for Impress 3D transactions, investments, products, and settings with RLS enabled.

-- 1. IMPRESS3D SETTINGS
CREATE TABLE IF NOT EXISTS public.impress3d_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  kwh_price NUMERIC(15, 4) NOT NULL DEFAULT 0.8500,
  printer_power_w NUMERIC(15, 2) NOT NULL DEFAULT 350.00,
  filament_default_price_kg NUMERIC(15, 2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.impress3d_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own Impress3D settings" ON public.impress3d_settings;
CREATE POLICY "Users can manage their own Impress3D settings" ON public.impress3d_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. IMPRESS3D TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.impress3d_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'investimento', 'aporte')),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.impress3d_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own Impress3D transactions" ON public.impress3d_transactions;
CREATE POLICY "Users can manage their own Impress3D transactions" ON public.impress3d_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS impress3d_transactions_user_date_idx ON public.impress3d_transactions(user_id, date DESC);

-- 3. IMPRESS3D INVESTMENTS
CREATE TABLE IF NOT EXISTS public.impress3d_investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  supplier TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.impress3d_investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own Impress3D investments" ON public.impress3d_investments;
CREATE POLICY "Users can manage their own Impress3D investments" ON public.impress3d_investments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS impress3d_investments_user_date_idx ON public.impress3d_investments(user_id, purchase_date DESC);

-- 4. IMPRESS3D PRODUCTS
CREATE TABLE IF NOT EXISTS public.impress3d_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  category TEXT,
  filament_weight_g NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  printing_time_minutes NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  filament_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  energy_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  packaging_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  other_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  total_cost NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  sale_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  profit_margin NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.impress3d_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own Impress3D products" ON public.impress3d_products;
CREATE POLICY "Users can manage their own Impress3D products" ON public.impress3d_products
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS impress3d_products_user_idx ON public.impress3d_products(user_id);
