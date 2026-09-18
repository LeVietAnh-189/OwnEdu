# Chi tiết Use Case: UC-GEN-002 - Bóc tách Context & Prompting LLM

**Mã Use Case**: `UC-GEN-002`  
**Tên Use Case**: Bóc tách Context & Prompting LLM (AI Context Processing & Question Synthesis)  
**Phân hệ**: `ai-exam-generator`  
**Microservice**: `ai-engine-worker`  
**Actor chính**: Hệ thống (Background Worker)  
**Truy vết**: `UR-GEN-004`, `BR-GEN-002`, `BR-GEN-003`, `FR-GEN-002`, `FR-GEN-003`, `FR-GEN-005`, `RULE-GEN-002`, `RULE-GEN-003`, `RULE-GEN-005`

---

## 1. Tiền điều kiện (Preconditions)
1. Tác vụ sinh đề có mặt trong hàng đợi `exam.generation.requested`.
2. Microservice `ai-engine-worker` đang hoạt động bình thường và kết nối được LLM API (Gemini 1.5 Pro / GPT-4o).

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path)
1. Worker nhận message từ hàng đợi, trích xuất `job_id`, `document_id` và các tham số cấu hình.
2. Worker phát sự kiện qua Redis Pub/Sub: `{status: "FETCHING_CONTEXT", percent: 15}`.
3. Worker gọi nội bộ sang `document-service` để lấy danh sách chunks của tài liệu.
4. Worker áp dụng thuật toán lọc Semantic Clustering:
   - Sắp xếp các đoạn văn bản theo trọng số nội dung chính.
   - Giới hạn tổng độ dài context trong khoảng 8,000 - 16,000 tokens để tránh lãng phí chi phí.
5. Worker dựng Prompt hoàn chỉnh:
   - **System Prompt**: Định nghĩa vai trò chuyên gia sư phạm, yêu cầu độ chính xác 100%, không bịa đặt.
   - **User Prompt**: Bơm context tài liệu, cấu hình số lượng MCQ/Essay, Bloom levels.
   - **Schema Contract**: Ép trả về đúng định dạng JSON Schema có trường rubric cho essay (`RULE-GEN-002`, `RULE-GEN-003`).
6. Worker phát sự kiện: `{status: "PROMPTING_LLM", percent: 45}`.
7. Worker gửi request tới LLM API với tham số `temperature: 0.2` (giảm sáng tạo ngẫu nhiên, tăng tính bám sát sự thật).
8. Worker nhận chuỗi JSON kết quả từ LLM.
9. Worker phát sự kiện: `{status: "VALIDATING_SCHEMA", percent: 85}`.
10. Lớp Schema Validator kiểm tra:
    - Cấu trúc câu hỏi MCQ có đúng 4 options A/B/C/D và 1 correct_answer.
    - Cấu trúc câu hỏi Essay có benchmark_answer và danh sách rubric với tổng điểm = 100%.
11. Dữ liệu hợp lệ, worker lưu kết quả vào database của `exam-service`, cập nhật trạng thái đề thi thành `READY_FOR_REVIEW`.
12. Worker phát sự kiện hoàn thành: `{status: "COMPLETED", percent: 100, exam_id: "..."}`. Kênh SSE đóng lại, trình duyệt người dùng tự động chuyển sang `UC-GEN-003`.

---

## 3. Các Luồng Ngoại lệ (Exception Flows)

### 3.1. Luồng E1: Dữ liệu tài liệu quá ngắn (`E-GEN-002`)
- Tại bước 3, tổng số từ bóc tách được < 300 từ.
- Worker hủy tác vụ, cập nhật trạng thái `FAILED` với mã lỗi `E-GEN-002`.
- Gửi thông báo tới Client: "Tài liệu quá ngắn để tạo bộ câu hỏi theo yêu cầu. Vui lòng tải tài liệu chi tiết hơn."

### 3.2. Luồng E2: JSON trả về bị sai cấu trúc / Thiếu rubric (`E-GEN-004`)
- Tại bước 10, JSON bị cắt cụt do đứt mạng hoặc thiếu trường `rubric` trong câu tự luận.
- Worker kích hoạt cơ chế Retry lần 1: Gửi lại phần JSON lỗi kèm prompt sửa lỗi (JSON repair instruction).
- Nếu sau 2 lần retry vẫn không đạt chuẩn schema:
  - Chuyển trạng thái Job thành `FAILED` với mã lỗi `E-GEN-004`.
  - Hoàn trả lại hạn ngạch cho người dùng.

### 3.3. Luồng E3: Timeout vượt quá 90 giây (`E-GEN-005`)
- Nếu cuộc gọi LLM bị treo hoặc hàng đợi bị quá tải quá 90 giây:
- Cơ chế Heartbeat của Worker ngắt kết nối, đánh dấu Job là `FAILED` với mã lỗi `E-GEN-005`.

---

## 4. Hậu điều kiện (Postconditions)
- Đề thi hoàn chỉnh được lưu trữ an toàn trong DB với đầy đủ metadata, câu hỏi, đáp án, giải thích và barem rubric.
- Người dùng nhận được thông báo sẵn sàng xem trước và chỉnh sửa đề thi.
