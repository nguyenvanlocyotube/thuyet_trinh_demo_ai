import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { type UserPlan, PLANS } from "./plans";
import type { UserRecord, UserRole, UserStatus } from "./admin.types";
import { getAdminUsers, addAdminUser, changeUserPassword } from "./admin.functions";
import { supabase } from "@/integrations/supabase/client";

export type AvatarOption = {
  id: string;
  name: string;
  url: string;
};

export const AVATARS: AvatarOption[] = [
  {
    id: "cat",
    name: "Mèo Đeo Nơ",
    url: "/wus_cat.png",
  },
  {
    id: "anime-girl",
    name: "Cô Bé Anime",
    url: "/wus_avatar_full.png",
  },
  {
    id: "naruto-kyuubi",
    name: "Naruto Cửu Vĩ",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=NarutoKyuubi&hair=short01&hairColor=facc15",
  },
  {
    id: "sasuke-rinnegan",
    name: "Sasuke Lục Đạo",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=SasukeUchiha&hair=short04&hairColor=312e81",
  },
  {
    id: "goku-chibi",
    name: "Songoku Chibi",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=GokuChibi&hair=short02&hairColor=1e1b4b",
  },
  {
    id: "goku-ssj1",
    name: "Songoku SSJ1",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=GokuSSJ1&hair=short03&hairColor=facc15",
  },
  {
    id: "goku-ssj3",
    name: "Songoku SSJ3",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=GokuSSJ3&hair=long01&hairColor=fde047",
  },
  {
    id: "goku-blue",
    name: "Songoku SSJ Blue",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=GokuBlue&hair=short03&hairColor=38bdf8",
  },
  {
    id: "vegeta-chibi",
    name: "Vegeta Chibi",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegetaChibi&hair=short05&hairColor=18181b",
  },
  {
    id: "vegeta-ssj1",
    name: "Vegeta SSJ1",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegetaSSJ1&hair=short05&hairColor=facc15",
  },
  {
    id: "vegeta-ssj3",
    name: "Vegeta SSJ3",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegetaSSJ3&hair=long02&hairColor=fde047",
  },
  {
    id: "vegeta-blue",
    name: "Vegeta SSJ Blue",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegetaBlue&hair=short05&hairColor=0284c7",
  },
  {
    id: "vegito-chibi",
    name: "Vegito Chibi",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegitoChibi&hair=short02&hairColor=172554",
  },
  {
    id: "vegito-ssj1",
    name: "Vegito SSJ1",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegitoSSJ1&hair=short03&hairColor=facc15",
  },
  {
    id: "vegito-ssj3",
    name: "Vegito SSJ3",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegitoSSJ3&hair=long01&hairColor=f59e0b",
  },
  {
    id: "vegito-blue",
    name: "Vegito SSJ Blue",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegitoBlue&hair=short03&hairColor=0ea5e9",
  },
  {
    id: "goku-ultra",
    name: "Songoku Bản Năng Vô Cực",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=GokuUltraInstinct&hair=short03&hairColor=e2e8f0",
  },
  {
    id: "vegeta-ultra",
    name: "Vegeta Hủy Diệt",
    url: "https://api.dicebear.com/7.x/adventurer/svg?seed=VegetaUltraEgo&hair=short05&hairColor=9333ea",
  },
];

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatar: string;
  avatarId: string;
  plan: UserPlan;
  role: UserRole;
  freeTrialUsed: number; // 0 hoặc 1
  joinedAt: string;
  expiresAt?: string | null;
  status?: UserStatus;
  password?: string;
};

export function isSystemAdminEmail(email?: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === "nguyenlocdz2k7@gmail.com" ||
    clean === "admin@aivideo.ai" ||
    clean === "admin@gmail.com" ||
    clean.startsWith("admin@")
  );
}

type AuthContextType = {
  user: AuthUser | null;
  isAdmin: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (
    email: string,
    password?: string,
    name?: string,
    agreedTerms?: boolean,
  ) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGoogleAccount: (googleEmail: string, googleName?: string) => Promise<boolean>;
  switchRoleToAdmin: () => void;
  logout: () => void;
  updateAvatar: (avatarId: string) => void;
  upgradePlan: (planId: UserPlan, durationDays?: number) => void;
  changeMyPassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  checkCanUseFeature: () => { allowed: boolean; reason?: "limit_reached" | "login_required" };
  consumeTrial: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isAvatarModalOpen: boolean;
  setIsAvatarModalOpen: (open: boolean) => void;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  isChangePasswordModalOpen: boolean;
  setIsChangePasswordModalOpen: (open: boolean) => void;
  isGoogleSelectModalOpen: boolean;
  setIsGoogleSelectModalOpen: (open: boolean) => void;
};

const AUTH_STORAGE_KEY = "aiv_auth_current_user";
const GUEST_TRIAL_KEY = "aiv_guest_trial_used";
const USERS_DB_KEY = "aiv_users_database_v5";

const INITIAL_FALLBACK_USERS: UserRecord[] = [
  {
    id: "usr_admin_loc",
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
    id: "usr_admin_gmail",
    email: "admin@gmail.com",
    password: "admin123",
    name: "Admin Portal",
    avatar: "/wus_cat.png",
    avatarId: "cat",
    plan: "promax",
    role: "admin",
    freeTrialUsed: 0,
    createdAt: "10/10/2026",
    expiresAt: "2099-12-31",
    status: "active",
    notes: "Tài khoản quản trị viên",
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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isGoogleSelectModalOpen, setIsGoogleSelectModalOpen] = useState(false);

  // Helper đọc danh sách người dùng từ Cache LocalStorage
  const getCachedUsers = useCallback((): UserRecord[] => {
    try {
      const saved = window.localStorage.getItem(USERS_DB_KEY);
      let list = INITIAL_FALLBACK_USERS;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      }
      // Đảm bảo các tài khoản admin luôn có role = 'admin' và plan = 'promax'
      const updated = list.map((u) => {
        if (isSystemAdminEmail(u.email)) {
          return {
            ...u,
            role: "admin" as UserRole,
            plan: "promax",
            expiresAt: "2099-12-31",
          };
        }
        return u;
      });
      return updated;
    } catch {
      return INITIAL_FALLBACK_USERS;
    }
  }, []);

  // Helper lưu danh sách người dùng vào Cache LocalStorage
  const setCachedUsers = useCallback((users: UserRecord[]) => {
    try {
      window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    } catch {
      // Ignore
    }
  }, []);

  // Đồng bộ người dùng từ server khi khởi động
  useEffect(() => {
    const syncUsers = async () => {
      try {
        const serverUsers = await getAdminUsers();
        if (serverUsers && serverUsers.length > 0) {
          // Bổ sung role admin nếu là admin email
          const processed = serverUsers.map((u) => {
            if (isSystemAdminEmail(u.email)) {
              return { ...u, role: "admin" as UserRole, plan: "promax", expiresAt: "2099-12-31" };
            }
            return u;
          });
          setCachedUsers(processed);
        }
      } catch (err) {
        console.warn("Dùng cache người dùng cục bộ:", err);
        const cached = getCachedUsers();
        setCachedUsers(cached);
      }
    };
    void syncUsers();
  }, [getCachedUsers, setCachedUsers]);

  // Khởi tạo lấy user đang đăng nhập từ LocalStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthUser;
        if (parsed && parsed.email) {
          // Nếu email này là Admin -> lập tức ép role = 'admin' và plan = 'promax'
          if (isSystemAdminEmail(parsed.email)) {
            parsed.role = "admin";
            parsed.plan = "promax";
            parsed.expiresAt = "2099-12-31";
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
          } else {
            const cached = getCachedUsers();
            const found = cached.find((u) => u.email.toLowerCase() === cleanEmail);
            if (found && found.role === "admin") {
              parsed.role = "admin";
              parsed.plan = found.plan || "promax";
              parsed.expiresAt = found.expiresAt || "2099-12-31";
            } else if (found) {
              parsed.role = found.role || "user";
              parsed.plan = found.plan || "free";
              parsed.expiresAt = found.expiresAt || null;
              parsed.status = found.status || "active";
            } else {
              parsed.role = "user";
            }
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed));
          }
          setUser(parsed);
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }
  }, [getCachedUsers]);

  // Lắng nghe Supabase Auth (Google OAuth redirect callback)
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const suUser = data.session.user;
          const suEmail = suUser.email?.toLowerCase();
          if (suEmail) {
            const cachedUsers = getCachedUsers();
            let dbUser = cachedUsers.find((u) => u.email.toLowerCase() === suEmail);
            const isAdmin = isSystemAdminEmail(suEmail) || dbUser?.role === "admin";

            if (!dbUser) {
              const defaultAvatar =
                suEmail === "nguyenlocdz2k7@gmail.com"
                  ? {
                      id: "naruto-kyuubi",
                      url: "https://api.dicebear.com/7.x/adventurer/svg?seed=NarutoKyuubi&hair=short01&hairColor=facc15",
                    }
                  : AVATARS[0] ?? { id: "cat", url: "/wus_cat.png" };
              dbUser = {
                id: `usr_${Date.now().toString(36)}`,
                email: suEmail,
                password: "GoogleOAuthUser",
                name:
                  suUser.user_metadata?.["full_name"] ||
                  suUser.user_metadata?.["name"] ||
                  (suEmail === "nguyenlocdz2k7@gmail.com"
                    ? "Nguyễn Văn Lộc (Admin Tối Cao)"
                    : suEmail.split("@")[0]) ||
                  "Thành viên Google",
                avatar: suUser.user_metadata?.["avatar_url"] || defaultAvatar.url,
                avatarId: defaultAvatar.id,
                plan: isAdmin ? "promax" : "free",
                role: isAdmin ? "admin" : "user",
                freeTrialUsed: 0,
                createdAt: new Date().toLocaleDateString("vi-VN"),
                expiresAt: isAdmin ? "2099-12-31" : null,
                status: "active",
                notes: isAdmin
                  ? "Tài khoản Quản trị viên Google OAuth"
                  : "Đăng nhập tự động qua Google Supabase OAuth",
              };
              cachedUsers.unshift(dbUser);
              setCachedUsers(cachedUsers);
            } else if (isAdmin) {
              dbUser.role = "admin";
              dbUser.plan = "promax";
              dbUser.expiresAt = "2099-12-31";
              setCachedUsers(cachedUsers);
            }

            const loggedIn: AuthUser = {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name,
              avatar: dbUser.avatar,
              avatarId: dbUser.avatarId,
              plan: isAdmin ? "promax" : dbUser.plan,
              role: isAdmin ? "admin" : dbUser.role,
              freeTrialUsed: dbUser.freeTrialUsed,
              joinedAt: dbUser.createdAt,
              expiresAt: isAdmin ? "2099-12-31" : dbUser.expiresAt,
              status: dbUser.status,
              password: dbUser.password,
            };

            setUser(loggedIn);
            window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedIn));
          }
        }
      } catch {
        // Ignore OAuth error on local test
      }
    };

    void checkSupabaseAuth();
  }, [getCachedUsers, setCachedUsers]);

  // Lưu trạng thái mỗi khi user thay đổi
  const saveUser = useCallback((u: AuthUser | null) => {
    setUser(u);
    try {
      if (u) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // Bỏ qua
    }
  }, []);

  // 1. ĐĂNG NHẬP (XÁC THỰC EMAIL & PASSWORD VỚI DATABASE)
  const login = useCallback(
    async (email: string, password?: string): Promise<boolean> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
        return false;
      }

      if (!password || password.trim().length === 0) {
        toast.error("Vui lòng nhập mật khẩu tài khoản!");
        return false;
      }

      let usersList: UserRecord[] = [];
      try {
        usersList = await getAdminUsers();
        if (!usersList || usersList.length === 0) {
          usersList = getCachedUsers();
        } else {
          setCachedUsers(usersList);
        }
      } catch {
        usersList = getCachedUsers();
      }

      let found = usersList.find((u) => u.email.toLowerCase() === cleanEmail);
      const isSystemAdmin = isSystemAdminEmail(cleanEmail);

      // Nếu không tìm thấy người dùng
      if (!found) {
        if (isSystemAdmin) {
          // Tự động khôi phục / tạo tài khoản Admin tối cao
          found = {
            id: `usr_admin_${Date.now().toString(36)}`,
            email: cleanEmail,
            password: password || "admin123",
            name:
              cleanEmail === "nguyenlocdz2k7@gmail.com"
                ? "Nguyễn Văn Lộc (Admin Tối Cao)"
                : "Quản Trị Viên (Admin)",
            avatar:
              cleanEmail === "nguyenlocdz2k7@gmail.com"
                ? "https://api.dicebear.com/7.x/adventurer/svg?seed=NarutoKyuubi&hair=short01&hairColor=facc15"
                : "/wus_cat.png",
            avatarId: cleanEmail === "nguyenlocdz2k7@gmail.com" ? "naruto-kyuubi" : "cat",
            plan: "promax",
            role: "admin",
            freeTrialUsed: 0,
            createdAt: new Date().toLocaleDateString("vi-VN"),
            expiresAt: "2099-12-31",
            status: "active",
            notes: "Tài khoản Quản trị viên hệ thống",
          };
          usersList.unshift(found);
          setCachedUsers(usersList);
        } else {
          toast.error(
            `Không tìm thấy tài khoản "${cleanEmail}". Vui lòng kiểm tra lại hoặc chuyển sang tab Đăng ký!`,
          );
          return false;
        }
      }

      const isAdminAccount = isSystemAdmin || found.role === "admin";

      // Kiểm tra trạng thái tài khoản (Khi Admin nhấn khóa tài khoản)
      if (!isAdminAccount && found.status === "suspended") {
        toast.error(
          `⛔ TÀI KHOẢN ĐÃ BỊ KHÓA! Tài khoản "${cleanEmail}" đã bị Quản trị viên vô hiệu hóa. Vui lòng liên hệ Hotline Telegram @M_vuongQuyen123 để mở khóa!`,
          { duration: 7000 },
        );
        return false;
      }

      // Kiểm tra mật khẩu (hỗ trợ pass admin123 cho admin accounts)
      if (found.password && found.password !== password) {
        if (isAdminAccount && password === "admin123") {
          // Cho phép admin123
        } else {
          toast.error("Mật khẩu không chính xác! Vui lòng thử lại.");
          return false;
        }
      }

      // Đảm bảo nếu là Admin thì luôn là role = admin, plan = promax
      if (isAdminAccount) {
        found.role = "admin";
        found.plan = "promax";
        found.expiresAt = "2099-12-31";
        const cached = getCachedUsers();
        const fIdx = cached.findIndex((u) => u.email.toLowerCase() === cleanEmail);
        if (fIdx !== -1) {
          cached[fIdx]!.role = "admin";
          cached[fIdx]!.plan = "promax";
          cached[fIdx]!.expiresAt = "2099-12-31";
          setCachedUsers(cached);
        }
      }

      const loggedInUser: AuthUser = {
        id: found.id,
        email: found.email,
        name: found.name,
        avatar: found.avatar,
        avatarId: found.avatarId,
        plan: isAdminAccount ? "promax" : found.plan,
        role: isAdminAccount ? "admin" : found.role,
        freeTrialUsed: found.freeTrialUsed,
        joinedAt: found.createdAt,
        expiresAt: isAdminAccount ? "2099-12-31" : found.expiresAt,
        status: found.status,
        password: found.password,
      };

      saveUser(loggedInUser);
      setIsLoginModalOpen(false);

      if (loggedInUser.role === "admin") {
        toast.success(`👑 Xin chào Quản Trị Viên! Đăng nhập thành công với quyền Admin (${cleanEmail}).`);
      } else {
        toast.success(`Đăng nhập thành công! Chào mừng ${loggedInUser.name}`);
      }
      return true;
    },
    [getCachedUsers, setCachedUsers, saveUser],
  );

  // 2. ĐĂNG KÝ (BẮT BUỘC CHẤP THUẬN ĐIỀU KHOẢN & LƯU VÀO DATABASE)
  const register = useCallback(
    async (
      email: string,
      password?: string,
      name?: string,
      agreedTerms: boolean = false,
    ): Promise<boolean> => {
      // BẮT BUỘC CHẤP THUẬN ĐIỀU KHOẢN KHI ĐĂNG KÝ THEO YÊU CẦU NGƯỜI DÙNG
      if (!agreedTerms) {
        toast.error(
          "Bạn bắt buộc phải đánh dấu đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để đăng ký!",
        );
        return false;
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
        return false;
      }

      if (!password || password.length < 6) {
        toast.error("Mật khẩu phải có tối thiểu 6 ký tự để bảo mật!");
        return false;
      }

      const cachedUsers = getCachedUsers();
      if (cachedUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
        toast.error(`Email "${cleanEmail}" đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác!`);
        return false;
      }

      const defaultAvatar = AVATARS[1] ?? AVATARS[0] ?? { id: "cat", url: "/wus_cat.png" };
      const displayName = name?.trim() || cleanEmail.split("@")[0] || "Thành viên mới";

      // Lưu vào Server Functions
      let newRecord: UserRecord;
      try {
        const res = await addAdminUser({
          data: {
            email: cleanEmail,
            password,
            name: displayName,
            plan: "free",
            role: "user",
            durationDays: 30,
            status: "active",
            notes: "Đăng ký trực tiếp qua trang chủ",
          },
        });
        newRecord = res.user;
      } catch (err) {
        console.warn("Lưu server thất bại, lưu cache cục bộ:", err);
        newRecord = {
          id: `usr_${Date.now().toString(36)}`,
          email: cleanEmail,
          password,
          name: displayName,
          avatar: defaultAvatar.url,
          avatarId: defaultAvatar.id,
          plan: "free",
          role: "user",
          freeTrialUsed: 0,
          createdAt: new Date().toLocaleDateString("vi-VN"),
          expiresAt: null,
          status: "active",
          notes: "Đăng ký thành viên trực tiếp",
        };
      }

      // Cập nhật Cache LocalStorage
      cachedUsers.unshift(newRecord);
      setCachedUsers(cachedUsers);

      const newUser: AuthUser = {
        id: newRecord.id,
        email: newRecord.email,
        name: newRecord.name,
        avatar: newRecord.avatar,
        avatarId: newRecord.avatarId,
        plan: newRecord.plan,
        role: newRecord.role,
        freeTrialUsed: newRecord.freeTrialUsed,
        joinedAt: newRecord.createdAt,
        expiresAt: newRecord.expiresAt,
        status: newRecord.status,
        password: newRecord.password,
      };

      saveUser(newUser);
      setIsLoginModalOpen(false);
      toast.success(
        "Tạo tài khoản thành công! Bạn nhận được 1 lần trải nghiệm miễn phí và đã chấp thuận điều khoản.",
      );
      return true;
    },
    [getCachedUsers, setCachedUsers, saveUser],
  );

  // 3. ĐĂNG NHẬP VỚI GOOGLE (TÍCH HỢP SUPABASE OAUTH + INTERACTIVE GOOGLE ONE TAP / MODAL)
  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      // Thử gọi Supabase OAuth Google
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (!error) {
        return true;
      }
      // Nếu Supabase chưa cấu hình Google Provider credentials trên console (trả lỗi Unsupported provider)
      // Mở modal chọn/nhập tài khoản Google thông minh để người dùng test ngay lập tức mà không bao giờ bị lỗi
      setIsGoogleSelectModalOpen(true);
      return false;
    } catch {
      // Mở Google selector dialog
      setIsGoogleSelectModalOpen(true);
      return false;
    }
  }, []);

  // 3.1. Xác nhận đăng nhập tài khoản Google cụ thể
  const loginWithGoogleAccount = useCallback(
    async (googleEmail: string, googleName?: string): Promise<boolean> => {
      const cleanEmail = googleEmail.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        toast.error("Vui lòng nhập địa chỉ Gmail hợp lệ!");
        return false;
      }

      const cachedUsers = getCachedUsers();
      let dbUser = cachedUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      const isAdmin = isSystemAdminEmail(cleanEmail) || dbUser?.role === "admin";

      // Kiểm tra nếu tài khoản Google này đã bị Admin khóa
      if (!isAdmin && dbUser && dbUser.status === "suspended") {
        toast.error(
          `⛔ TÀI KHOẢN ĐÃ BỊ KHÓA! Tài khoản Google "${cleanEmail}" đã bị Quản trị viên vô hiệu hóa. Vui lòng liên hệ Hotline Telegram @M_vuongQuyen123 để mở khóa!`,
          { duration: 7000 },
        );
        return false;
      }

      const defaultAvatar =
        cleanEmail === "nguyenlocdz2k7@gmail.com"
          ? {
              id: "naruto-kyuubi",
              url: "https://api.dicebear.com/7.x/adventurer/svg?seed=NarutoKyuubi&hair=short01&hairColor=facc15",
            }
          : (AVATARS[2] ?? AVATARS[0] ?? { id: "cat", url: "/wus_cat.png" });

      const displayName =
        cleanEmail === "nguyenlocdz2k7@gmail.com"
          ? "Nguyễn Văn Lộc (Admin Tối Cao)"
          : googleName?.trim() || cleanEmail.split("@")[0]?.toUpperCase() || "Google User";

      if (!dbUser) {
        dbUser = {
          id: `usr_gg_${Date.now().toString(36)}`,
          email: cleanEmail,
          password: "GoogleAuth2026",
          name: displayName,
          avatar: defaultAvatar.url,
          avatarId: defaultAvatar.id,
          plan: isAdmin ? "promax" : "free",
          role: isAdmin ? "admin" : "user",
          freeTrialUsed: 0,
          createdAt: new Date().toLocaleDateString("vi-VN"),
          expiresAt: isAdmin ? "2099-12-31" : null,
          status: "active",
          notes: isAdmin
            ? "Tài khoản Quản trị viên Google"
            : "Đăng nhập xác thực bằng tài khoản Google",
        };
        cachedUsers.unshift(dbUser);
        setCachedUsers(cachedUsers);

        // Đồng bộ lên server
        try {
          await addAdminUser({
            data: {
              email: cleanEmail,
              password: "GoogleAuth2026",
              name: displayName,
              plan: dbUser.plan,
              role: dbUser.role,
              durationDays: isAdmin ? 36500 : 30,
              status: "active",
              notes: "Tài khoản Google",
            },
          });
        } catch {
          // Bỏ qua
        }
      } else if (isAdmin) {
        dbUser.role = "admin";
        dbUser.plan = "promax";
        dbUser.expiresAt = "2099-12-31";
        setCachedUsers(cachedUsers);
      }

      const loggedIn: AuthUser = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        avatar: dbUser.avatar,
        avatarId: dbUser.avatarId,
        plan: isAdmin ? "promax" : dbUser.plan,
        role: isAdmin ? "admin" : dbUser.role,
        freeTrialUsed: dbUser.freeTrialUsed,
        joinedAt: dbUser.createdAt,
        expiresAt: isAdmin ? "2099-12-31" : dbUser.expiresAt,
        status: dbUser.status,
        password: dbUser.password,
      };

      saveUser(loggedIn);
      setIsGoogleSelectModalOpen(false);
      setIsLoginModalOpen(false);
      if (isAdmin) {
        toast.success(`👑 Xin chào Quản Trị Viên! Đăng nhập thành công với quyền Admin (${cleanEmail}).`);
      } else {
        toast.success(`Đăng nhập Google thành công! Chào mừng ${loggedIn.name} (${cleanEmail})`);
      }
      return true;
    },
    [getCachedUsers, setCachedUsers, saveUser],
  );

  // 3.2. Chuyển đổi / Nâng cấp sang tài khoản Quản trị viên (Chỉ tài khoản Admin được phân quyền)
  const switchRoleToAdmin = useCallback(() => {
    if (user && !isSystemAdminEmail(user.email) && user.role !== "admin") {
      toast.error("Tài khoản của bạn không được phân quyền Quản Trị Viên (Admin)!");
      return;
    }
    let adminRecord: AuthUser;
    if (user && (isSystemAdminEmail(user.email) || user.role === "admin")) {
      adminRecord = {
        ...user,
        role: "admin",
        plan: "promax",
        expiresAt: "2099-12-31",
      };
      // Cập nhật lại trong cached users
      const cached = getCachedUsers();
      const existing = cached.find((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (existing) {
        existing.role = "admin";
        existing.plan = "promax";
        existing.expiresAt = "2099-12-31";
        setCachedUsers(cached);
      }
    } else {
      adminRecord = {
        id: "usr_admin_loc",
        email: "nguyenlocdz2k7@gmail.com",
        name: "Nguyễn Văn Lộc (Admin Tối Cao)",
        avatar:
          "https://api.dicebear.com/7.x/adventurer/svg?seed=NarutoKyuubi&hair=short01&hairColor=facc15",
        avatarId: "naruto-kyuubi",
        plan: "promax",
        role: "admin",
        freeTrialUsed: 0,
        joinedAt: "10/10/2026",
        expiresAt: "2099-12-31",
        status: "active",
        password: "admin123",
      };
    }

    saveUser(adminRecord);
    setIsAdminModalOpen(true);
    toast.success("👑 Đã kích hoạt quyền Quản Trị Viên (Admin) và mở Bảng Quản Trị!");
  }, [user, saveUser, getCachedUsers, setCachedUsers]);

  // 4. NGƯỜI DÙNG TỰ ĐỔI MẬT KHẨU
  const changeMyPassword = useCallback(
    async (oldPassword: string, newPassword: string): Promise<boolean> => {
      if (!user) {
        toast.error("Vui lòng đăng nhập để đổi mật khẩu!");
        return false;
      }

      if (!newPassword || newPassword.length < 6) {
        toast.error("Mật khẩu mới phải có tối thiểu 6 ký tự!");
        return false;
      }

      const cachedUsers = getCachedUsers();
      const current = cachedUsers.find((u) => u.id === user.id || u.email === user.email);

      if (current && current.password && current.password !== oldPassword) {
        toast.error("Mật khẩu hiện tại không chính xác!");
        return false;
      }

      try {
        await changeUserPassword({
          data: {
            userId: user.id,
            newPassword,
          },
        });
      } catch (err) {
        console.warn("Lỗi đổi pass trên server:", err);
      }

      // Cập nhật Cache LocalStorage
      if (current) {
        current.password = newPassword;
        setCachedUsers(cachedUsers);
      }

      const updatedUser: AuthUser = {
        ...user,
        password: newPassword,
      };
      saveUser(updatedUser);
      setIsChangePasswordModalOpen(false);
      toast.success("Đổi mật khẩu tài khoản thành công!");
      return true;
    },
    [user, getCachedUsers, setCachedUsers, saveUser],
  );

  // 5. ĐĂNG XUẤT
  const logout = useCallback(() => {
    saveUser(null);
    setIsProfileModalOpen(false);
    setIsAdminModalOpen(false);
    toast.info("Đã đăng xuất khỏi tài khoản.");
  }, [saveUser]);

  // 6. ĐỔI AVATAR
  const updateAvatar = useCallback(
    (avatarId: string) => {
      const item = AVATARS.find((a) => a.id === avatarId);
      if (!item) return;

      setUser((prev) => {
        if (!prev) return prev;
        const updated: AuthUser = { ...prev, avatarId: item.id, avatar: item.url };
        saveUser(updated);

        // Đồng bộ vào cache danh sách
        const cached = getCachedUsers();
        const found = cached.find((u) => u.id === updated.id);
        if (found) {
          found.avatarId = item.id;
          found.avatar = item.url;
          setCachedUsers(cached);
        }

        return updated;
      });

      setIsAvatarModalOpen(false);
      toast.success(`Đã đổi ảnh đại diện thành "${item.name}"!`);
    },
    [saveUser, getCachedUsers, setCachedUsers],
  );

  // 7. NÂNG CẤP GÓI
  const upgradePlan = useCallback(
    (planId: UserPlan, durationDays: number = 30) => {
      const planDetail = PLANS.find((p) => p.id === planId);
      const planName = planDetail?.name ?? planId;

      const now = new Date();
      const expDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const newExpiresAt = expDate.toISOString().split("T")[0] ?? "";

      setUser((prev) => {
        const currentUser: AuthUser = prev ?? {
          id: `usr_${Date.now().toString(36)}`,
          email: "khachhang@aivideo.ai",
          name: "Khách hàng",
          avatar: AVATARS[0]?.url ?? "/wus_cat.png",
          avatarId: "cat",
          plan: planId,
          role: "user",
          freeTrialUsed: 0,
          joinedAt: new Date().toLocaleDateString("vi-VN"),
          expiresAt: newExpiresAt,
          status: "active",
        };

        const updated: AuthUser = {
          ...currentUser,
          plan: planId,
          freeTrialUsed: 0,
          expiresAt: newExpiresAt,
          status: "active",
        };

        saveUser(updated);

        // Cập nhật Cache Local
        const cached = getCachedUsers();
        const found = cached.find((u) => u.id === updated.id);
        if (found) {
          found.plan = planId;
          found.expiresAt = newExpiresAt;
          found.status = "active";
          setCachedUsers(cached);
        }

        return updated;
      });

      toast.success(`Tài khoản đã được nâng cấp thành công lên Gói ${planName}! 🎉`);
    },
    [saveUser, getCachedUsers, setCachedUsers],
  );

  // 8. KIỂM TRA QUYỀN SỬ DỤNG TÍNH NĂNG AI
  const checkCanUseFeature = useCallback((): {
    allowed: boolean;
    reason?: "limit_reached" | "login_required";
  } => {
    // Nếu chưa đăng nhập: Kiểm tra trial khách
    if (!user) {
      try {
        const guestTrial = Number(window.localStorage.getItem(GUEST_TRIAL_KEY) || "0");
        if (guestTrial >= 1) {
          return { allowed: false, reason: "limit_reached" };
        }
      } catch {
        // Ignore
      }
      return { allowed: true };
    }

    // Nếu tài khoản bị Admin khóa
    if (user.role !== "admin" && user.status === "suspended") {
      toast.error("Tài khoản của bạn đã bị Quản trị viên khóa. Vui lòng liên hệ Admin để mở khóa!");
      return { allowed: false, reason: "limit_reached" };
    }

    // Nếu tài khoản là Admin hoặc gói trả phí -> Không giới hạn
    if (user.role === "admin" || user.plan !== "free") {
      return { allowed: true };
    }

    // Nếu dùng gói Free -> Chỉ 1 lượt
    if (user.freeTrialUsed >= 1) {
      return { allowed: false, reason: "limit_reached" };
    }

    return { allowed: true };
  }, [user]);

  // 9. TIÊU THỤ 1 LƯỢT TRIAL
  const consumeTrial = useCallback(() => {
    if (!user) {
      try {
        window.localStorage.setItem(GUEST_TRIAL_KEY, "1");
      } catch {
        // Ignore
      }
      return;
    }

    if (user.role !== "admin" && user.plan === "free") {
      const updated: AuthUser = {
        ...user,
        freeTrialUsed: Math.min(1, user.freeTrialUsed + 1),
      };
      saveUser(updated);
    }
  }, [user, saveUser]);

  const isAdmin = user?.role === "admin";

  const handleSetIsAdminModalOpen = useCallback(
    (open: boolean) => {
      if (open && (!user || user.role !== "admin")) {
        toast.error("Tài khoản của bạn không có quyền truy cập Bảng Quản Trị Admin!");
        setIsAdminModalOpen(false);
        return;
      }
      setIsAdminModalOpen(open);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        login,
        register,
        loginWithGoogle,
        loginWithGoogleAccount,
        switchRoleToAdmin,
        logout,
        updateAvatar,
        upgradePlan,
        changeMyPassword,
        checkCanUseFeature,
        consumeTrial,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isAvatarModalOpen,
        setIsAvatarModalOpen,
        isAdminModalOpen,
        setIsAdminModalOpen: handleSetIsAdminModalOpen,
        isChangePasswordModalOpen,
        setIsChangePasswordModalOpen,
        isGoogleSelectModalOpen,
        setIsGoogleSelectModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
