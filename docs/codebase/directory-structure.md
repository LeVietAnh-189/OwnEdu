# Cấu Trúc Thư Mục Dự Án (Monorepo Directory Structure)

Hệ thống OwnEdu được xây dựng theo mô hình monorepo tinh gọn với runtime siêu tốc **Bun**, phân chia ranh giới rõ ràng giữa backend API, frontend web client và các tài liệu đặc tả nghiệp vụ.

---

## 1. Cây thư mục tổng quan

```text
ownedu/
├── backend/                  # REST API server Express + TypeScript
│   ├── data/                 # Cơ sở dữ liệu JSON và thư mục lưu trữ file
│   │   ├── store.json        # File JSON lưu trữ dữ liệu chính (HybridStore)
│   │   └── uploads/          # Tài liệu tải lên (.pdf, .docx, đề thi, avatar)
│   ├── src/                  # Mã nguồn chính của backend
│   │   ├── config/           # Cấu hình môi trường (.env, Cloudflare R2 S3)
│   │   ├── controllers/      # Bộ điều hướng xử lý HTTP request/response
│   │   ├── middleware/       # Middleware xác thực JWT, phân quyền, upload Multer
│   │   ├── routes/           # Khai báo đường dẫn API endpoints
│   │   ├── services/         # Nghiệp vụ lõi (AI Gemini, R2, HybridStore)
│   │   └── types/            # Định nghĩa kiểu dữ liệu TypeScript dùng chung
│   ├── package.json          # Danh sách phụ thuộc backend (Express, Bun, AWS SDK, Multer...)
│   └── tsconfig.json         # Cấu hình biên dịch TypeScript cho backend
│
├── frontend/                 # Ứng dụng giao diện React 18 + Vite + Tailwind CSS
│   ├── public/               # Tài nguyên tĩnh công khai (favicon, logo, icons)
│   ├── src/                  # Mã nguồn giao diện chính
│   │   ├── components/       # Các thành phần UI tái sử dụng (Player, Modal, Button...)
│   │   ├── context/          # React Context (AuthContext, CourseContext)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Màn hình theo tuyến đường (Dashboard, CourseView, Studio...)
│   │   ├── services/         # Lớp gọi API HTTP (api.ts dùng Axios/Fetch)
│   │   ├── types/            # Khai báo interface TypeScript cho frontend
│   │   ├── App.tsx           # Thành phần gốc định tuyến và bố cục chung
│   │   ├── main.tsx          # Điểm gắn kết DOM React
│   │   └── index.css         # Cấu hình phong cách Tailwind CSS và biến theme
│   ├── package.json          # Danh sách phụ thuộc frontend (React, Vite, Lucide...)
│   └── vite.config.ts        # Cấu hình máy chủ phát triển Vite và Proxy
│
├── docs/                     # Hệ thống tài liệu kỹ thuật & nghiệp vụ
│   ├── SUMMARY.md            # Mục lục điều hướng tài liệu toàn dự án
│   ├── architecture/         # Kiến trúc hệ thống, luồng dữ liệu, lưu trữ video
│   ├── codebase/             # Tài liệu chi tiết mã nguồn backend & frontend
│   ├── code-standard/        # Quy chuẩn viết mã, quy tắc API và môi trường
│   └── project-pdr/          # Đặc tả sản phẩm, Bloom Taxonomy, gói cước Free/Pro
│
├── dev.ts                    # Kịch bản khởi chạy đồng thời backend + frontend
├── package.json              # Monorepo root scripts và cấu hình chung
└── README.md                 # Hướng dẫn khởi động nhanh cho lập trình viên
```

---

## 2. Chi tiết các khu vực trọng yếu

### 2.1 Backend (`backend/`)
- **`src/services/storage.service.ts`**: Cung cấp lớp lưu trữ `HybridStore` đọc/ghi trực tiếp vào `data/store.json`. Tự động khởi tạo schema mặc định nếu file chưa tồn tại.
- **`src/services/ai.service.ts`**: Tích hợp Google Gemini API để tạo câu hỏi trắc nghiệm/tự luận bám sát tài liệu tải lên theo 4 mức độ nhận thức Bloom và chấm điểm bài luận với Rubric.
- **`src/services/r2.service.ts`**: Kết nối Cloudflare R2 tương thích S3 API (`@aws-sdk/client-s3`), hỗ trợ streaming video cho học viên Pro VIP và tạo presigned URL tải lên.
- **`src/controllers/`**: Phân chia theo thực thể nghiệp vụ:
  - `auth.controller.ts`: Đăng ký, đăng nhập, cấp JWT token.
  - `course.controller.ts`: Quản lý khóa học, chương học, bài giảng và tiến độ.
  - `exam.controller.ts`: Tạo đề thi AI từ file, nộp bài, lưu lịch sử chấm điểm.
  - `video.controller.ts`: Xử lý streaming video qua HTTP Range Header (HTTP 206) hoặc phân phát URL YouTube an toàn.

### 2.2 Frontend (`frontend/`)
- **`src/components/video/UnifiedVideoPlayer.tsx`**: Trình phát video đa chế độ thông minh. Tự động nhận diện video YouTube để hiển thị qua `youtube-nocookie.com` (chế độ bảo mật không lưu cookie) hoặc video Pro VIP streaming từ R2 với tùy chọn tốc độ phát và bookmark.
- **`src/pages/learning/`**: Giao diện phòng học trực quan, danh sách bài học chia chương, thanh tiến độ bài giảng và khu vực tài liệu đính kèm.
- **`src/pages/exam/`**: Giao diện làm bài thi trực tuyến, hiển thị đồng hồ đếm ngược, phân loại thẻ nhận thức Bloom và xem kết quả giải thích chi tiết sau khi nộp.
- **`src/services/api.ts`**: Axios instance trung tâm gắn Bearer JWT token tự động và xử lý bắt lỗi tập trung.

### 2.3 Script điều phối (`dev.ts`)
- Script chạy bằng Bun ở thư mục gốc: khởi động đồng thời cả backend (port 3000) và frontend Vite (port 5173), hiển thị log gộp có mã màu rõ ràng giúp lập trình viên dễ dàng theo dõi.
