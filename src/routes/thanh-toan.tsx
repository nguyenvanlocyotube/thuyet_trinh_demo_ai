import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Clock,
  AlertCircle,
  Sparkles,
  Building2,
  User as UserIcon,
  CreditCard,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { createOrder, getOrderStatus } from "@/lib/payment.functions";
import { PAID_PLAN_IDS, PLANS, vnd, type PaidPlanId } from "@/lib/plans";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/thanh-toan")({
  validateSearch: (s: Record<string, unknown>): { plan: PaidPlanId } => ({
    plan: PAID_PLAN_IDS.includes(s["plan"] as PaidPlanId) ? (s["plan"] as PaidPlanId) : "pro",
  }),
  head: () => ({ meta: [{ title: "Thanh toán an toàn — AI Video&Text" }] }),
  component: Checkout,
});

function PaymentRow({
  icon: Icon,
  label,
  value,
  copy,
  highlight,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  copy?: boolean;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`Đã sao chép ${label.toLowerCase()} vào bộ nhớ tạm!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/40 py-3.5 last:border-0">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        <Icon className="size-4 shrink-0 text-muted-foreground/80" />
        <span className="text-sm">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-sm font-semibold ${
            highlight ? "text-primary font-bold text-base" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {copy ? (
          <button
            type="button"
            onClick={handleCopy}
            className="flex size-7 items-center justify-center rounded-md border border-line bg-panel/60 text-muted-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-95"
            title={`Sao chép ${label}`}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Checkout() {
  const { plan: selectedPlanId } = Route.useSearch();
  const runCreate = useServerFn(createOrder);
  const runStatus = useServerFn(getOrderStatus);
  const { user, upgradePlan } = useAuth();

  const [demoPaid, setDemoPaid] = useState(false);

  const planInfo = PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[2];

  const order = useQuery({
    queryKey: ["order", selectedPlanId],
    queryFn: () => runCreate({ data: { plan: selectedPlanId } }),
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const code = order.data?.code;

  const status = useQuery({
    queryKey: ["order-status", code],
    queryFn: () => runStatus({ data: { code: code ?? "" } }),
    enabled: !!code,
    refetchInterval: (q) => (q.state.data?.status === "paid" ? false : 3000),
  });

  const paid = status.data?.status === "paid" || demoPaid;

  // Tự động nâng cấp tài khoản khi thanh toán thành công
  useEffect(() => {
    if (paid && selectedPlanId) {
      upgradePlan(selectedPlanId);
    }
  }, [paid, selectedPlanId, upgradePlan]);

  // Đếm ngược 5 phút = 300 giây
  const [timeLeft, setTimeLeft] = useState(5 * 60);

  useEffect(() => {
    if (!code) return;
    setTimeLeft(5 * 60);
  }, [code]);

  useEffect(() => {
    if (!code || paid || timeLeft <= 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [code, paid, timeLeft]);

  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const expired = timeLeft <= 0;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background px-4 py-8 font-body text-foreground sm:py-14">
      {/* Background Aurora */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-[520px] rounded-full bg-[#6366F1]/30 blur-[90px]" />
      <div className="pointer-events-none absolute -right-24 top-1/3 size-[460px] rounded-full bg-[#8B5CF6]/25 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-[360px] w-[560px] rounded-full bg-[#06B6D4]/20 blur-[90px]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Navigation back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel/50 px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Quay lại trang chủ
          </Link>
          <div className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-400" />
            Thanh toán mã hóa bảo mật VietQR
          </div>
        </div>

        {paid ? (
          /* Trạng thái thanh toán thành công */
          <div className="glass-card mx-auto max-w-xl rounded-2xl p-8 text-center sm:p-12">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 ring-8 ring-emerald-500/10">
              <Check className="size-10" />
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Thanh toán thành công!
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Hệ thống đã xác nhận giao dịch và kích hoạt thành công{" "}
              <b className="text-foreground">Gói {planInfo?.name}</b> cho tài khoản của bạn.
            </p>

            <div className="my-6 rounded-xl border border-line bg-panel/40 p-4 text-left font-mono text-xs text-muted-foreground">
              <div className="flex justify-between py-1.5 border-b border-line/30">
                <span>Tài khoản kích hoạt:</span>
                <span className="font-semibold text-foreground">
                  {user ? user.email : "Tài khoản hiện tại"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line/30">
                <span>Mã đơn hàng:</span>
                <span className="font-semibold text-foreground">{order.data?.code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-line/30">
                <span>Số tiền thanh toán:</span>
                <span className="font-semibold text-emerald-400">
                  {order.data ? vnd(order.data.amount) : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Trạng thái:</span>
                <span className="font-semibold text-emerald-400">Đã kích hoạt thành công ✓</span>
              </div>
            </div>

            <Link
              to="/"
              className="btn-glow inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold shadow-lg"
            >
              <Sparkles className="size-4" />
              Quay về trang chủ &amp; Sử dụng ngay
            </Link>
          </div>
        ) : (
          /* Trình đơn thanh toán 2 cột */
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Cột trái: Thông tin đơn hàng & Quyền lợi gói */}
            <div className="lg:col-span-5">
              <div className="glass-card flex flex-col justify-between rounded-2xl p-6 sm:p-7">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary">
                      Chi tiết gói đăng ký
                    </span>
                    {planInfo?.popular ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-400">
                        <Zap className="size-3 fill-amber-400" />
                        Gói phổ biến
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl text-foreground">
                    Gói {planInfo?.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{planInfo?.tagline}</p>

                  <div className="my-6 rounded-xl border border-line/50 bg-panel/30 p-4">
                    {user ? (
                      <div className="flex items-baseline justify-between pb-2 border-b border-line/30">
                        <span className="text-xs text-muted-foreground">Tài khoản nhận:</span>
                        <span className="font-mono text-xs font-semibold text-primary">
                          {user.email}
                        </span>
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-sm text-muted-foreground">Thời hạn:</span>
                      <span className="font-semibold text-foreground">1 Tháng</span>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between border-t border-line/30 pt-2">
                      <span className="text-sm text-muted-foreground">Tổng thanh toán:</span>
                      <span className="font-display text-2xl font-bold text-primary">
                        {order.data ? vnd(order.data.amount) : vnd(planInfo?.price ?? 0)}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display text-sm font-semibold text-foreground">
                    Quyền lợi bao gồm:
                  </h3>
                  <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
                    {planInfo?.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                          <Check className="size-3" />
                        </span>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 border-t border-line/50 pt-4 text-xs leading-relaxed text-muted-foreground">
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    Chính sách an tâm mua sắm:
                  </p>
                  <p className="mt-1">
                    Hỗ trợ kích hoạt tự động 24/7. Nếu giao dịch gặp sự cố hoặc cần hỗ trợ, vui lòng
                    liên hệ Telegram <b className="text-foreground">@M_vuongQuyen123</b>.
                  </p>
                </div>
              </div>
            </div>

            {/* Cột phải: Mã QR và thông tin chuyển khoản */}
            <div className="lg:col-span-7">
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                {order.isLoading ? (
                  <div className="py-20 text-center">
                    <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-4 font-mono text-sm text-muted-foreground">
                      Đang khởi tạo mã thanh toán SePay…
                    </p>
                  </div>
                ) : order.error || !order.data ? (
                  <div className="py-14 text-center">
                    <AlertCircle className="mx-auto size-10 text-rose-400" />
                    <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                      Không thể tạo đơn hàng
                    </h3>
                    <p className="mt-1 text-sm text-rose-300">
                      {order.error instanceof Error
                        ? order.error.message
                        : "Vui lòng kiểm tra lại kết nối và thử lại."}
                    </p>
                    <button
                      type="button"
                      onClick={() => void order.refetch()}
                      className="btn-glow mt-6 rounded-lg px-6 py-2.5 text-sm font-medium"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-center sm:text-left">
                      <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Quét mã QR để thanh toán
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                        Mở App Ngân hàng bất kỳ hoặc Ví điện tử hỗ trợ VietQR để quét mã.
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="my-6 flex flex-col items-center justify-center">
                      <div className="qr-payment-box relative">
                        <img
                          src={order.data.qrUrl}
                          alt="Mã QR thanh toán VietQR"
                          className="qr-payment-image"
                        />
                        {!expired ? <div className="qr-scan-line" aria-hidden="true" /> : null}
                      </div>

                      {/* Đếm ngược thời gian */}
                      <div className="mt-4 flex flex-col items-center">
                        <div
                          className={`payment-countdown ${
                            timeLeft <= 60 && timeLeft > 0 ? "payment-countdown-warning" : ""
                          } ${expired ? "payment-countdown-expired" : ""}`}
                        >
                          <Clock className="size-5" />
                          <span>{expired ? "00:00" : `${minutes}:${seconds}`}</span>
                        </div>
                        {expired ? (
                          <p className="payment-expired-text font-medium text-rose-400">
                            Đơn hàng đã hết thời gian hiệu lực. Vui lòng tạo đơn mới.
                          </p>
                        ) : (
                          <p className="payment-time-hint">
                            Mã QR có hiệu lực trong 5 phút để bảo đảm giá trị giao dịch.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Chi tiết chuyển khoản */}
                    <div className="rounded-xl border border-line/60 bg-panel/30 p-4">
                      <div className="mb-2 flex items-center justify-between border-b border-line/40 pb-2">
                        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                          Thông tin chuyển khoản thủ công
                        </span>
                        <span className="font-mono text-[10px] text-primary">
                          Tự động nhận diện
                        </span>
                      </div>

                      <PaymentRow icon={Building2} label="Ngân hàng" value={order.data.bank} />
                      <PaymentRow
                        icon={CreditCard}
                        label="Số tài khoản"
                        value={order.data.account}
                        copy
                      />
                      {order.data.accountName ? (
                        <PaymentRow
                          icon={UserIcon}
                          label="Chủ tài khoản"
                          value={order.data.accountName}
                        />
                      ) : null}
                      <PaymentRow
                        icon={Sparkles}
                        label="Số tiền"
                        value={vnd(order.data.amount)}
                        copy
                        highlight
                      />
                      <PaymentRow
                        icon={FileText}
                        label="Nội dung CK"
                        value={order.data.code}
                        copy
                        highlight
                      />
                    </div>

                    {/* Hướng dẫn và trạng thái */}
                    {!expired ? (
                      <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                        <p className="flex items-center justify-center gap-2 font-mono text-xs font-semibold text-primary">
                          <span className="pulse-glow size-2 rounded-full bg-primary" />
                          Đang chờ tín hiệu thanh toán từ ngân hàng...
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          ⚠️ <b>Lưu ý quan trọng:</b> Giữ nguyên <b>Nội dung CK</b> (
                          {order.data.code}) để hệ thống tự động nhận diện và kích hoạt ngay lập
                          tức.
                        </p>

                        {/* Nút mô phỏng thanh toán để kiểm thử */}
                        <div className="mt-3 pt-3 border-t border-primary/10">
                          <button
                            type="button"
                            onClick={() => {
                              setDemoPaid(true);
                              upgradePlan(selectedPlanId);
                              toast.success(
                                "Mô phỏng thanh toán thành công! Gói cước đã được cập nhật.",
                              );
                            }}
                            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground hover:text-emerald-400 transition underline"
                          >
                            ⚡ Bấm để mô phỏng thanh toán thành công (Thử nghiệm)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 text-center">
                        <Link
                          to="/thanh-toan"
                          search={{ plan: selectedPlanId }}
                          className="btn-glow inline-flex rounded-lg px-6 py-2.5 text-sm font-semibold"
                        >
                          Tạo lại đơn thanh toán mới
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
