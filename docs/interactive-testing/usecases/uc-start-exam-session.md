# Chi tiết Use Case: UC-TEST-001 - Khởi tạo & Vào Phòng thi

**Mã Use Case**: `UC-TEST-001`  
**Tên Use Case**: Khởi tạo & Vào Phòng thi (Start & Initialize Exam Session)  
**Phân hệ**: `interactive-testing`  
**Microservice**: `exam-service`  
**Actor chính**: Thí sinh (Học sinh / Sinh viên)  
**Truy vết**: `UR-TEST-001`, `UR-TEST-004`, `FR-TEST-001`, `FR-TEST-002`, `RULE-TEST-001`

---

## 1. Tiền điều kiện (Preconditions)
1. Đề thi mục tiêu đang ở trạng thái `PUBLISHED`.
2. Thí sinh đã đăng nhập và được cấp quyền truy cập đề thi (chủ sở hữu hoặc có link làm bài).

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path)
1. Thí sinh truy cập trang thông tin đề thi, nhấn nút **"Bắt đầu Làm bài"**.
2. Client gửi request `POST /api/v1/exams/{exam_id}/start`.
3. `exam-service` kiểm tra xem thí sinh đã có phiên làm dở (`IN_PROGRESS`) chưa:
   - Nếu chưa: Tạo bản ghi `exam_attempts` mới với `started_at = NOW()`, tính toán `expires_at = NOW() + duration`.
   - Nếu đã có: Khôi phục phiên thi cũ kèm các câu trả lời nháp đã lưu.
4. Server trả về dữ liệu đề thi: Toàn bộ danh sách câu hỏi MCQ và Essay (đã ẩn trường `correct_answer`, `explanation` và `rubric` để đảm bảo bảo mật đề thi).
5. Giao diện Client kích hoạt chế độ Phòng thi tập trung (Exam Mode):
   - Ẩn thanh điều hướng website thông thường để tránh phân tâm.
   - Khởi động đồng hồ đếm ngược đồng bộ theo `expires_at`.
   - Khởi tạo Question Palette bên phải màn hình (đánh số từ 1 đến N).
6. Thí sinh sẵn sàng làm câu hỏi đầu tiên.

---

## 3. Các Luồng Thay thế & Ngoại lệ (Alternative & Exception Flows)

### 3.1. Luồng A1: Khôi phục phiên thi sau khi bị mất kết nối / Đổi máy
- Thí sinh bị sập nguồn máy tính hoặc rớt mạng, sau đó mở lại trình duyệt và bấm vào link đề.
- Server phát hiện `attempt_id` đang ở trạng thái `IN_PROGRESS` và thời gian hiện tại vẫn nhỏ hơn `expires_at`.
- Trả về toàn bộ đáp án đã lưu trước đó và số giây còn lại tính theo thời gian thực của Server (`FR-TEST-002`).
- Thí sinh tiếp tục làm bài mà không bị mất dữ liệu đã làm.

### 3.2. Luồng E1: Đề thi chưa được phát hành (`E-TEST-001`)
- Thí sinh truy cập vào một đề thi đang ở trạng thái nháp (`DRAFT` hoặc `GENERATING`).
- Server trả về lỗi `404 Not Found` kèm thông báo: "Đề thi hiện chưa sẵn sàng hoặc chưa được phát hành."

### 3.3. Luồng E2: Đã nộp bài trước đó (`E-TEST-002`)
- Thí sinh đã nộp bài thi này và cố tình bấm làm lại trong khi đề thi chỉ cho phép thi 1 lần.
- Server trả về lỗi `409 Conflict` và chuyển hướng sang màn hình xem kết quả điểm thi.

---

## 4. Hậu điều kiện (Postconditions)
- Bản ghi `exam_attempts` ở trạng thái `IN_PROGRESS` với thời gian hết hạn được xác lập trên Server.
- Thí sinh ở trong giao diện phòng thi tương tác an toàn.
