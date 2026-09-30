# Môi Trường Phát Triển & Công Cụ (Environment and Tooling)

Tài liệu này hướng dẫn thiết lập môi trường lập trình cục bộ, cấu hình biến môi trường và quy trình vận hành hệ thống OwnEdu.

---

## 1. Yêu cầu công cụ và Runtime

Để chạy hệ thống OwnEdu cục bộ, máy tính lập trình viên cần cài đặt:

- **Bun Runtime**: Phiên bản 1.0.0 trở lên (khuyến nghị Bun mới nhất vì tốc độ khởi động và cài đặt gói cực nhanh).
- **Node.js**: Phiên bản 18+ (tùy chọn, Bun có khả năng chạy độc lập).
- **Git**: Dùng để quản lý phiên bản mã nguồn.
- **Trình duyệt hiện đại**: Chrome, Edge, Firefox hoặc Safari hỗ trợ HTML5 Video và JavaScript ES2022.

---

## 2. Cấu hình biến môi trường (`.env`)

Tạo tập tin `.env` tại thư mục `backend/` theo mẫu hướng dẫn sau:

```env
# ==============================================================================
# CẤU HÌNH MÁY CHỦ BACKEND
# ==============================================================================
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_super_secret_key_here_at_least_32_characters

# ==============================================================================
# CẤU HÌNH GOOGLE GEMINI AI (Tạo đề thi & Chấm điểm luận)
# ==============================================================================
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere

# ==============================================================================
# CẤU HÌNH CLOUDFLARE R2 OBJECT STORAGE (Dành cho video Pro VIP)
# ==============================================================================
# Tương thích hoàn toàn chuẩn AWS S3 API
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=ownedu-videos
R2_ENDPOINT=https://<your_account_id>.r2.cloudflarestorage.com
R2_PUBLIC_DOMAIN=https://videos.ownedu.vn

# ==============================================================================
# CẤU HÌNH GIỚI HẠN UPLOAD TÀI LIỆU
# ==============================================================================
MAX_DOCUMENT_SIZE_MB=25
MAX_VIDEO_SIZE_MB=500
```

> [!WARNING]
> Tuyệt đối **không commit** tập tin `.env` chứa các API Key thật lên GitHub. Hãy giữ tập tin `.env.example` làm mẫu cấu hình sạch cho toàn đội ngũ.

---

## 3. Quy trình khởi chạy dự án cục bộ

### Bước 1: Cài đặt các gói thư viện
Tại thư mục gốc của dự án `ownedu/`:

```bash
# Cài đặt toàn bộ thư viện cho cả root, backend và frontend
bun install
```

### Bước 2: Khởi động chế độ phát triển đồng thời
Chạy script điều phối `dev.ts`:

```bash
bun run dev
```

Script này sẽ tự động:
1. Khởi động **Backend Express** tại cổng: `http://localhost:3000`
2. Khởi động **Frontend Vite** tại cổng: `http://localhost:5173`
3. Tổng hợp và hiển thị log của cả hai tiến trình lên một cửa sổ terminal duy nhất với màu sắc phân biệt trực quan.

---

## 4. Các lệnh hữu ích trong quá trình phát triển

| Lệnh thực thi | Mục đích sử dụng |
| :--- | :--- |
| `bun run dev` | Khởi chạy toàn bộ hệ thống (Backend + Frontend) ở chế độ phát triển |
| `bun run dev:backend` | Chỉ chạy riêng máy chủ Backend (cổng 3000) với cờ theo dõi thay đổi file |
| `bun run dev:frontend` | Chỉ chạy riêng ứng dụng Frontend Vite (cổng 5173) |
| `bun run build` | Đóng gói sản phẩm Frontend cho môi trường production vào thư mục `dist/` |
| `bun test` | Chạy bộ kiểm thử tự động của dự án |
