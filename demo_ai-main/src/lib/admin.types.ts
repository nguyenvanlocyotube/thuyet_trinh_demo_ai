export type UserRole = "admin" | "user";
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
  freeTrialUsed: number;
  createdAt: string;
  expiresAt: string | null;
  status: UserStatus;
  notes?: string;
}

export interface PlanItem {
  id: string;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  popular?: boolean;
  isFree?: boolean;
  durationDays: number;
  createdAt: string;
}
