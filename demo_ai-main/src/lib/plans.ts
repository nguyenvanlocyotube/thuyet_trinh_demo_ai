export type PaidPlanId = "go" | "pro" | "promax";
export type PlanId = "free" | PaidPlanId;
export type UserPlan = string;

export type Plan = {
  id: PlanId;
  name: string;
  price: number; // 0 cho gói free
  tagline: string;
  features: string[];
  popular?: boolean;
  isFree?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "Cho người mới bắt đầu trải nghiệm",
    isFree: true,
    features: [
      "1 lượt trải nghiệm AI miễn phí",
      "Thị giác AI phân tích & OCR tiếng Việt",
      "Phiên âm giọng nói bằng Whisper Turbo",
      "Độ phân giải & tốc độ xử lý tiêu chuẩn",
      "Lưu kết quả tạm thời",
    ],
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
  },
];

export const PAID_PLAN_IDS: PaidPlanId[] = ["go", "pro", "promax"];
export const PLAN_IDS = PAID_PLAN_IDS as [PaidPlanId, ...PaidPlanId[]];
export const vnd = (n: number) => (n === 0 ? "0đ" : `${n.toLocaleString("vi-VN")}đ`);
