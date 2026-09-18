# Chi tiết Use Case: UC-GRADE-002 - Thẩm định Tự luận theo Rubric bằng AI

**Mã Use Case**: `UC-GRADE-002`  
**Tên Use Case**: Thẩm định Tự luận theo Rubric bằng AI (AI Essay Evaluation with Rubric Schema)  
**Phân hệ**: `ai-grading-feedback`  
**Microservice**: `ai-engine-worker` / `grading-service`  
**Actor chính**: Hệ thống (`ai-engine-worker`)  
**Truy vết**: `UR-GRADE-002`, `BR-GRADE-002`, `FR-GRADE-003`, `FR-GRADE-004`, `RULE-GRADE-002`, `RULE-GRADE-003`

---

## 1. Tiền điều kiện (Preconditions)
1. Bài thi có chứa ít nhất một câu hỏi tự luận (`ESSAY`).
2. Tác vụ chấm tự luận `grading.essay.requested` đã có trong hàng đợi RabbitMQ.

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path)
1. `ai-engine-worker` kéo message chấm tự luận từ hàng đợi.
2. Với mỗi câu hỏi tự luận trong bài làm:
   - Lấy `student_text` (bài viết của thí sinh), cắt tỉa tối đa 3,000 từ (`RULE-GRADE-003`).
   - Lấy `benchmark_answer` (câu trả lời chuẩn).
   - Lấy danh sách các tiêu chí rubric thành phần (`criteria`, `max_points`).
3. Worker xây dựng Prompt thẩm định sư phạm:
   - **System Instruction**: Đóng vai trò giám khảo công tâm, chấm điểm bám sát từng tiêu chí rubric, không thiên vị, không cho điểm ngoài rubric.
   - **Grading Prompt**: Cung cấp đề bài, đáp án chuẩn, bài làm của thí sinh và danh sách rubric. Yêu cầu trả về JSON có cấu trúc rõ ràng (`RULE-GEN-003`).
4. Worker gọi LLM (Gemini 1.5 Pro / GPT-4o) với `temperature: 0.1` để đảm bảo độ ổn định và tính nhất quán cao nhất.
5. Nhận kết quả từ LLM, kiểm tra tính hợp lệ:
   - Tổng điểm các tiêu chí đạt được phải nhỏ hơn hoặc bằng điểm tối đa của câu hỏi (`RULE-GRADE-003`).
   - Mọi tiêu chí bị trừ điểm đều phải có lời giải thích cụ thể (`RULE-GRADE-002`).
6. Worker đóng gói kết quả chấm tự luận, đẩy event `grading.essay.completed` vào RabbitMQ.
7. `grading-service` nhận kết quả, cập nhật vào bảng điểm của bài thi và chuyển trạng thái sang `FINALIZED`.

---

## 3. Các Luồng Ngoại lệ (Exception Flows)

### 3.1. Luồng E1: Thí sinh nộp bài tự luận trắng (Empty Essay)
- Nếu `student_text` rỗng hoặc chỉ có khoảng trắng:
- Worker không cần gọi LLM (giúp tiết kiệm token), tự động chấm 0 điểm cho câu hỏi đó, nhận xét: "Thí sinh không làm bài tự luận này."

### 3.2. Luồng E2: LLM Timeout hoặc quá tải (`E-GRADE-002`)
- Quá trình gọi LLM vượt quá thời gian chờ (30 giây).
- Hệ thống kích hoạt cơ chế suy biến an toàn (Graceful Degradation - `RULE-GRADE-005`):
  - Tạm thời gán nhãn câu hỏi: `Đang chờ chấm điểm tự luận`.
  - Vẫn cho phép thí sinh xem trước điểm trắc nghiệm.
  - Xếp lại bài thi vào hàng đợi ưu tiên retry.

---

## 4. Hậu điều kiện (Postconditions)
- Toàn bộ câu tự luận được chấm điểm chi tiết theo rubric.
- Lời nhận xét phân tích rõ ràng từng tiêu chí điểm đạt và điểm mất.
