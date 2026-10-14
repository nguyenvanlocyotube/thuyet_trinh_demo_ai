import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import type {
  UserRecord,
  PlanItem,
  UserRole,
  UserStatus,
  AdminTier,
  AdminAuditLog,
  AuditActionType,
  BroadcastNotification,
  NotificationType,
  SerializableValue,
} from "./admin.types";
import { isGoldAdmin, isSilverAdmin, isAnyAdmin } from "./admin.types";

// File lưu trữ cơ sở dữ liệu trên server
async function getStoragePaths() {
  const path = await import("node:path");
  const fs = await import("node:fs");
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return {
    usersFile: path.join(dataDir, "users_db.json"),
    plansFile: path.join(dataDir, "plans_db.json"),
    auditLogsFile: path.join(dataDir, "admin_audit_logs.json"),
    notificationsFile: path.join(dataDir, "notifications_db.json"),
  };
}

const DEFAULT_USERS: UserRecord[] = [
  {
    id: "usr_admin_loc",
    email: "nguyenlocdz2k7@gmail.com",
    password: "admin123",
    name: "Nguyễn Văn Lộc (Admin Vàng)",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=NarutoKyuubi&hair=short01&hairColor=facc15",
    avatarId: "naruto-kyuubi",
    plan: "promax",
    role: "admin",
    adminTier: "gold",
    freeTrialUsed: 0,
    createdAt: "10/10/2026",
    expiresAt: "2099-12-31",
    status: "active",
    notes: "Admin Vàng tối cao (Chủ sở hữu hệ thống - Toàn quyền)",
  },
  {
    id: "usr_admin_001",
    email: "admin@aivideo.ai",
    password: "admin123",
    name: "Quản Trị Viên (Admin Vàng)",
    avatar: "/wus_cat.png",
    avatarId: "cat",
    plan: "promax",
    role: "admin",
    adminTier: "gold",
    freeTrialUsed: 0,
    createdAt: "10/10/2026",
    expiresAt: "2099-12-31",
    status: "active",
    notes: "Admin Vàng tối cao hệ thống",
  },
  {
    id: "usr_admin_gmail",
    email: "admin@gmail.com",
    password: "admin123",
    name: "Admin Bạc (Giám Sát)",
    avatar: "/wus_cat.png",
    avatarId: "cat",
    plan: "promax",
    role: "admin",
    adminTier: "silver",
    freeTrialUsed: 0,
    createdAt: "10/10/2026",
    expiresAt: "2099-12-31",
    status: "active",
    notes: "Admin Bạc cấp 2 (Mọi chỉnh sửa đều báo cáo về Admin Vàng)",
  },
  {
    id: "usr_demo_002",
    email: "demo.user@aivideo.ai",
    password: "demo123456",
    name: "Tài khoản Demo",
    avatar: "/wus_avatar_full.png",
    avatarId: "anime-girl",
    plan: "free",
    role: "user",
    freeTrialUsed: 0,
    createdAt: "12/10/2026",
    expiresAt: null,
    status: "active",
    notes: "Tài khoản dùng thử tính năng",
  },
  {
    id: "usr_member_004",
    email: "hoangnam.ai@gmail.com",
    password: "nam2026pass",
    name: "Hoàng Nam",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=GokuSSJ1&hair=short03&hairColor=facc15",
    avatarId: "goku-ssj1",
    plan: "go",
    role: "user",
    freeTrialUsed: 1,
    createdAt: "11/10/2026",
    expiresAt: "2026-11-11",
    status: "active",
    notes: "Thành viên gói Go cơ bản",
  },
];

const DEFAULT_PLANS: PlanItem[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Cho người mới bắt đầu trải nghiệm",
    features: [
      "1 lượt trải nghiệm AI miễn phí",
      "Thị giác AI phân tích & OCR tiếng Việt",
      "Phiên âm giọng nói bằng Whisper Turbo",
      "Lưu kết quả tạm thời",
    ],
    isFree: true,
    durationDays: 30,
    createdAt: "01/09/2026",
  },
  {
    id: "go",
    name: "Go",
    price: 49000,
    tagline: "Cho nhu cầu cá nhân cơ bản hàng tháng",
    features: [
      "100 ảnh phân tích / tháng",
      "30 phút ghi âm chuyển văn bản / tháng",
      "Lưu lịch sử đám mây 30 ngày",
      "Hỗ trợ qua Telegram & Email 24/7",
    ],
    durationDays: 30,
    createdAt: "01/09/2026",
  },
  {
    id: "pro",
    name: "Pro",
    price: 149000,
    tagline: "Cho nhà sáng tạo & người dùng thường xuyên",
    popular: true,
    features: [
      "1.000 ảnh phân tích / tháng",
      "300 phút ghi âm Whisper / tháng",
      "Xử lý nhiều ảnh song song",
      "Lưu lịch sử không giới hạn",
      "Ưu tiên hàng đợi AI tốc độ cao",
    ],
    durationDays: 30,
    createdAt: "01/09/2026",
  },
  {
    id: "promax",
    name: "Promax",
    price: 399000,
    tagline: "Cho đội nhóm & doanh nghiệp",
    features: [
      "Không giới hạn ảnh & ghi âm",
      "Truy cập API riêng cho doanh nghiệp",
      "Băng thông & bộ nhớ tối đa",
      "Hỗ trợ ưu tiên 24/7 trực tiếp",
      "Xuất báo cáo & dữ liệu CSV / JSON",
    ],
    durationDays: 30,
    createdAt: "01/09/2026",
  },
];

async function loadUsersFromFile(): Promise<UserRecord[]> {
  try {
    const fs = await import("node:fs");
    const { usersFile } = await getStoragePaths();
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, JSON.stringify(DEFAULT_USERS, null, 2), "utf-8");
      return DEFAULT_USERS;
    }
    const content = fs.readFileSync(usersFile, "utf-8");
    const parsed = JSON.parse(content);
    const list: UserRecord[] = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;

    let hasOwnerLoc = false;
    let hasAdminAi = false;
    for (const u of list) {
      const email = u.email.trim().toLowerCase();
      if (email === "nguyenlocdz2k7@gmail.com") {
        hasOwnerLoc = true;
        u.role = "admin";
        u.adminTier = "gold";
        u.plan = "promax";
        u.expiresAt = "2099-12-31";
      }
      if (email === "admin@aivideo.ai") {
        hasAdminAi = true;
        u.role = "admin";
        u.adminTier = "gold";
        u.plan = "promax";
        u.expiresAt = "2099-12-31";
      }
      if (email === "admin@gmail.com" && !u.adminTier) {
        u.adminTier = "silver";
      }
    }
    if (!hasOwnerLoc) {
      list.unshift(DEFAULT_USERS[0]!);
    }
    if (!hasAdminAi) {
      list.unshift(DEFAULT_USERS[1]!);
    }
    return list;
  } catch (err) {
    console.error("Lỗi đọc users file:", err);
    return DEFAULT_USERS;
  }
}

async function saveUsersToFile(users: UserRecord[]): Promise<void> {
  const fs = await import("node:fs");
  const { usersFile } = await getStoragePaths();
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

async function loadPlansFromFile(): Promise<PlanItem[]> {
  try {
    const fs = await import("node:fs");
    const { plansFile } = await getStoragePaths();
    if (!fs.existsSync(plansFile)) {
      fs.writeFileSync(plansFile, JSON.stringify(DEFAULT_PLANS, null, 2), "utf-8");
      return DEFAULT_PLANS;
    }
    const content = fs.readFileSync(plansFile, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PLANS;
  } catch (err) {
    console.error("Lỗi đọc plans file:", err);
    return DEFAULT_PLANS;
  }
}

async function savePlansToFile(plans: PlanItem[]): Promise<void> {
  const fs = await import("node:fs");
  const { plansFile } = await getStoragePaths();
  fs.writeFileSync(plansFile, JSON.stringify(plans, null, 2), "utf-8");
}

/* =========================================================================
   AUDIT LOGS FILE OPERATIONS
   ========================================================================= */
async function loadAuditLogsFromFile(): Promise<AdminAuditLog[]> {
  try {
    const fs = await import("node:fs");
    const { auditLogsFile } = await getStoragePaths();
    if (!fs.existsSync(auditLogsFile)) {
      fs.writeFileSync(auditLogsFile, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const content = fs.readFileSync(auditLogsFile, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Lỗi đọc audit logs file:", err);
    return [];
  }
}

async function saveAuditLogsToFile(logs: AdminAuditLog[]): Promise<void> {
  const fs = await import("node:fs");
  const { auditLogsFile } = await getStoragePaths();
  fs.writeFileSync(auditLogsFile, JSON.stringify(logs, null, 2), "utf-8");
}

async function logAdminAction(params: {
  actorEmail?: string | undefined;
  actionType: AuditActionType;
  actionTitle: string;
  targetId?: string | undefined;
  targetEmail?: string | undefined;
  targetName?: string | undefined;
  description: string;
  changes?: {
    before?: Record<string, SerializableValue> | undefined;
    after?: Record<string, SerializableValue> | undefined;
  } | undefined;
}): Promise<AdminAuditLog> {
  const users = await loadUsersFromFile();
  const actor = users.find(
    (u) => u.email.toLowerCase() === (params.actorEmail || "").trim().toLowerCase(),
  );
  const actorTier: AdminTier = isSilverAdmin(actor) ? "silver" : "gold";
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} ${now.toLocaleDateString("vi-VN")}`;

  const newLog: AdminAuditLog = {
    id: `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    actorId: actor?.id || "unknown",
    actorEmail: params.actorEmail || actor?.email || "admin@system",
    actorName: actor?.name || (actorTier === "silver" ? "Admin Bạc" : "Admin Vàng"),
    actorTier,
    actionType: params.actionType,
    actionTitle: params.actionTitle,
    targetId: params.targetId,
    targetEmail: params.targetEmail,
    targetName: params.targetName,
    description: params.description,
    changes: params.changes,
    timestamp: timeStr,
    createdAtIso: now.toISOString(),
  };

  const logs = await loadAuditLogsFromFile();
  logs.unshift(newLog);
  if (logs.length > 500) logs.length = 500;
  await saveAuditLogsToFile(logs);
  return newLog;
}

/* =========================================================================
   BROADCAST NOTIFICATIONS FILE OPERATIONS
   ========================================================================= */
async function loadNotificationsFromFile(): Promise<BroadcastNotification[]> {
  try {
    const fs = await import("node:fs");
    const { notificationsFile } = await getStoragePaths();
    if (!fs.existsSync(notificationsFile)) {
      fs.writeFileSync(notificationsFile, JSON.stringify([], null, 2), "utf-8");
      return [];
    }
    const content = fs.readFileSync(notificationsFile, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Lỗi đọc notifications file:", err);
    return [];
  }
}

async function saveNotificationsToFile(notifications: BroadcastNotification[]): Promise<void> {
  const fs = await import("node:fs");
  const { notificationsFile } = await getStoragePaths();
  fs.writeFileSync(notificationsFile, JSON.stringify(notifications, null, 2), "utf-8");
}

/* =========================================================================
   SERVER FUNCTIONS: QUẢN LÝ NGƯỜI DÙNG (CƠ SỞ DỮ LIỆU ADMIN)
   ========================================================================= */

// 1. Lấy danh sách toàn bộ người dùng
export const getAdminUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserRecord[]> => {
    return loadUsersFromFile();
  },
);

// 2. Thêm người dùng mới vào cơ sở dữ liệu
export const addAdminUser = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        email: z.string().email("Email không đúng định dạng"),
        password: z.string().min(4, "Mật khẩu tối thiểu 4 ký tự"),
        name: z.string().optional(),
        plan: z.string().default("free"),
        role: z.enum(["admin", "user"]).default("user"),
        adminTier: z.enum(["gold", "silver"]).optional(),
        durationDays: z.number().default(30),
        status: z.enum(["active", "suspended"]).default("active"),
        notes: z.string().optional(),
        actorEmail: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; user: UserRecord; message?: string }> => {
    const users = await loadUsersFromFile();
    const cleanEmail = data.email.trim().toLowerCase();

    // Kiểm tra trùng lặp email
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email "${cleanEmail}" đã tồn tại trong cơ sở dữ liệu!`);
    }

    const actor = users.find(
      (u) => u.email.toLowerCase() === (data.actorEmail || "").trim().toLowerCase(),
    );

    // Nếu Actor là Admin Bạc mà cố tình tạo Admin Vàng -> Chặn!
    let assignedAdminTier = data.adminTier;
    if (data.role === "admin") {
      if (actor && isSilverAdmin(actor)) {
        assignedAdminTier = "silver"; // Admin Bạc chỉ được tạo Admin Bạc
      } else if (!assignedAdminTier) {
        assignedAdminTier = "silver";
      }
    }

    const now = new Date();
    let expiresAt: string | null = null;
    if (data.plan !== "free" && data.durationDays > 0) {
      const expDate = new Date(now.getTime() + data.durationDays * 24 * 60 * 60 * 1000);
      expiresAt = expDate.toISOString().split("T")[0] ?? null;
    }

    const newUser: UserRecord = {
      id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      password: data.password,
      name: data.name?.trim() || cleanEmail.split("@")[0] || "Thành viên",
      avatar: "/wus_cat.png",
      avatarId: "cat",
      plan: data.plan,
      role: data.role as UserRole,
      adminTier: assignedAdminTier,
      freeTrialUsed: 0,
      createdAt: now.toLocaleDateString("vi-VN"),
      expiresAt,
      status: data.status as UserStatus,
      notes: data.notes ?? "",
    };

    users.unshift(newUser);
    await saveUsersToFile(users);

    // Ghi lại tiến trình chỉnh sửa của Admin Bạc / Admin Vàng
    await logAdminAction({
      actorEmail: data.actorEmail,
      actionType: "add_user",
      actionTitle: "Thêm người dùng mới vào hệ thống",
      targetId: newUser.id,
      targetEmail: newUser.email,
      targetName: newUser.name,
      description: `Đã tạo tài khoản mới: "${newUser.email}" (${newUser.name}) với quyền [${newUser.role}${newUser.adminTier ? ` - ${newUser.adminTier === "gold" ? "Admin Vàng" : "Admin Bạc"}` : ""}], gói cước [${newUser.plan.toUpperCase()}].`,
      changes: {
        after: {
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          adminTier: newUser.adminTier ?? null,
          plan: newUser.plan,
        },
      },
    });

    return { success: true, user: newUser, message: "Đã thêm người dùng mới thành công!" };
  });

// 3. Đổi mật khẩu người dùng
export const changeUserPassword = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        userId: z.string(),
        newPassword: z.string().min(4, "Mật khẩu tối thiểu 4 ký tự"),
        actorEmail: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const users = await loadUsersFromFile();
    const targetUser = users.find((u) => u.id === data.userId);
    if (!targetUser) {
      throw new Error("Không tìm thấy người dùng trong cơ sở dữ liệu.");
    }

    const actor = users.find(
      (u) => u.email.toLowerCase() === (data.actorEmail || "").trim().toLowerCase(),
    );

    // Admin Bạc không được đổi mật khẩu của Admin Vàng
    if (isGoldAdmin(targetUser) && actor && isSilverAdmin(actor)) {
      throw new Error("Admin Bạc không có quyền đổi mật khẩu của Admin Vàng!");
    }

    targetUser.password = data.newPassword;
    await saveUsersToFile(users);

    // Ghi nhật ký tiến trình thay đổi
    await logAdminAction({
      actorEmail: data.actorEmail,
      actionType: "change_password",
      actionTitle: "Đổi mật khẩu tài khoản người dùng",
      targetId: targetUser.id,
      targetEmail: targetUser.email,
      targetName: targetUser.name,
      description: `Đã cập nhật mật khẩu mới cho tài khoản "${targetUser.email}" (${targetUser.name}).`,
      changes: {
        after: { passwordUpdated: true },
      },
    });

    return {
      success: true,
      message: `Đã đổi mật khẩu cho tài khoản "${targetUser.email}" thành công!`,
    };
  });

// 4. Gia hạn gói cho thành viên
export const renewUserSubscription = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        userId: z.string(),
        planId: z.string(),
        additionalDays: z.number().min(1, "Số ngày gia hạn tối thiểu là 1 ngày"),
        actorEmail: z.string().optional(),
      })
      .parse(d),
  )
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; user: UserRecord; newExpiresAt: string; message: string }> => {
      const users = await loadUsersFromFile();
      const user = users.find((u) => u.id === data.userId);
      if (!user) {
        throw new Error("Không tìm thấy thành viên cần gia hạn.");
      }

      const prevPlan = user.plan;
      const prevExpiresAt = user.expiresAt;

      const now = new Date();
      let baseTime = now.getTime();

      if (user.expiresAt) {
        const currentExp = new Date(user.expiresAt);
        if (currentExp.getTime() > baseTime) {
          baseTime = currentExp.getTime();
        }
      }

      const newDate = new Date(baseTime + data.additionalDays * 24 * 60 * 60 * 1000);
      const newExpiresAt = newDate.toISOString().split("T")[0] ?? "";

      user.plan = data.planId;
      user.expiresAt = newExpiresAt;
      user.status = "active";

      await saveUsersToFile(users);

      // Ghi nhật ký tiến trình
      await logAdminAction({
        actorEmail: data.actorEmail,
        actionType: "renew_subscription",
        actionTitle: "Gia hạn gói cước thành viên",
        targetId: user.id,
        targetEmail: user.email,
        targetName: user.name,
        description: `Đã gia hạn gói "${data.planId.toUpperCase()}" thêm ${data.additionalDays} ngày cho "${user.email}" (${user.name}) đến ngày ${newDate.toLocaleDateString("vi-VN")}.`,
        changes: {
          before: { plan: prevPlan, expiresAt: prevExpiresAt },
          after: {
            plan: data.planId,
            expiresAt: newExpiresAt,
            additionalDays: data.additionalDays,
          },
        },
      });

      return {
        success: true,
        user,
        newExpiresAt,
        message: `Đã gia hạn thành công gói "${data.planId.toUpperCase()}" cho ${user.email} đến ngày ${newDate.toLocaleDateString("vi-VN")}!`,
      };
    },
  );

// 5. Cập nhật thông tin người dùng (Role, Plan, Status, v.v.)
export const updateAdminUser = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        userId: z.string(),
        name: z.string().optional(),
        role: z.enum(["admin", "user"]).optional(),
        adminTier: z.enum(["gold", "silver"]).optional(),
        plan: z.string().optional(),
        status: z.enum(["active", "suspended"]).optional(),
        notes: z.string().optional(),
        expiresAt: z.string().nullable().optional(),
        actorEmail: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; user: UserRecord }> => {
    const users = await loadUsersFromFile();
    const user = users.find((u) => u.id === data.userId);
    if (!user) throw new Error("Không tìm thấy người dùng.");

    const actor = users.find(
      (u) => u.email.toLowerCase() === (data.actorEmail || "").trim().toLowerCase(),
    );

    // Admin Bạc không thể sửa tài khoản Admin Vàng
    if (isGoldAdmin(user) && actor && isSilverAdmin(actor)) {
      throw new Error("Admin Bạc không có quyền chỉnh sửa tài khoản của Admin Vàng!");
    }

    // Admin Bạc không thể tự phong mình hoặc người khác thành Admin Vàng
    if (data.adminTier === "gold" && actor && isSilverAdmin(actor)) {
      throw new Error("Admin Bạc không có quyền chỉ định tài khoản thành Admin Vàng!");
    }

    const beforeState = { ...user };

    if (data.name !== undefined) user.name = data.name;
    if (data.role !== undefined) user.role = data.role as UserRole;
    if (data.adminTier !== undefined) user.adminTier = data.adminTier;
    if (data.plan !== undefined) user.plan = data.plan;
    if (data.status !== undefined) user.status = data.status as UserStatus;
    if (data.notes !== undefined) user.notes = data.notes;
    if (data.expiresAt !== undefined) user.expiresAt = data.expiresAt;

    await saveUsersToFile(users);

    // Ghi nhận tiến trình thay đổi
    await logAdminAction({
      actorEmail: data.actorEmail,
      actionType: "edit_user",
      actionTitle: "Chỉnh sửa thông tin tài khoản",
      targetId: user.id,
      targetEmail: user.email,
      targetName: user.name,
      description: `Đã chỉnh sửa thông tin tài khoản "${user.email}" (${user.name}): Vai trò [${user.role}${user.adminTier ? ` - ${user.adminTier === "gold" ? "Admin Vàng" : "Admin Bạc"}` : ""}], Gói [${user.plan}], Trạng thái [${user.status}].`,
      changes: {
        before: {
          name: beforeState.name,
          role: beforeState.role,
          adminTier: beforeState.adminTier ?? null,
          plan: beforeState.plan,
          status: beforeState.status,
          notes: beforeState.notes ?? null,
        },
        after: {
          name: user.name,
          role: user.role,
          adminTier: user.adminTier ?? null,
          plan: user.plan,
          status: user.status,
          notes: user.notes ?? null,
        },
      },
    });

    return { success: true, user };
  });

// 6. Xóa người dùng
export const deleteAdminUser = createServerFn({ method: "POST" })
  .validator(
    (d: unknown) => z.object({ userId: z.string(), actorEmail: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const users = await loadUsersFromFile();
    const target = users.find((u) => u.id === data.userId);
    if (!target) throw new Error("Không tìm thấy người dùng để xóa.");

    const actor = users.find(
      (u) => u.email.toLowerCase() === (data.actorEmail || "").trim().toLowerCase(),
    );

    if (isGoldAdmin(target)) {
      throw new Error("Không thể xóa tài khoản Quản trị viên tối cao (Admin Vàng)!");
    }

    if (actor && isSilverAdmin(actor) && isAnyAdmin(target)) {
      throw new Error("Admin Bạc không có quyền xóa tài khoản Quản trị viên!");
    }

    const filtered = users.filter((u) => u.id !== data.userId);
    await saveUsersToFile(filtered);

    // Ghi nhật ký tiến trình
    await logAdminAction({
      actorEmail: data.actorEmail,
      actionType: "delete_user",
      actionTitle: "Xóa tài khoản người dùng",
      targetId: target.id,
      targetEmail: target.email,
      targetName: target.name,
      description: `Đã xóa vĩnh viễn tài khoản "${target.email}" (${target.name}) khỏi hệ thống.`,
      changes: {
        before: { email: target.email, name: target.name, role: target.role, plan: target.plan },
      },
    });

    return {
      success: true,
      message: `Đã xóa người dùng "${target.email}" khỏi cơ sở dữ liệu.`,
    };
  });

// 7. Khóa / Mở khóa tài khoản người dùng
export const toggleUserSuspension = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        userId: z.string(),
        reason: z.string().optional(),
        actorEmail: z.string().optional(),
      })
      .parse(d),
  )
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; user: UserRecord; isSuspended: boolean; message: string }> => {
      const users = await loadUsersFromFile();
      const user = users.find((u) => u.id === data.userId);
      if (!user) throw new Error("Không tìm thấy người dùng.");

      const actor = users.find(
        (u) => u.email.toLowerCase() === (data.actorEmail || "").trim().toLowerCase(),
      );

      // QUY TẮC PHÂN CẤP ADMIN:
      // 1. Không ai có thể khóa Admin Vàng
      if (isGoldAdmin(user)) {
        throw new Error("Không thể khóa tài khoản Admin Vàng (Cấp tối cao)!");
      }

      // 2. Tự khóa chính mình
      if (actor && actor.id === user.id) {
        throw new Error("Bạn không thể tự khóa tài khoản của chính mình!");
      }

      // 3. Admin không thể khóa nhau:
      // Nếu Actor là Admin Bạc mà Target là Admin (cả Vàng lẫn Bạc khác) -> Chặn tuyệt đối!
      if (actor && isSilverAdmin(actor) && isAnyAdmin(user)) {
        throw new Error("Admin Bạc không có quyền khóa tài khoản Quản trị viên (Admin không thể khóa nhau)!");
      }

      const prevStatus = user.status;
      const nextStatus: UserStatus = user.status === "suspended" ? "active" : "suspended";
      user.status = nextStatus;
      if (nextStatus === "suspended" && data.reason) {
        user.notes = (user.notes ? user.notes + " | " : "") + `Bị khóa: ${data.reason}`;
      }

      await saveUsersToFile(users);

      // Ghi nhận tiến trình thay đổi của Admin Bạc / Admin Vàng
      await logAdminAction({
        actorEmail: data.actorEmail,
        actionType: "toggle_suspend",
        actionTitle:
          nextStatus === "suspended" ? "Khóa tài khoản người dùng" : "Mở khóa tài khoản người dùng",
        targetId: user.id,
        targetEmail: user.email,
        targetName: user.name,
        description: `Đã ${nextStatus === "suspended" ? "KHÓA" : "MỞ KHÓA"} tài khoản "${user.email}" (${user.name}). ${data.reason ? `Lý do: ${data.reason}` : ""}`,
        changes: {
          before: { status: prevStatus },
          after: { status: nextStatus, reason: data.reason ?? null },
        },
      });

      const isSuspended = nextStatus === "suspended";
      return {
        success: true,
        user,
        isSuspended,
        message: isSuspended
          ? `Đã khóa tài khoản "${user.email}". Người dùng này sẽ không thể đăng nhập!`
          : `Đã mở khóa tài khoản "${user.email}". Người dùng đã có thể đăng nhập bình thường.`,
      };
    },
  );

/* =========================================================================
   SERVER FUNCTIONS: TIẾN TRÌNH CHỈNH SỬA (AUDIT LOGS CHO ADMIN VÀNG)
   ========================================================================= */

// 8. Lấy toàn bộ danh sách tiến trình chỉnh sửa của Admin Bạc
export const getAdminAuditLogs = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminAuditLog[]> => {
    return loadAuditLogsFromFile();
  },
);

// 9. Ghi trực tiếp một bản ghi tiến trình chỉnh sửa
export const recordAdminAuditLog = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        actorEmail: z.string(),
        actionType: z.enum([
          "edit_user",
          "change_password",
          "renew_subscription",
          "add_user",
          "delete_user",
          "toggle_suspend",
          "add_plan",
          "delete_plan",
          "broadcast_notification",
          "other",
        ]),
        actionTitle: z.string(),
        targetId: z.string().optional(),
        targetEmail: z.string().optional(),
        targetName: z.string().optional(),
        description: z.string(),
        changes: z
          .object({
            before: z.record(z.any()).optional(),
            after: z.record(z.any()).optional(),
          })
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; log: AdminAuditLog }> => {
    const log = await logAdminAction(data as any);
    return { success: true, log };
  });

// 10. Xóa lịch sử tiến trình (Chỉ Admin Vàng mới có quyền)
export const clearAdminAuditLogs = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ actorEmail: z.string().optional() }).parse(d))
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const users = await loadUsersFromFile();
    const actor = users.find(
      (u) => u.email.toLowerCase() === (data.actorEmail || "").trim().toLowerCase(),
    );
    if (!actor || !isGoldAdmin(actor)) {
      throw new Error("Chỉ Admin Vàng (Cấp tối cao) mới có quyền xóa tiến trình nhật ký!");
    }

    await saveAuditLogsToFile([]);
    return { success: true, message: "Đã dọn sạch toàn bộ nhật ký tiến trình chỉnh sửa." };
  });

/* =========================================================================
   SERVER FUNCTIONS: THÔNG BÁO TỪ ADMIN GỬI TOÀN BỘ USER (BROADCAST)
   ========================================================================= */

// 11. Lấy danh sách thông báo gửi cho tất cả người dùng
export const getBroadcastNotifications = createServerFn({ method: "GET" }).handler(
  async (): Promise<BroadcastNotification[]> => {
    return loadNotificationsFromFile();
  },
);

// 12. Tạo thông báo mới gửi cho tất cả user
export const createBroadcastNotification = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        title: z.string().min(3, "Tiêu đề thông báo tối thiểu 3 ký tự"),
        content: z.string().min(5, "Nội dung thông báo tối thiểu 5 ký tự"),
        type: z
          .enum(["update", "feature", "promo", "maintenance", "general"])
          .default("update"),
        badgeText: z.string().optional(),
        senderName: z.string().optional(),
        senderEmail: z.string().optional(),
        pinned: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(
    async ({
      data,
    }): Promise<{ success: boolean; notification: BroadcastNotification; message: string }> => {
      const users = await loadUsersFromFile();
      const actor = users.find(
        (u) => u.email.toLowerCase() === (data.senderEmail || "").trim().toLowerCase(),
      );
      const senderTier: AdminTier = isSilverAdmin(actor) ? "silver" : "gold";

      const now = new Date();
      const newNotif: BroadcastNotification = {
        id: `notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        title: data.title.trim(),
        content: data.content.trim(),
        type: data.type as NotificationType,
        badgeText: data.badgeText?.trim() || undefined,
        senderName:
          data.senderName?.trim() ||
          actor?.name ||
          (senderTier === "gold" ? "Ban Quản Trị (Admin Vàng)" : "Admin Bạc"),
        senderEmail: data.senderEmail || actor?.email || "admin@system",
        senderTier,
        createdAt: now.toLocaleDateString("vi-VN"),
        createdAtIso: now.toISOString(),
        pinned: data.pinned,
      };

      const notifs = await loadNotificationsFromFile();
      notifs.unshift(newNotif);
      await saveNotificationsToFile(notifs);

      // Ghi nhận vào tiến trình chỉnh sửa của Admin
      await logAdminAction({
        actorEmail: data.senderEmail,
        actionType: "broadcast_notification",
        actionTitle: "Gửi thông báo cập nhật cho tất cả User",
        targetName: "Tất cả thành viên hệ thống",
        description: `Đã phát thông báo mới: "${newNotif.title}" [Loại: ${newNotif.type.toUpperCase()}].`,
        changes: {
          after: { title: newNotif.title, content: newNotif.content, type: newNotif.type },
        },
      });

      return {
        success: true,
        notification: newNotif,
        message: "Đã gửi thông báo mới đến toàn bộ người dùng thành công!",
      };
    },
  );

// 13. Xóa thông báo
export const deleteBroadcastNotification = createServerFn({ method: "POST" })
  .validator(
    (d: unknown) =>
      z.object({ notificationId: z.string(), actorEmail: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const notifs = await loadNotificationsFromFile();
    const target = notifs.find((n) => n.id === data.notificationId);
    if (!target) throw new Error("Không tìm thấy thông báo để xóa.");

    const filtered = notifs.filter((n) => n.id !== data.notificationId);
    await saveNotificationsToFile(filtered);

    await logAdminAction({
      actorEmail: data.actorEmail,
      actionType: "broadcast_notification",
      actionTitle: "Xóa thông báo hệ thống",
      description: `Đã xóa thông báo: "${target.title}".`,
      changes: { before: { title: target.title } },
    });

    return {
      success: true,
      message: "Đã xóa thông báo thành công.",
    };
  });

/* =========================================================================
   SERVER FUNCTIONS: QUẢN LÝ GÓI CƯỚC (PLANS MANAGEMENT)
   ========================================================================= */

// 14. Lấy danh sách toàn bộ các gói cước
export const getAdminPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlanItem[]> => {
    return loadPlansFromFile();
  },
);

// 15. Thêm gói cước mới
export const addAdminPlan = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        id: z.string().min(2, "Mã gói phải từ 2 ký tự trở lên"),
        name: z.string().min(2, "Tên gói không được để trống"),
        price: z.number().min(0, "Giá gói không được âm"),
        tagline: z.string().default(""),
        features: z.array(z.string()).default([]),
        popular: z.boolean().default(false),
        durationDays: z.number().default(30),
        actorEmail: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; plan: PlanItem; message: string }> => {
    const plans = await loadPlansFromFile();
    const cleanId = data.id.trim().toLowerCase().replace(/\s+/g, "_");

    if (plans.some((p) => p.id === cleanId)) {
      throw new Error(`Mã gói "${cleanId}" đã tồn tại! Vui lòng chọn mã gói khác.`);
    }

    const newPlan: PlanItem = {
      id: cleanId,
      name: data.name.trim(),
      price: data.price,
      tagline: data.tagline.trim(),
      features: data.features.filter((f) => f.trim().length > 0),
      popular: data.popular,
      isFree: data.price === 0,
      durationDays: data.durationDays,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    plans.push(newPlan);
    await savePlansToFile(plans);

    // Ghi nhận tiến trình
    await logAdminAction({
      actorEmail: data.actorEmail,
      actionType: "add_plan",
      actionTitle: "Thêm gói cước mới",
      targetId: newPlan.id,
      targetName: newPlan.name,
      description: `Đã tạo gói cước mới: "${newPlan.name}" (Mã: ${newPlan.id}) - Giá: ${newPlan.price.toLocaleString("vi-VN")} đ.`,
      changes: { after: { id: newPlan.id, name: newPlan.name, price: newPlan.price } },
    });

    return {
      success: true,
      plan: newPlan,
      message: `Đã tạo mới gói cước "${newPlan.name}" thành công!`,
    };
  });

// 16. Xóa gói cước tùy chỉnh
export const deleteAdminPlan = createServerFn({ method: "POST" })
  .validator(
    (d: unknown) =>
      z.object({ planId: z.string(), actorEmail: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const defaultIds = ["free", "go", "pro", "promax"];
    if (defaultIds.includes(data.planId)) {
      throw new Error("Không thể xóa các gói cước mặc định của hệ thống.");
    }

    const plans = await loadPlansFromFile();
    const filtered = plans.filter((p) => p.id !== data.planId);
    await savePlansToFile(filtered);

    await logAdminAction({
      actorEmail: data.actorEmail,
      actionType: "delete_plan",
      actionTitle: "Xóa gói cước hệ thống",
      targetId: data.planId,
      description: `Đã xóa gói cước "${data.planId}".`,
      changes: { before: { planId: data.planId } },
    });

    return {
      success: true,
      message: `Đã xóa gói cước "${data.planId}" thành công.`,
    };
  });

// 17. Đồng bộ cơ sở dữ liệu Admin (Sync Users, Plans, Logs giữa File, Local Cache và Supabase)
export const syncAdminDatabase = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        clientUsers: z.array(z.any()).optional(),
      })
      .parse(d),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      success: boolean;
      users: UserRecord[];
      plans: PlanItem[];
      auditLogs: AdminAuditLog[];
      notifications: BroadcastNotification[];
      totalUsers: number;
      totalPlans: number;
      timestamp: string;
      message: string;
    }> => {
      const serverUsers = await loadUsersFromFile();
      const serverPlans = await loadPlansFromFile();
      const serverLogs = await loadAuditLogsFromFile();
      const serverNotifs = await loadNotificationsFromFile();

      if (Array.isArray(data.clientUsers) && data.clientUsers.length > 0) {
        for (const cu of data.clientUsers) {
          if (cu && cu.email) {
            const exists = serverUsers.some(
              (su) => su.email.toLowerCase() === cu.email.toLowerCase(),
            );
            if (!exists) {
              serverUsers.push(cu as UserRecord);
            }
          }
        }
        await saveUsersToFile(serverUsers);
      }

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")} ${now.toLocaleDateString("vi-VN")}`;

      return {
        success: true,
        users: serverUsers,
        plans: serverPlans,
        auditLogs: serverLogs,
        notifications: serverNotifs,
        totalUsers: serverUsers.length,
        totalPlans: serverPlans.length,
        timestamp: timeStr,
        message: `Đồng bộ thành công ${serverUsers.length} tài khoản người dùng, ${serverPlans.length} gói cước và ${serverLogs.length} nhật ký tiến trình với máy chủ!`,
      };
    },
  );
