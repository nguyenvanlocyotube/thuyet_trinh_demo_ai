import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Sparkles, ChevronDown, ShieldCheck, Zap, Star, ArrowRight } from "lucide-react";

import { PLANS, vnd, type PaidPlanId, type Plan } from "@/lib/plans";
import { getAdminPlans } from "@/lib/admin.functions";

const wrap = "section-y mx-auto w-full max-w-[1400px] px-4 sm:px-6";

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        <Sparkles className="size-3.5" />
        {eyebrow}
      </div>
      <h2 className="mt-3 font-display text-[clamp(1.75rem,5vw,2.75rem)] font-bold leading-tight tracking-tight text-foreground">
        {title}
      </h2>
      {sub ? (
        <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {sub}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Công nghệ & nền tảng sử dụng ---------- */
const SPONSORS = [
  {
    name: "Groq LPU",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/groq.png",
    text: "text-foreground/90",
  },
  {
    name: "OpenAI Whisper",
    logo: "https://cdn.simpleicons.org/openai/ECE8D1",
    text: "text-foreground/90",
  },
  {
    name: "Supabase Cloud",
    logo: "https://cdn.jsdelivr.net/gh/selfhst/icons/png/supabase.png",
    text: "text-[#3ECF8E]",
  },
  {
    name: "Google Cloud",
    logo: "https://cdn.jsdelivr.net/gh/selfhst/icons/svg/google-cloud.svg",
    text: "text-foreground/90",
  },
  {
    name: "Meta Llama",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/meta.png",
    text: "text-[#0668E1]",
  },
  {
    name: "Hugging Face",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/huggingface.png",
    text: "text-[#FFD21E]",
  },
  {
    name: "SePay VietQR",
    logo: "https://cdn.jsdelivr.net/gh/selfhst/icons/png/stripe.png",
    text: "text-[#635BFF]",
  },
  {
    name: "React 19",
    logo: "https://cdn.simpleicons.org/react/61DAFB",
    text: "text-[#61DAFB]",
  },
  {
    name: "TanStack Start",
    logo: "https://cdn.simpleicons.org/tanstack/ECE8D1",
    text: "text-foreground/85",
  },
  {
    name: "Tailwind CSS",
    logo: "https://cdn.simpleicons.org/tailwindcss/06B6D4",
    text: "text-[#38BDF8]",
  },
  {
    name: "Vite",
    logo: "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/vite.svg",
    text: "text-[#8B7CFF]",
  },
  {
    name: "TypeScript",
    logo: "https://cdn.simpleicons.org/typescript/3178C6",
    text: "text-[#3178C6]",
  },
];

export function Sponsors() {
  const duplicated = [...SPONSORS, ...SPONSORS, ...SPONSORS];

  return (
    <section
      id="nha-tai-tro"
      className="section-y border-y border-line/40 bg-panel/20 py-12 overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] px-4 text-center">
        <p className="mb-8 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          Công nghệ &amp; Nền tảng AI tăng tốc hiệu năng
        </p>
      </div>

      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track flex w-max items-center py-2">
          {duplicated.map((item, i) => (
            <div key={`${item.name}-${i}`} className="group flex shrink-0 items-center">
              <div className="flex items-center gap-3.5 px-6 sm:px-10">
                <img
                  src={item.logo}
                  alt={`${item.name} logo`}
                  className="size-8 shrink-0 object-contain opacity-80 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 sm:size-9"
                  loading="lazy"
                  decoding="async"
                />
                <span
                  className={`whitespace-nowrap font-display text-base font-semibold tracking-tight transition-all duration-300 group-hover:text-foreground ${item.text}`}
                >
                  {item.name}
                </span>
              </div>

              <span className="h-6 w-px bg-foreground/15" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Đánh giá ---------- */
const REVIEWS = [
  {
    name: "Minh Anh",
    role: "Content Creator & Designer",
    text: "Tải ảnh thiết kế lên là nhận dạng chi tiết bố cục và OCR chữ tiếng Việt ngay tức thì, tiết kiệm cho mình hàng giờ gõ lại nội dung.",
    rating: 5,
  },
  {
    name: "Quốc Bảo",
    role: "Kỹ sư phần mềm",
    text: "Tốc độ xử lý của Groq và Whisper quá ấn tượng. Giao diện trực quan, bảng điều khiển số liệu hiển thị minh bạch từng token.",
    rating: 5,
  },
  {
    name: "Thu Hà",
    role: "Kế toán trưởng",
    text: "Mình dùng tính năng OCR để bóc tách thông tin hoá đơn chụp mờ. Kết quả chính xác cao và có lưu trữ lịch sử để tra cứu dễ dàng.",
    rating: 5,
  },
  {
    name: "Đức Long",
    role: "Freelancer Multimedia",
    text: "Gói Pro rất đáng tiền. Thanh toán QR ngân hàng qua SePay kích hoạt tự động trong 5 giây, không cần chờ đợi xác nhận thủ công.",
    rating: 5,
  },
  {
    name: "Ngọc Trâm",
    role: "Marketing Manager",
    text: "Tính năng ghi âm giọng nói chuyển thành văn bản chuẩn tiếng Việt cả với ngữ điệu tự nhiên. Rất hữu ích khi họp và ghi chú nhanh.",
    rating: 5,
  },
  {
    name: "Hoàng Nam",
    role: "Product Owner",
    text: "Giao diện dark mode hiện đại, logic thao tác rõ ràng. Từ lúc dùng công cụ này, quy trình xử lý dữ liệu truyền thông nhanh hơn hẳn.",
    rating: 5,
  },
];

export function Reviews() {
  return (
    <section id="danh-gia" className={wrap}>
      <Heading
        eyebrow="Đánh giá từ cộng đồng"
        title="Trải nghiệm thực tế từ người dùng"
        sub="Hơn 10.000+ lượt xử lý hình ảnh và chuyển đổi âm thanh mỗi tuần với độ hài lòng 4.9/5 sao."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REVIEWS.map((r) => (
          <figure
            key={r.name}
            className="glass-card flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:border-primary/40 sm:p-7"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <Star key={idx} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400">
                  <ShieldCheck className="size-3" />
                  Đã xác thực
                </span>
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-foreground/90">
                “{r.text}”
              </blockquote>
            </div>
            <figcaption className="mt-6 flex items-center gap-3.5 border-t border-line/50 pt-4">
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#6366F1] to-[#06B6D4] font-display text-sm font-bold text-white shadow-md">
                {r.name.split(" ").pop()?.[0]}
              </span>
              <div>
                <span className="block font-display text-sm font-semibold text-foreground">
                  {r.name}
                </span>
                <span className="block text-xs text-muted-foreground">{r.role}</span>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------- BẢNG GIÁ & GÓI CƯỚC (CHUẨN LOGIC FREE & PAID) ---------- */
export function Pricing() {
  const [plansList, setPlansList] = useState<Plan[]>(PLANS);

  useEffect(() => {
    getAdminPlans()
      .then((serverPlans) => {
        if (serverPlans && serverPlans.length > 0) {
          const custom = serverPlans.filter((sp) => !PLANS.some((p) => p.id === sp.id));
          if (custom.length > 0) {
            setPlansList([
              ...PLANS,
              ...custom.map((c) => ({
                id: c.id as any,
                name: c.name,
                price: c.price,
                tagline: c.tagline,
                features: c.features,
                popular: c.popular,
                isFree: c.isFree,
              })),
            ]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const saleInfo: Record<
    string,
    {
      oldPrice: number;
      discount: string;
      saving: number;
    }
  > = {
    go: {
      oldPrice: 59000,
      discount: "-17%",
      saving: 10000,
    },
    pro: {
      oldPrice: 199000,
      discount: "-25%",
      saving: 50000,
    },
    promax: {
      oldPrice: 499000,
      discount: "-20%",
      saving: 100000,
    },
  };

  return (
    <section id="bang-gia" className={wrap}>
      <Heading
        eyebrow="Bảng giá & Gói cước"
        title="Bảng giá minh bạch, phù hợp mọi nhu cầu"
        sub="Bắt đầu hoàn toàn miễn phí với 1 lượt trải nghiệm. Nâng cấp các gói linh hoạt thanh toán qua VietQR tự động qua SePay."
      />

      <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {plansList.map((p) => {
          const sale = saleInfo[p.id];
          const isFree = p.isFree;

          return (
            <div
              key={p.id}
              className={`glass-card relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7 ${
                p.popular
                  ? "ring-2 ring-primary/80 shadow-[0_0_50px_rgba(99,102,241,0.25)] lg:-translate-y-2 bg-panel/50"
                  : isFree
                    ? "border-white/10 bg-panel/20"
                    : "border-line/60"
              }`}
            >
              {/* Badge phổ biến nhất cho gói Pro */}
              {p.popular ? (
                <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2">
                  <span className="btn-glow inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                    <Zap className="size-3.5 fill-white" />
                    Được tin dùng nhất
                  </span>
                </div>
              ) : null}

              {isFree ? (
                <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                  <span className="rounded-full border border-white/20 bg-panel/90 px-3 py-1 font-mono text-[10px] font-semibold uppercase text-muted-foreground backdrop-blur-md">
                    Dùng thử
                  </span>
                </div>
              ) : null}

              <div>
                {/* Header card */}
                <div className="text-center pt-2">
                  <h3
                    className={`font-display text-2xl font-bold ${
                      p.popular ? "gradient-text" : "text-foreground"
                    }`}
                  >
                    Gói {p.name}
                  </h3>
                  <div
                    className={`mx-auto mt-2 h-1 w-10 rounded-full ${
                      p.popular
                        ? "bg-gradient-to-r from-primary to-[#06B6D4]"
                        : isFree
                          ? "bg-white/20"
                          : "bg-primary/40"
                    }`}
                  />
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground min-h-[36px]">
                    {p.tagline}
                  </p>
                </div>

                {/* Giá cước */}
                <div className="mt-5 rounded-xl border border-line/40 bg-panel/30 p-4 text-center">
                  {sale ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground line-through opacity-70">
                        {vnd(sale.oldPrice)}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm">
                        Ưu đãi {sale.discount}
                      </span>
                    </div>
                  ) : isFree ? (
                    <span className="font-mono text-xs text-emerald-400 font-semibold">
                      Miễn phí trải nghiệm
                    </span>
                  ) : null}

                  <div className="mt-1 flex items-baseline justify-center gap-1">
                    <span className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                      {vnd(p.price)}
                    </span>
                    {!isFree ? (
                      <span className="text-xs font-medium text-muted-foreground">/ tháng</span>
                    ) : null}
                  </div>

                  {sale ? (
                    <div className="mt-1 text-[11px] font-semibold text-emerald-400">
                      Tiết kiệm {vnd(sale.saving)}
                    </div>
                  ) : isFree ? (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Không cần thẻ thanh toán
                    </div>
                  ) : null}
                </div>

                {/* Danh sách tính năng */}
                <ul className="mt-6 space-y-3 text-xs">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-foreground/90">
                      <span
                        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${
                          p.popular
                            ? "bg-primary text-white"
                            : isFree
                              ? "bg-white/10 text-white/80"
                              : "bg-primary/20 text-primary"
                        }`}
                      >
                        <Check className="size-2.5" />
                      </span>
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nút đăng ký */}
              <div className="mt-7 pt-3 border-t border-line/30">
                {isFree ? (
                  <a
                    href="#studio"
                    className="block w-full rounded-xl border border-line bg-panel/70 py-3 text-center font-display text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-panel"
                  >
                    Trải nghiệm miễn phí
                  </a>
                ) : (
                  <Link
                    to="/thanh-toan"
                    search={{
                      plan: (["go", "pro", "promax"].includes(p.id)
                        ? p.id
                        : "pro") as PaidPlanId,
                    }}
                    className={`block w-full rounded-xl py-3 text-center font-display text-xs font-semibold transition-all duration-300 ${
                      p.popular
                        ? "btn-glow shadow-md hover:scale-[1.02]"
                        : "border border-line bg-panel/80 text-foreground hover:bg-panel hover:border-primary/40"
                    }`}
                  >
                    Nâng cấp gói {p.name}
                  </Link>
                )}
                <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
                  {isFree
                    ? "1 lượt dùng thử cho tài khoản mới"
                    : "Kích hoạt tự động qua VietQR 24/7"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Câu hỏi thường gặp (FAQ) ---------- */
export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "Gói Free (Miễn phí) hoạt động như thế nào?",
      a: "Tài khoản Free cho phép bạn trải nghiệm 1 lần miễn phí tính năng phân tích hình ảnh (Vision & OCR) hoặc chuyển đổi giọng nói Whisper. Bạn không cần nhập bất kỳ thông tin thẻ hay chuyển khoản nào để dùng thử.",
    },
    {
      q: "Hệ thống hỗ trợ những định dạng tệp nào?",
      a: "Hệ thống hỗ trợ tải lên hình ảnh định dạng PNG, JPG, JPEG, WEBP với dung lượng tối đa 10MB/tệp. Đối với âm thanh, bạn có thể ghi âm trực tiếp qua trình duyệt hoặc tải file định dạng MP3, WAV, M4A, WebM, OGG.",
    },
    {
      q: "Sau khi chuyển khoản, gói cước được kích hoạt như thế nào?",
      a: "Quá trình hoàn toàn tự động! Cổng thanh toán SePay kết nối trực tiếp với tài khoản ngân hàng và tự động kích hoạt tài khoản của bạn ngay sau khi nhận được tiền với đúng mã nội dung đơn hàng (thường chỉ mất 3 - 10 giây).",
    },
    {
      q: "Dữ liệu hình ảnh và âm thanh của tôi có được bảo mật không?",
      a: "Tuyệt đối an toàn. Toàn bộ hình ảnh và dữ liệu được lưu trữ mã hóa trên Supabase Storage. Bạn có toàn quyền xem, tải về hoặc xóa vĩnh viễn tệp bất cứ lúc nào trong bảng Lịch sử.",
    },
    {
      q: "Tôi có thể hủy gói hoặc yêu cầu hoàn tiền không?",
      a: "Nếu hệ thống gặp sự cố kỹ thuật khiến bạn không thể sử dụng dịch vụ trong vòng 24h sau khi mua gói, chúng tôi cam kết hoàn tiền 100%. Vui lòng liên hệ bộ phận hỗ trợ qua Telegram hoặc Email để được xử lý nhanh nhất.",
    },
  ];

  return (
    <section id="faq" className={wrap}>
      <Heading
        eyebrow="Hỗ trợ & Giải đáp"
        title="Câu hỏi thường gặp"
        sub="Mọi thông tin bạn cần biết về dịch vụ nhận dạng AI và quy trình thanh toán."
      />

      <div className="mx-auto max-w-3xl space-y-4">
        {faqs.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={faq.q}
              className="glass-card overflow-hidden rounded-xl border border-line/60 transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left font-display text-base font-semibold text-foreground transition-colors hover:text-primary sm:text-lg"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {isOpen ? (
                <div className="border-t border-line/40 px-5 pb-5 pt-3 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
