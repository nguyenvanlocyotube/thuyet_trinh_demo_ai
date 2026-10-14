import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Key,
  Calendar,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  User,
  Users,
  Check,
  Copy,
  Trash2,
  Edit,
  Clock,
  AlertCircle,
  RefreshCw,
  Zap,
  Tag,
  CheckCircle2,
  ChevronRight,
  Filter,
  FileDown,
  Activity,
  HardDrive,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import type { UserRecord, PlanItem, UserRole, UserStatus } from "@/lib/admin.types";
import {
  getAdminUsers,
  addAdminUser,
  changeUserPassword,
  renewUserSubscription,
  updateAdminUser,
  deleteAdminUser,
  toggleUserSuspension,
  syncAdminDatabase,
  getAdminPlans,
  addAdminPlan,
  deleteAdminPlan,
} from "@/lib/admin.functions";
import { PLANS, vnd } from "@/lib/plans";

export function AdminPanelModal() {
  const { user, isAdminModalOpen, setIsAdminModalOpen } = useAuth();

  const [activeTab, setActiveTab] = useState<"users" | "plans" | "logs">("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Show/Hide password toggles for individual users
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Sub-modal states
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);

  // Selected user for action
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Form states for Add User
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newPlan, setNewPlan] = useState("free");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [newDurationDays, setNewDurationDays] = useState(30);
  const [newNotes, setNewNotes] = useState("");

  // Form states for Change Password
  const [changePasswordVal, setChangePasswordVal] = useState("");

  // Form states for Renew Plan
  const [renewPlanId, setRenewPlanId] = useState("pro");
  const [renewDurationDays, setRenewDurationDays] = useState(30);

  // Form states for Add Plan
  const [planIdInput, setPlanIdInput] = useState("");
  const [planNameInput, setPlanNameInput] = useState("");
  const [planPriceInput, setPlanPriceInput] = useState(99000);
  const [planTaglineInput, setPlanTaglineInput] = useState("");
  const [planFeaturesInput, setPlanFeaturesInput] = useState(
    "200 ảnh phân tích / tháng\n60 phút ghi âm Whisper\nLưu lịch sử đám mây 60 ngày",
  );
  const [planPopularInput, setPlanPopularInput] = useState(false);
  const [planDurationDaysInput, setPlanDurationDaysInput] = useState(30);

  // Form states for Edit User
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [editPlan, setEditPlan] = useState("free");
  const [editStatus, setEditStatus] = useState<UserStatus>("active");
  const [editNotes, setEditNotes] = useState("");

  // Load data from server
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedPlans] = await Promise.all([getAdminUsers(), getAdminPlans()]);
      if (fetchedUsers) setUsers(fetchedUsers);
      if (fetchedPlans) setPlans(fetchedPlans);
    } catch (err) {
      console.error("Lỗi nạp dữ liệu Admin:", err);
      toast.error("Không thể tải dữ liệu từ máy chủ. Đang dùng dữ liệu bộ nhớ đệm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen && user?.role === "admin") {
      void loadData();
    } else if (isAdminModalOpen && user?.role !== "admin") {
      setIsAdminModalOpen(false);
    }
  }, [isAdminModalOpen, user?.role, setIsAdminModalOpen]);

  // Generate random safe password
  const generateRandomPassword = () => {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const copyToClipboard = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  // Toggle reveal password
  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      // Status filter
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      // Plan filter
      if (planFilter !== "all" && u.plan !== planFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchName = u.name.toLowerCase().includes(q);
        const matchNotes = u.notes?.toLowerCase().includes(q);
        return matchEmail || matchName || matchNotes;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, planFilter, searchQuery]);

  // Stats
  const totalUsersCount = users.length;
  const adminUsersCount = users.filter((u) => u.role === "admin").length;
  const vipUsersCount = users.filter((u) => u.plan !== "free").length;
  const suspendedUsersCount = users.filter((u) => u.status === "suspended").length;
  const totalPlansCount = plans.length;

  /* =========================================================================
     ACTIONS: ĐỒNG BỘ DỮ LIỆU, KHÓA / MỞ KHÓA, THÊM USER, ĐỔI PASS, GIA HẠN
     ========================================================================= */

  // 0. CHỨC NĂNG NÚT ĐỒNG BỘ (SYNC DATABASE GIỮA SERVER, CACHE VÀ CLIENT)
  const handleSyncDatabase = async () => {
    setSyncing(true);
    try {
      const res = await syncAdminDatabase({
        data: { clientUsers: users },
      });
      if (res.success) {
        setUsers(res.users);
        setPlans(res.plans);
        setLastSyncedTime(res.timestamp);
        // Lưu vào cache LocalStorage
        try {
          window.localStorage.setItem("aiv_users_database_v5", JSON.stringify(res.users));
        } catch {
          // Ignore
        }
        toast.success(
          `🔄 Đồng bộ thành công! Hiện có ${res.totalUsers} người dùng và ${res.totalPlans} gói cước trên hệ thống.`,
          { duration: 4500 },
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đồng bộ thất bại.");
    } finally {
      setSyncing(false);
    }
  };

  // 1. KHÓA / MỞ KHÓA TÀI KHOẢN NGƯỜI DÙNG (CẬP NHẬT KHI ADMIN NHẤN KHÓA TÀI KHOẢN)
  const handleToggleSuspend = async (u: UserRecord) => {
    if (
      u.role === "admin" ||
      u.email.toLowerCase() === "nguyenlocdz2k7@gmail.com" ||
      u.email.toLowerCase() === "admin@aivideo.ai"
    ) {
      toast.error("Không thể khóa tài khoản Quản trị viên tối cao!");
      return;
    }

    const isCurrentActive = u.status === "active";
    const confirmMsg = isCurrentActive
      ? `Bạn có chắc chắn muốn KHÓA tài khoản "${u.email}"?\n\nSau khi khóa, người dùng này khi đăng nhập sẽ hiện thông báo: "Tài khoản của bạn đã bị khóa bởi Quản trị viên".`
      : `Bạn có chắc chắn muốn MỞ KHÓA tài khoản "${u.email}"?\n\nSau khi mở khóa, người dùng có thể đăng nhập và sử dụng dịch vụ bình thường.`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await toggleUserSuspension({
        data: {
          userId: u.id,
          reason: isCurrentActive ? "Khóa trực tiếp từ Bảng Quản Trị Admin" : undefined,
        },
      });

      if (res.success && res.user) {
        setUsers((prev) => prev.map((item) => (item.id === u.id ? res.user : item)));
        // Cập nhật LocalStorage ngay lập tức
        try {
          const cached = users.map((item) => (item.id === u.id ? res.user : item));
          window.localStorage.setItem("aiv_users_database_v5", JSON.stringify(cached));
        } catch {
          // Ignore
        }
        if (res.isSuspended) {
          toast.error(`⛔ ${res.message}`, { duration: 5500 });
        } else {
          toast.success(`✅ ${res.message}`, { duration: 4000 });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác trạng thái tài khoản thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Thêm người dùng mới
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      toast.error("Mật khẩu phải có tối thiểu 4 ký tự!");
      return;
    }

    setLoading(true);
    try {
      const res = await addAdminUser({
        data: {
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          name: newName.trim() || newEmail.split("@")[0] || "Thành viên",
          plan: newPlan,
          role: newRole,
          durationDays: newPlan === "free" ? 0 : newDurationDays,
          status: "active",
          notes: newNotes,
        },
      });

      if (res.success && res.user) {
        setUsers((prev) => [res.user, ...prev]);
        toast.success(`Đã thêm người dùng "${res.user.email}" vào cơ sở dữ liệu!`);
        setIsAddUserOpen(false);
        // Reset form
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        setNewPlan("free");
        setNewRole("user");
        setNewNotes("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm người dùng.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Đổi mật khẩu người dùng
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!changePasswordVal || changePasswordVal.length < 4) {
      toast.error("Mật khẩu mới phải có tối thiểu 4 ký tự!");
      return;
    }

    setLoading(true);
    try {
      const res = await changeUserPassword({
        data: {
          userId: selectedUser.id,
          newPassword: changePasswordVal,
        },
      });

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, password: changePasswordVal } : u)),
        );
        toast.success(res.message);
        setIsChangePassOpen(false);
        setChangePasswordVal("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Gia hạn gói cước
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    try {
      const res = await renewUserSubscription({
        data: {
          userId: selectedUser.id,
          planId: renewPlanId,
          additionalDays: Number(renewDurationDays),
        },
      });

      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? res.user : u)));
        toast.success(res.message);
        setIsRenewOpen(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gia hạn gói thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Chỉnh sửa thông tin người dùng
  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    try {
      const res = await updateAdminUser({
        data: {
          userId: selectedUser.id,
          name: editName.trim(),
          role: editRole,
          plan: editPlan,
          status: editStatus,
          notes: editNotes.trim(),
        },
      });

      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? res.user : u)));
        toast.success(`Đã cập nhật thông tin thành viên "${res.user.email}"!`);
        setIsEditUserOpen(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // 6. Xóa người dùng
  const handleDeleteUser = async (u: UserRecord) => {
    if (u.email === "admin@aivideo.ai" || u.email === "nguyenlocdz2k7@gmail.com") {
      toast.error("Không thể xóa tài khoản Quản trị viên tối cao!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${u.email}"?`)) return;

    setLoading(true);
    try {
      const res = await deleteAdminUser({
        data: { userId: u.id },
      });
      if (res.success) {
        setUsers((prev) => prev.filter((item) => item.id !== u.id));
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa người dùng.");
    } finally {
      setLoading(false);
    }
  };

  // 7. Thêm gói cước mới
  const handleAddPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planIdInput.trim() || !planNameInput.trim()) {
      toast.error("Vui lòng điền đầy đủ Mã gói và Tên gói!");
      return;
    }

    const featuresArray = planFeaturesInput
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    setLoading(true);
    try {
      const res = await addAdminPlan({
        data: {
          id: planIdInput,
          name: planNameInput,
          price: Number(planPriceInput),
          tagline: planTaglineInput,
          features: featuresArray,
          popular: planPopularInput,
          durationDays: Number(planDurationDaysInput),
        },
      });

      if (res.success && res.plan) {
        setPlans((prev) => [...prev, res.plan]);
        toast.success(res.message);
        setIsAddPlanOpen(false);
        // Reset form
        setPlanIdInput("");
        setPlanNameInput("");
        setPlanPriceInput(99000);
        setPlanTaglineInput("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tạo gói cước.");
    } finally {
      setLoading(false);
    }
  };

  // 8. Xóa gói cước tùy chỉnh
  const handleDeletePlan = async (planId: string) => {
    if (["free", "go", "pro", "promax"].includes(planId)) {
      toast.error("Không thể xóa các gói cước mặc định!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa gói "${planId}"?`)) return;

    setLoading(true);
    try {
      const res = await deleteAdminPlan({
        data: { planId },
      });
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== planId));
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa gói cước.");
    } finally {
      setLoading(false);
    }
  };

  // 9. Xuất dữ liệu sao lưu (JSON Backup)
  const handleExportBackup = () => {
    try {
      const data = {
        users,
        plans,
        exportedAt: new Date().toISOString(),
        version: "5.0",
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_admin_database_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất tệp sao lưu JSON thành công!");
    } catch {
      toast.error("Lỗi xuất tệp sao lưu.");
    }
  };

  if (!isAdminModalOpen || user?.role !== "admin") return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-xl"
      onClick={() => setIsAdminModalOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-primary/40 bg-[#0a0d1e] text-slate-100 shadow-[0_0_80px_rgba(99,102,241,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            HEADER QUẢN TRỊ ADMIN (HIỆN ĐẠI, CYBER GLASSMORPHISM)
        ========================================================= */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-950 via-[#111633] to-slate-950 px-5 py-4 backdrop-blur-lg sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="AI Video&amp;Text Logo"
              className="size-11 shrink-0 rounded-2xl object-cover shadow-lg shadow-blue-500/25 ring-1 ring-blue-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-white sm:text-xl tracking-tight">
                  Trung Tâm Quản Trị Hệ Thống (Admin Control Center)
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/40">
                  <ShieldCheck className="size-3" />
                  ADMIN TOÀN QUYỀN
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-400 border border-emerald-500/30">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE DB
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/60">
                Lưu trữ người dùng (Gmail / Mật khẩu / Gói cước / Chức vụ), Khóa tài khoản, Đồng bộ
                &amp; Gia hạn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* NÚT ĐỒNG BỘ TRÊN HEADER */}
            <button
              type="button"
              onClick={handleSyncDatabase}
              disabled={syncing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/20 to-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-300 shadow-md transition hover:border-cyan-400 hover:from-primary/30 hover:to-cyan-500/30 active:scale-95 disabled:opacity-50"
              title="Đồng bộ cơ sở dữ liệu với máy chủ và bộ nhớ đệm"
            >
              <RefreshCw className={`size-3.5 text-cyan-400 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              className="grid size-9 place-items-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Đóng bảng quản trị"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* =========================================================
            5 THẺ KPI THỐNG KÊ MINI & TAB SWITCHER
        ========================================================= */}
        <div className="shrink-0 border-b border-white/10 bg-slate-900/40 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 5 Thẻ thống kê */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-3 font-mono">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10 shadow-sm">
                <Users className="size-4 text-sky-400" />
                <span className="text-white/60">Tổng người dùng:</span>
                <b className="text-white font-bold">{totalUsersCount}</b>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 shadow-sm">
                <Crown className="size-4 text-amber-400" />
                <span className="text-amber-200/70">Quản trị viên:</span>
                <b className="text-amber-300 font-bold">{adminUsersCount}</b>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 shadow-sm">
                <Sparkles className="size-4 text-emerald-400" />
                <span className="text-emerald-200/70">Gói trả phí VIP:</span>
                <b className="text-emerald-400 font-bold">{vipUsersCount}</b>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-1.5 border border-rose-500/20 shadow-sm">
                <ShieldAlert className="size-4 text-rose-400" />
                <span className="text-rose-200/70">Tài khoản bị khóa:</span>
                <b className="text-rose-400 font-bold">{suspendedUsersCount}</b>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-purple-500/10 px-3 py-1.5 border border-purple-500/20 shadow-sm">
                <Zap className="size-4 text-purple-400" />
                <span className="text-purple-200/70">Gói cước:</span>
                <b className="text-purple-300 font-bold">{totalPlansCount}</b>
              </div>
            </div>

            {/* Chuyển đổi tab */}
            <div className="flex rounded-xl bg-white/10 p-1 font-display text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
                  activeTab === "users"
                    ? "bg-primary text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                👥 Người Dùng ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("plans")}
                className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
                  activeTab === "plans"
                    ? "bg-primary text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                📦 Gói Cước ({plans.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
                  activeTab === "logs"
                    ? "bg-primary text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                ⚡ Đồng Bộ &amp; Nhật Ký
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            NỘI DUNG CHÍNH (TAB 1: USERS, TAB 2: PLANS, TAB 3: LOGS)
        ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "users" ? (
            /* TAB 1: QUẢN LÝ NGƯỜI DÙNG */
            <div className="space-y-4">
              {/* Thanh công cụ: Tìm kiếm, Bộ lọc & Các nút hành động */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                  {/* Ô tìm kiếm */}
                  <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Tìm theo Gmail, tên, ghi chú..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-primary focus:outline-none transition"
                    />
                  </div>

                  {/* Lọc chức vụ */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "user")}
                    className="rounded-xl border border-white/15 bg-[#141838] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="all">Tất cả chức vụ</option>
                    <option value="admin">Chỉ Quản trị viên (Admin)</option>
                    <option value="user">Chỉ Thành viên (Member)</option>
                  </select>

                  {/* Lọc trạng thái (Hoạt động / Bị khóa) */}
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as "all" | "active" | "suspended")
                    }
                    className="rounded-xl border border-white/15 bg-[#141838] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">🟢 Đang hoạt động</option>
                    <option value="suspended">🔴 Đã bị khóa</option>
                  </select>

                  {/* Lọc gói */}
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="rounded-xl border border-white/15 bg-[#141838] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="all">Tất cả gói cước</option>
                    <option value="free">Gói Free (Miễn phí)</option>
                    <option value="go">Gói Go</option>
                    <option value="pro">Gói Pro VIP</option>
                    <option value="promax">Gói Promax</option>
                    {plans
                      .filter((p) => !["free", "go", "pro", "promax"].includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          Gói {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* CÁC NÚT HÀNH ĐỘNG NHANH */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncDatabase}
                    disabled={syncing || loading}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 active:scale-95"
                    title="Đồng bộ cơ sở dữ liệu"
                  >
                    <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
                    <span>Đồng bộ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword(generateRandomPassword());
                      setIsAddUserOpen(true);
                    }}
                    className="btn-glow inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95"
                  >
                    <Plus className="size-4" />
                    <span>Thêm người dùng</span>
                  </button>
                </div>
              </div>

              {/* BẢNG DỮ LIỆU NGƯỜI DÙNG (CÓ KHÓA / MỞ KHÓA, GMAIL, PASSWORK, GÓI, CHỨC VỤ) */}
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-900/60 font-mono text-[11px] uppercase tracking-wider text-white/60">
                        <th className="px-3 py-3 text-center">#</th>
                        <th className="px-4 py-3">Thành viên / Gmail</th>
                        <th className="px-4 py-3">Mật khẩu (Passwork)</th>
                        <th className="px-3 py-3">Gói tài khoản</th>
                        <th className="px-3 py-3">Chức vụ</th>
                        <th className="px-3 py-3">Trạng thái</th>
                        <th className="px-3 py-3">Thời hạn gói</th>
                        <th className="px-4 py-3 text-right">Thao tác Quản trị viên</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 font-sans">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-white/50">
                            Không tìm thấy tài khoản người dùng nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u, idx) => {
                          const isRevealed = Boolean(revealedPasswords[u.id]);
                          const isSuspended = u.status === "suspended";
                          const isSuperAdmin =
                            u.email.toLowerCase() === "nguyenlocdz2k7@gmail.com" ||
                            u.email.toLowerCase() === "admin@aivideo.ai";

                          const isExpired =
                            u.expiresAt &&
                            new Date(u.expiresAt).getTime() < Date.now() &&
                            u.plan !== "free";

                          return (
                            <tr
                              key={u.id}
                              className={`transition hover:bg-white/[0.04] ${
                                isSuspended ? "bg-rose-950/15" : ""
                              }`}
                            >
                              {/* STT */}
                              <td className="px-3 py-3 text-center font-mono text-[11px] text-white/40">
                                {idx + 1}
                              </td>

                              {/* CỘT 1: THÀNH VIÊN & GMAIL */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={u.avatar || "/wus_cat.png"}
                                    alt={u.name}
                                    className={`size-9 rounded-xl border bg-white/10 object-contain p-0.5 ${
                                      isSuspended
                                        ? "border-rose-500/40 opacity-70"
                                        : "border-white/20"
                                    }`}
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5 font-display text-xs font-bold text-white">
                                      <span className={isSuspended ? "line-through text-white/60" : ""}>
                                        {u.name}
                                      </span>
                                      {u.role === "admin" ? (
                                        <Crown className="size-3 text-amber-400" />
                                      ) : null}
                                    </div>
                                    <div className="flex items-center gap-1 font-mono text-[11px] text-white/70">
                                      <span>{u.email}</span>
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(u.email, "email")}
                                        className="text-white/30 hover:text-white"
                                        title="Sao chép email"
                                      >
                                        <Copy className="size-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* CỘT 2: MẬT KHẨU (PASSWORK) CÓ MẮT XEM / SAO CHÉP */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-medium text-emerald-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                                    {isRevealed ? u.password || "(Trống)" : "••••••••"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleRevealPassword(u.id)}
                                    className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white transition"
                                    title={isRevealed ? "Ẩn mật khẩu" : "Xem mật khẩu"}
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="size-3.5" />
                                    ) : (
                                      <Eye className="size-3.5" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(u.password, "mật khẩu")}
                                    className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white transition"
                                    title="Sao chép mật khẩu"
                                  >
                                    <Copy className="size-3.5" />
                                  </button>
                                </div>
                              </td>

                              {/* CỘT 3: GÓI TÀI KHOẢN (PLAN) */}
                              <td className="px-3 py-3">
                                <div>
                                  {u.plan === "free" ? (
                                    <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white/80">
                                      Free
                                    </span>
                                  ) : u.plan === "go" ? (
                                    <span className="inline-flex items-center rounded-full bg-sky-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-sky-400 border border-sky-500/30">
                                      GO
                                    </span>
                                  ) : u.plan === "pro" ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-primary border border-primary/40">
                                      <Sparkles className="size-3" />
                                      PRO VIP
                                    </span>
                                  ) : u.plan === "promax" ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-amber-500/40">
                                      <Crown className="size-3" />
                                      PROMAX
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-purple-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-300 border border-purple-500/40">
                                      {u.plan.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* CỘT 4: CHỨC VỤ (ROLE) */}
                              <td className="px-3 py-3">
                                {u.role === "admin" ? (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/30">
                                    <ShieldCheck className="size-3 text-amber-400" />
                                    Admin
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 font-mono text-[10px] font-medium text-white/70">
                                    <User className="size-3 text-white/40" />
                                    Thành viên
                                  </span>
                                )}
                              </td>

                              {/* CỘT 5: TRẠNG THÁI (HOẠT ĐỘNG / ĐÃ KHÓA) */}
                              <td className="px-3 py-3">
                                {isSuspended ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-rose-300 border border-rose-500/40 animate-pulse">
                                    <Lock className="size-3" />
                                    ĐÃ BỊ KHÓA
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold text-emerald-400">
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Hoạt động
                                  </span>
                                )}
                              </td>

                              {/* CỘT 6: THỜI HẠN GÓI (EXPIRES AT) */}
                              <td className="px-3 py-3">
                                <div className="font-mono text-[11px]">
                                  {u.plan === "free" ? (
                                    <span className="text-white/40">Miễn phí</span>
                                  ) : u.expiresAt ? (
                                    <span
                                      className={
                                        isExpired
                                          ? "text-rose-400 font-bold"
                                          : "text-emerald-400 font-medium"
                                      }
                                    >
                                      {u.expiresAt}
                                    </span>
                                  ) : (
                                    <span className="text-white/40">Vĩnh viễn</span>
                                  )}
                                </div>
                              </td>

                              {/* CỘT 7: THAO TÁC ADMIN (KHÓA/MỞ KHÓA, GIA HẠN, ĐỔI PASS, SỬA, XÓA) */}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* NÚT KHÓA / MỞ KHÓA TÀI KHOẢN (TRỌNG TÂM YÊU CẦU NGƯỜI DÙNG) */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSuspend(u)}
                                    disabled={isSuperAdmin}
                                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition shadow-sm ${
                                      isSuspended
                                        ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white"
                                        : "border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-white"
                                    } disabled:opacity-30 disabled:pointer-events-none`}
                                    title={
                                      isSuperAdmin
                                        ? "Không thể khóa tài khoản Admin tối cao"
                                        : isSuspended
                                          ? "Mở khóa cho tài khoản này"
                                          : "Khóa tài khoản này (chặn đăng nhập)"
                                    }
                                  >
                                    {isSuspended ? (
                                      <>
                                        <Unlock className="size-3" />
                                        <span>Mở khóa</span>
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="size-3" />
                                        <span>Khóa</span>
                                      </>
                                    )}
                                  </button>

                                  {/* Nút Gia hạn gói */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setRenewPlanId(u.plan === "free" ? "pro" : u.plan);
                                      setRenewDurationDays(30);
                                      setIsRenewOpen(true);
                                    }}
                                    className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary hover:text-white"
                                    title="Gia hạn gói cước cho thành viên"
                                  >
                                    <Calendar className="size-3" />
                                    <span>Gia hạn</span>
                                  </button>

                                  {/* Nút Đổi Password */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setChangePasswordVal(generateRandomPassword());
                                      setIsChangePassOpen(true);
                                    }}
                                    className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                                    title="Đổi mật khẩu tài khoản này"
                                  >
                                    <Key className="size-3 text-amber-400" />
                                    <span>Đổi Pass</span>
                                  </button>

                                  {/* Nút Sửa thông tin */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setEditName(u.name);
                                      setEditRole(u.role);
                                      setEditPlan(u.plan);
                                      setEditStatus(u.status);
                                      setEditNotes(u.notes ?? "");
                                      setIsEditUserOpen(true);
                                    }}
                                    className="rounded-lg border border-white/10 bg-white/5 p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                                    title="Chỉnh sửa thông tin"
                                  >
                                    <Edit className="size-3.5" />
                                  </button>

                                  {/* Nút Xóa User */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    disabled={isSuperAdmin}
                                    className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1 text-rose-400 transition hover:bg-rose-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                                    title="Xóa người dùng"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === "plans" ? (
            /* TAB 2: QUẢN LÝ GÓI CƯỚC (PLANS MANAGEMENT) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Danh Sách Gói Cước Hệ Thống
                  </h3>
                  <p className="text-xs text-white/60">
                    Thêm gói cước mới hoặc quản lý cấu hình các gói tài khoản trong hệ thống.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddPlanOpen(true)}
                  className="btn-glow inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md active:scale-95"
                >
                  <Plus className="size-4" />
                  <span>Thêm gói mới</span>
                </button>
              </div>

              {/* Grid các gói cước */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {plans.map((p) => {
                  const isSystemDefault = ["free", "go", "pro", "promax"].includes(p.id);

                  return (
                    <div
                      key={p.id}
                      className="relative flex flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.04] p-5 transition hover:border-primary/50"
                    >
                      {p.popular ? (
                        <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white shadow-sm">
                          Phổ biến
                        </span>
                      ) : null}

                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-display text-lg font-bold text-white">
                            Gói {p.name}
                          </h4>
                          <span className="font-mono text-[10px] text-white/50">Mã: {p.id}</span>
                        </div>

                        <div className="my-3 font-display text-2xl font-bold text-primary">
                          {vnd(p.price)}
                          {p.price > 0 ? (
                            <span className="text-xs font-normal text-white/60"> / tháng</span>
                          ) : (
                            <span className="text-xs font-normal text-emerald-400"> (Miễn phí)</span>
                          )}
                        </div>

                        <p className="text-xs text-white/70 min-h-[32px]">{p.tagline}</p>

                        <div className="my-3 border-t border-white/10 pt-3">
                          <span className="font-mono text-[10px] uppercase text-white/50">
                            Quyền lợi:
                          </span>
                          <ul className="mt-2 space-y-1.5 text-xs text-white/80">
                            {p.features.map((f, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <Check className="size-3 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between text-xs">
                        <span className="font-mono text-[11px] text-white/50">
                          {isSystemDefault ? "Gói chuẩn hệ thống" : "Gói tùy chỉnh Admin"}
                        </span>
                        {!isSystemDefault ? (
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(p.id)}
                            className="text-rose-400 hover:text-rose-300 font-semibold"
                          >
                            Xóa gói
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* TAB 3: TRẠNG THÁI ĐỒNG BỘ & NHẬT KÝ HỆ THỐNG */
            <div className="space-y-5 text-xs">
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Database className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold text-white">
                        Trạng Thái Cơ Sở Dữ Liệu &amp; Đồng Bộ
                      </h3>
                      <p className="text-xs text-white/60">
                        Kiểm soát tính toàn vẹn dữ liệu giữa File máy chủ, Cache trình duyệt và
                        Supabase.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncDatabase}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2 font-bold text-white shadow-md active:scale-95"
                  >
                    <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
                    <span>{syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}</span>
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <span className="text-white/50 font-mono text-[11px]">Tệp Người Dùng:</span>
                    <div className="font-bold text-white font-mono">data/users_db.json</div>
                    <div className="text-emerald-400 font-mono text-[10px]">
                      ✓ {users.length} tài khoản đã ghi
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <span className="text-white/50 font-mono text-[11px]">Tệp Gói Cước:</span>
                    <div className="font-bold text-white font-mono">data/plans_db.json</div>
                    <div className="text-emerald-400 font-mono text-[10px]">
                      ✓ {plans.length} gói cước sẵn sàng
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <span className="text-white/50 font-mono text-[11px]">Lần Đồng Bộ Cuối:</span>
                    <div className="font-bold text-cyan-300 font-mono">
                      {lastSyncedTime || "Vừa khởi động"}
                    </div>
                    <div className="text-white/40 font-mono text-[10px]">
                      Trạng thái: Hoạt động ổn định
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Activity className="size-4 text-emerald-400" />
                    Cơ chế hoạt động khi Khóa tài khoản:
                  </h4>
                  <ul className="space-y-1.5 text-white/70 pl-5 list-disc text-[11px] leading-relaxed">
                    <li>
                      Khi Admin nhấn <b>"Khóa"</b> một tài khoản, trạng thái sẽ lập tức chuyển thành{" "}
                      <b className="text-rose-400">suspended</b> trên cả Server JSON và
                      LocalStorage.
                    </li>
                    <li>
                      Người dùng sở hữu tài khoản bị khóa khi nhập thông tin đăng nhập sẽ bị hệ
                      thống chặn và hiển thị thông báo:{" "}
                      <b className="text-rose-300">
                        "⛔ TÀI KHOẢN ĐÃ BỊ KHÓA! Vui lòng liên hệ Hotline Telegram @M_vuongQuyen123
                        để mở khóa!"
                      </b>
                    </li>
                    <li>
                      Tài khoản Google tương ứng cũng bị chặn đăng nhập tự động cho đến khi Admin mở
                      khóa.
                    </li>
                    <li>
                      Các tài khoản Quản trị viên tối cao (Super Admin) được bảo vệ an toàn, không
                      thể bị khóa nhầm.
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-white transition"
                  >
                    <FileDown className="size-4 text-cyan-400" />
                    <span>Tải về tệp sao lưu (JSON Backup)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================
            CÁC SUB-MODAL PHỤ (ADD USER, CHANGE PASS, RENEW, ADD PLAN, EDIT)
        ========================================================= */}

        {/* 1. MODAL THÊM NGƯỜI DÙNG */}
        {isAddUserOpen ? (
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setIsAddUserOpen(false)}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-[#141838] p-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  Thêm Người Dùng Vào Cơ Sở Dữ Liệu
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="rounded-full p-1 text-white/60 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Địa chỉ Gmail *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="vidu.nguoidung@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-white/80">
                      Mật khẩu (Passwork) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateRandomPassword())}
                      className="text-[10px] text-primary hover:underline font-mono"
                    >
                      Tạo ngẫu nhiên 🎲
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Nhập hoặc tạo mật khẩu"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 font-mono text-xs text-emerald-400 focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Tên hiển thị (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Gói tài khoản *
                    </label>
                    <select
                      value={newPlan}
                      onChange={(e) => setNewPlan(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-[#171b38] px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="free">Gói Free</option>
                      <option value="go">Gói Go</option>
                      <option value="pro">Gói Pro VIP</option>
                      <option value="promax">Gói Promax</option>
                      {plans
                        .filter((p) => !["free", "go", "pro", "promax"].includes(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            Gói {p.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Chức vụ *
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-white/20 bg-[#171b38] px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="user">Thành viên (Member)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                </div>

                {newPlan !== "free" ? (
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Thời hạn sử dụng (Số ngày) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newDurationDays}
                      onChange={(e) => setNewDurationDays(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Ghi chú nội bộ
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Thành viên thân thiết, cấp qua chuyển khoản..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-glow rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md"
                  >
                    {loading ? "Đang lưu..." : "Lưu vào cơ sở"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* 2. MODAL ĐỔI MẬT KHẨU NGƯỜI DÙNG */}
        {isChangePassOpen && selectedUser ? (
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setIsChangePassOpen(false)}
          >
            <div
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-[#141838] p-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Key className="size-4 text-amber-400" />
                  Đổi Mật Khẩu Thành Viên
                </h3>
                <button
                  type="button"
                  onClick={() => setIsChangePassOpen(false)}
                  className="rounded-full p-1 text-white/60 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                  <span className="text-white/60">Đang đổi mật khẩu cho:</span>
                  <div className="font-mono font-bold text-white mt-0.5">{selectedUser.email}</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-white/80">
                      Mật khẩu mới *
                    </label>
                    <button
                      type="button"
                      onClick={() => setChangePasswordVal(generateRandomPassword())}
                      className="text-[10px] text-primary hover:underline font-mono"
                    >
                      Tạo ngẫu nhiên 🎲
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)"
                    value={changePasswordVal}
                    onChange={(e) => setChangePasswordVal(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 font-mono text-xs text-emerald-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsChangePassOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-md"
                  >
                    {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* 3. MODAL GIA HẠN GÓI CƯỚC */}
        {isRenewOpen && selectedUser ? (
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setIsRenewOpen(false)}
          >
            <div
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/20 bg-[#141838] p-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="size-4 text-emerald-400" />
                  Gia Hạn Gói Cho Thành Viên
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRenewOpen(false)}
                  className="rounded-full p-1 text-white/60 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleRenewSubmit} className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                  <span className="text-white/60">Tài khoản:</span>
                  <div className="font-mono font-bold text-white mt-0.5">{selectedUser.email}</div>
                  <div className="text-[11px] text-white/50 mt-1">
                    Gói hiện tại: <b>{selectedUser.plan.toUpperCase()}</b> | Hạn dùng:{" "}
                    <b>{selectedUser.expiresAt || "Chưa có"}</b>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Chọn gói gia hạn *
                  </label>
                  <select
                    value={renewPlanId}
                    onChange={(e) => setRenewPlanId(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-[#171b38] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="go">Gói Go</option>
                    <option value="pro">Gói Pro VIP</option>
                    <option value="promax">Gói Promax</option>
                    {plans
                      .filter((p) => !["free", "go", "pro", "promax"].includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          Gói {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Số ngày cộng thêm *
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[30, 90, 365].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setRenewDurationDays(days)}
                        className={`rounded-lg py-1.5 font-mono text-xs border transition ${
                          renewDurationDays === days
                            ? "border-primary bg-primary text-white font-bold"
                            : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        +{days} ngày
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    required
                    value={renewDurationDays}
                    onChange={(e) => setRenewDurationDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRenewOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2 text-xs font-bold text-slate-950 shadow-md"
                  >
                    {loading ? "Đang xử lý..." : "Xác nhận gia hạn"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* 4. MODAL THÊM GÓI CƯỚC MỚI */}
        {isAddPlanOpen ? (
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setIsAddPlanOpen(false)}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-[#141838] p-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  Thêm Gói Cước Mới Vào Hệ Thống
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddPlanOpen(false)}
                  className="rounded-full p-1 text-white/60 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleAddPlanSubmit} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Mã gói (ID không dấu) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="vd: ultra_vip"
                      value={planIdInput}
                      onChange={(e) => setPlanIdInput(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Tên hiển thị gói *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="vd: Ultra VIP 2026"
                      value={planNameInput}
                      onChange={(e) => setPlanNameInput(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Giá gói (VNĐ) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={planPriceInput}
                      onChange={(e) => setPlanPriceInput(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Thời hạn mặc định (ngày)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={planDurationDaysInput}
                      onChange={(e) => setPlanDurationDaysInput(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Khẩu hiệu / Mô tả ngắn
                  </label>
                  <input
                    type="text"
                    placeholder="Cho người dùng chuyên nghiệp cần tốc độ cao"
                    value={planTaglineInput}
                    onChange={(e) => setPlanTaglineInput(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Danh sách quyền lợi (Mỗi dòng một quyền lợi) *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={planFeaturesInput}
                    onChange={(e) => setPlanFeaturesInput(e.target.value)}
                    placeholder="500 ảnh phân tích / tháng&#10;120 phút ghi âm Whisper Turbo&#10;Hỗ trợ kỹ thuật 24/7"
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-white cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={planPopularInput}
                    onChange={(e) => setPlanPopularInput(e.target.checked)}
                    className="rounded border-white/20 bg-white/10 size-4 text-primary accent-indigo-600"
                  />
                  <span>Đánh dấu là gói "Phổ biến nhất" (Nổi bật)</span>
                </label>

                <div className="mt-5 pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPlanOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-glow rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md"
                  >
                    {loading ? "Đang lưu..." : "Tạo gói cước mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* 5. MODAL CHỈNH SỬA THÔNG TIN NGƯỜI DÙNG */}
        {isEditUserOpen && selectedUser ? (
          <div
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setIsEditUserOpen(false)}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-[#141838] p-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Edit className="size-4 text-primary" />
                  Chỉnh Sửa Thông Tin Thành Viên
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="rounded-full p-1 text-white/60 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleEditUserSubmit} className="mt-4 space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                  <span className="text-white/60">Tài khoản:</span>
                  <div className="font-mono font-bold text-white mt-0.5">{selectedUser.email}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">Chức vụ</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-white/20 bg-[#171b38] px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="user">Thành viên (Member)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Gói cước
                    </label>
                    <select
                      value={editPlan}
                      onChange={(e) => setEditPlan(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-[#171b38] px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="free">Gói Free</option>
                      <option value="go">Gói Go</option>
                      <option value="pro">Gói Pro VIP</option>
                      <option value="promax">Gói Promax</option>
                      {plans
                        .filter((p) => !["free", "go", "pro", "promax"].includes(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            Gói {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                    className="w-full rounded-xl border border-white/20 bg-[#171b38] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="active">🟢 Đang hoạt động (Active)</option>
                    <option value="suspended">🔴 Tạm khóa (Suspended - Chặn đăng nhập)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/80 mb-1">
                    Ghi chú nội bộ
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditUserOpen(false)}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-glow rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md"
                  >
                    {loading ? "Đang lưu..." : "Cập nhật thành viên"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
