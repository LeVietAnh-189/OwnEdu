# Thiết Kế Kiến Trúc Hệ Thống (System Design)

## 1. Tổng Quan Kiến Trúc Đa Tầng

OwnEdu là nền tảng quản lý học tập và đánh giá năng lực ứng dụng AI, được thiết kế để giải quyết trọn vẹn chu trình đào tạo: tiếp nhận tài liệu giáo trình, bóc tách tri thức, tạo đề thi trắc nghiệm & tự luận theo chuẩn thang đo nhận thức Bloom, tổ chức thi trực tuyến có bấm giờ, chấm bài bằng AI theo tiêu chí Rubric và lưu trữ phát bài giảng video.

```
                  +-----------------------------------+
                  |        Người Dùng Cuối             |
                  |     (Học viên & Giảng viên)       |
                  +-----------------+-----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |      Giao Diện Web Frontend       |
                  |   (React 18 + Vite + Tailwind)    |
                  |       Port 5173 / UserLayout      |
                  +-----------------+-----------------+
                                    | HTTP / JSON / Multipart
                                    v
+-----------------------------------+-----------------------------------+
|               Backend API Gateway Điều Phối (Cổng 3000)               |
|                   Express + TypeScript chạy trên Bun                  |
+-----------------------------------+-----------------------------------+
|  /api/v1/auth    /api/v1/docs     /api/v1/exams    /api/v1/videos    |
+-----------------+-----------------+----------------+------------------+
                  |                 |                |
                  v                 v                v
          +---------------+ +---------------+ +---------------+
          | DocumentParser| | ExamGenerator | | VideoService  |
          | Bóc tách file | | AI Gemini/LLM | | Cloudflare R2 |
          +---------------+ +---------------+ +---------------+
                  |                 |                |
                  +-----------------+----------------+
                                    |
                                    v
                  +-----------------+-----------------+
                  |       Cơ Sở Dữ Liệu Hybrid        |
                  | Lưu tệp JSON + Chỉ mục bộ nhớ RAM |
                  |       (backend/data/store.json)   |
                  +-----------------------------------+
```

---

## 2. Hạ Tầng & Điều Phối Tiến Trình

- **Môi trường thực thi (Runtime)**: Sử dụng Bun xuyên suốt dự án thông qua runner `dev.ts`, giúp khởi động đồng thời cả Backend và Frontend chỉ bằng 1 câu lệnh duy nhất (`bun run dev`), hợp nhất luồng log với tiền tố trực quan `[backend]` và `[frontend]`, đồng thời tự động giải phóng cổng mạng khi dừng (`Ctrl + C`).
- **Backend API Gateway**: Máy chủ Express.js viết bằng TypeScript chạy trên cổng 3000, tích hợp bảo vệ CORS, xử lý kích thước body lớn cho việc tải tài liệu, ghi log thời gian phản hồi (ms) cho từng request và chuẩn hóa mã lỗi trả về.
- **Frontend SPA**: Ứng dụng React 18 xây dựng trên nền Vite cho tốc độ tải cực nhanh và Tailwind CSS cho hệ thống giao diện nhất quán. Điều hướng dựa trên `react-router-dom` v6 kết hợp layout khung làm việc cố định (`UserLayout`).
- **Lưu trữ dữ liệu Hybrid**: Phân hệ `HybridStore` (`backend/src/db/hybridStore.ts`) kết hợp giữa tốc độ đọc ghi tức thì trên bộ nhớ RAM và cơ chế tự động đồng bộ xuống tệp JSON (`backend/data/store.json`), đảm bảo dữ liệu không bị mất khi khởi động lại máy chủ mà không cần cài đặt cơ sở dữ liệu cồng kềnh.

---

## 3. Các Phân Hệ Cốt Lõi

### 3.1 Phân Hệ Bóc Tách Giáo Trình & Tài Liệu (Document Ingestion)
Chịu trách nhiệm tiếp nhận và xử lý các định dạng tài liệu học tập `.pdf`, `.docx`, `.md`.
- Sử dụng thư viện `pdfjs-dist` và `mammoth` để trích xuất văn bản thô, tính toán số trang, kích thước và phân chia cấu trúc chương mục.
- Sẵn sàng tích hợp dịch vụ OCR nâng cao MinerU (`backend/services/mineru_service`) khi cần trích xuất bảng biểu phức tạp và công thức toán học.

### 3.2 Phân Hệ Tạo Đề Thi Chuẩn Khảo Thí Bloom (Exam Generator)
Biến đổi nội dung tài liệu học phần thành bộ đề thi chuẩn hóa dựa trên ma trận 4 cấp độ nhận thức của Bloom:
1. **Nhận biết (Remember)**: Kiểm tra khả năng ghi nhớ khái niệm, thuật ngữ, định nghĩa.
2. **Thông hiểu (Understand)**: Đánh giá khả năng giải thích, so sánh, phân loại nguyên lý.
3. **Vận dụng (Apply)**: Giải quyết bài toán thực tế, đọc hiểu luồng code hoặc tính toán cụ thể.
4. **Phân tích (Analyze)**: Đánh giá kiến trúc hệ thống, tìm lỗi tiềm ẩn và phân tích đánh đổi kỹ thuật.

### 3.3 Phân Hệ Khảo Thí & Chấm Điểm AI Theo Tiêu Chí Rubric
- **Câu hỏi trắc nghiệm**: Đối chiếu đáp án tự động tức thì, tính toán điểm số và tỷ lệ chính xác theo từng cấp độ Bloom.
- **Câu hỏi tự luận**: Sử dụng LLM phân tích câu trả lời của học viên dựa trên bảng tiêu chuẩn Rubric (Tính chính xác kỹ thuật, Độ sâu kiến thức, Tính logic, Cách trình bày), cung cấp điểm số chi tiết từng tiêu chí kèm nhận xét ưu điểm và hướng dẫn khắc phục cụ thể.

### 3.4 Phân Hệ Quản Lý & Phát Bài Giảng Video (Video Delivery)
Hỗ trợ mô hình phân phối video kết hợp linh hoạt:
- **Khóa học Miễn phí (Free)**: Nhúng video từ YouTube qua tên miền bảo mật `youtube-nocookie.com`, giúp tiết kiệm 100% chi phí băng thông và dung lượng máy chủ.
- **Khóa học Nâng cao (PRO VIP)**: Lưu trữ video độ nét cao trực tiếp trên Cloudflare R2, phát trực tuyến mượt mà bằng trình phát HTML5 chuẩn HTTP 206 (cho phép tua nhanh đến bất kỳ đoạn nào mà không phải tải cả tệp), giao diện sạch sẽ 100% không bị dính logo bên thứ ba.
