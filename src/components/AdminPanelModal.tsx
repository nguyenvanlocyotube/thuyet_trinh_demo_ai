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
  Bell,
  Send,
  Pin,
  Gift,
  AlertTriangle,
  History,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth, notifyDataUpdated } from "@/lib/auth";
import type {
  UserRecord,
  PlanItem,
  UserRole,
  UserStatus,
  AdminTier,
  AdminAuditLog,
  BroadcastNotification,
  NotificationType,
} from "@/lib/admin.types";
import {
  isGoldAdmin as checkIsGoldAdmin,
  isSilverAdmin as checkIsSilverAdmin,
  canLockTargetUser,
} from "@/lib/admin.types";
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
  getAdminAuditLogs,
  clearAdminAuditLogs,
  getBroadcastNotifications,
  createBroadcastNotification,
  deleteBroadcastNotification,
} from "@/lib/admin.functions";
import { PLANS, vnd } from "@/lib/plans";

export function AdminPanelModal() {
  const { user, isGoldAdmin, isSilverAdmin, isAdminModalOpen, setIsAdminModalOpen } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "users" | "plans" | "audit_logs" | "broadcast" | "logs"
  >("users");
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [broadcastNotifs, setBroadcastNotifs] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");

  // Filters & Search for Users
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "admin_gold" | "admin_silver" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  // Filters for Audit Logs
  const [auditSearch, setAuditSearch] = useState("");
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>("all");

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
  const [newAdminTier, setNewAdminTier] = useState<AdminTier>("silver");
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
  const [editAdminTier, setEditAdminTier] = useState<AdminTier>("silver");
  const [editPlan, setEditPlan] = useState("free");
  const [editStatus, setEditStatus] = useState<UserStatus>("active");
  const [editNotes, setEditNotes] = useState("");

  // Form states for Broadcast Notification
  const [notifTitle, setNotifTitle] = useState("");
  const [notifContent, setNotifContent] = useState("");
  const [notifType, setNotifType] = useState<NotificationType>("update");
  const [notifBadge, setNotifBadge] = useState("");
  const [notifPinned, setNotifPinned] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);

  // Load data from server
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedPlans, fetchedLogs, fetchedNotifs] = await Promise.all([
        getAdminUsers(),
        getAdminPlans(),
        getAdminAuditLogs(),
        getBroadcastNotifications(),
      ]);
      if (fetchedUsers) setUsers(fetchedUsers);
      if (fetchedPlans) setPlans(fetchedPlans);
      if (fetchedLogs) setAuditLogs(fetchedLogs);
      if (fetchedNotifs) setBroadcastNotifs(fetchedNotifs);
    } catch (err) {
      console.error("Lỗi nạp dữ liệu Admin:", err);
      toast.error("Không thể tải dữ liệu từ máy chủ. Đang dùng dữ liệu bộ nhớ đệm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminModalOpen || user?.role !== "admin") {
      if (isAdminModalOpen && user?.role !== "admin") {
        setIsAdminModalOpen(false);
      }
      return undefined;
    }

    void loadData();

    // 1. Tự động làm mới dữ liệu liên tục mỗi 10 giây khi mở Admin Panel
    const intervalTimer = setInterval(() => {
      void loadData();
    }, 10000);

    // 2. Lắng nghe sự kiện cập nhật dữ liệu liên tab và các thao tác admin
    const handleDataUpdated = () => {
      void loadData();
    };
    window.addEventListener("app:data-updated", handleDataUpdated);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener("app:data-updated", handleDataUpdated);
    };
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
      if (roleFilter === "admin" && u.role !== "admin") return false;
      if (roleFilter === "admin_gold" && !checkIsGoldAdmin(u)) return false;
      if (roleFilter === "admin_silver" && !checkIsSilverAdmin(u)) return false;
      if (roleFilter === "user" && u.role !== "user") return false;

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

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditTypeFilter !== "all" && log.actionType !== auditTypeFilter) return false;
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchActor = log.actorEmail.toLowerCase().includes(q) || log.actorName.toLowerCase().includes(q);
        const matchTarget = (log.targetEmail || "").toLowerCase().includes(q) || (log.targetName || "").toLowerCase().includes(q);
        const matchDesc = log.description.toLowerCase().includes(q) || log.actionTitle.toLowerCase().includes(q);
        return matchActor || matchTarget || matchDesc;
      }
      return true;
    });
  }, [auditLogs, auditTypeFilter, auditSearch]);

  // Stats
  const totalUsersCount = users.length;
  const goldAdminCount = users.filter((u) => checkIsGoldAdmin(u)).length;
  const silverAdminCount = users.filter((u) => checkIsSilverAdmin(u)).length;
  const adminUsersCount = users.filter((u) => u.role === "admin").length;
  const vipUsersCount = users.filter((u) => u.plan !== "free").length;
  const suspendedUsersCount = users.filter((u) => u.status === "suspended").length;
  const totalPlansCount = plans.length;

  /* =========================================================================
     ACTIONS
     ========================================================================= */

  // 0. Đồng bộ Database
  const handleSyncDatabase = async () => {
    setSyncing(true);
    try {
      const res = await syncAdminDatabase({
        data: { clientUsers: users },
      });
      if (res.success) {
        setUsers(res.users);
        setPlans(res.plans);
        setAuditLogs(res.auditLogs);
        setBroadcastNotifs(res.notifications);
        setLastSyncedTime(res.timestamp);
        try {
          window.localStorage.setItem("aiv_users_database_v5", JSON.stringify(res.users));
        } catch {
          // Ignore
        }
        toast.success(
          `🔄 Đồng bộ thành công! Hiện có ${res.totalUsers} người dùng, ${res.totalPlans} gói cước và ${res.auditLogs.length} tiến trình nhật ký.`,
          { duration: 4500 },
        );
        notifyDataUpdated();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đồng bộ thất bại.");
    } finally {
      setSyncing(false);
    }
  };

  // 1. Khóa / Mở khóa tài khoản người dùng
  const handleToggleSuspend = async (u: UserRecord) => {
    // Kiểm tra quyền theo phân cấp Admin Vàng / Admin Bạc
    const permission = canLockTargetUser(user, u);
    if (!permission.allowed) {
      toast.error(permission.reason || "Bạn không có quyền khóa tài khoản này!");
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
          reason: isCurrentActive ? `Khóa bởi ${user?.email}` : undefined,
          actorEmail: user?.email,
        },
      });

      if (res.success && res.user) {
        setUsers((prev) => prev.map((item) => (item.id === u.id ? res.user : item)));
        try {
          const cached = users.map((item) => (item.id === u.id ? res.user : item));
          window.localStorage.setItem("aiv_users_database_v5", JSON.stringify(cached));
        } catch {
          // Ignore
        }
        // Tải lại nhật ký kiểm toán và phát sóng cập nhật
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();

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
          adminTier: newRole === "admin" ? newAdminTier : undefined,
          durationDays: newPlan === "free" ? 0 : newDurationDays,
          status: "active",
          notes: newNotes,
          actorEmail: user?.email,
        },
      });

      if (res.success && res.user) {
        setUsers((prev) => [res.user, ...prev]);
        toast.success(`Đã thêm người dùng "${res.user.email}" vào cơ sở dữ liệu!`);
        setIsAddUserOpen(false);
        setNewEmail("");
        setNewPassword("");
        setNewName("");
        setNewPlan("free");
        setNewRole("user");
        setNewAdminTier("silver");
        setNewNotes("");
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
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

    // Admin Bạc không được đổi mật khẩu của Admin Vàng
    if (checkIsGoldAdmin(selectedUser) && isSilverAdmin) {
      toast.error("Admin Bạc không có quyền đổi mật khẩu của Admin Vàng!");
      return;
    }

    setLoading(true);
    try {
      const res = await changeUserPassword({
        data: {
          userId: selectedUser.id,
          newPassword: changePasswordVal,
          actorEmail: user?.email,
        },
      });

      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, password: changePasswordVal } : u)),
        );
        toast.success(res.message);
        setIsChangePassOpen(false);
        setChangePasswordVal("");
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
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
          actorEmail: user?.email,
        },
      });

      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? res.user : u)));
        toast.success(res.message);
        setIsRenewOpen(false);
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
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

    // Admin Bạc không được sửa Admin Vàng
    if (checkIsGoldAdmin(selectedUser) && isSilverAdmin) {
      toast.error("Admin Bạc không có quyền chỉnh sửa tài khoản Admin Vàng!");
      return;
    }

    setLoading(true);
    try {
      const res = await updateAdminUser({
        data: {
          userId: selectedUser.id,
          name: editName.trim(),
          role: editRole,
          adminTier: editRole === "admin" ? editAdminTier : undefined,
          plan: editPlan,
          status: editStatus,
          notes: editNotes.trim(),
          actorEmail: user?.email,
        },
      });

      if (res.success && res.user) {
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? res.user : u)));
        toast.success(`Đã cập nhật thông tin thành viên "${res.user.email}"!`);
        setIsEditUserOpen(false);
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  // 6. Xóa người dùng
  const handleDeleteUser = async (u: UserRecord) => {
    if (checkIsGoldAdmin(u)) {
      toast.error("Không thể xóa tài khoản Quản trị viên tối cao (Admin Vàng)!");
      return;
    }
    if (isSilverAdmin && u.role === "admin") {
      toast.error("Admin Bạc không có quyền xóa tài khoản Quản trị viên!");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${u.email}"?`)) return;

    setLoading(true);
    try {
      const res = await deleteAdminUser({
        data: { userId: u.id, actorEmail: user?.email },
      });
      if (res.success) {
        setUsers((prev) => prev.filter((item) => item.id !== u.id));
        toast.success(res.message);
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
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
          actorEmail: user?.email,
        },
      });

      if (res.success && res.plan) {
        setPlans((prev) => [...prev, res.plan]);
        toast.success(res.message);
        setIsAddPlanOpen(false);
        setPlanIdInput("");
        setPlanNameInput("");
        setPlanPriceInput(99000);
        setPlanTaglineInput("");
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
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
        data: { planId, actorEmail: user?.email },
      });
      if (res.success) {
        setPlans((prev) => prev.filter((p) => p.id !== planId));
        toast.success(res.message);
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa gói cước.");
    } finally {
      setLoading(false);
    }
  };

  // 9. Gửi thông báo phát sóng (Broadcast Notification) cho tất cả user
  const handleSendBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifContent.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!");
      return;
    }

    setSendingNotif(true);
    try {
      const res = await createBroadcastNotification({
        data: {
          title: notifTitle.trim(),
          content: notifContent.trim(),
          type: notifType,
          badgeText: notifBadge.trim() || undefined,
          senderName: user?.name,
          senderEmail: user?.email,
          pinned: notifPinned,
        },
      });

      if (res.success && res.notification) {
        setBroadcastNotifs((prev) => [res.notification, ...prev]);
        toast.success("📢 Đã gửi thông báo đến tất cả người dùng thành công!");
        setNotifTitle("");
        setNotifContent("");
        setNotifBadge("");
        setNotifPinned(false);
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể gửi thông báo.");
    } finally {
      setSendingNotif(false);
    }
  };

  // 10. Xóa thông báo đã gửi
  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;
    try {
      const res = await deleteBroadcastNotification({
        data: { notificationId: id, actorEmail: user?.email },
      });
      if (res.success) {
        setBroadcastNotifs((prev) => prev.filter((n) => n.id !== id));
        toast.success(res.message);
        void getAdminAuditLogs().then((logs) => setAuditLogs(logs));
        notifyDataUpdated();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa thông báo.");
    }
  };

  // 11. Xóa toàn bộ nhật ký (Chỉ Admin Vàng)
  const handleClearAuditLogs = async () => {
    if (!isGoldAdmin) {
      toast.error("Chỉ Admin Vàng (Cấp tối cao) mới có quyền dọn sạch tiến trình!");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn dọn sạch toàn bộ nhật ký tiến trình chỉnh sửa?")) return;
    try {
      const res = await clearAdminAuditLogs({
        data: { actorEmail: user?.email },
      });
      if (res.success) {
        setAuditLogs([]);
        toast.success(res.message);
        notifyDataUpdated();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi dọn nhật ký.");
    }
  };

  // 12. Xuất dữ liệu sao lưu (JSON Backup)
  const handleExportBackup = () => {
    try {
      const data = {
        users,
        plans,
        auditLogs,
        broadcastNotifs,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.email,
        version: "5.5",
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
            HEADER QUẢN TRỊ ADMIN (PHÂN BIỆT ADMIN VÀNG VÀ ADMIN BẠC)
        ========================================================= */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-slate-950 via-[#111633] to-slate-950 px-5 py-4 backdrop-blur-lg sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="AI Video&amp;Text Logo"
              className="size-11 shrink-0 rounded-2xl object-cover shadow-lg shadow-blue-500/25 ring-1 ring-blue-500/30"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-lg font-bold text-white sm:text-xl tracking-tight">
                  Trung Tâm Quản Trị Hệ Thống (Admin Control Center)
                </h2>

                {/* Huy hiệu Admin Vàng / Admin Bạc */}
                {isGoldAdmin ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/20 px-3 py-0.5 font-mono text-[11px] font-extrabold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/60 shadow-sm shadow-amber-500/20">
                    <Crown className="size-3.5 text-amber-400 animate-pulse" />
                    ADMIN VÀNG (CẤP TỐI CAO - TOÀN QUYỀN)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-slate-400/25 to-slate-200/10 px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-200 ring-1 ring-slate-400/50 shadow-sm">
                    <Shield className="size-3.5 text-slate-300" />
                    ADMIN BẠC (QUẢN TRỊ VIÊN CẤP 2)
                  </span>
                )}

                <span
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 border border-emerald-500/30"
                  title="Hệ thống tự động đồng bộ thời gian thực mỗi 10 giây khi mở bảng quản trị"
                >
                  <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE 24/7 (AUTO-SYNC 10S)
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/60">
                {isGoldAdmin
                  ? "Admin Vàng có thể thực hiện mọi thao tác, giám sát tiến trình của Admin Bạc và phát thông báo."
                  : "Admin Bạc không thể khóa Admin Vàng, mọi tiến trình chỉnh sửa được tự động báo cáo về Admin Vàng."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            KPI THỐNG KÊ MINI & TAB SWITCHER
        ========================================================= */}
        <div className="shrink-0 border-b border-white/10 bg-slate-900/40 px-5 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-3 font-mono">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 border border-white/10 shadow-sm">
                <Users className="size-4 text-sky-400" />
                <span className="text-white/60">Tổng người dùng:</span>
                <b className="text-white font-bold">{totalUsersCount}</b>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-3 py-1.5 border border-amber-500/20 shadow-sm">
                <Crown className="size-4 text-amber-400" />
                <span className="text-amber-200/70">Admin Vàng:</span>
                <b className="text-amber-300 font-bold">{goldAdminCount}</b>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-400/10 px-3 py-1.5 border border-slate-400/20 shadow-sm">
                <Shield className="size-4 text-slate-300" />
                <span className="text-slate-300/70">Admin Bạc:</span>
                <b className="text-slate-200 font-bold">{silverAdminCount}</b>
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
                <Bell className="size-4 text-purple-400" />
                <span className="text-purple-200/70">Bản tin:</span>
                <b className="text-purple-300 font-bold">{broadcastNotifs.length}</b>
              </div>
            </div>

            {/* Chuyển đổi tab */}
            <div className="flex rounded-xl bg-white/10 p-1 font-display text-xs flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
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
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  activeTab === "plans"
                    ? "bg-primary text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                📦 Gói Cước ({plans.length})
              </button>

              {/* TAB TIẾN TRÌNH CHỈNH SỬA CỦA ADMIN BẠC (TRỌNG TÂM YÊU CẦU NGƯỜI DÙNG) */}
              <button
                type="button"
                onClick={() => setActiveTab("audit_logs")}
                className={`relative rounded-lg px-3 py-1.5 font-bold transition flex items-center gap-1.5 ${
                  activeTab === "audit_logs"
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "text-amber-300/80 hover:text-amber-300 hover:bg-white/5"
                }`}
              >
                <History className="size-3.5" />
                <span>Tiến Trình Admin Bạc</span>
                <span className="rounded-full bg-black/40 px-1.5 py-0.2 font-mono text-[10px]">
                  {auditLogs.length}
                </span>
              </button>

              {/* TAB THÔNG BÁO CHO TẤT CẢ USER (TRỌNG TÂM YÊU CẦU NGƯỜI DÙNG) */}
              <button
                type="button"
                onClick={() => setActiveTab("broadcast")}
                className={`rounded-lg px-3 py-1.5 font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "broadcast"
                    ? "bg-primary text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Bell className="size-3.5" />
                <span>Gửi Thông Báo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                  activeTab === "logs"
                    ? "bg-primary text-white shadow-md"
                    : "text-white/70 hover:text-white"
                }`}
              >
                ⚡ Đồng Bộ
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================
            NỘI DUNG CHÍNH CÁC TAB
        ========================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "users" ? (
            /* TAB 1: QUẢN LÝ NGƯỜI DÙNG */
            <div className="space-y-4">
              {/* Thanh công cụ: Tìm kiếm, Bộ lọc & Các nút hành động */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
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

                  {/* Lọc chức vụ phân cấp */}
                  <select
                    value={roleFilter}
                    onChange={(e) =>
                      setRoleFilter(
                        e.target.value as "all" | "admin" | "admin_gold" | "admin_silver" | "user",
                      )
                    }
                    className="rounded-xl border border-white/15 bg-[#141838] px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="all">Tất cả chức vụ</option>
                    <option value="admin_gold">👑 Chỉ Admin Vàng</option>
                    <option value="admin_silver">🥈 Chỉ Admin Bạc</option>
                    <option value="admin">Tất cả Admin (Vàng &amp; Bạc)</option>
                    <option value="user">Chỉ Thành viên (Member)</option>
                  </select>

                  {/* Lọc trạng thái */}
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

              {/* BẢNG DỮ LIỆU NGƯỜI DÙNG */}
              <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.03] shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-900/60 font-mono text-[11px] uppercase tracking-wider text-white/60">
                        <th className="px-3 py-3 text-center">#</th>
                        <th className="px-4 py-3">Thành viên / Gmail</th>
                        <th className="px-4 py-3">Mật khẩu (Passwork)</th>
                        <th className="px-3 py-3">Gói tài khoản</th>
                        <th className="px-3 py-3">Cấp bậc Quản trị</th>
                        <th className="px-3 py-3">Trạng thái</th>
                        <th className="px-3 py-3">Thời hạn gói</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
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
                          const isTargetGold = checkIsGoldAdmin(u);
                          const isTargetSilver = checkIsSilverAdmin(u);

                          // Kiểm tra quyền khóa theo quy tắc người dùng yêu cầu
                          const lockPermission = canLockTargetUser(user, u);

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

                              {/* THÀNH VIÊN & GMAIL */}
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
                                      {isTargetGold ? (
                                        <span title="Admin Vàng tối cao">
                                          <Crown className="size-3.5 text-amber-400" />
                                        </span>
                                      ) : isTargetSilver ? (
                                        <span title="Admin Bạc cấp 2">
                                          <Shield className="size-3.5 text-slate-300" />
                                        </span>
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

                              {/* MẬT KHẨU */}
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

                              {/* GÓI TÀI KHOẢN */}
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

                              {/* CHỨC VỤ / CẤP BẬC ADMIN VÀNG HOẶC ADMIN BẠC */}
                              <td className="px-3 py-3">
                                {isTargetGold ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/20 px-2.5 py-1 font-mono text-[10px] font-extrabold text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10">
                                    <Crown className="size-3 text-amber-400" />
                                    Admin Vàng
                                  </span>
                                ) : isTargetSilver ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-400/20 to-slate-200/10 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-200 border border-slate-400/40">
                                    <Shield className="size-3 text-slate-300" />
                                    Admin Bạc
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 font-mono text-[10px] font-medium text-white/70">
                                    <User className="size-3 text-white/40" />
                                    Thành viên
                                  </span>
                                )}
                              </td>

                              {/* TRẠNG THÁI */}
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

                              {/* THỜI HẠN GÓI */}
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

                              {/* THAO TÁC (KHÓA/MỞ KHÓA, GIA HẠN, ĐỔI PASS, SỬA, XÓA) */}
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* NÚT KHÓA / MỞ KHÓA VỚI QUY TẮC PHÂN CẤP */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSuspend(u)}
                                    disabled={!lockPermission.allowed}
                                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition shadow-sm ${
                                      isSuspended
                                        ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white"
                                        : "border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-white"
                                    } disabled:opacity-25 disabled:cursor-not-allowed`}
                                    title={
                                      !lockPermission.allowed
                                        ? lockPermission.reason
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
                                    disabled={isTargetGold && isSilverAdmin}
                                    className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
                                    title={
                                      isTargetGold && isSilverAdmin
                                        ? "Admin Bạc không thể đổi mật khẩu Admin Vàng"
                                        : "Đổi mật khẩu tài khoản này"
                                    }
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
                                      setEditAdminTier(u.adminTier || "silver");
                                      setEditPlan(u.plan);
                                      setEditStatus(u.status);
                                      setEditNotes(u.notes ?? "");
                                      setIsEditUserOpen(true);
                                    }}
                                    disabled={isTargetGold && isSilverAdmin}
                                    className="rounded-lg border border-white/10 bg-white/5 p-1 text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
                                    title={
                                      isTargetGold && isSilverAdmin
                                        ? "Admin Bạc không thể sửa Admin Vàng"
                                        : "Chỉnh sửa thông tin"
                                    }
                                  >
                                    <Edit className="size-3.5" />
                                  </button>

                                  {/* Nút Xóa User */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    disabled={isTargetGold || (isSilverAdmin && u.role === "admin")}
                                    className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1 text-rose-400 transition hover:bg-rose-500 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
                                    title={
                                      isTargetGold
                                        ? "Không thể xóa Admin Vàng tối cao"
                                        : isSilverAdmin && u.role === "admin"
                                          ? "Admin Bạc không thể xóa Admin"
                                          : "Xóa người dùng"
                                    }
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
          ) : activeTab === "audit_logs" ? (
            /* =========================================================
               TAB 2: TIẾN TRÌNH CHỈNH SỬA CỦA ADMIN BẠC BÁO CÁO VỀ CHO ADMIN VÀNG
               ========================================================= */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <History className="size-5 text-amber-400" />
                      Tiến Trình Chỉnh Sửa Của Admin Bạc (Audit Logs)
                    </h3>
                    <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/40">
                      Báo cáo gửi về Admin Vàng
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    Toàn bộ lịch sử các thao tác thay đổi dữ liệu của Admin Bạc (đổi mật khẩu, gia hạn, khóa/mở khóa, sửa người dùng) được ghi nhận chi tiết tại đây.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void getAdminAuditLogs().then((l) => setAuditLogs(l))}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition active:scale-95"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Làm mới</span>
                  </button>

                  {isGoldAdmin && (
                    <button
                      type="button"
                      onClick={handleClearAuditLogs}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition active:scale-95"
                      title="Chỉ Admin Vàng mới có quyền dọn dẹp"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Dọn nhật ký</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bộ lọc và Tìm kiếm Tiến Trình */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Tìm theo email Admin Bạc, mục tiêu hoặc mô tả..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="rounded-xl border border-white/15 bg-[#141838] px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="all">Tất cả hành động</option>
                  <option value="renew_subscription">Gia hạn gói cước</option>
                  <option value="change_password">Đổi mật khẩu</option>
                  <option value="edit_user">Chỉnh sửa thông tin</option>
                  <option value="toggle_suspend">Khóa / Mở khóa tài khoản</option>
                  <option value="add_user">Thêm người dùng</option>
                  <option value="delete_user">Xóa người dùng</option>
                  <option value="broadcast_notification">Gửi thông báo</option>
                  <option value="add_plan">Thêm gói cước</option>
                </select>
              </div>

              {/* Danh sách Dòng Thời Gian Tiến Trình (Timeline) */}
              <div className="space-y-3">
                {filteredAuditLogs.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center text-white/50">
                    <History className="size-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Chưa có tiến trình chỉnh sửa nào được ghi nhận</p>
                    <p className="text-xs text-white/40 mt-1">
                      Mọi hành vi chỉnh sửa của Admin Bạc sẽ tự động xuất hiện tại đây theo thời gian thực.
                    </p>
                  </div>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const isSilverActor = log.actorTier === "silver";

                    return (
                      <div
                        key={log.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-amber-500/40 hover:bg-white/[0.05]"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Actor Badge */}
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 font-mono text-[10px] font-bold border ${
                                isSilverActor
                                  ? "bg-slate-400/20 text-slate-200 border-slate-400/30"
                                  : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              }`}
                            >
                              {isSilverActor ? (
                                <Shield className="size-3 text-slate-300" />
                              ) : (
                                <Crown className="size-3 text-amber-400" />
                              )}
                              <span>
                                {isSilverActor ? "Admin Bạc: " : "Admin Vàng: "}
                                {log.actorName} ({log.actorEmail})
                              </span>
                            </span>

                            {/* Action Title Badge */}
                            <span className="inline-flex items-center rounded-lg bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 font-mono text-[10px] font-bold">
                              {log.actionTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-mono text-white/50 shrink-0">
                            <Clock className="size-3 text-amber-400/80" />
                            <span>{log.timestamp}</span>
                          </div>
                        </div>

                        {/* Chi tiết nội dung mô tả thay đổi */}
                        <div className="mt-3 text-xs sm:text-sm text-white/90 leading-relaxed font-sans">
                          {log.description}
                        </div>

                        {/* So sánh Trước & Sau (Diff Details) nếu có */}
                        {log.changes && (log.changes.before || log.changes.after) && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                            {log.changes.before && (
                              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-2.5">
                                <span className="text-rose-400 font-bold block mb-1 text-[10px] uppercase">
                                  ◀ Trạng thái trước khi sửa:
                                </span>
                                <pre className="text-[11px] text-white/70 whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.changes.before, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.changes.after && (
                              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                                <span className="text-emerald-400 font-bold block mb-1 text-[10px] uppercase">
                                  ▶ Trạng thái sau khi sửa:
                                </span>
                                <pre className="text-[11px] text-emerald-300 whitespace-pre-wrap break-all">
                                  {JSON.stringify(log.changes.after, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeTab === "broadcast" ? (
            /* =========================================================
               TAB 3: SOẠN & PHÁT THÔNG BÁO CHO TẤT CẢ USER
               ========================================================= */
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="size-5 text-primary" />
                    Quản Lý Thông Báo &amp; Cập Nhật Gửi Tất Cả User
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Các thông báo, bản cập nhật hoặc khuyến mãi bạn gửi tại đây sẽ lập tức xuất hiện khi người dùng nhấp vào biểu tượng chuông thông báo.
                  </p>
                </div>
              </div>

              {/* Form soạn thông báo mới */}
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-slate-900/40 to-slate-950 p-5 shadow-xl">
                <h4 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Send className="size-4 text-cyan-400" />
                  Soạn Bản Cập Nhật / Thông Báo Mới
                </h4>

                <form onSubmit={handleSendBroadcastNotification} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Tiêu đề thông báo *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="vd: 🎉 Nâng cấp v3.5: Ra mắt hệ thống phân quyền Admin Vàng & Bạc!"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Loại thông báo *
                      </label>
                      <select
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value as NotificationType)}
                        className="w-full rounded-xl border border-white/20 bg-[#171b38] px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="update">⚡ Cập nhật hệ thống (Update)</option>
                        <option value="feature">🚀 Tính năng AI mới (Feature)</option>
                        <option value="promo">🎁 Ưu đãi &amp; Khuyến mãi (Promo)</option>
                        <option value="maintenance">🛠️ Bảo trì &amp; Lưu ý kỹ thuật</option>
                        <option value="general">ℹ️ Thông báo chung</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/80 mb-1">
                        Huy hiệu nổi bật (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="vd: MỚI, V3.5, HOT, GIẢM 20%..."
                        value={notifBadge}
                        onChange={(e) => setNotifBadge(e.target.value)}
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Nội dung chi tiết gửi đến toàn bộ người dùng *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Mô tả chi tiết những update mà Admin gửi cho tất cả user (hỗ trợ xuống dòng và các đoạn văn bản rõ ràng)..."
                      value={notifContent}
                      onChange={(e) => setNotifContent(e.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/5 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={notifPinned}
                        onChange={(e) => setNotifPinned(e.target.checked)}
                        className="rounded border-white/20 bg-white/10 size-4 text-primary accent-indigo-600"
                      />
                      <span className="flex items-center gap-1 font-semibold">
                        <Pin className="size-3.5 text-amber-400" />
                        Ghim thông báo này lên đầu trang
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={sendingNotif}
                      className="btn-glow inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      <Send className="size-3.5" />
                      <span>{sendingNotif ? "Đang gửi..." : "Gửi thông báo đến tất cả User"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách các thông báo đã gửi */}
              <div>
                <h4 className="font-display text-sm font-bold text-white mb-3">
                  Danh Sách Thông Báo Đã Phát Sóng ({broadcastNotifs.length})
                </h4>

                <div className="space-y-3">
                  {broadcastNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="rounded-lg bg-primary/20 px-2 py-0.5 font-mono text-[10px] font-bold text-primary uppercase border border-primary/30">
                            {notif.badgeText || notif.type}
                          </span>
                          {notif.pinned && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/40">
                              <Pin className="size-3 text-amber-400" />
                              Ghim
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-white/50">{notif.createdAt}</span>
                        </div>

                        <h5 className="mt-2 font-display text-sm font-bold text-white">
                          {notif.title}
                        </h5>

                        <p className="mt-1 text-xs text-white/70 line-clamp-2">{notif.content}</p>

                        <div className="mt-2 text-[11px] text-white/40 font-mono">
                          Người gửi: <b>{notif.senderName}</b> ({notif.senderTier === "gold" ? "Admin Vàng" : "Admin Bạc"})
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteBroadcast(notif.id)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500 hover:text-white transition"
                        title="Xóa thông báo này"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "plans" ? (
            /* TAB 4: QUẢN LÝ GÓI CƯỚC */
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
            /* TAB 5: TRẠNG THÁI ĐỒNG BỘ & NHẬT KÝ HỆ THỐNG */
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
                        Kiểm soát tính toàn vẹn dữ liệu giữa File máy chủ, Cache trình duyệt và Supabase.
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

                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <span className="text-white/50 font-mono text-[11px]">Tệp Người Dùng:</span>
                    <div className="font-bold text-white font-mono">data/users_db.json</div>
                    <div className="text-emerald-400 font-mono text-[10px]">
                      ✓ {users.length} tài khoản
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <span className="text-white/50 font-mono text-[11px]">Tiến Trình Audit:</span>
                    <div className="font-bold text-white font-mono">data/admin_audit_logs.json</div>
                    <div className="text-amber-400 font-mono text-[10px]">
                      ✓ {auditLogs.length} bản ghi
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                    <span className="text-white/50 font-mono text-[11px]">Thông Báo Broadcast:</span>
                    <div className="font-bold text-white font-mono">data/notifications_db.json</div>
                    <div className="text-purple-400 font-mono text-[10px]">
                      ✓ {broadcastNotifs.length} thông báo
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
                    Nguyên tắc phân quyền &amp; Kiểm soát Admin:
                  </h4>
                  <ul className="space-y-1.5 text-white/70 pl-5 list-disc text-[11px] leading-relaxed">
                    <li>
                      <b>Admin Vàng (Gold Admin):</b> Cấp cao nhất, toàn quyền quản trị người dùng, gói cước, giám sát tiến trình và gửi thông báo.
                    </li>
                    <li>
                      <b>Admin Bạc (Silver Admin):</b> Cấp 2, không thể khóa Admin Vàng, không thể khóa các Admin khác.
                    </li>
                    <li>
                      <b>Admin không thể khóa nhau:</b> Hệ thống chặn quyền khóa giữa các tài khoản Quản trị viên để tránh xung đột quyền lực.
                    </li>
                    <li>
                      <b>Tiến trình chỉnh sửa:</b> Mọi thao tác chỉnh sửa của Admin Bạc tự động gửi báo cáo về bảng kiểm toán cho Admin Vàng theo dõi.
                    </li>
                    <li>
                      <b>Thông báo cập nhật:</b> Cập nhật mà Admin phát sóng hiển thị trực tiếp khi người dùng bấm vào biểu tượng chuông trên Header.
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

                {newRole === "admin" && (
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Cấp bậc Quản trị (Admin Tier) *
                    </label>
                    <select
                      value={newAdminTier}
                      onChange={(e) => setNewAdminTier(e.target.value as AdminTier)}
                      className="w-full rounded-xl border border-amber-500/30 bg-[#171b38] px-3 py-2 text-xs text-amber-300 focus:outline-none"
                    >
                      {isGoldAdmin && <option value="gold">👑 Admin Vàng (Cấp tối cao - Toàn quyền)</option>}
                      <option value="silver">🥈 Admin Bạc (Cấp 2 - Giám sát &amp; Báo cáo)</option>
                    </select>
                  </div>
                )}

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
                    placeholder="VD: Cấp qua chuyển khoản..."
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

        {/* 2. MODAL ĐỔI MẬT KHẨU */}
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

                {editRole === "admin" && (
                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1">
                      Phân cấp Admin *
                    </label>
                    <select
                      value={editAdminTier}
                      onChange={(e) => setEditAdminTier(e.target.value as AdminTier)}
                      className="w-full rounded-xl border border-amber-500/30 bg-[#171b38] px-3 py-2 text-xs text-amber-300 focus:outline-none"
                    >
                      {isGoldAdmin && <option value="gold">👑 Admin Vàng (Cấp tối cao - Toàn quyền)</option>}
                      <option value="silver">🥈 Admin Bạc (Cấp 2 - Giám sát &amp; Báo cáo)</option>
                    </select>
                  </div>
                )}

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
