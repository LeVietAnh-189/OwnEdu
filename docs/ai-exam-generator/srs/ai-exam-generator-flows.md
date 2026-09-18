# Luồng Tương tác Hệ thống (System Flows) - ai-exam-generator

**Phân hệ**: `ai-exam-generator`  
**Microservice phối hợp**: `exam-service`, `ai-engine-worker`, `document-service`, `api-gateway`  
**Tài liệu liên quan**:
- [ai-exam-generator-spec.md](file:///C:/Nexis/ownedu/docs/ai-exam-generator/srs/ai-exam-generator-spec.md)
- [ai-exam-generator-brd.md](file:///C:/Nexis/ownedu/docs/ai-exam-generator/ai-exam-generator-brd.md)
- [ai-exam-generator-usecase-index.md](file:///C:/Nexis/ownedu/docs/ai-exam-generator/usecases/ai-exam-generator-usecase-index.md)

---

## 1. Sơ đồ Luồng Swimlane Xử lý Sinh Đề Thi AI (End-to-End Swimlane)

Sơ đồ phân định ranh giới và cơ chế điều phối bất đồng bộ giữa **Client (Web UI)**, **API Gateway**, **Exam Service**, **Message Queue (RabbitMQ)**, **AI Engine Worker**, và **Doc Service & LLM**:

![Sơ đồ Luồng Swimlane Sinh Đề Thi AI](file:///C:/Nexis/ownedu/docs/ai-exam-generator/srs/ai-exam-generator-swimlane.svg)

---

## 2. Diễn giải Chi tiết các Pha Điều phối (Phase Details)

### Pha 1: Nhận diện Cấu hình & Kiểm soát Hạn ngạch (Quota & Dispatch)
1. Người dùng thiết lập số lượng câu trắc nghiệm (MCQ: 1-50), câu tự luận (Essay: 0-10), cấp độ nhận thức Bloom và thời lượng.
2. Gửi request `POST /api/v1/exams/generate` qua **API Gateway**.
3. **Exam Service** kiểm tra hạn ngạch người dùng (`RULE-GEN-004`). Nếu hợp lệ, chuyển bài thi sang trạng thái `GENERATING`, đẩy message vào hàng đợi RabbitMQ `exam.generation.requested`.
4. Trả về mã phản hồi `202 Accepted` ngay lập tức trong vòng 200ms để không block Client, kèm URL Server-Sent Events (SSE).

### Pha 2: Điều phối Hàng đợi & Streaming Tiến độ (Async Queue & SSE)
1. Client thiết lập kết nối EventSource (SSE) tới `/api/v1/exams/jobs/{job_id}/stream`.
2. Giao diện hiển thị thanh tiến trình trực quan với các mốc trạng thái thời gian thực:
   - $15\%$: Đang lấy dữ liệu tài liệu nguồn.
   - $45\%$: Đang phân tích ngữ cảnh và gọi AI LLM.
   - $85\%$: Đang kiểm tra tính nhất quán và barem điểm rubric.
   - $100\%$: Hoàn tất bộ đề.

### Pha 3: RAG Semantic Context & Prompt Engineering
1. **AI Engine Worker** lấy job từ RabbitMQ, gọi nội bộ `document-service` để lấy chunks văn bản.
2. Thực hiện lọc ngữ cảnh (Semantic Clustering) để gói gọn trong giới hạn 8,000 - 16,000 tokens tối ưu chi phí (`BR-GEN-004`).
3. Dựng Prompt nghiêm ngặt với JSON Schema bắt buộc cho trắc nghiệm và barem rubric cho tự luận (`RULE-GEN-002`, `RULE-GEN-003`).
4. Gửi request tới LLM API (Google Gemini 1.5 Pro / GPT-4o).

### Pha 4: Validation, Barem Rubric & Tự phục hồi
1. Worker nhận kết quả JSON từ LLM và chạy bộ kiểm duyệt Zod Validator:
   - Đảm bảo 100% câu MCQ có đúng 1 đáp án chính xác và 3 đáp án nhiễu hợp lý.
   - Đảm bảo 100% câu Essay có câu trả lời mẫu và tiêu chí chấm điểm rubric chi tiết.
2. Nếu JSON bị méo hoặc thiếu cấu trúc: Kích hoạt cơ chế Re-prompting sửa lỗi (tối đa 2 lần).
3. Khi dữ liệu đạt chuẩn, lưu vào database `exam-service`, cập nhật trạng thái `READY_FOR_REVIEW`, bắn sự kiện hoàn tất qua SSE.

### Pha 5: Xem trước, Chỉnh sửa & Bàn giao Phòng thi
1. Client render giao diện Preview Đề thi tương tác cao.
2. Người dùng có toàn quyền xem lại, biên tập câu chữ, điều chỉnh thang điểm hoặc đổi phương án đúng nếu cần (`UR-GEN-005`).
3. Khi bấm **"Xuất bản Đề thi"**, trạng thái chuyển thành `PUBLISHED`, bàn giao trực tiếp cho phân hệ `interactive-testing` (`exam-service`) để học sinh bắt đầu làm bài.
