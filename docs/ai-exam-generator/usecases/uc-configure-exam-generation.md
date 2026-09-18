# Chi tiết Use Case: UC-GEN-001 - Thiết lập Cấu hình & Yêu cầu Sinh Đề

**Mã Use Case**: `UC-GEN-001`  
**Tên Use Case**: Thiết lập Cấu hình & Yêu cầu Sinh Đề (Configure Exam Generation)  
**Phân hệ**: `ai-exam-generator`  
**Microservice**: `exam-service` / `api-gateway`  
**Actor chính**: Học sinh / Sinh viên / Giáo viên  
**Truy vết**: `UR-GEN-001`, `UR-GEN-002`, `UR-GEN-003`, `FR-GEN-001`, `FR-GEN-004`, `RULE-GEN-001`, `RULE-GEN-004`

---

## 1. Tiền điều kiện (Preconditions)
1. Người dùng đã đăng nhập vào hệ thống và có JWT token hợp lệ.
2. Người dùng đã có ít nhất một tài liệu ở trạng thái `PARSED` trong thư viện (`document-service`).
3. Tài khoản của người dùng còn hạn ngạch sinh đề trong ngày (`RULE-GEN-004`).

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path)
1. Người dùng vào màn hình chi tiết tài liệu hoặc màn hình "Tạo đề thi mới", chọn một tài liệu nguồn.
2. Hệ thống hiển thị form cấu hình sinh đề:
   - **Tên đề thi**: Tự động gợi ý theo tên tài liệu (cho phép sửa).
   - **Số lượng câu trắc nghiệm (MCQ)**: Slider từ 1 đến 50 câu (mặc định: 15).
   - **Số lượng câu tự luận (Essay)**: Slider từ 0 đến 10 câu (mặc định: 2).
   - **Cấp độ nhận thức (Bloom Levels)**: Checkbox [Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao].
   - **Thời gian làm bài**: Hệ thống tự động tính toán thời gian gợi ý theo `RULE-GEN-001` (ví dụ: $15 \times 1.5 + 2 \times 10 = 42.5 \rightarrow 45$ phút). Người dùng có thể tùy chỉnh.
3. Người dùng nhấn nút **"Kích hoạt AI Sinh Đề"**.
4. Client gửi request `POST /api/v1/exams/generate`.
5. API Gateway xác thực token, kiểm tra rate limit.
6. `exam-service` kiểm tra hạn ngạch người dùng, lưu bản ghi đề thi ở trạng thái `GENERATING`, đẩy job vào RabbitMQ queue `exam.generation.requested`.
7. Hệ thống trả về `202 Accepted` kèm `job_id` và endpoint SSE: `/api/v1/exams/jobs/{job_id}/stream`.
8. Trình duyệt chuyển sang màn hình chờ trạng thái tiến độ thời gian thực (Trigger `UC-GEN-002`).

---

## 3. Các Luồng Thay thế & Ngoại lệ (Alternative & Exception Flows)

### 3.1. Luồng A1: Chọn phạm vi chương mục cụ thể
- Tại bước 2, người dùng bỏ chọn "Toàn bộ tài liệu" và tick chọn các chương cụ thể (ví dụ: Chương 1, Chương 3).
- Client gửi mảng `selected_chapter_ids` trong payload.
- Worker chỉ truy xuất các chunk thuộc các chương được chọn.

### 3.2. Luồng E1: Vi phạm giới hạn số lượng câu hỏi (`E-GEN-001`)
- Nếu người dùng chọn MCQ = 0 và Essay = 0, hoặc tổng số câu > 60:
- Client disable nút bấm hoặc API trả về lỗi `400 Bad Request` kèm thông điệp: "Đề thi phải có ít nhất 1 câu hỏi và không quá 60 câu."

### 3.3. Luồng E2: Hết hạn ngạch sinh đề (`E-GEN-003`)
- Tại bước 6, `exam-service` kiểm tra thấy người dùng gói Free đã dùng hết 5 lượt sinh đề trong 24h.
- Hệ thống trả về `429 Too Many Requests`.
- UI hiển thị modal: "Bạn đã dùng hết hạn ngạch sinh đề hôm nay. Vui lòng nâng cấp gói Pro để tiếp tục tạo đề không giới hạn."

---

## 4. Hậu điều kiện (Postconditions)
- Tác vụ sinh đề được đưa vào hàng đợi `exam.generation.requested` thành công.
- Client kết nối sẵn sàng vào kênh SSE để nhận luồng sự kiện.
