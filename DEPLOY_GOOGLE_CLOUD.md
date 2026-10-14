# 🚀 HƯỚNG DẪN TRIỂN KHAI GOOGLE CLOUD: CHẠY 24/24 & LƯU TRỮ DỮ LIỆU VĨNH VIỄN

Tài liệu này hướng dẫn chi tiết cách thiết lập nền tảng **AI Vision & Speech Studio** trên **Google Cloud Run** để:
1. **Lưu trữ dữ liệu người dùng vĩnh viễn trên Google Cloud** (không bao giờ mất dữ liệu khi restart hoặc deploy bản mới).
2. **Chạy liên tục 24/24 (Always-On 24/7)** (không ngủ, không gián đoạn, 0 cold start).
3. **Tự động cập nhật thời gian thực (Real-time Live Auto-Update)** ngay khi có dữ liệu mới (thông báo mới, Admin Bạc thao tác, nâng cấp/khóa tài khoản).

---

## 🏗️ 1. LƯU TRỮ DỮ LIỆU NGƯỜI DÙNG VĨNH VIỄN TRÊN GOOGLE CLOUD

Mặc định, container trên Cloud Run có ổ cứng tạm thời (ephemeral filesystem). Để lưu trữ vĩnh viễn toàn bộ tài khoản người dùng (`users_db.json`), nhật ký tiến trình của Admin Bạc (`admin_audit_logs.json`), thông báo phát sóng (`notifications_db.json`) và gói cước (`plans_db.json`), ta sử dụng tính năng **Google Cloud Storage (GCS) Volume Mount (Cloud Storage FUSE)** chuẩn của Google Cloud Run.

### 🌟 Cách Thực Hiện Qua Giao Diện Web (Google Cloud Console):
1. Vào [Google Cloud Storage Console](https://console.cloud.google.com/storage) -> Nhấn **Create Bucket**.
   - Đặt tên bucket: ví dụ `ai-pricing-user-data` (tên phải là duy nhất).
   - Chọn Region: `asia-southeast1 (Singapore)` (cùng khu vực với Cloud Run).
   - Nhấn **Create**.
2. Vào [Google Cloud Run Console](https://console.cloud.google.com/run) -> Chọn dịch vụ của bạn -> Nhấn **Edit & Deploy New Revision**.
3. Cuộn xuống mục **Volumes** -> Bấm **Add Volume**:
   - **Volume Type**: Chọn **Cloud Storage bucket**.
   - **Volume Name**: Đặt là `user-data-volume`.
   - **Bucket**: Chọn bucket `ai-pricing-user-data` vừa tạo ở bước 1.
4. Chuyển sang mục **Container** -> Tab **Volume Mounts** -> Bấm **Add Volume Mount**:
   - Chọn Volume: `user-data-volume`.
   - **Mount Path**: Điền chính xác `/app/data`.
5. Bấm **Deploy**.
   👉 **Kể từ lúc này, mọi file JSON trong thư mục `/app/data` được lưu trực tiếp lên Google Cloud Storage. Dữ liệu sẽ tồn tại vĩnh viễn, an toàn 100% ngay cả khi nâng cấp hoặc khởi động lại container.**

### 💻 Cách Thực Hiện Bằng Lệnh `gcloud CLI`:
```bash
# 1. Tạo GCS Bucket lưu trữ
gcloud storage buckets create gs://ai-pricing-user-data --location=asia-southeast1

# 2. Deploy lên Cloud Run kèm Volume Mount vào /app/data
gcloud run deploy ai-pricing-platform \
  --image gcr.io/YOUR_PROJECT_ID/ai-pricing-platform:latest \
  --region asia-southeast1 \
  --add-volume name=user-data-vol,type=cloud-storage,bucket=ai-pricing-user-data \
  --add-volume-mount volume=user-data-vol,mount-path=/app/data
```

---

## ⚡ 2. CẤU HÌNH GOOGLE CLOUD CHẠY LIÊN TỤC 24/24 (ALWAYS-ON 24/7)

Mặc định, Cloud Run có cơ chế `min-instances=0` (sẽ tắt container khi không có người dùng truy cập sau vài phút để tiết kiệm chi phí). Khi có người truy cập lại, sẽ mất 2-4 giây để khởi động (Cold Start).

Để đảm bảo hệ thống **luôn chạy 24/24, trực tuyến liên tục, không bao giờ ngủ**:

### 🌟 Cách Cấu Hình Trên Google Cloud Console:
1. Vào **Cloud Run** -> Chọn dịch vụ -> **Edit & Deploy New Revision**.
2. Tại mục **Container, Networking, Security**:
   - **Minimum number of instances**: Đổi từ `0` thành `1` (Đảm bảo luôn luôn có ít nhất 1 container hoạt động 24/7).
   - **Maximum number of instances**: Đặt là `10` (Tự động mở rộng khi có lượng truy cập tăng đột biến).
   - **CPU allocation and pricing**: Chọn **CPU is always allocated** (Tương đương `--no-cpu-throttling`, giữ CPU hoạt động 24/7 liên tục ngay cả khi không có request để phục vụ background task và đồng bộ ngầm).
3. Bấm **Deploy**.

### 💻 Cách Cấu Hình Bằng Lệnh `gcloud CLI` / `cloudbuild.yaml`:
File [`cloudbuild.yaml`](file:///c:/Users/L%E1%BB%99c/Desktop/demo_ai-pricing3/cloudbuild.yaml) đã được cấu hình sẵn các cờ này:
```bash
gcloud run deploy ai-pricing-platform \
  --image gcr.io/YOUR_PROJECT_ID/ai-pricing-platform:latest \
  --region asia-southeast1 \
  --min-instances 1 \
  --max-instances 10 \
  --no-cpu-throttling \
  --port 8080
```

---

## 🔄 3. CƠ CHẾ TỰ ĐỘNG CẬP NHẬT THỜI GIAN THỰC (REAL-TIME LIVE AUTO-UPDATE)

Hệ thống đã được lập trình cơ chế đồng bộ đa tầng giúp giao diện tự động cập nhật ngay khi có dữ liệu mới mà không cần người dùng phải nhấn F5 hoặc tải lại trang:

1. **Smart Background Polling (Chu kỳ 10s - 12s)**:
   - Client tự động thăm dò máy chủ định kỳ ngầm để kiểm tra:
     - Có thông báo phát sóng mới từ Admin không? (Nếu có -> Tự động cập nhật số lượng chuông thông báo 🔔 và hiển thị thông báo popup).
     - Tài khoản người dùng có bị Admin thay đổi gói cước hoặc trạng thái không? (Nếu Admin nâng gói hoặc khóa tài khoản -> Giao diện người dùng lập tức tự động cập nhật ngay trên màn hình).
     - Admin Vàng khi mở tab "Tiến trình Admin Bạc" sẽ tự động nhận mọi thay đổi mới nhất mà Admin Bạc vừa thực hiện mỗi 10 giây.
2. **Page Visibility API Sync**:
   - Khi người dùng chuyển sang tab khác rồi quay lại tab web, hệ thống ngay lập tức kích hoạt đồng bộ dữ liệu mới nhất trong 0.1 giây.
3. **Cross-Tab Realtime Bus (`BroadcastChannel` & `CustomEvent`)**:
   - Khi Admin thực hiện bất kỳ hành động nào (tạo user, sửa user, khóa tài khoản, gửi thông báo) ở 1 tab/cửa sổ, tất cả các tab khác của hệ thống đang mở trên trình duyệt đều được thông báo và đồng bộ tức thời.
4. **Huy Hiệu Trạng Thái Trực Quan**:
   - Header của Bảng Quản Trị hiển thị: `🟢 LIVE 24/7 (AUTO-SYNC 10S)`.
   - Header của Modal Thông Báo hiển thị: `🟢 Live 24/7`.

---

## 📋 TỔNG HỢP CÁC LỆNH TRIỂN KHAI NHANH

```bash
# Bước 1: Khởi tạo và đẩy code lên GitHub
git init
git add .
git commit -m "feat: 24/7 cloud run, persistent storage, real-time live sync"
git branch -M main
git remote add origin https://github.com/TÊN_BẠN/ai-pricing-platform.git
git push -u origin main

# Bước 2: Tạo Bucket lưu trữ vĩnh viễn trên Google Cloud
gcloud storage buckets create gs://ai-pricing-data --location=asia-southeast1

# Bước 3: Deploy lên Cloud Run chạy 24/24 và gắn ổ cứng vĩnh viễn
gcloud run deploy ai-pricing-platform \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --no-cpu-throttling \
  --add-volume name=data-vol,type=cloud-storage,bucket=ai-pricing-data \
  --add-volume-mount volume=data-vol,mount-path=/app/data
```
