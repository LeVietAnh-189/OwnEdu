# Tài liệu Yêu cầu Nghiệp vụ (BRD) - interactive-testing

**Phân hệ**: `interactive-testing`  
**Microservice chịu trách nhiệm**: `exam-service`  
**Phiên bản**: 1.0.0  
**Trạng thái**: Draft  
**Truy vết (Traceability)**:
- [interactive-testing-urd.md](file:///C:/Nexis/ownedu/docs/interactive-testing/interactive-testing-urd.md)

---

## 1. Mục tiêu Nghiệp vụ (Business Objectives)

| Mã Mục tiêu | Tên Mục tiêu | Mô tả Đo lường |
| :--- | :--- | :--- |
| **BR-TEST-001** | Trải nghiệm thi cử không gián đoạn (Zero Data Loss) | 100% câu trả lời của thí sinh được lưu trữ an toàn trong suốt thời gian làm bài, triệt tiêu rủi ro mất bài thi do sự cố mạng hoặc tắt nhầm tab. |
| **BR-TEST-002** | Toàn vẹn thời gian thi cử (Server-Authoritative Timing) | Kiểm soát thời gian thi từ phía máy chủ để ngăn chặn tuyệt đối việc can thiệp chỉnh sửa thời gian ở phía client. |
| **BR-TEST-003** | Tối ưu hóa hiệu năng phòng thi đồng thời | Hỗ trợ tối thiểu 10,000 thí sinh làm bài đồng thời với độ trễ phản hồi lưu bài $\le 200$ms. |
| **BR-TEST-004** | Tự động hóa bàn giao sang Chấm điểm | Ngay khi bài thi nộp thành công, hệ thống tự động phát hành sự kiện `exam.attempt.submitted` sang `grading-service` mà không cần can thiệp thủ công. |

---

## 2. Quy tắc Nghiệp vụ (Business Rules)

### RULE-TEST-001: Đồng hồ Server-Authoritative (Server-Side Time Tracking)
- Thời gian kết thúc bài thi được tính toán cố định tại thời điểm bắt đầu: $\text{ExpiresAt} = \text{StartedAt} + \text{DurationMinutes}$.
- Server từ chối tiếp nhận câu trả lời nếu thời gian gửi đến vượt quá $\text{ExpiresAt} + \text{GracePeriod}$ (`RULE-TEST-002`).

### RULE-TEST-002: Thời gian Gia hạn Trễ Mạng (Grace Period)
- Cho phép thời gian gia hạn tối đa là **30 giây** sau khi đồng hồ về $0:00$ để xử lý các gói tin đang trên đường truyền internet từ client lên server.
- Mọi payload gửi sau $30$ giây gia hạn sẽ bị từ chối với lỗi `E-TEST-003`.

### RULE-TEST-003: Tính Bất biến của Phiên thi Đã Nộp (Immutability After Submission)
- Khi một phiên thi (`attempt_id`) đã chuyển sang trạng thái `SUBMITTED`, toàn bộ câu trả lời bị khóa vĩnh viễn (Read-Only).
- Bất kỳ request chỉnh sửa hoặc lưu tiếp nào đều bị chặn ngay lập tức.

### RULE-TEST-004: Tần suất Lưu Tự động (Auto-Save Debouncing & Rate Limit)
- Thao tác chọn câu trắc nghiệm: Gửi lưu ngay lập tức.
- Thao tác gõ văn bản tự luận: Áp dụng cơ chế Debounce $2000$ms (người dùng dừng gõ 2 giây mới gửi gói tin) hoặc định kỳ $15$ giây/lần.
- Tần suất gửi request lưu từ cùng 1 client không được vượt quá 1 request/giây.

---

## 3. Ma trận Truy vết Yêu cầu Nghiệp vụ (Traceability Matrix)

| Mã BR | Tên BR | Nhu cầu Người dùng (URD) | Quy tắc Áp dụng |
| :--- | :--- | :--- | :--- |
| **BR-TEST-001** | Không gián đoạn & Zero Data Loss | `UR-TEST-002`, `UR-TEST-003`, `UR-TEST-005` | `RULE-TEST-004` |
| **BR-TEST-002** | Toàn vẹn thời gian thi | `UR-TEST-001`, `UR-TEST-004`, `UR-TEST-006` | `RULE-TEST-001`, `RULE-TEST-002` |
| **BR-TEST-003** | Hiệu năng cao phòng thi | `UR-TEST-005` | `RULE-TEST-004` |
| **BR-TEST-004** | Bàn giao sang Chấm điểm | `UR-TEST-006` | `RULE-TEST-003` |
