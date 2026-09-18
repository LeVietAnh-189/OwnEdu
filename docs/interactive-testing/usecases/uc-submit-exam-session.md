# Chi tiết Use Case: UC-TEST-003 - Nộp bài Thi & Bàn giao Chấm điểm

**Mã Use Case**: `UC-TEST-003`  
**Tên Use Case**: Nộp bài Thi & Bàn giao Chấm điểm (Submit Exam Session & Handover)  
**Phân hệ**: `interactive-testing`  
**Microservice**: `exam-service`  
**Actor chính**: Thí sinh (hoặc Hệ thống khi hết giờ)  
**Truy vết**: `UR-TEST-006`, `BR-TEST-002`, `BR-TEST-004`, `FR-TEST-006`, `FR-TEST-007`, `FR-TEST-008`, `RULE-TEST-001`, `RULE-TEST-002`, `RULE-TEST-003`

---

## 1. Tiền điều kiện (Preconditions)
1. Thí sinh đang có một phiên làm bài `IN_PROGRESS`.
2. Thời gian thi chưa vượt quá `expires_at + grace_period (30s)`.

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path: Thí sinh Chủ động Nộp bài)
1. Thí sinh hoàn thành bài làm, nhấn nút **"Nộp bài Thi" (Submit Exam)**.
2. Hệ thống hiển thị Modal xác nhận nộp bài kèm bản tóm tắt:
   - Tổng số câu: 25.
   - Đã làm: 24/25.
   - Chưa làm: 1 câu (Câu số 18).
   - Số câu còn cắm cờ xem lại: 2 câu.
   - Thời gian còn lại: 12 phút 30 giây.
3. Thí sinh nhấn nút xác nhận **"Xác nhận Nộp bài"**.
4. Client gửi request `POST /api/v1/attempts/{attempt_id}/submit`.
5. `exam-service` kiểm tra tính hợp lệ:
   - Xác nhận thời gian gửi bài nằm trong giới hạn cho phép.
   - Cập nhật trạng thái phiên thi từ `IN_PROGRESS` sang `SUBMITTED`.
   - Khóa vĩnh viễn toàn bộ quyền sửa đổi dữ liệu bài làm (`RULE-TEST-003`).
6. `exam-service` đóng gói payload gồm toàn bộ câu trả lời của thí sinh cùng đề thi và rubric gốc, đẩy sự kiện `exam.attempt.submitted` vào hàng đợi RabbitMQ để bàn giao cho `grading-service`.
7. `exam-service` trả về `200 OK` kèm kết quả nộp bài thành công.
8. Giao diện Client chuyển sang màn hình chờ chấm điểm (Trigger sang Phân hệ `ai-grading-feedback`).

---

## 3. Các Luồng Thay thế & Ngoại lệ (Alternative & Exception Flows)

### 3.1. Luồng A1: Tự động nộp bài khi hết giờ (Auto-submit on countdown reach 0:00)
- Đồng hồ đếm ngược trên Client chạm mốc `00:00`.
- Client hiển thị thông báo: *"Hết giờ làm bài! Hệ thống đang tự động nộp bài của bạn..."*
- Khóa toàn bộ các ô chọn và khung soạn thảo.
- Tự động thực hiện bước 4 để gửi bài thi lên Server.
- Server tiếp nhận trong thời gian gia hạn 30 giây (`RULE-TEST-002`) và xử lý tương tự bước 5, 6, 7.

### 3.2. Luồng A2: Server quét tự động nộp bài (Server Sweep Auto-Submit)
- Nếu thí sinh tắt máy hoặc mất mạng khi hết giờ mà không gửi request nộp bài:
- Cron job định kỳ trên Server phát hiện bản ghi `exam_attempts` có `expires_at < NOW() - 30s` mà trạng thái vẫn là `IN_PROGRESS`.
- Server tự động chuyển trạng thái bản ghi thành `SUBMITTED` (ghi chú: `auto_submitted_by_system`), lấy toàn bộ câu trả lời đã auto-save trong DB/Redis và bắn event sang `grading-service`.

### 3.3. Luồng E1: Nộp bài trễ sau thời gian gia hạn (`E-TEST-003`)
- Do gian lận hoặc can thiệp đồng hồ client, request nộp bài gửi đến Server muộn hơn `expires_at + 30s`.
- Server từ chối tiếp nhận với mã lỗi `403 Forbidden` (`E-TEST-003`).
- Hệ thống chỉ công nhận các câu trả lời đã được auto-save trước thời điểm hết giờ.

---

## 4. Hậu điều kiện (Postconditions)
- Phiên thi chuyển sang trạng thái `SUBMITTED` và hoàn toàn bất biến.
- Sự kiện `exam.attempt.submitted` đã nằm trong hàng đợi của `grading-service`.
