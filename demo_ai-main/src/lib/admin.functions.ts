import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import type { UserRecord, PlanItem, UserRole, UserStatus } from "./admin.types";

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
  };
}

const DEFAULT_USERS: UserRecord[] = [
  {
    id: "usr_admin_001",
    email: "admin@aivideo.ai",
    password: "admin123",
    name: "Quản Trị Viên (Admin)",
    avatar: "/wus_cat.png",
    avatarId: "cat",
    plan: "promax",
    role: "admin",
    freeTrialUsed: 0,
    createdAt: "10/10/2026",
    expiresAt: "2099-12-31",
    status: "active",
    notes: "Tài khoản quản trị viên tối cao",
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
    id: "usr_vip_003",
    email: "nguyenlocdz2k7@gmail.com",
    password: "admin123",
    name: "Nguyễn Văn Lộc (Admin)",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=NarutoKyuubi&hair=short01&hairColor=facc15",
    avatarId: "naruto-kyuubi",
    plan: "promax",
    role: "admin",
    freeTrialUsed: 0,
    createdAt: "10/10/2026",
    expiresAt: "2099-12-31",
    status: "active",
    notes: "Quản trị viên tối cao (Chủ sở hữu hệ thống)",
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
    // Đảm bảo các tài khoản admin chủ chốt luôn có role = 'admin' và plan = 'promax'
    let hasOwnerLoc = false;
    let hasAdminAi = false;
    for (const u of list) {
      const email = u.email.trim().toLowerCase();
      if (email === "nguyenlocdz2k7@gmail.com") {
        hasOwnerLoc = true;
        u.role = "admin";
        u.plan = "promax";
        u.expiresAt = "2099-12-31";
      }
      if (email === "admin@aivideo.ai") {
        hasAdminAi = true;
        u.role = "admin";
        u.plan = "promax";
        u.expiresAt = "2099-12-31";
      }
    }
    if (!hasOwnerLoc) {
      list.unshift(DEFAULT_USERS[2]!);
    }
    if (!hasAdminAi) {
      list.unshift(DEFAULT_USERS[0]!);
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
        durationDays: z.number().default(30),
        status: z.enum(["active", "suspended"]).default("active"),
        notes: z.string().optional(),
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
      freeTrialUsed: 0,
      createdAt: now.toLocaleDateString("vi-VN"),
      expiresAt,
      status: data.status as UserStatus,
      notes: data.notes ?? "",
    };

    users.unshift(newUser);
    await saveUsersToFile(users);

    return { success: true, user: newUser, message: "Đã thêm người dùng mới thành công!" };
  });

// 3. Đổi mật khẩu người dùng
export const changeUserPassword = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        userId: z.string(),
        newPassword: z.string().min(4, "Mật khẩu tối thiểu 4 ký tự"),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const users = await loadUsersFromFile();
    const index = users.findIndex((u) => u.id === data.userId);
    if (index === -1) {
      throw new Error("Không tìm thấy người dùng trong cơ sở dữ liệu.");
    }

    const targetUser = users[index];
    if (targetUser) {
      targetUser.password = data.newPassword;
    }
    await saveUsersToFile(users);

    return {
      success: true,
      message: `Đã đổi mật khẩu cho tài khoản "${targetUser?.email}" thành công!`,
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

      const now = new Date();
      let baseTime = now.getTime();

      // Nếu thành viên đang có hạn dùng và chưa hết hạn, cộng dồn từ ngày hết hạn đó
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
        plan: z.string().optional(),
        status: z.enum(["active", "suspended"]).optional(),
        notes: z.string().optional(),
        expiresAt: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ success: boolean; user: UserRecord }> => {
    const users = await loadUsersFromFile();
    const user = users.find((u) => u.id === data.userId);
    if (!user) throw new Error("Không tìm thấy người dùng.");

    if (data.name !== undefined) user.name = data.name;
    if (data.role !== undefined) user.role = data.role as UserRole;
    if (data.plan !== undefined) user.plan = data.plan;
    if (data.status !== undefined) user.status = data.status as UserStatus;
    if (data.notes !== undefined) user.notes = data.notes;
    if (data.expiresAt !== undefined) user.expiresAt = data.expiresAt;

    await saveUsersToFile(users);
    return { success: true, user };
  });

// 6. Xóa người dùng
export const deleteAdminUser = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const users = await loadUsersFromFile();
    const target = users.find((u) => u.id === data.userId);
    if (!target) throw new Error("Không tìm thấy người dùng để xóa.");

    if (target.email === "admin@aivideo.ai") {
      throw new Error("Không thể xóa tài khoản Quản trị viên tối cao mặc định!");
    }

    const filtered = users.filter((u) => u.id !== data.userId);
    await saveUsersToFile(filtered);

    return {
      success: true,
      message: `Đã xóa người dùng "${target.email}" khỏi cơ sở dữ liệu.`,
    };
  });

/* =========================================================================
   SERVER FUNCTIONS: QUẢN LÝ GÓI CƯỚC (PLANS MANAGEMENT)
   ========================================================================= */

// 7. Lấy danh sách toàn bộ các gói cước
export const getAdminPlans = createServerFn({ method: "GET" }).handler(
  async (): Promise<PlanItem[]> => {
    return loadPlansFromFile();
  },
);

// 8. Thêm gói cước mới
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

    return {
      success: true,
      plan: newPlan,
      message: `Đã tạo mới gói cước "${newPlan.name}" thành công!`,
    };
  });

// 9. Xóa gói cước tùy chỉnh
export const deleteAdminPlan = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ planId: z.string() }).parse(d))
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const defaultIds = ["free", "go", "pro", "promax"];
    if (defaultIds.includes(data.planId)) {
      throw new Error("Không thể xóa các gói cước mặc định của hệ thống.");
    }

    const plans = await loadPlansFromFile();
    const filtered = plans.filter((p) => p.id !== data.planId);
    await savePlansToFile(filtered);

    return {
      success: true,
      message: `Đã xóa gói cước "${data.planId}" thành công.`,
    };
  });

function isSystemAdminEmail(email?: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === "nguyenlocdz2k7@gmail.com" ||
    clean === "admin@aivideo.ai" ||
    clean === "admin@gmail.com" ||
    clean.startsWith("admin@")
  );
}

// 10. Khóa / Mở khóa tài khoản người dùng
export const toggleUserSuspension = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z
      .object({
        userId: z.string(),
        reason: z.string().optional(),
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

      if (isSystemAdminEmail(user.email)) {
        throw new Error("Không thể khóa tài khoản Quản trị viên tối cao!");
      }

      const nextStatus: UserStatus = user.status === "suspended" ? "active" : "suspended";
      user.status = nextStatus;
      if (nextStatus === "suspended" && data.reason) {
        user.notes = (user.notes ? user.notes + " | " : "") + `Bị khóa: ${data.reason}`;
      }

      await saveUsersToFile(users);

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

// 11. Đồng bộ cơ sở dữ liệu Admin (Sync Users & Plans giữa File hệ thống, Local Cache và Supabase)
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
      totalUsers: number;
      totalPlans: number;
      timestamp: string;
      message: string;
    }> => {
      const serverUsers = await loadUsersFromFile();
      const serverPlans = await loadPlansFromFile();

      // Nếu client gửi kèm user cục bộ chưa có trên server, hợp nhất vào server
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
        totalUsers: serverUsers.length,
        totalPlans: serverPlans.length,
        timestamp: timeStr,
        message: `Đồng bộ thành công ${serverUsers.length} tài khoản người dùng và ${serverPlans.length} gói cước với máy chủ!`,
      };
    },
  );
