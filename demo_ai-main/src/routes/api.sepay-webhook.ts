import { createFileRoute } from "@tanstack/react-router";

type SepayPayload = {
  id?: number;
  content?: string;
  code?: string | null;
  transferType?: string;
  transferAmount?: number;
};

const ok = (extra: Record<string, unknown> = {}) => Response.json({ success: true, ...extra });

// SePay gọi vào đây mỗi khi có tiền vào tài khoản. Cấu hình ở my.sepay.vn > WebHooks:
//   URL: https://<domain>/api/sepay-webhook · chứng thực: API Key · Content-Type: JSON
export const Route = createFileRoute("/api/sepay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["SEPAY_API_KEY"];
        if (!key || request.headers.get("authorization") !== `Apikey ${key}`) {
          return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json().catch(() => null)) as SepayPayload | null;
        if (!body || body.transferType !== "in") return ok();

        const code = `${body.content ?? ""} ${body.code ?? ""}`
          .toUpperCase()
          .match(/AIV[A-Z0-9]{8}/)?.[0];
        if (!code) return ok({ message: "Không có mã đơn hàng" });

        const { getDb } = await import("@/lib/payment.functions");
        const db = await getDb();
        const { data: order } = await db
          .from("orders")
          .select("amount,status")
          .eq("code", code)
          .maybeSingle();
        if (!order || order.status === "paid") return ok();

        // Chỉ xác nhận khi khách chuyển đủ tiền. `sepay_id` UNIQUE chống xử lý trùng khi SePay retry.
        if ((body.transferAmount ?? 0) >= order.amount) {
          await db
            .from("orders")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              sepay_id: body.id ?? null,
            })
            .eq("code", code)
            .eq("status", "pending");
        }
        return ok();
      },
    },
  },
});
