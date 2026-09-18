# Chi tiết Use Case: UC-GRADE-001 - Chấm điểm Trắc nghiệm Xác định

**Mã Use Case**: `UC-GRADE-001`  
**Tên Use Case**: Chấm điểm Trắc nghiệm Xác định (Deterministic Automated MCQ Grading)  
**Phân hệ**: `ai-grading-feedback`  
**Microservice**: `grading-service`  
**Actor chính**: Hệ thống (Message Consumer)  
**Truy vết**: `UR-GRADE-001`, `BR-GRADE-001`, `FR-GRADE-001`, `FR-GRADE-002`, `RULE-GRADE-001`

---

## 1. Tiền điều kiện (Preconditions)
1. Sự kiện `exam.attempt.submitted` đã được đẩy vào hàng đợi RabbitMQ từ `exam-service`.
2. Microservice `grading-service` đang lắng nghe hàng đợi.

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path)
1. `grading-service` tiêu thụ message `exam.attempt.submitted`.
2. Khởi tạo bản ghi kết quả `grade_reports` cho `attempt_id`.
3. Bộ xử lý trắc nghiệm (MCQ Evaluator) duyệt qua danh sách các câu hỏi loại `MCQ`:
   - So sánh `selected_option` của thí sinh với `correct_answer` của đề thi.
   - Nếu trùng khớp: Gán điểm bằng `points` của câu hỏi đó, đánh dấu `is_correct = true`.
   - Nếu không trùng hoặc thí sinh bỏ trắng: Gán `points = 0`, đánh dấu `is_correct = false`.
   - Lưu trữ kèm chuỗi `explanation` giải thích vì sao đáp án đó đúng.
4. Tính tổng điểm trắc nghiệm `mcq_score = SUM(earned_mcq_points)`.
5. Đếm số câu đúng: `correct_mcq_count / total_mcq_count`.
6. Kiểm tra xem đề thi có chứa câu hỏi tự luận (`ESSAY`) hay không:
   - **Nếu CÓ câu tự luận**: Chuyển trạng thái sang `WAITING_FOR_AI_ESSAY`, đẩy job sang queue `grading.essay.requested` (Kích hoạt `UC-GRADE-002`).
   - **Nếu KHÔNG CÓ câu tự luận**: Chuyển ngay trạng thái sang `FINALIZED`, tính tổng điểm và phát tín hiệu hoàn tất chấm điểm về Client qua WebSocket / SSE.

---

## 3. Các Luồng Ngoại lệ (Exception Flows)

### 3.1. Luồng E1: Dữ liệu bài làm bị thiếu thông tin câu hỏi
- Payload sự kiện bị thiếu danh sách đáp án đúng do lỗi đồng bộ từ `exam-service`.
- `grading-service` từ chối xử lý, đẩy message vào Dead-Letter Queue (DLQ) và ghi alert log để DevOps kiểm tra.

---

## 4. Hậu điều kiện (Postconditions)
- 100% câu hỏi trắc nghiệm được chấm xong trong thời gian < 50ms.
- Điểm trắc nghiệm và danh sách đúng/sai sẵn sàng hiển thị.
