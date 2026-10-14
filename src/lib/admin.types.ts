export type UserRole = "admin" | "user";
export type AdminTier = "gold" | "silver";
export type UserStatus = "active" | "suspended";

export interface UserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar: string;
  avatarId: string;
  plan: string; // "free" | "go" | "pro" | "promax" hoặc id gói tùy chỉnh
  role: UserRole;
  adminTier?: AdminTier | undefined; // "gold" = Admin Vàng (Cấp tối cao), "silver" = Admin Bạc
  freeTrialUsed: number;
  createdAt: string;
  expiresAt: string | null;
  status: UserStatus;
  notes?: string | undefined;
}

export interface PlanItem {
  id: string;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  popular?: boolean | undefined;
  isFree?: boolean | undefined;
  durationDays: number;
  createdAt: string;
}

/* =========================================================================
   TIẾN TRÌNH CHỈNH SỬA CỦA ADMIN BẠC (AUDIT LOGS FOR GOLD ADMIN)
   ========================================================================= */
export type AuditActionType =
  | "edit_user"
  | "change_password"
  | "renew_subscription"
  | "add_user"
  | "delete_user"
  | "toggle_suspend"
  | "add_plan"
  | "delete_plan"
  | "broadcast_notification"
  | "other";

export type SerializableValue = string | number | boolean | null;

export interface AdminAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorName: string;
  actorTier: AdminTier;
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
  timestamp: string;
  createdAtIso: string;
}

/* =========================================================================
   THÔNG BÁO TỪ ADMIN GỬI CHO TẤT CẢ USER (BROADCAST NOTIFICATIONS)
   ========================================================================= */
export type NotificationType = "update" | "feature" | "promo" | "maintenance" | "general";

export interface BroadcastNotification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  badgeText?: string | undefined;
  senderName: string;
  senderEmail: string;
  senderTier: AdminTier;
  createdAt: string;
  createdAtIso: string;
  pinned?: boolean | undefined;
}

/* =========================================================================
   HELPER UTILS CHO PHÂN QUYỀN ADMIN VÀNG VÀ ADMIN BẠC
   ========================================================================= */
export function isGoldAdmin(user?: {
  role?: string | undefined;
  adminTier?: string | undefined;
  email?: string | undefined;
} | null): boolean {
  if (!user) return false;
  const email = user.email?.trim().toLowerCase() || "";
  // Chủ sở hữu tối cao
  if (email === "nguyenlocdz2k7@gmail.com" || email === "admin@aivideo.ai") return true;
  if (user.role === "admin") {
    return user.adminTier !== "silver";
  }
  return false;
}

export function isSilverAdmin(user?: {
  role?: string | undefined;
  adminTier?: string | undefined;
  email?: string | undefined;
} | null): boolean {
  if (!user) return false;
  if (isGoldAdmin(user)) return false;
  return user.role === "admin" && user.adminTier === "silver";
}

export function isAnyAdmin(user?: {
  role?: string | undefined;
  adminTier?: string | undefined;
  email?: string | undefined;
} | null): boolean {
  if (!user) return false;
  return user.role === "admin" || isGoldAdmin(user) || isSilverAdmin(user);
}

/**
 * Kiểm tra xem Actor có quyền Khóa/Mở khóa Target hay không:
 * - Không ai được tự khóa chính mình.
 * - Admin không thể khóa nhau:
 *   + Nếu Target là Admin Vàng: KHÔNG AI được khóa.
 *   + Nếu Actor là Admin Bạc: KHÔNG ĐƯỢC khóa bất kỳ Admin nào (cả Vàng lẫn Bạc khác).
 *   + Admin Vàng là cấp cao nhất: có thể khóa User và có thể vô hiệu hóa Admin Bạc vi phạm nếu cần, nhưng không khóa Admin Vàng khác.
 */
export function canLockTargetUser(
  actor?: { role?: string | undefined; adminTier?: string | undefined; email?: string | undefined } | null,
  target?: { role?: string | undefined; adminTier?: string | undefined; email?: string | undefined } | null,
): { allowed: boolean; reason?: string | undefined } {
  if (!actor || !target) return { allowed: false, reason: "Thiếu thông tin người thực hiện." };

  const actorEmail = actor.email?.trim().toLowerCase() || "";
  const targetEmail = target.email?.trim().toLowerCase() || "";

  if (actorEmail === targetEmail) {
    return { allowed: false, reason: "Bạn không thể tự khóa tài khoản của chính mình!" };
  }

  const targetIsGold = isGoldAdmin(target);
  const targetIsSilver = isSilverAdmin(target);
  const targetIsAdmin = targetIsGold || targetIsSilver || target.role === "admin";

  const actorIsGold = isGoldAdmin(actor);
  const actorIsSilver = isSilverAdmin(actor);

  if (targetIsGold) {
    return {
      allowed: false,
      reason: "Không thể khóa tài khoản Admin Vàng (Cấp tối cao)!",
    };
  }

  if (actorIsSilver) {
    if (targetIsAdmin) {
      return {
        allowed: false,
        reason: "Admin Bạc không có quyền khóa tài khoản Quản trị viên (Admin không thể khóa nhau)!",
      };
    }
  }

  if (actorIsGold) {
    return { allowed: true };
  }

  if (actor.role !== "admin") {
    return { allowed: false, reason: "Chỉ Quản trị viên mới có quyền khóa tài khoản!" };
  }

  return { allowed: true };
}
