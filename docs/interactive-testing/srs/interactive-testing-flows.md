# Luồng Tương tác Hệ thống (System Flows) - interactive-testing

**Phân hệ**: `interactive-testing`  
**Microservice phối hợp**: `exam-service`, `grading-service`, `api-gateway`  
**Tài liệu liên quan**:
- [interactive-testing-spec.md](file:///C:/Nexis/ownedu/docs/interactive-testing/srs/interactive-testing-spec.md)
- [interactive-testing-brd.md](file:///C:/Nexis/ownedu/docs/interactive-testing/interactive-testing-brd.md)
- [interactive-testing-usecase-index.md](file:///C:/Nexis/ownedu/docs/interactive-testing/usecases/interactive-testing-usecase-index.md)

---

## 1. Sơ đồ Luồng Swimlane Phòng Thi Trực Tuyến & Tự Động Lưu (End-to-End Swimlane)

Sơ đồ phân định trách nhiệm giữa **Thí sinh (Web UI)**, **API Gateway**, **Exam Service**, **Redis Cache & DB**, **Message Queue (RabbitMQ)**, và **Grading Service**:

![Sơ đồ Luồng Swimlane Phòng Thi Trực Tuyến](file:///C:/Nexis/ownedu/docs/interactive-testing/srs/interactive-testing-swimlane.svg)

---

## 2. Diễn giải Chi tiết các Pha (Phase Execution Details)

### Pha 1: Khởi tạo Phiên thi & Thiết lập Đồng bộ Server
1. Thí sinh bấm "Bắt đầu Làm bài", `exam-service` kiểm tra quyền và khởi tạo phiên thi `attempt_id`.
2. Đồng hồ đếm ngược được khóa cố định theo thời gian Server (`expires_at = now + duration`), ngăn ngừa can thiệp client-side (`RULE-TEST-001`).
3. Client render giao diện phòng thi tập trung kèm Question Palette bên phải.

### Pha 2: Cơ chế Tự động Lưu Song song (High-Frequency Auto-Save)
1. **Câu hỏi Trắc nghiệm**: Khi click chọn phương án, Client gửi PUT request ngay lập tức. Service ghi nhanh vào Redis cache trong vòng < 100ms và cập nhật trạng thái ô câu hỏi sang màu xanh.
2. **Câu hỏi Tự luận**: Khi gõ văn bản, áp dụng cơ chế Debounce 2000ms (hoặc định kỳ 15 giây/lần) để gom cụm nội dung bài viết gửi lên máy chủ (`RULE-TEST-004`), hạn chế spam request.
3. Cơ chế chịu lỗi Offline: Nếu mạng bị chập chờn, Client lưu tạm câu trả lời vào `localStorage` và tự động re-sync ngay khi mạng thông lại.

### Pha 3: Nộp bài Thi & Cơ chế Gia hạn Trễ mạng (Submission & Grace Period)
1. Thí sinh có thể chủ động nộp bài (xác nhận qua Modal tóm tắt).
2. Khi đồng hồ về `00:00`, Client tự động khóa nhập liệu và nộp bài.
3. Server áp dụng Grace Period 30 giây (`RULE-TEST-002`) để tiếp nhận các gói dữ liệu đang truyền dở.
4. Trạng thái phiên thi chuyển thành `SUBMITTED`, khóa quyền sửa đổi vĩnh viễn (`RULE-TEST-003`).

### Pha 4: Chuyển giao Bất đồng bộ sang Chấm điểm (Handover via Message Queue)
1. `exam-service` flush toàn bộ dữ liệu từ Redis sang PostgreSQL đảm bảo tính bền vững (`BR-TEST-001`).
2. Đóng gói câu trả lời của thí sinh cùng barem rubric gốc của đề thi thành event payload `exam.attempt.submitted`.
3. Đẩy event vào RabbitMQ queue `exam.attempt.submitted` để bàn giao trơn tru cho phân hệ `ai-grading-feedback` (`grading-service`).
