# Chi tiết Use Case: UC-GRADE-003 - Xem Báo cáo Kết quả & Nhận xét

**Mã Use Case**: `UC-GRADE-003`  
**Tên Use Case**: Xem Báo cáo Kết quả & Nhận xét (View Analytics & Grade Override)  
**Phân hệ**: `ai-grading-feedback`  
**Microservice**: `grading-service`  
**Actor chính**: Học sinh / Sinh viên / Giáo viên  
**Truy vết**: `UR-GRADE-003`, `UR-GRADE-004`, `UR-GRADE-005`, `FR-GRADE-005`, `FR-GRADE-006`, `FR-GRADE-007`, `RULE-GRADE-004`

---

## 1. Tiền điều kiện (Preconditions)
1. Bài thi đã được chấm điểm hoàn tất (`status: FINALIZED`).
2. Người dùng đã đăng nhập và có quyền xem kết quả của phiên thi đó (Chính thí sinh hoặc Giáo viên tạo đề).

---

## 2. Luồng Cơ bản (Main Scenario - Happy Path: Học sinh Xem Kết quả)
1. Học sinh truy cập màn hình Kết quả bài thi hoặc bấm vào thông báo hoàn tất chấm bài.
2. Client gửi request `GET /api/v1/attempts/{attempt_id}/result`.
3. `grading-service` trả về toàn bộ dữ liệu báo cáo:
   - **Hero Card**: Tổng điểm (ví dụ: `8.5 / 10.0`), Điểm trắc nghiệm (6.5/7.5), Điểm tự luận (2.0/2.5), Thời gian làm bài.
   - **Radar Chart**: Biểu đồ mạng nhện thể hiện tỷ lệ đạt theo 4 cấp độ Bloom (Nhận biết 100%, Thông hiểu 83%, Vận dụng 75%, Phân tích 80%).
   - **Chi tiết từng câu hỏi**:
     - Câu trắc nghiệm: Hiển thị phương án đã chọn, đúng hay sai, và giải thích chi tiết đáp án.
     - Câu tự luận: Hiển thị bài viết của học sinh, đáp án chuẩn, và bảng đánh giá từng tiêu chí rubric.
   - **Lỗ hổng kiến thức & Gợi ý ôn tập**: Danh sách các chủ đề còn yếu kèm liên kết trỏ thẳng tới các trang trong tài liệu ban đầu.
4. Học sinh có thể bấm vào liên kết để mở ngay đoạn tài liệu cần đọc lại.

---

## 3. Các Luồng Thay thế & Can thiệp của Giáo viên (Teacher Override Flow)

### 3.1. Luồng A1: Giáo viên Duyệt và Điều chỉnh Điểm (`RULE-GRADE-004`)
1. Giáo viên truy cập danh sách bài nộp của cả lớp, chọn bài thi của học sinh Nam.
2. Giao diện hiển thị thêm các trường:
   - Nút **"Chỉnh sửa điểm"** (Edit Grade).
   - Ô nhập nhận xét bổ sung của giáo viên.
3. Giáo viên thấy bài tự luận của Nam viết rất sáng tạo dù ví dụ hơi ngắn, quyết định nâng điểm tiêu chí 3 từ `0.5` lên `1.0` (Tổng điểm câu tự luận từ `2.0` thành `2.5`).
4. Giáo viên nhập lý do: *"Ý tưởng sáng tạo, diễn đạt mạch lạc nên khuyến khích thêm 0.5đ"* và nhấn **"Lưu thay đổi"**.
5. Client gửi request `POST /api/v1/attempts/{attempt_id}/override-grade`.
6. Hệ thống lưu điểm mới vào `final_score`, giữ nguyên điểm AI ban đầu vào `ai_score` để đảm bảo tính minh bạch, cập nhật tổng điểm lên `9.0 / 10.0`.
7. Học sinh Nam nhận được thông báo: *"Giáo viên đã cập nhật lại điểm bài thi của bạn."*

### 3.2. Luồng E1: Thí sinh cố tình gọi API chỉnh điểm (`E-GRADE-003`)
- Học sinh gửi request can thiệp điểm số qua endpoint của giáo viên.
- Server phát hiện JWT không có quyền Giáo viên sở hữu đề thi, lập tức trả về lỗi `403 Forbidden` (`E-GRADE-003`).

---

## 4. Hậu điều kiện (Postconditions)
- Người học nắm rõ điểm mạnh, điểm yếu và phương hướng ôn tập cụ thể.
- Mọi điều chỉnh của giáo viên được ghi vết kiểm toán (Audit Trail) đầy đủ.
