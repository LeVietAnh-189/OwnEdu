# Luồng Tương tác Hệ thống (System Flows) - ai-grading-feedback

**Phân hệ**: `ai-grading-feedback`  
**Microservice phối hợp**: `grading-service`, `ai-engine-worker`, `api-gateway`  
**Tài liệu liên quan**:
- [ai-grading-feedback-spec.md](file:///C:/Nexis/ownedu/docs/ai-grading-feedback/srs/ai-grading-feedback-spec.md)
- [ai-grading-feedback-brd.md](file:///C:/Nexis/ownedu/docs/ai-grading-feedback/ai-grading-feedback-brd.md)
- [ai-grading-feedback-usecase-index.md](file:///C:/Nexis/ownedu/docs/ai-grading-feedback/usecases/ai-grading-feedback-usecase-index.md)

---

## 1. Sơ đồ Luồng Swimlane Chấm Điểm Hỗn Hợp & Báo Cáo Năng Lực (End-to-End Swimlane)

Sơ đồ phân định trách nhiệm giữa **Thí sinh / Giáo viên**, **API Gateway**, **Grading Service**, **Message Queue (RabbitMQ)**, **AI Engine Worker & LLM**, và **Grading Database**:

![Sơ đồ Luồng Swimlane Chấm Điểm Hỗn Hợp](file:///C:/Nexis/ownedu/docs/ai-grading-feedback/srs/ai-grading-feedback-swimlane.svg)

---

## 2. Diễn giải Chi tiết các Pha Xử lý (Phase Execution Details)

### Pha 1: Tiếp nhận Bài thi & Chấm Trắc nghiệm Tức thì
1. Ngay khi thí sinh nộp bài hoặc hết giờ thi, sự kiện `exam.attempt.submitted` được đẩy vào RabbitMQ.
2. `grading-service` tiêu thụ message, khởi tạo bản ghi điểm số.
3. Chạy bộ chấm trắc nghiệm xác định (Deterministic MCQ Evaluator):
   - So khớp `selected_option` với `correct_answer`.
   - Tính toán điểm trắc nghiệm `mcq_score` trong thời gian chưa đến 50ms.
   - Nếu bài thi không có câu tự luận, chuyển thẳng sang hoàn tất (`FINALIZED`).

### Pha 2: Điều phối Thẩm định Tự luận theo Barem Rubric bằng AI
1. Nếu bài thi có câu tự luận: Đóng gói bài viết của thí sinh, câu trả lời chuẩn và danh sách tiêu chí rubric.
2. Đẩy job `grading.essay.requested` vào RabbitMQ.
3. `ai-engine-worker` kéo job, kiểm tra độ dài ($\le 3000$ từ theo `RULE-GRADE-003`).
4. Lắp ráp Prompt sư phạm và gọi LLM (Gemini 1.5 Pro / GPT-4o) với `temperature: 0.1` để đảm bảo chấm chuẩn xác tuyệt đối.
5. Validator kiểm tra dữ liệu trả về: Đảm bảo có nhận xét giải thích cho từng tiêu chí rubric bị trừ điểm (`RULE-GRADE-002`) và điểm không vượt trần (`RULE-GRADE-003`).
6. Trả kết quả về `grading-service` qua event `grading.essay.completed`.

### Pha 3: Tổng hợp Điểm số & Phân tích Năng lực Bloom
1. Tổng hợp điểm số bài thi về thang 10 chuẩn hóa (`RULE-GRADE-001`).
2. Tính toán tỷ lệ phần trăm thành thạo theo 4 mức nhận thức Bloom (Nhận biết, Thông hiểu, Vận dụng, Phân tích).
3. Đối chiếu các câu làm sai với các đoạn tài liệu gốc từ `document-service` để tự động tạo danh sách gợi ý ôn tập (Knowledge Gap Analysis).
4. Lưu toàn bộ dữ liệu vào `Grading DB` và phát thông báo hoàn tất tới Client.

### Pha 4: Hiển thị Báo cáo & Quyền Can thiệp của Giáo viên (Teacher Grade Override)
1. Thí sinh và giáo viên mở giao diện Kết quả bài thi: Xem biểu đồ Radar Bloom, danh sách câu đúng/sai, barem rubric đạt được và tài liệu gợi ý đọc lại.
2. Đối với lớp học do giáo viên quản lý:
   - Giáo viên có quyền điều chỉnh lại điểm tự luận và thêm nhận xét sư phạm.
   - Điểm do giáo viên điều chỉnh được lưu vào `final_score`, giữ nguyên điểm ban đầu của AI ở `ai_score` để đảm bảo tính minh bạch và truy vết (`RULE-GRADE-004`).
