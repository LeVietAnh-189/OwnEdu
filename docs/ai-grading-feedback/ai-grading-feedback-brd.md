# Tài liệu Yêu cầu Nghiệp vụ (BRD) - ai-grading-feedback

**Phân hệ**: `ai-grading-feedback`  
**Microservice chịu trách nhiệm**: `grading-service`  
**Phiên bản**: 1.0.0  
**Trạng thái**: Draft  
**Truy vết (Traceability)**:
- [ai-grading-feedback-urd.md](file:///C:/Nexis/ownedu/docs/ai-grading-feedback/ai-grading-feedback-urd.md)

---

## 1. Mục tiêu Nghiệp vụ (Business Objectives)

| Mã Mục tiêu | Tên Mục tiêu | Mô tả Đo lường |
| :--- | :--- | :--- |
| **BR-GRADE-001** | Phản hồi Tức thì (Instant Feedback Loop) | Trả kết quả trắc nghiệm ngay lập tức (< 3s) và kết quả tự luận trong vòng < 30s, giúp tăng 70% hiệu quả ghi nhớ so với chấm truyền thống. |
| **BR-GRADE-002** | Chuẩn hóa & Công bằng trong Chấm Tự luận | Đảm bảo tính nhất quán 100% khi chấm cùng một bài thi nhờ barem rubric cố định, loại bỏ hoàn toàn cảm xúc chủ quan hoặc sự mệt mỏi của người chấm. |
| **BR-GRADE-003** | Giải phóng Thời gian cho Giáo viên | Giảm 95% thời gian chấm bài định kỳ cho giáo viên (từ 20 phút/bài tự luận xuống còn 30 giây duyệt kết quả AI). |
| **BR-GRADE-004** | Cá nhân hóa Lộ trình Ôn tập | Tự động phân tích điểm yếu kiến thức và trỏ thẳng tới các trang tài liệu cần đọc lại trong tài liệu gốc. |

---

## 2. Quy tắc Nghiệp vụ (Business Rules)

### RULE-GRADE-001: Công thức Chuẩn hóa Điểm Tổng hợp (Composite Scoring)
- Tổng điểm bài thi được quy chuẩn về thang điểm 10.0 (làm tròn đến 1 chữ số thập phân).
- Điểm bài thi là tổng điểm thực tế đạt được của toàn bộ câu hỏi trắc nghiệm và tự luận:
$$\text{FinalScore} = \sum_{i=1}^{N_{MCQ}} \text{Score}_{MCQ, i} + \sum_{j=1}^{N_{Essay}} \text{Score}_{Essay, j}$$
- Nếu câu trắc nghiệm đúng thì nhận 100% điểm của câu đó, nếu sai hoặc bỏ trắng thì nhận 0 điểm (không áp dụng điểm trừ nếu không cấu hình).

### RULE-GRADE-002: Bắt buộc Phản hồi Tiêu chí Rubric (Mandatory Rubric Justification)
- Khi chấm câu hỏi tự luận, AI bắt buộc phải phân tích và chấm điểm riêng cho từng tiêu chí trong danh mục rubric của câu hỏi đó.
- Điểm số đạt được của mỗi tiêu chí phải thỏa mãn: $0 \le \text{EarnedPoints}_k \le \text{MaxPoints}_k$.
- Với mỗi tiêu chí không đạt điểm tối đa, AI bắt buộc phải đưa ra dẫn chứng giải thích: "Thí sinh thiếu ý gì so với đáp án mẫu".

### RULE-GRADE-003: Giới hạn Kích thước Bài làm Tự luận (Essay Word Limit)
- Bài làm tự luận của thí sinh chấp nhận độ dài tối đa là 3,000 từ. Nếu vượt quá, hệ thống chỉ lấy 3,000 từ đầu tiên để gửi cho AI chấm và cảnh báo thí sinh.

### RULE-GRADE-004: Cơ chế Can thiệp & Ghi đè của Giáo viên (Teacher Grade Override)
- Đối với bài thi trong lớp học do giáo viên tổ chức, giáo viên có quyền ghi đè điểm số của AI.
- Dữ liệu điểm số của AI được lưu trữ nguyên vẹn ở trường `ai_score`. Điểm số do giáo viên điều chỉnh được lưu ở `final_score` kèm trường `override_reason` và `updated_by` để phục vụ thanh tra audit.

### RULE-GRADE-005: Xử lý Khi Sự cố Chấm Tự luận AI (Graceful Degradation)
- Nếu AI Engine Worker bị quá tải hoặc gặp lỗi khi chấm tự luận, hệ thống vẫn hiển thị kết quả trắc nghiệm trước cho thí sinh và gắn nhãn câu tự luận: `Đang phân tích bài viết...`. Kết quả tự luận sẽ được cập nhật tự động qua WebSocket/Polling sau đó mà không làm mất bài thi.

---

## 3. Ma trận Truy vết Yêu cầu Nghiệp vụ (Traceability Matrix)

| Mã BR | Tên BR | Nhu cầu Người dùng (URD) | Quy tắc Áp dụng |
| :--- | :--- | :--- | :--- |
| **BR-GRADE-001** | Phản hồi Tức thì | `UR-GRADE-001`, `UR-GRADE-002` | `RULE-GRADE-001`, `RULE-GRADE-005` |
| **BR-GRADE-002** | Công bằng chấm tự luận | `UR-GRADE-002` | `RULE-GRADE-002`, `RULE-GRADE-003` |
| **BR-GRADE-003** | Giải phóng thời gian giáo viên | `UR-GRADE-005` | `RULE-GRADE-004` |
| **BR-GRADE-004** | Cá nhân hóa ôn tập | `UR-GRADE-003`, `UR-GRADE-004` | `RULE-GRADE-001`, `RULE-GRADE-002` |
