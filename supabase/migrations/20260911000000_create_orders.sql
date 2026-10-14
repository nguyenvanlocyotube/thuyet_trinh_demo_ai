CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,                -- nội dung chuyển khoản, vd AIV3F9A21BC
  plan text NOT NULL CHECK (plan IN ('go','pro','promax')),
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  sepay_id bigint UNIQUE,                   -- chống xử lý trùng webhook
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Bật RLS và KHÔNG tạo policy: chỉ server (service_role) mới đọc/ghi được.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
