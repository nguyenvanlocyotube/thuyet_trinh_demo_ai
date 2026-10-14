import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Bell,
  Sparkles,
  Zap,
  Gift,
  AlertTriangle,
  Info,
  CheckCheck,
  RefreshCw,
  Crown,
  Shield,
  Calendar,
  Pin,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { BroadcastNotification, NotificationType } from "@/lib/admin.types";
import { getBroadcastNotifications } from "@/lib/admin.functions";
import { toast } from "sonner";

const READ_NOTIFS_KEY = "aiv_read_notifications_ids_v1";

export function NotificationsModal() {
  const {
    isNotificationsModalOpen,
    setIsNotificationsModalOpen,
    setUnreadNotificationsCount,
    markNotificationsAsRead,
  } = useAuth();

  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<"all" | NotificationType>("all");
  const [readIds, setReadIds] = useState<string[]>([]);

  // Đọc danh sách đã đọc từ LocalStorage
  const loadReadIds = () => {
    try {
      const raw = window.localStorage.getItem(READ_NOTIFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setReadIds(parsed);
      }
    } catch {
      // Ignore
    }
  };

  // Tải danh sách thông báo từ Server
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await getBroadcastNotifications();
      if (list && Array.isArray(list)) {
        // Sắp xếp: Tin ghim lên đầu, sau đó đến mới nhất
        const sorted = [...list].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime();
        });
        setNotifications(sorted);

        // Cập nhật số chưa đọc
        const raw = window.localStorage.getItem(READ_NOTIFS_KEY);
        const currentRead: string[] = raw ? JSON.parse(raw) : [];
        const unread = sorted.filter((n) => !currentRead.includes(n.id)).length;
        setUnreadNotificationsCount(unread);
      }
    } catch (err) {
      console.warn("Lỗi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isNotificationsModalOpen) return;

    loadReadIds();
    void loadNotifications();

    // 1. Tự động kiểm tra bản tin mới mỗi 10 giây khi modal đang mở
    const timer = setInterval(() => {
      void loadNotifications();
    }, 10000);

    // 2. Lắng nghe sự kiện cập nhật dữ liệu từ admin hoặc các tab khác
    const handleDataUpdated = () => {
      void loadNotifications();
    };
    window.addEventListener("app:data-updated", handleDataUpdated);

    return () => {
      clearInterval(timer);
      window.removeEventListener("app:data-updated", handleDataUpdated);
    };
  }, [isNotificationsModalOpen]);

  // Đánh dấu 1 tin đã đọc khi click
  const markSingleAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      try {
        window.localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(next));
      } catch {
        // Ignore
      }
      setUnreadNotificationsCount(Math.max(0, notifications.length - next.length));
    }
  };

  // Đánh dấu tất cả đã đọc
  const handleMarkAllRead = () => {
    markNotificationsAsRead();
    setReadIds(notifications.map((n) => n.id));
    toast.success("Đã đánh dấu tất cả thông báo là đã đọc!");
  };

  // Lọc theo tab
  const filteredNotifications = useMemo(() => {
    if (filterType === "all") return notifications;
    return notifications.filter((n) => n.type === filterType);
  }, [notifications, filterType]);

  const getTypeMeta = (type: NotificationType) => {
    switch (type) {
      case "update":
        return {
          icon: Zap,
          color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
          label: "Cập nhật hệ thống",
        };
      case "feature":
        return {
          icon: Sparkles,
          color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
          label: "Tính năng mới",
        };
      case "promo":
        return {
          icon: Gift,
          color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
          label: "Ưu đãi & Khuyến mãi",
        };
      case "maintenance":
        return {
          icon: AlertTriangle,
          color: "text-rose-400 bg-rose-500/10 border-rose-500/30",
          label: "Bảo trì & Thông báo",
        };
      default:
        return {
          icon: Info,
          color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
          label: "Thông báo chung",
        };
    }
  };

  if (!isNotificationsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => setIsNotificationsModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex h-[88vh] max-h-[850px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#111633] via-[#0b0e24] to-[#070916] text-white shadow-[0_0_80px_rgba(99,102,241,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            HEADER MODAL THÔNG BÁO
        ========================================================= */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/60 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/30 border border-primary/40 shadow-inner">
              <Bell className="size-5 text-amber-300 animate-bounce" />
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-amber-400 ring-2 ring-[#0b0e24]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
                  Thông Báo &amp; Bản Cập Nhật
                </h3>
                <span className="rounded-full bg-primary/20 border border-primary/40 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {notifications.length} bản tin
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live 24/7
                </span>
              </div>
              <p className="text-xs text-white/60">
                Các cập nhật mới nhất từ Admin gửi đến tất cả thành viên hệ thống.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95"
              title="Đánh dấu tất cả là đã đọc"
            >
              <CheckCheck className="size-3.5 text-emerald-400" />
              <span>Đã đọc tất cả</span>
            </button>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition active:scale-95"
              title="Làm mới thông báo"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsNotificationsModalOpen(false)}
              className="grid size-9 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Đóng bảng thông báo"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* =========================================================
            BỘ LỌC THEO LOẠI THÔNG BÁO (TẤT CẢ / UPDATE / FEATURE / PROMO)
        ========================================================= */}
        <div className="shrink-0 border-b border-white/10 bg-slate-900/40 px-5 py-2.5 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-xl px-3 py-1.5 font-semibold transition shrink-0 ${
                filterType === "all"
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Tất cả ({notifications.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType("update")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition shrink-0 ${
                filterType === "update"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30"
                  : "bg-white/5 text-cyan-300 hover:bg-white/10"
              }`}
            >
              <Zap className="size-3.5" />
              <span>Cập nhật</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("feature")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition shrink-0 ${
                filterType === "feature"
                  ? "bg-purple-500 text-white font-bold shadow-md shadow-purple-500/30"
                  : "bg-white/5 text-purple-300 hover:bg-white/10"
              }`}
            >
              <Sparkles className="size-3.5" />
              <span>Tính năng mới</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("promo")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition shrink-0 ${
                filterType === "promo"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                  : "bg-white/5 text-amber-300 hover:bg-white/10"
              }`}
            >
              <Gift className="size-3.5" />
              <span>Ưu đãi VIP</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("maintenance")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold transition shrink-0 ${
                filterType === "maintenance"
                  ? "bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30"
                  : "bg-white/5 text-rose-300 hover:bg-white/10"
              }`}
            >
              <AlertTriangle className="size-3.5" />
              <span>Hệ thống</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            DANH SÁCH THÔNG BÁO TỪ ADMIN GỬI CHO TẤT CẢ USER
        ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid size-16 place-items-center rounded-3xl bg-white/5 border border-white/10 text-white/40 mb-3">
                <Bell className="size-8 opacity-40" />
              </div>
              <p className="font-semibold text-white/70 text-sm">Chưa có thông báo nào trong mục này</p>
              <p className="text-xs text-white/40 mt-1 max-w-sm">
                Các bản cập nhật và thông báo mới từ Quản trị viên sẽ được hiển thị ở đây.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const meta = getTypeMeta(notif.type);
              const IconComp = meta.icon;
              const isRead = readIds.includes(notif.id);
              const isGoldSender = notif.senderTier === "gold";

              return (
                <article
                  key={notif.id}
                  onClick={() => markSingleAsRead(notif.id)}
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${
                    notif.pinned
                      ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-900/50 to-slate-950/70 shadow-lg shadow-amber-500/5"
                      : isRead
                        ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                        : "border-primary/40 bg-primary/[0.06] hover:border-primary/60 hover:bg-primary/[0.09] shadow-md shadow-primary/5"
                  }`}
                >
                  {/* Dải sáng chỉ báo tin mới */}
                  {!isRead && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-primary to-cyan-400" />
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Huy hiệu loại tin */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase border ${meta.color}`}
                      >
                        <IconComp className="size-3" />
                        <span>{notif.badgeText || meta.label}</span>
                      </span>

                      {/* Tag Ghim */}
                      {notif.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/40">
                          <Pin className="size-3 text-amber-400" />
                          <span>GHIM ĐẦU TRANG</span>
                        </span>
                      )}

                      {/* Chấm chỉ báo trạng thái chưa đọc */}
                      {!isRead ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/30">
                          <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          Mới
                        </span>
                      ) : (
                        <span className="text-[11px] text-white/40 font-mono">Đã xem</span>
                      )}
                    </div>

                    {/* Ngày tháng */}
                    <div className="flex items-center gap-1 text-[11px] font-mono text-white/50 shrink-0">
                      <Calendar className="size-3" />
                      <span>{notif.createdAt}</span>
                    </div>
                  </div>

                  {/* Tiêu đề thông báo */}
                  <h4 className="mt-3 font-display text-base sm:text-lg font-bold text-white group-hover:text-primary transition leading-snug">
                    {notif.title}
                  </h4>

                  {/* Nội dung chi tiết thông báo */}
                  <div className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed whitespace-pre-line font-sans">
                    {notif.content}
                  </div>

                  {/* Chữ ký người gửi Admin */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 text-[11px]">Người gửi:</span>
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 border border-white/10 font-medium">
                        {isGoldSender ? (
                          <>
                            <Crown className="size-3 text-amber-400" />
                            <span className="font-bold text-amber-300">{notif.senderName}</span>
                            <span className="font-mono text-[9px] text-amber-400/80 bg-amber-500/20 px-1 rounded">
                              Admin Vàng
                            </span>
                          </>
                        ) : (
                          <>
                            <Shield className="size-3 text-slate-300" />
                            <span className="font-semibold text-slate-200">{notif.senderName}</span>
                            <span className="font-mono text-[9px] text-slate-300 bg-slate-500/20 px-1 rounded">
                              Admin Bạc
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] text-white/40 font-mono">
                      Gửi tới: Tất cả người dùng
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* =========================================================
            FOOTER MODAL
        ========================================================= */}
        <div className="shrink-0 border-t border-white/10 bg-slate-950/70 px-5 py-3 sm:px-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white/50">
            <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kênh thông báo chính thức từ Ban Quản Trị AI Video&amp;Text</span>
          </div>

          <button
            type="button"
            onClick={() => setIsNotificationsModalOpen(false)}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-1.5 font-semibold text-white hover:bg-white/10 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
