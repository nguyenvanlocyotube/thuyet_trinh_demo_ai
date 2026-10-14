import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  LogOut,
  ChevronRight,
  Crown,
  AlertCircle,
  Camera,
  Key,
  Shield,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, AVATARS } from "@/lib/auth";
import { PLANS, vnd } from "@/lib/plans";

/* =========================================================================
   0. INTERACTIVE HEAD AVATAR (SMOOTH FLUID CAT - ZERO JITTER & ZERO FLASH)
   ========================================================================= */
export function InteractiveHeadAvatar({
  isPasswordFocused = false,
}: {
  isPasswordFocused?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const headRef = React.useRef<HTMLDivElement>(null);
  const spriteRef = React.useRef<HTMLDivElement>(null);
  const shadowRef = React.useRef<HTMLDivElement>(null);

  const [isPet, setIsPet] = React.useState(false);

  const activeRowRef = React.useRef(1);
  const activeColRef = React.useRef(1);

  React.useEffect(() => {
    let animId: number;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (isPasswordFocused) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.45;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      const maxDistX = Math.max(window.innerWidth / 2, 360);
      const maxDistY = Math.max(window.innerHeight / 2, 340);

      targetX = Math.max(-1, Math.min(1, dx / maxDistX));
      targetY = Math.max(-1, Math.min(1, dy / maxDistY));
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isPasswordFocused) return;
      if (!containerRef.current || !e.touches[0]) return;
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height * 0.45;

      const dx = touch.clientX - centerX;
      const dy = touch.clientY - centerY;

      const maxDistX = Math.max(window.innerWidth / 2, 300);
      const maxDistY = Math.max(window.innerHeight / 2, 300);

      targetX = Math.max(-1, Math.min(1, dx / maxDistX));
      targetY = Math.max(-1, Math.min(1, dy / maxDistY));
    };

    const onMouseLeave = () => {
      if (isPasswordFocused) return;
      targetX = 0;
      targetY = 0;
    };

    const animate = (time: number) => {
      if (isPasswordFocused) {
        targetX = -0.85;
        targetY = 0.35;
      }

      curX += (targetX - curX) * 0.075;
      curY += (targetY - curY) * 0.075;

      let nextRow = activeRowRef.current;
      if (isPasswordFocused) {
        nextRow = 2;
      } else {
        if (activeRowRef.current === 1) {
          if (curY < -0.26) nextRow = 0;
          else if (curY > 0.26) nextRow = 2;
        } else if (activeRowRef.current === 0) {
          if (curY > -0.15) nextRow = curY > 0.26 ? 2 : 1;
        } else if (activeRowRef.current === 2) {
          if (curY < 0.15) nextRow = curY < -0.26 ? 0 : 1;
        }
      }

      let nextCol = activeColRef.current;
      if (isPasswordFocused) {
        nextCol = 0;
      } else {
        if (activeColRef.current === 1) {
          if (curX < -0.28) nextCol = 0;
          else if (curX > 0.28) nextCol = 2;
        } else if (activeColRef.current === 0) {
          if (curX > -0.16) nextCol = curX > 0.28 ? 2 : 1;
        } else if (activeColRef.current === 2) {
          if (curX < 0.16) nextCol = curX < -0.28 ? 0 : 1;
        }
      }

      if (nextRow !== activeRowRef.current || nextCol !== activeColRef.current) {
        activeRowRef.current = nextRow;
        activeColRef.current = nextCol;
        if (spriteRef.current) {
          spriteRef.current.style.backgroundPosition = `${nextCol * 50}% ${nextRow * 50}%`;
        }
      }

      const breath = Math.sin(time * 0.0022) * 2;
      const rotY = curX * 14;
      const rotX = -curY * 11;
      const rotZ = isPasswordFocused ? -6 : curX * 3;
      const tX = curX * 6;
      const tY = curY * 5 + breath;

      if (headRef.current) {
        headRef.current.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) translate3d(${tX.toFixed(2)}px, ${tY.toFixed(2)}px, 0)`;
      }

      if (shadowRef.current) {
        shadowRef.current.style.transform = `translateX(calc(-50% + ${(tX * 0.35).toFixed(1)}px)) scale(${1 - tY * 0.015})`;
      }

      animId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    document.addEventListener("mouseleave", onMouseLeave);
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [isPasswordFocused]);

  const handlePet = () => {
    setIsPet(true);
    setTimeout(() => setIsPet(false), 600);
  };

  return (
    <div className="relative mx-auto my-2 flex flex-col items-center select-none">
      <div
        ref={containerRef}
        onClick={handlePet}
        className={`relative flex h-44 w-40 cursor-pointer items-center justify-center transition-transform duration-300 ${
          isPet ? "scale-105 -rotate-2" : "hover:scale-[1.02]"
        }`}
        style={{ perspective: "800px" }}
        title="Nhấp để vuốt ve Mèo cưng! ✨"
      >
        <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-indigo-100/90 via-pink-100/70 to-purple-100/50 blur-xl transition-all duration-700" />

        <div
          className={`pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-full bg-slate-900/90 px-3 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-300 ${
            isPasswordFocused
              ? "translate-y-0 opacity-100 scale-100"
              : isPet
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-2 opacity-0 scale-90"
          }`}
        >
          <span>
            {isPasswordFocused
              ? "Em không nhìn đâu nha! 🙈"
              : "Meo meo! Chào bạn nha~ 🐾"}
          </span>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
        </div>

        <div
          ref={headRef}
          className="relative size-full will-change-transform"
          style={{ transformOrigin: "50% 88%" }}
        >
          <div
            ref={spriteRef}
            className="size-full bg-no-repeat pointer-events-none select-none drop-shadow-sm"
            style={{
              backgroundImage: "url('/cat_spritesheet.webp')",
              backgroundSize: "300% 300%",
              backgroundPosition: "50% 50%",
            }}
          />

          <div
            className={`pointer-events-none absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-300 ${
              isPasswordFocused ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute top-[52%] left-[26%] size-4 rounded-full bg-rose-400/40 blur-[2px]" />
            <div className="absolute top-[52%] right-[26%] size-4 rounded-full bg-rose-400/40 blur-[2px]" />
          </div>
        </div>

        <div
          ref={shadowRef}
          className="absolute bottom-1 left-1/2 -translate-x-1/2 h-2.5 w-24 rounded-[50%] bg-slate-900/10 blur-[3px]"
        />
      </div>
    </div>
  );
}

const MODAL_ROW1_LOGOS = [
  {
    name: "Anthropic Claude",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/claude-color.png",
  },
  {
    name: "Grok",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/grok.png",
  },
  {
    name: "Chuyến bay lên Mặt Trăng",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/moonshot.png",
  },
  {
    name: "Groq Vision",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/groq.png",
  },
  {
    name: "OpenAI GPT-4o",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/openai.png",
  },
  {
    name: "DeepSeek V3",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/deepseek-color.png",
  },
];

const MODAL_ROW2_LOGOS = [
  {
    name: "Meta Llama 3.3",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/meta-color.png",
  },
  {
    name: "Whisper Turbo",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/openai.png",
  },
  {
    name: "Khuôn mặt ôm",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/huggingface-color.png",
  },
  {
    name: "Trí tuệ nhân tạo ổn định",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/stability-color.png",
  },
  {
    name: "Midjourney v6",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/midjourney.png",
  },
  {
    name: "Mistral Large",
    logo: "https://cdn.jsdelivr.net/npm/@lobehub/icons-static-png@latest/dark/mistral-color.png",
  },
];

/* =========================================================================
   1. AUTH MODAL (LOGIN / REGISTER VỚI BẮT BUỘC CHẤP THUẬN ĐIỀU KHOẢN)
   ========================================================================= */
export function AuthModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false); // BẮT BUỘC CHẤP THUẬN KHI ĐĂNG KÝ
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isTermsDetailOpen, setIsTermsDetailOpen] = useState(false);
  const [termsErrorHighlight, setTermsErrorHighlight] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // BẮT BUỘC CHẤP THUẬN ĐIỀU KHOẢN KHI ĐĂNG KÝ
    if (tab === "register") {
      if (!agreedTerms) {
        setTermsErrorHighlight(true);
        toast.error(
          "⚠️ BẮT BUỘC: Bạn phải đánh dấu tích chọn chấp thuận Điều khoản dịch vụ và Chính sách bảo mật để đăng ký tài khoản!",
        );
        return;
      }
      setTermsErrorHighlight(false);

      if (password.length < 6) {
        toast.error("Mật khẩu phải có tối thiểu 6 ký tự để bảo mật!");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.");
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register(email, password, undefined, agreedTerms);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoc = async () => {
    setLoading(true);
    try {
      await login("nguyenlocdz2k7@gmail.com", "admin123");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuick = async () => {
    setLoading(true);
    try {
      await login("admin@aivideo.ai", "admin123");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    try {
      await login("demo.user@aivideo.ai", "demo123456");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-3 backdrop-blur-md sm:p-4"
        onClick={() => setIsLoginModalOpen(false)}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative grid w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-2xl md:grid-cols-12"
          onClick={(e) => e.stopPropagation()}
        >
          {/* CỘT TRÁI: BANNER MINH HỌA VỚI AVATAR DI CHUYỂN THEO CHUỘT */}
          <div className="relative hidden flex-col justify-between border-r border-slate-200/80 bg-[#f8fafc] p-6 md:col-span-5 md:flex overflow-hidden">
            <div>
              <InteractiveHeadAvatar isPasswordFocused={isPasswordFocused} />
              <h3 className="text-center font-display text-lg font-bold text-slate-900">
                Chào mừng đến với AI Video&amp;Text
              </h3>
              <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
                Nền tảng trí tuệ nhân tạo nhận dạng hình ảnh OCR và chuyển đổi giọng nói siêu tốc.
              </p>
            </div>

            {/* DẢI LOGO MARQUEE */}
            <div className="marquee-modal-container border-t border-slate-200/80 pt-3 mt-4 w-full overflow-hidden select-none">
              <div className="marquee-modal-mask overflow-hidden w-full">
                <div className="marquee-modal-left flex w-max items-center gap-5 py-1">
                  {[...MODAL_ROW1_LOGOS, ...MODAL_ROW1_LOGOS].map((item, idx) => (
                    <span
                      key={`m-r1-${item.name}-${idx}`}
                      className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-slate-500 whitespace-nowrap"
                    >
                      <img
                        src={item.logo}
                        alt={item.name}
                        className="size-3.5 shrink-0 object-contain"
                        loading="lazy"
                      />
                      <span>{item.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: FORM ĐĂNG NHẬP / ĐĂNG KÝ */}
          <div className="p-6 md:col-span-7 sm:p-8 bg-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {tab === "login" ? "Đăng nhập tài khoản ✌️" : "Đăng ký tài khoản 👋"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {tab === "login"
                    ? "Vui lòng nhập email và mật khẩu của bạn để tiếp tục."
                    : "Điền thông tin và chấp thuận điều khoản để tạo tài khoản."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="grid size-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Đóng"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="my-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setTermsErrorHighlight(false);
                }}
                className={`rounded-lg py-2 font-display text-xs transition ${
                  tab === "login"
                    ? "bg-white text-slate-900 font-semibold shadow-sm"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setAgreedTerms(false); // BẮT BUỘC người dùng phải tự đánh dấu đồng ý
                }}
                className={`rounded-lg py-2 font-display text-xs transition ${
                  tab === "register"
                    ? "bg-white text-slate-900 font-semibold shadow-sm"
                    : "text-slate-500 hover:text-slate-900 font-medium"
                }`}
              >
                Đăng ký mới
              </button>
            </div>

            {/* Form inputs */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email input */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ Gmail / Email của bạn"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              {/* Password input */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder={
                    tab === "register" ? "Tạo mật khẩu (tối thiểu 6 ký tự)" : "Nhập mật khẩu của bạn"
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Confirm Password input (chỉ khi Register) */}
              {tab === "register" ? (
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholder="Nhập lại mật khẩu để xác nhận"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              ) : null}

              {/* BẮT BUỘC CHẤP THUẬN ĐIỀU KHOẢN KHI ĐĂNG KÝ */}
              {tab === "register" ? (
                <div
                  className={`rounded-xl border p-2.5 transition ${
                    termsErrorHighlight
                      ? "border-rose-400 bg-rose-50/70 ring-2 ring-rose-200"
                      : "border-slate-200 bg-slate-50/50"
                  }`}
                >
                  <label className="flex items-start gap-2.5 text-[11px] leading-tight text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => {
                        setAgreedTerms(e.target.checked);
                        if (e.target.checked) setTermsErrorHighlight(false);
                      }}
                      className="mt-0.5 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                    />
                    <span>
                      <span className="font-semibold text-rose-600">* Bắt buộc:</span> Tôi đã đọc
                      và cam kết chấp thuận{" "}
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.preventDefault();
                          setIsTermsDetailOpen(true);
                        }}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        Điều khoản dịch vụ
                      </button>{" "}
                      và{" "}
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.preventDefault();
                          setIsTermsDetailOpen(true);
                        }}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        Chính sách bảo mật
                      </button>{" "}
                      của hệ thống.
                    </span>
                  </label>
                  {termsErrorHighlight ? (
                    <p className="mt-1 text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3 shrink-0" />
                      Vui lòng tích vào ô trên để tiếp tục đăng ký!
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-[#0f172a] py-3 font-display text-xs font-bold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-50 shadow-md"
              >
                {loading ? "Đang xử lý..." : tab === "login" ? "Đăng nhập ngay" : "Đăng ký tài khoản mới"}
              </button>
            </form>

            <div className="relative my-4 text-center">
              <span className="relative z-10 bg-white px-3 font-mono text-[10px] text-slate-400">
                Hoặc tiếp tục với
              </span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
            </div>

            {/* CẬP NHẬT ĐĂNG NHẬP BẰNG GOOGLE CHUẨN */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={loading}
                className="relative flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 shadow-sm"
              >
                <svg className="size-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Đăng nhập với Google</span>
                <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-500 px-2 py-0.5 font-mono text-[9px] font-bold text-white shadow-sm uppercase">
                  TỰ ĐỘNG
                </span>
              </button>

              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAdminLoc}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-400 bg-amber-500/15 py-2 text-[11px] font-bold text-amber-900 transition hover:bg-amber-500/25 shadow-sm"
                    title="Đăng nhập tài khoản Quản trị viên tối cao: nguyenlocdz2k7@gmail.com / admin123"
                  >
                    <Crown className="size-3.5 text-amber-600" />
                    <span>👑 Admin Lộc</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAdminQuick}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-2 text-[11px] font-semibold text-amber-900 transition hover:bg-amber-100 shadow-sm"
                    title="Đăng nhập tài khoản Quản trị viên hệ thống: admin@aivideo.ai / admin123"
                  >
                    <ShieldCheck className="size-3.5 text-amber-600" />
                    <span>Admin Hệ Thống</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleQuickDemo}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Zap className="size-3.5 text-emerald-500" />
                  <span>Vào Demo (1 lượt trải nghiệm)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT ĐIỀU KHOẢN VÀ CHÍNH SÁCH BẢO MẬT */}
      {isTermsDetailOpen ? (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setIsTermsDetailOpen(false)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-[#141838] p-6 shadow-2xl text-left flex flex-col text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Điều Khoản Dịch Vụ &amp; Chính Sách Bảo Mật
              </h3>
              <button
                type="button"
                onClick={() => setIsTermsDetailOpen(false)}
                className="rounded-full p-1 text-white/60 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="my-4 overflow-y-auto space-y-4 text-xs leading-relaxed text-white/80 pr-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <h4 className="font-bold text-white mb-1">1. Quy định sử dụng và trách nhiệm</h4>
                <p>
                  Người dùng cam kết không sử dụng hệ thống AI để tải lên các nội dung vi phạm pháp
                  luật, hình ảnh bạo lực, khiêu dâm hoặc xâm phạm bản quyền của bên thứ ba.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <h4 className="font-bold text-white mb-1">2. Bảo mật dữ liệu người dùng</h4>
                <p>
                  Toàn bộ thông tin tài khoản (Gmail, mật khẩu mã hóa), lịch sử nhận dạng và hình ảnh
                  được bảo vệ nghiêm ngặt trên cơ sở dữ liệu Supabase, không chia sẻ cho bên thứ ba.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <h4 className="font-bold text-white mb-1">3. Gói cước và thời hạn dịch vụ</h4>
                <p>
                  Tài khoản Free được trải nghiệm 1 lần miễn phí. Các gói trả phí (Go, Pro, Promax)
                  kích hoạt tự động qua VietQR SePay theo chu kỳ thời hạn tương ứng.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setAgreedTerms(true);
                  setTermsErrorHighlight(false);
                  setIsTermsDetailOpen(false);
                  toast.success("Đã ghi nhận chấp thuận Điều khoản dịch vụ!");
                }}
                className="btn-glow rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md"
              >
                Tôi đồng ý &amp; Chấp thuận
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* =========================================================================
   2. PROFILE MODAL (TRANG CÁ NHÂN & NÚT ADMIN / ĐỔI MẬT KHẨU)
   ========================================================================= */
export function ProfileModal() {
  const {
    user,
    isAdmin,
    isProfileModalOpen,
    setIsProfileModalOpen,
    setIsAvatarModalOpen,
    setIsAdminModalOpen,
    setIsChangePasswordModalOpen,
    switchRoleToAdmin,
    logout,
  } = useAuth();

  if (!isProfileModalOpen || !user) return null;

  const currentPlan = PLANS.find((p) => p.id === user.plan) ?? PLANS[0];
  const isFreePlan = user.plan === "free";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4"
      onClick={() => setIsProfileModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#141836] p-6 shadow-2xl sm:p-7 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </button>

        {/* Header thông tin người dùng */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-5">
          <div className="relative group">
            <img
              src={user.avatar}
              alt={user.name}
              className="size-16 rounded-2xl border-2 border-primary/40 bg-white/10 object-contain p-1 shadow-md"
            />
            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsAvatarModalOpen(true);
              }}
              className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-primary text-white shadow-sm hover:scale-110"
              title="Đổi avatar"
            >
              <Camera className="size-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold text-white">{user.name}</h3>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/40">
                  <Crown className="size-3 text-amber-400" />
                  ADMIN
                </span>
              ) : user.plan !== "free" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  <Sparkles className="size-3" />
                  VIP
                </span>
              ) : null}
            </div>
            <p className="font-mono text-xs text-white/60">{user.email}</p>
            <div className="flex items-center gap-3 mt-0.5 font-mono text-[10px] text-white/40">
              <span>Tham gia: {user.joinedAt}</span>
              <span>•</span>
              <span className="text-white/70">
                Chức vụ: <b>{user.role === "admin" ? "Quản trị viên (Admin)" : "Thành viên"}</b>
              </span>
            </div>
          </div>
        </div>

        {/* NÚT MỞ BẢNG QUẢN TRỊ ADMIN (CHỈ HIỂN THỊ KHI ĐĂNG NHẬP BẰNG TÀI KHOẢN ADMIN ĐƯỢC PHÂN QUYỀN) */}
        {isAdmin && (
          <div className="my-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-primary/15 p-3.5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-500/20 text-amber-400">
                <Crown className="size-4" />
              </span>
              <div>
                <div className="font-display text-xs font-bold text-amber-300">
                  Trung Tâm Quản Trị Hệ Thống (Admin Portal)
                </div>
                <div className="text-[11px] text-white/60">
                  Quản lý người dùng, đổi mật khẩu, thêm gói &amp; gia hạn gói.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsAdminModalOpen(true);
              }}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 text-xs shadow-md"
            >
              Mở ngay
            </button>
          </div>
        )}

        {/* THÔNG TIN GÓI CƯỚC HIỆN TẠI */}
        <div className="my-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-white/60">
              Gói dịch vụ hiện tại
            </span>

            {isFreePlan ? (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-white/80">
                Gói Miễn Phí (Free)
              </span>
            ) : (
              <span className="btn-glow inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                <Sparkles className="size-3" />
                Gói {currentPlan?.name || user.plan.toUpperCase()}
              </span>
            )}
          </div>

          <div className="mt-4">
            {isFreePlan ? (
              <div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-white/70">Số lượt trải nghiệm miễn phí:</span>
                  <span className="font-bold text-white">{user.freeTrialUsed} / 1 lượt</span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      user.freeTrialUsed >= 1 ? "bg-rose-500" : "bg-emerald-400"
                    }`}
                    style={{ width: `${user.freeTrialUsed * 100}%` }}
                  />
                </div>

                {user.freeTrialUsed >= 1 ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                    <AlertCircle className="size-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      Bạn đã sử dụng hết <b>1 lượt trải nghiệm miễn phí</b>. Vui lòng nâng cấp gói
                      cước để tiếp tục sử dụng không giới hạn!
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 font-mono text-[11px] text-emerald-400">
                    ✓ Bạn còn 1 lượt trải nghiệm AI miễn phí!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-white/70">Trạng thái:</span>
                  <span className="font-semibold text-emerald-400">Đang hoạt động ✓</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-white/70">Thời hạn gói:</span>
                  <span className="text-white font-medium">
                    {user.expiresAt ? `Hết hạn ngày ${user.expiresAt}` : "Vĩnh viễn"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-white/10 pt-3">
            <a
              href="#bang-gia"
              onClick={() => setIsProfileModalOpen(false)}
              className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl py-2 text-center font-display text-xs font-semibold shadow-md"
            >
              <Zap className="size-3.5" />
              <span>{isFreePlan ? "Nâng cấp lên gói trả phí ngay" : "Xem thêm gói cước khác"}</span>
            </a>
          </div>
        </div>

        {/* Nút đổi mật khẩu và đổi avatar */}
        <div className="space-y-2">
          {/* NÚT ĐỔI MẬT KHẨU TÀI KHOẢN */}
          <button
            type="button"
            onClick={() => {
              setIsProfileModalOpen(false);
              setIsChangePasswordModalOpen(true);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <Key className="size-3.5 text-amber-400" />
              Đổi mật khẩu tài khoản
            </span>
            <ChevronRight className="size-4 text-white/40" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsProfileModalOpen(false);
              setIsAvatarModalOpen(true);
            }}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <span>Thay đổi ảnh đại diện (Kho 18 Avatar)</span>
            <ChevronRight className="size-4 text-white/40" />
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20"
          >
            <LogOut className="size-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. CHANGE PASSWORD MODAL (NGƯỜI DÙNG TỰ ĐỔI MẬT KHẨU CỦA MÌNH)
   ========================================================================= */
export function ChangePasswordModal() {
  const { isChangePasswordModalOpen, setIsChangePasswordModalOpen, changeMyPassword, user } =
    useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isChangePasswordModalOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự!");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      const success = await changeMyPassword(oldPassword, newPassword);
      if (success) {
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={() => setIsChangePasswordModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-[#141838] p-6 shadow-2xl text-left text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
            <Key className="size-4 text-amber-400" />
            Đổi Mật Khẩu Cá Nhân
          </h3>
          <button
            type="button"
            onClick={() => setIsChangePasswordModalOpen(false)}
            className="rounded-full p-1 text-white/60 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
            <span className="text-white/60">Tài khoản:</span>
            <div className="font-mono font-bold text-white mt-0.5">{user.email}</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Mật khẩu hiện tại *
            </label>
            <input
              type="password"
              required
              placeholder="Nhập mật khẩu hiện tại"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Mật khẩu mới (tối thiểu 6 ký tự) *
            </label>
            <input
              type="password"
              required
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Xác nhận mật khẩu mới *
            </label>
            <input
              type="password"
              required
              placeholder="Nhập lại mật khẩu mới"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsChangePasswordModalOpen(false)}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-md"
            >
              {loading ? "Đang xử lý..." : "Lưu mật khẩu mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   4. GOOGLE ACCOUNT SELECT MODAL (TƯƠNG TÁC ĐĂNG NHẬP GOOGLE)
   ========================================================================= */
export function GoogleAccountSelectModal() {
  const {
    isGoogleSelectModalOpen,
    setIsGoogleSelectModalOpen,
    loginWithGoogleAccount,
  } = useAuth();
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  if (!isGoogleSelectModalOpen) return null;

  const demoGoogleAccounts = [
    {
      name: "Nguyễn Văn Lộc (Admin Tối Cao)",
      email: "nguyenlocdz2k7@gmail.com",
      avatar:
        "https://api.dicebear.com/7.x/adventurer/svg?seed=NarutoKyuubi&hair=short01&hairColor=facc15",
    },
    {
      name: "Quản Trị Viên (Admin Hệ Thống)",
      email: "admin@aivideo.ai",
      avatar: "/wus_cat.png",
    },
    {
      name: "Hoàng Nam AI (Thành viên Pro)",
      email: "hoangnam.ai@gmail.com",
      avatar:
        "https://api.dicebear.com/7.x/adventurer/svg?seed=GokuSSJ1&hair=short03&hairColor=facc15",
    },
  ];

  const handleSelectPredefined = (item: (typeof demoGoogleAccounts)[0]) => {
    void loginWithGoogleAccount(item.email, item.name);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoogleEmail.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ Gmail hợp lệ!");
      return;
    }
    void loginWithGoogleAccount(customGoogleEmail, customGoogleName);
  };

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={() => setIsGoogleSelectModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white text-slate-900 p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <h3 className="font-display text-base font-bold text-slate-900">
              Đăng nhập bằng tài khoản Google
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsGoogleSelectModalOpen(false)}
            className="rounded-full p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Chọn một tài khoản Google bên dưới để đăng nhập ngay, hoặc nhập địa chỉ Gmail của bạn:
        </p>

        {/* Danh sách tài khoản mẫu */}
        <div className="mt-4 space-y-2">
          {demoGoogleAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleSelectPredefined(acc)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-2.5 text-left transition hover:bg-slate-50 hover:border-indigo-400"
            >
              <img
                src={acc.avatar}
                alt={acc.name}
                className="size-9 rounded-full border border-slate-200 bg-slate-100 p-0.5 object-contain"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900">{acc.name}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{acc.email}</div>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </button>
          ))}
        </div>

        <div className="relative my-4 text-center">
          <span className="relative z-10 bg-white px-2 font-mono text-[10px] text-slate-400">
            Hoặc nhập Gmail của bạn
          </span>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div>
            <input
              type="email"
              required
              placeholder="nhap.email.cua.ban@gmail.com"
              value={customGoogleEmail}
              onChange={(e) => setCustomGoogleEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Tên của bạn (Tùy chọn)"
              value={customGoogleName}
              onChange={(e) => setCustomGoogleName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-2.5 font-display text-xs font-bold text-white transition hover:bg-indigo-700 shadow-sm"
          >
            Tiếp tục đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   5. AVATAR SELECTOR MODAL (BỘ SƯU TẬP 18 AVATAR)
   ========================================================================= */
export function AvatarModal() {
  const { user, isAvatarModalOpen, setIsAvatarModalOpen, updateAvatar } = useAuth();

  if (!isAvatarModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-3 backdrop-blur-md sm:p-4"
      onClick={() => setIsAvatarModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#141836] p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Chọn ảnh đại diện của bạn</h3>
            <p className="text-xs text-white/60">Bộ sưu tập 18 nhân vật Anime &amp; Avatar độc quyền</p>
          </div>
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(false)}
            className="grid size-8 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="my-4 max-h-[58vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-3.5">
            {AVATARS.map((avt) => {
              const isSelected = user?.avatarId === avt.id;
              return (
                <button
                  key={avt.id}
                  type="button"
                  onClick={() => updateAvatar(avt.id)}
                  className={`group relative flex flex-col items-center rounded-2xl border p-3 text-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary/20 shadow-md shadow-primary/30 ring-2 ring-primary"
                      : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  <div className="size-14 overflow-hidden rounded-xl bg-white/10 p-1">
                    <img
                      src={avt.url}
                      alt={avt.name}
                      className="size-full object-contain transition group-hover:scale-110"
                    />
                  </div>
                  <span className="mt-2 line-clamp-1 font-display text-[11px] font-semibold text-white">
                    {avt.name}
                  </span>
                  {isSelected ? (
                    <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 text-center">
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(false)}
            className="rounded-xl border border-white/15 bg-white/5 px-6 py-2 text-xs font-medium text-white transition hover:bg-white/10"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   6. TRIAL LIMIT MODAL (KHI GÓI FREE DÙNG HẾT 1 LƯỢT)
   ========================================================================= */
export function TrialLimitModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-[#161a3b] p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/20 text-amber-400 ring-8 ring-amber-500/10">
          <Zap className="size-8" />
        </div>

        <h3 className="mt-5 font-display text-xl font-bold text-white">
          Đã hết lượt trải nghiệm miễn phí
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-white/70">
          Tài khoản Free chỉ được <b>1 lần trải nghiệm tính năng AI</b>. Để tiếp tục nhận dạng hình
          ảnh, trích xuất OCR và chuyển giọng nói không giới hạn, vui lòng nâng cấp gói cước!
        </p>

        <div className="my-5 rounded-xl border border-white/10 bg-white/5 p-3.5 text-left text-xs font-mono text-white/80 space-y-1.5">
          <div className="flex justify-between">
            <span>Gói Go (Cơ bản):</span>
            <span className="font-bold text-primary">49.000đ / tháng</span>
          </div>
          <div className="flex justify-between">
            <span>Gói Pro (Phổ biến):</span>
            <span className="font-bold text-emerald-400">149.000đ / tháng</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <a
            href="#bang-gia"
            onClick={onClose}
            className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl py-3 font-display text-xs font-semibold shadow-md"
          >
            <Crown className="size-4" />
            <span>Xem bảng giá &amp; Nâng cấp ngay</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 py-2.5 text-xs font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}
