# Các Phân Hệ Và Module Backend (Backend Modules)

Backend OwnEdu được thiết kế theo kiến trúc phân tầng (Layered Architecture) rõ ràng, sử dụng Express.js trên nền runtime Bun với TypeScript mạnh mẽ.

---

## 1. Kiến trúc phân tầng (Layered Architecture)

Luồng xử lý một HTTP Request đi qua các tầng như sau:

```text
HTTP Request
     │
     ▼
[ Middleware Layer ]  ──> Xác thực JWT (auth.middleware.ts), kiểm tra quyền (role.middleware.ts), upload file Multer
     │
     ▼
[ Controller Layer ]  ──> Trích xuất tham số req.params, req.body, req.query; kiểm tra đầu vào và định dạng phản hồi
     │
     ▼
[ Service Layer ]     ──> Xử lý nghiệp vụ lõi: gọi Gemini AI, đọc/ghi HybridStore, tương tác Cloudflare R2
     │
     ▼
[ Data Access Layer ] ──> Lưu trữ HybridStore (store.json), file uploads vật lý
     │
     ▼
HTTP Response (Chuẩn ApiResponseEnvelope: { success, data, error, timestamp })
```

---

## 2. Chi tiết các Module chính

### 2.1 Module Xác thực & Tài khoản (`auth`)
- **Tập tin liên quan**: `src/controllers/auth.controller.ts`, `src/middleware/auth.middleware.ts`
- **Chức năng**:
  - Đăng ký tài khoản mới (`POST /api/auth/register`): Băm mật khẩu bằng thuật toán an toàn, khởi tạo vai trò mặc định (`student`) và hạng thành viên (`free`).
  - Đăng nhập (`POST /api/auth/login`): So khớp mật khẩu, sinh mã JWT có thời hạn gắn kèm `userId` và `role`.
  - Lấy thông tin cá nhân (`GET /api/auth/me`): Trả về hồ sơ người dùng hiện tại từ token.
  - Phân quyền theo vai trò: `student` (học viên), `instructor` (giảng viên tạo khóa), `admin` (quản trị viên).

### 2.2 Module Quản lý Khóa học & Bài giảng (`courses`)
- **Tập tin liên quan**: `src/controllers/course.controller.ts`
- **Chức năng**:
  - Quản lý danh mục khóa học: Tạo, sửa, xóa, tìm kiếm khóa học theo thẻ và cấp độ.
  - Cấu trúc khóa học: Phân cấp theo `Course` -> `Chapter` -> `Lesson`.
  - Quản lý trạng thái bài học: Video miễn phí (preview), video YouTube nhúng, hoặc video Pro VIP lưu trữ trên R2.
  - Theo dõi tiến độ học tập: Đánh dấu bài học hoàn thành, tính tỷ lệ phần trăm tiến độ của học viên theo từng khóa học.

### 2.3 Module Tạo Đề Thi & Chấm Điểm AI (`exams`)
- **Tập tin liên quan**: `src/controllers/exam.controller.ts`, `src/services/ai.service.ts`
- **Chức năng**:
  - Trích xuất tài liệu: Đọc nội dung văn bản từ các file tải lên (.pdf, .docx, .txt).
  - Sinh câu hỏi tự động qua Gemini AI:
    - Bám sát tài liệu gốc (grounded prompt), chống ảo giác (hallucination).
    - Phân bổ theo 4 mức độ nhận thức của Thang đo Bloom: Nhận biết, Thông hiểu, Vận dụng, Phân tích.
    - Hỗ trợ câu hỏi trắc nghiệm khách quan (kèm đáp án và giải thích) và câu hỏi tự luận.
  - Nộp bài & Chấm bài:
    - Tự động chấm câu hỏi trắc nghiệm ngay lập tức.
    - Gửi bài làm tự luận lên Gemini AI để chấm điểm theo Rubric nhiều tiêu chí (nội dung, lập luận, bằng chứng, chính xác) và đưa ra nhận xét cá nhân hóa.

### 2.4 Module Video & Lưu trữ Cloudflare R2 (`videos`)
- **Tập tin liên quan**: `src/controllers/video.controller.ts`, `src/services/r2.service.ts`
- **Chức năng**:
  - Điều phối nguồn phát video kép (Dual-tier video delivery):
    - Video Free: Phân giải ID YouTube an toàn, nhúng qua miền không lưu cookie `youtube-nocookie.com`.
    - Video Pro VIP: Phân phát qua dịch vụ lưu trữ Cloudflare R2 sử dụng chuẩn AWS S3 SDK.
  - Hỗ trợ giao thức HTTP 206 Partial Content: Cho phép người dùng tua nhanh, tua chậm mượt mà mà không phải tải toàn bộ file video một lần.
  - Tải lên video bảo mật: Sinh Presigned Upload URL cho giảng viên tải video trực tiếp lên bucket R2 mà không làm nghẽn băng thông server Express.

### 2.5 Lớp Dữ Liệu `HybridStore` (`storage.service.ts`)
- **Cơ chế hoạt động**:
  - Sử dụng file phẳng `backend/data/store.json` làm cơ sở dữ liệu phi quan hệ tinh gọn cho giai đoạn phát triển.
  - Bộ nhớ đệm (In-memory cache) kết hợp cơ chế ghi bất đồng bộ (Asynchronous atomic write) giúp giảm thiểu hiện tượng xung đột dữ liệu khi có nhiều lượt ghi.
  - Cấu trúc dữ liệu phân tách rõ ràng: `users`, `courses`, `chapters`, `lessons`, `exams`, `submissions`.
