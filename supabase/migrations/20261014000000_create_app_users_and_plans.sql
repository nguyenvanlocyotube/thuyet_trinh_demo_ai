-- Bảng lưu trữ người dùng hệ thống (Admin quản lý)
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  name text NOT NULL,
  avatar text DEFAULT '/wus_cat.png',
  avatar_id text DEFAULT 'cat',
  plan text NOT NULL DEFAULT 'free',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  free_trial_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  notes text
);

-- Bảng lưu trữ gói cước tùy chỉnh (Admin thêm mới)
CREATE TABLE IF NOT EXISTS public.custom_plans (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  tagline text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  popular boolean DEFAULT false,
  is_free boolean DEFAULT false,
  duration_days integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bật RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_plans ENABLE ROW LEVEL SECURITY;

-- Policy cho phép đọc/ghi từ server (service_role) và anon cơ bản nếu cần
CREATE POLICY "Allow public read custom_plans" ON public.custom_plans FOR SELECT USING (true);
CREATE POLICY "Allow service_role all app_users" ON public.app_users FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service_role all custom_plans" ON public.custom_plans FOR ALL TO service_role USING (true);
