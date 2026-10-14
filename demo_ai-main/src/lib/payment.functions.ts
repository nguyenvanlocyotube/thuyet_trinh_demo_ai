import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { PLANS, PLAN_IDS } from "./plans";

// Bảng `orders` chưa có trong types.ts tự sinh -> dùng client lỏng kiểu.
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as { from: (t: string) => any };
}

export type OrderInfo = {
  code: string;
  amount: number;
  planName: string;
  qrUrl: string;
  bank: string;
  account: string;
  accountName: string;
};

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ plan: z.enum(PLAN_IDS) }).parse(d))
  .handler(async ({ data }): Promise<OrderInfo> => {
    const bank = process.env["SEPAY_BANK"];
    const account = process.env["SEPAY_ACCOUNT"];
    if (!bank || !account) throw new Error("Chưa cấu hình SEPAY_BANK / SEPAY_ACCOUNT trong .env.");

    const plan = PLANS.find((p) => p.id === data.plan);
    if (!plan) throw new Error("Gói không hợp lệ.");

    // Giá luôn lấy ở server, không tin dữ liệu từ trình duyệt.
    const code = `AIV${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const { error } = await (
      await getDb()
    )
      .from("orders")
      .insert({ code, plan: plan.id, amount: plan.price, status: "pending" });
    if (error) throw new Error(`Không tạo được đơn hàng: ${error.message}`);

    const qr = new URLSearchParams({ acc: account, bank, amount: String(plan.price), des: code });
    return {
      code,
      amount: plan.price,
      planName: plan.name,
      qrUrl: `https://qr.sepay.vn/img?${qr}`,
      bank,
      account,
      accountName: process.env["SEPAY_ACCOUNT_NAME"] ?? "",
    };
  });

export const getOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ code: z.string().regex(/^AIV[A-Z0-9]{8}$/) }).parse(d))
  .handler(async ({ data }): Promise<{ status: "pending" | "paid" }> => {
    const { data: row } = await (
      await getDb()
    )
      .from("orders")
      .select("status")
      .eq("code", data.code)
      .maybeSingle();
    return { status: row?.status === "paid" ? "paid" : "pending" };
  });
