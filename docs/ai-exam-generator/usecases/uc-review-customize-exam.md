# Chi tiết Use Case: UC-GEN-003 - Xem trước, Chỉnh sửa & Xuất bản Đề thi

**Mã Use Case**: `UC-GEN-003`  
**Tên Use Case**: Xem trước, Chỉnh sửa & Xuất bản Đề thi (Review, Customize & Publish Exam)  
**Phân hệ**: `ai-exam-generator`  
**Microservice**: `exam-service`  
**Actor chính**: Học sinh / Sinh viên / Giáo viên  
**Truy vết**: `UR-GEN-005`, `UR-GEN-006`, `FR-GEN-007`, `FR-GEN-008`

---

## 1. Tiền điều kiện (Preconditions)
1. Tác vụ sinh đề `UC-GEN-002` đã hoàn tất thành công.
2. Đề thi đang ở trạng thái `READY_FOR_REVIEW`.
3. Người dùng sở hữu đề thi đó (Tenant & User isolation).

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path)
1. Giao diện hiển thị danh sách toàn bộ các câu hỏi đã được AI sinh ra (gồm các thẻ câu trắc nghiệm và tự luận).
2. Người dùng cuộn xem từng câu:
   - Câu trắc nghiệm: Đề bài, 4 phương án lựa chọn, nhãn đáp án đúng (tô màu xanh), giải thích chi tiết.
   - Câu tự luận: Đề bài, câu trả lời gợi ý chuẩn, bảng barem rubric điểm thành phần.
3. Người dùng thực hiện các thao tác tùy biến nếu muốn:
   - Nhấn vào tiêu đề hoặc phương án để sửa lại từ ngữ cho tự nhiên hơn.
   - Bấm nút "Đổi đáp án đúng" nếu muốn đổi từ A sang B.
   - Bấm nút "Xóa câu hỏi" nếu thấy câu không cần thiết (hệ thống tự động cập nhật lại tổng điểm thang 10).
   - Thêm câu hỏi thủ công nếu muốn.
4. Người dùng nhấn nút **"Xuất bản Đề thi" (Publish Exam)** hoặc **"Bắt đầu Làm bài Ngay" (Take Exam Now)**.
5. Client gửi request `POST /api/v1/exams/{exam_id}/publish`.
6. `exam-service` kiểm tra tính toàn vẹn: Tổng điểm các câu hỏi hợp lệ, không có câu hỏi rỗng nội dung.
7. `exam-service` cập nhật trạng thái đề thi thành `PUBLISHED`.
8. Hệ thống điều hướng:
   - Nếu là Học sinh/Sinh viên chọn "Làm bài ngay": Chuyển hướng trực tiếp vào phòng thi của `interactive-testing` (`exam-service`).
   - Nếu là Giáo viên: Hiển thị màn hình link chia sẻ đề thi (Shareable Link / Room Code) để học sinh vào thi.

---

## 3. Các Luồng Thay thế & Ngoại lệ (Alternative & Exception Flows)

### 3.1. Luồng A1: Tái sinh câu hỏi đơn lẻ (Regenerate Single Question)
- Tại bước 3, người dùng không thích câu số 4 (nội dung chưa hay).
- Người dùng nhấn biểu tượng "Sinh lại câu này" (Regenerate).
- Client gửi request `POST /api/v1/exams/{exam_id}/questions/{q_id}/regenerate`.
- AI worker chỉ sinh lại đúng 1 câu thay thế từ chunk tương ứng và cập nhật vào đề thi trong 3-5 giây.

### 3.2. Luồng E1: Barem rubric câu tự luận bị sửa sai tổng điểm
- Người dùng sửa điểm các tiêu chí rubric thành phần nhưng tổng điểm không khớp với tổng điểm của câu hỏi đó (`points`).
- Hệ thống cảnh báo đỏ dưới bảng rubric: "Tổng điểm các tiêu chí (3.0) phải bằng số điểm của câu hỏi (2.5)."
- Nút "Xuất bản" bị vô hiệu hóa cho đến khi người dùng điều chỉnh chuẩn xác.

---

## 4. Hậu điều kiện (Postconditions)
- Đề thi chuyển sang trạng thái `PUBLISHED` và sẵn sàng làm bài hoặc chia sẻ.
- Lịch sử chỉnh sửa được ghi nhận.
