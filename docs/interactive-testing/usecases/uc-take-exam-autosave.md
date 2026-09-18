# Chi tiết Use Case: UC-TEST-002 - Làm bài Thi & Tự động Lưu Tiến độ

**Mã Use Case**: `UC-TEST-002`  
**Tên Use Case**: Làm bài Thi & Tự động Lưu Tiến độ (Take Exam & Real-Time Auto-Save)  
**Phân hệ**: `interactive-testing`  
**Microservice**: `exam-service`  
**Actor chính**: Thí sinh (Học sinh / Sinh viên)  
**Truy vết**: `UR-TEST-002`, `UR-TEST-003`, `UR-TEST-005`, `FR-TEST-003`, `FR-TEST-004`, `RULE-TEST-004`

---

## 1. Tiền điều kiện (Preconditions)
1. Thí sinh đang trong phiên thi `IN_PROGRESS` hợp lệ (`UC-TEST-001`).
2. Thời gian thi còn hiệu lực (`now < expires_at`).

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path)

### 2.1. Thao tác với Câu hỏi Trắc nghiệm (MCQ)
1. Thí sinh đọc đề bài và click chọn 1 trong 4 phương án A, B, C, D.
2. Nút chọn sáng lên ngay lập tức trên giao diện.
3. Client gửi request nền không chặn UI: `PUT /api/v1/attempts/{attempt_id}/answers/{question_id}` kèm key lựa chọn.
4. `exam-service` ghi nhận vào cache Redis và xếp hàng ghi DB, trả về `200 OK` trong < 100ms.
5. Ô số câu tương ứng trên Question Palette chuyển màu sang xanh lá (Đã làm).

### 2.2. Thao tác với Câu hỏi Tự luận (Essay)
1. Thí sinh chuyển sang câu tự luận, gõ nội dung phân tích vào khung soạn thảo.
2. Trình soạn thảo hiển thị bộ đếm từ thời gian thực (ví dụ: "342 từ").
3. Bộ điều khiển Client áp dụng kỹ thuật Debounce: Khi thí sinh ngừng gõ 2 giây hoặc sau mỗi chu kỳ 15 giây, tự động kích hoạt gửi payload văn bản lên Server.
4. Server lưu nháp nội dung tự luận vào Redis.
5. Góc dưới khung soạn thảo hiển thị icon tick xanh kèm chú thích: "Đã tự động lưu lúc 14:32:05".

### 2.3. Cắm cờ xem lại (Flag for Review)
1. Thí sinh phân vân giữa phương án B và D, nhấn nút **"Đánh dấu xem lại"** (Flag).
2. Ô số câu trên Question Palette xuất hiện góc đánh dấu màu vàng cam.
3. Thí sinh có thể nhấn vào nút lọc "Chỉ xem các câu đánh dấu" để kiểm tra lại trước khi nộp.

---

## 3. Các Luồng Thay thế & Ngoại lệ (Alternative & Exception Flows)

### 3.1. Luồng E1: Tạm thời mất kết nối mạng (Offline Resilience)
- Thí sinh bị ngắt wifi đột ngột trong khi đang làm bài.
- Request auto-save thất bại.
- Client bắt sự kiện `offline`, lưu trữ câu trả lời vào `localStorage` của trình duyệt và hiển thị thanh thông báo nhỏ màu vàng trên đầu trang: *"Mất kết nối mạng! Dữ liệu đang được lưu tạm trên thiết bị. Vui lòng không đóng tab."*
- Khi mạng phục hồi, Client tự động gửi lại toàn bộ các câu trả lời lưu tạm lên Server và cập nhật trạng thái "Đã đồng bộ lại".

### 3.2. Luồng E2: Spam request auto-save (`E-TEST-004`)
- Thí sinh click liên tục chuyển đổi giữa các đáp án quá nhanh (< 1 giây).
- Gateway/Service trả về `429 Too Many Requests`.
- Client điều chỉnh bóp nghẽn (Throttle), chỉ gửi lựa chọn cuối cùng sau 500ms người dùng dừng click.

---

## 4. Hậu điều kiện (Postconditions)
- Mọi câu trả lời (trắc nghiệm và tự luận) được đồng bộ an toàn trên cụm máy chủ OwnEdu.
- Trạng thái trực quan trên Question Palette phản ánh chính xác 100% tiến độ làm bài.
