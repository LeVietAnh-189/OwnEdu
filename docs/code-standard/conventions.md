# Quy Chuẩn Mã Nguồn & Định Dạng Dữ Liệu (Code Conventions)

Tài liệu này xác lập các tiêu chuẩn viết mã, phong cách đặt tên và định dạng phản hồi API bắt buộc áp dụng trên toàn bộ dự án OwnEdu nhằm đảm bảo tính đồng nhất, dễ đọc và bảo trì lâu dài.

---

## 1. Phong cách đặt tên (Naming Conventions)

| Đối tượng | Quy tắc đặt tên | Ví dụ thực tế |
| :--- | :--- | :--- |
| **Thư mục (Directories)** | `kebab-case` | `video-player/`, `course-management/` |
| **Tập tin React Component** | `PascalCase.tsx` | `UnifiedVideoPlayer.tsx`, `ExamCard.tsx` |
| **Tập tin Logic / Utils / Services** | `camelCase.ts` | `storage.service.ts`, `ai.service.ts`, `formatDate.ts` |
| **Tập tin Routes / Controllers** | `noun.controller.ts` | `course.controller.ts`, `exam.routes.ts` |
| **Hàm & Biến (Functions & Variables)** | `camelCase` | `calculateExamScore()`, `currentUserTier` |
| **Lớp đối tượng & Kiểu dữ liệu (Classes & Interfaces)** | `PascalCase` | `HybridStore`, `CoursePayload`, `BloomQuestion` |
| **Hằng số toàn cục (Constants)** | `UPPER_SNAKE_CASE` | `DEFAULT_PORT`, `MAX_UPLOAD_SIZE_BYTES` |

---

## 2. Tiêu chuẩn phản hồi API (API Response Envelope)

Tất cả các endpoint REST API trong backend OwnEdu bắt buộc phải đóng gói dữ liệu trả về theo giao thức phản hồi chuẩn (`ApiResponseEnvelope`):

### 2.1 Định dạng thành công (Success Response)
HTTP Status: `200 OK` hoặc `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "course_123",
    "title": "Nhập môn Lập trình Web",
    "totalLessons": 24
  },
  "message": "Lấy thông tin khóa học thành công",
  "timestamp": "2026-09-25T10:30:00.000Z"
}
```

### 2.2 Định dạng thất bại (Error Response)
HTTP Status: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, hoặc `500 Internal Server Error`

```json
{
  "success": false,
  "error": {
    "code": "EXAM_GENERATION_FAILED",
    "message": "Không thể trích xuất nội dung từ tệp tài liệu được tải lên",
    "details": "Định dạng tệp không được hỗ trợ hoặc nội dung rỗng"
  },
  "timestamp": "2026-09-25T10:30:00.000Z"
}
```

---

## 3. Quy chuẩn TypeScript & Kiểu dữ liệu

1. **Nghiêm cấm lạm dụng kiểu `any`**:
   - Mọi biến, tham số hàm và giá trị trả về đều phải được định kiểu tường minh hoặc suy luận kiểu an toàn.
   - Khi chưa rõ cấu trúc, sử dụng `unknown` kết hợp type guard thay vì `any`.
2. **Khai báo Interface rõ ràng**:
   - Mọi thực thể nghiệp vụ lưu trữ trong `HybridStore` đều phải có interface tương ứng đặt tại `backend/src/types/`.
   - Ví dụ: `IUser`, `ICourse`, `ILesson`, `IExam`, `ISubmission`.
3. **Quản lý bất đồng bộ (Async/Await)**:
   - Tất cả các tác vụ I/O (gọi Gemini AI, đọc file, truy vấn R2 S3) bắt buộc phải sử dụng cú pháp `async/await`.
   - Bắt buộc bọc trong khối lệnh `try...catch` ở tầng Controller để xử lý lỗi tập trung và chuyển tiếp qua middleware xử lý lỗi chung.

---

## 4. Quy chuẩn giao diện & Tailwind CSS

1. **Thiết kế Responsive**:
   - Ưu tiên Mobile-first, đảm bảo giao diện hiển thị chuẩn xác từ màn hình điện thoại (sm), máy tính bảng (md) đến màn hình rộng (lg, xl).
2. **Hệ màu sắc thống nhất**:
   - Tông màu chủ đạo: Indigo / Blue hiện đại, sạch sẽ và thân thiện với học tập.
   - Thẻ Thang đo Bloom: Màu sắc cố định theo quy ước nhận thức (Xanh lá: Nhận biết, Xanh dương: Thông hiểu, Cam: Vận dụng, Đỏ: Phân tích).
3. **Tối ưu trải nghiệm tương tác**:
   - Luôn hiển thị trạng thái đang tải (Loading Skeleton hoặc Spinner) khi đang chờ dữ liệu API hoặc AI đang sinh câu hỏi.
   - Cung cấp thông báo Toast (Toast Notification) rõ ràng khi thao tác thành công hoặc gặp lỗi.
