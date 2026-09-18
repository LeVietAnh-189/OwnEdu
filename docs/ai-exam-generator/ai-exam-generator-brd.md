# Tài liệu Yêu cầu Nghiệp vụ (BRD) - ai-exam-generator

**Phân hệ**: `ai-exam-generator`  
**Microservice chịu trách nhiệm**: `ai-engine-worker`  
**Phiên bản**: 1.0.0  
**Trạng thái**: Draft  
**Truy vết (Traceability)**:
- [ai-exam-generator-urd.md](file:///C:/Nexis/ownedu/docs/ai-exam-generator/ai-exam-generator-urd.md)

---

## 1. Mục tiêu Nghiệp vụ (Business Objectives)

| Mã Mục tiêu | Tên Mục tiêu | Mô tả Đo lường |
| :--- | :--- | :--- |
| **BR-GEN-001** | Tự động hóa tạo đề thi hỗn hợp | Giảm 90% thời gian tạo đề thi học tập (từ 3 giờ thủ công xuống dưới 60 giây nhờ AI RAG). |
| **BR-GEN-002** | Đảm bảo độ chính xác học thuật | Đảm bảo 100% câu hỏi bám sát dữ liệu bóc tách từ tài liệu nguồn; triệt tiêu hoàn toàn hiện tượng sinh câu hỏi lạc đề do AI hallucination. |
| **BR-GEN-003** | Chuẩn hóa barem tự luận cho chấm điểm tự động | Mọi câu hỏi tự luận sinh ra bắt buộc đi kèm rubric tiêu chí chấm điểm chi tiết để phục vụ phân hệ `grading-service`. |
| **BR-GEN-004** | Kiểm soát chi phí Token AI | Tối ưu hóa context injection qua RAG Semantic Search và Chunk clustering để chi phí token LLM trung bình $\le 0.02\$$ mỗi đề thi 25 câu. |

---

## 2. Quy tắc Nghiệp vụ (Business Rules)

### RULE-GEN-001: Ràng buộc Quy mô Đề thi (Exam Structure Boundaries)
- Số lượng câu trắc nghiệm (MCQ): Tối thiểu 1 câu, tối đa 50 câu.
- Số lượng câu tự luận (Essay): Tối thiểu 0 câu, tối đa 10 câu.
- Tổng số lượng câu hỏi trong một đề không được vượt quá 60 câu.
- Thời lượng gợi ý làm bài: Tự động tính toán theo công thức: $\text{Duration (phút)} = (\text{MCQ} \times 1.5) + (\text{Essay} \times 10)$, làm tròn lên bội số của 5 phút (tối thiểu 10 phút, tối đa 180 phút).

### RULE-GEN-002: Bắt buộc Barem Rubric cho Câu hỏi Tự luận (Mandatory Scoring Rubric)
- Mọi câu hỏi Essay sinh ra bắt buộc phải bao gồm:
  1. Đề bài chi tiết (Problem statement).
  2. Câu trả lời mẫu / Ý tưởng chuẩn (Sample benchmark answer).
  3. Barem chấm điểm (Rubric Breakdown) gồm tối thiểu 2 tiêu chí đánh giá (ví dụ: Nắm vững khái niệm, Lập luận logic, Dẫn chứng tài liệu).
  4. Tổng điểm các tiêu chí rubric thành phần phải đúng bằng 100% số điểm gán cho câu hỏi đó.

### RULE-GEN-003: Kiểm soát Chuẩn đầu ra LLM bằng Schema Cứng (Strict JSON Schema Enforcement)
- Toàn bộ kết quả sinh từ LLM bắt buộc phải tuân theo JSON Schema quy định.
- Trước khi lưu trữ vào Database hoặc chuyển sang `exam-service`, Payload kết quả phải vượt qua lớp Validator (Zod / JSON Schema).
- Nếu JSON bị lỗi cú pháp hoặc thiếu trường dữ liệu cốt lõi, worker tự động kích hoạt retry cơ chế sửa lỗi (JSON Repair / Re-prompt) tối đa 2 lần.

### RULE-GEN-004: Định mức Hạn ngạch & Chống Lạm dụng (Quotas & Rate Limiting)
- Người dùng tài khoản Miễn phí (Free): Tối đa 5 lượt sinh đề trong 24 giờ, tối đa 20 câu/đề.
- Người dùng Pro / Giáo viên: Tối đa 50 lượt sinh đề trong 24 giờ, tối đa 60 câu/đề.
- Khoảng cách giữa 2 yêu cầu sinh đề liên tiếp từ cùng một tài khoản tối thiểu là 10 giây để chống spam queue.

### RULE-GEN-005: Xử lý Tác vụ Bất đồng bộ & Timeout (Async Worker SLA)
- Yêu cầu sinh đề bắt buộc phải xử lý qua Hàng đợi tin nhắn (Message Queue - RabbitMQ/Redis Streams) để tránh làm nghẽn API Gateway.
- Thời gian chờ xử lý tối đa cho 1 Job là 90 giây. Nếu sau 90 giây LLM không phản hồi hoặc worker gặp sự cố, hệ thống chuyển Job sang trạng thái `FAILED`, hoàn lại quota cho người dùng và gửi thông báo lỗi `E-GEN-005`.

---

## 3. Ma trận Truy vết Yêu cầu Nghiệp vụ (Traceability Matrix)

| Mã BR | Tên BR | Nhu cầu Người dùng (URD) | Quy tắc Áp dụng |
| :--- | :--- | :--- | :--- |
| **BR-GEN-001** | Tự động hóa tạo đề | `UR-GEN-001`, `UR-GEN-004` | `RULE-GEN-001`, `RULE-GEN-005` |
| **BR-GEN-002** | Độ chính xác học thuật | `UR-GEN-002`, `UR-GEN-003` | `RULE-GEN-003` |
| **BR-GEN-003** | Chuẩn hóa barem tự luận | `UR-GEN-005` | `RULE-GEN-002` |
| **BR-GEN-004** | Kiểm soát chi phí AI | `UR-GEN-004` | `RULE-GEN-004`, `RULE-GEN-005` |
