# Tài liệu Yêu cầu Người dùng (URD) - interactive-testing

**Phân hệ**: `interactive-testing`  
**Microservice chịu trách nhiệm**: `exam-service`  
**Phiên bản**: 1.0.0  
**Trạng thái**: Draft  
**Truy vết (Traceability)**:
- [project-brief.md](file:///C:/Nexis/ownedu/docs/_product/project-brief.md)
- [discovery.md](file:///C:/Nexis/ownedu/docs/_product/discovery.md)
- Phân hệ tiền đề: [ai-exam-generator-spec.md](file:///C:/Nexis/ownedu/docs/ai-exam-generator/srs/ai-exam-generator-spec.md)

---

## 1. Mục tiêu & Phạm vi (Objectives & Scope)
Phân hệ `interactive-testing` cung cấp giao diện phòng thi trực tuyến chuyên nghiệp, tập trung cao độ cho học sinh và sinh viên. Hệ thống đảm bảo tính liên tục của trải nghiệm làm bài thông qua cơ chế tự động lưu câu trả lời ngầm, đồng hồ đếm ngược đồng bộ từ server, hỗ trợ cả câu hỏi trắc nghiệm và khung soạn thảo bài làm tự luận, cũng như cơ chế nộp bài an toàn khi hết giờ.

---

## 2. Phân tích Persona & Nhu cầu (Persona Needs)

### Persona: Nam (Sinh viên Đại học)
- **Nhu cầu**: Làm bài thi thử 45 phút trên điện thoại hoặc laptop. Khi làm bài, muốn biết mình đã làm được bao nhiêu câu, câu nào chưa chắc chắn thì đánh dấu để quay lại sau.
- **Nỗi đau**: Sợ nhất là đang gõ bài tự luận dài thì mất mạng hoặc vô tình f5 trình duyệt mất sạch dữ liệu bài làm; sợ đồng hồ client chạy lệch so với server.
- **Kỳ vọng**: Hệ thống phải tự lưu liên tục sau mỗi thao tác chọn đáp án hoặc gõ phím; nếu rớt mạng có thông báo nhẹ và tự động đồng bộ lại khi có kết nối.

---

## 3. Danh sách Yêu cầu Người dùng (User Requirements Catalog)

| Mã Yêu cầu | Tên Yêu cầu | Mô tả Chi tiết | Mức độ Ưu tiên | Persona Mục tiêu |
| :--- | :--- | :--- | :--- | :--- |
| **UR-TEST-001** | Khởi tạo phiên thi an toàn | Người dùng có thể bắt đầu làm bài từ đề thi đã phát hành; hệ thống cấp mã phiên thi độc lập (`attempt_id`) và đồng bộ thời gian bắt đầu. | Bắt buộc (Must) | Nam, Học sinh |
| **UR-TEST-002** | Điều hướng câu hỏi thông minh | Bảng danh mục câu hỏi (Question Palette) cho phép nhảy nhanh đến câu bất kỳ, hiển thị trực quan: Đã trả lời, Chưa trả lời, Đã đánh dấu xem lại (Flagged). | Bắt buộc (Must) | Nam |
| **UR-TEST-003** | Khung làm bài tự luận chuyên dụng | Trình soạn thảo văn bản cho câu tự luận hỗ trợ đếm số từ, giãn dòng thoáng mắt, tự động lưu nháp sau mỗi 10 giây. | Bắt buộc (Must) | Nam |
| **UR-TEST-004** | Đồng hồ đếm ngược đồng bộ Server | Hiển thị thời gian còn lại đếm ngược chính xác; cảnh báo khi còn 5 phút và 1 phút cuối. | Bắt buộc (Must) | Nam |
| **UR-TEST-005** | Tự động lưu tiến độ làm bài (Auto-save) | Tự động đồng bộ câu trả lời ngầm về server, không yêu cầu người dùng phải bấm nút lưu thủ công. | Bắt buộc (Must) | Nam |
| **UR-TEST-006** | Tự động nộp bài khi hết giờ | Khi thời gian về 0:00, hệ thống tự động khóa form làm bài và gửi toàn bộ bài làm hiện tại về server để chuyển sang chấm điểm. | Bắt buộc (Must) | Nam |

---

## 4. Tiêu chí Chấp nhận Tổng thể (Acceptance Criteria)
- [ ] Dữ liệu bài làm trắc nghiệm được lưu ngay lập tức khi click chọn (độ trễ < 300ms).
- [ ] Dữ liệu bài tự luận được tự động lưu sau mỗi 10 giây hoặc sau khi người dùng ngừng gõ 2 giây (Debounce).
- [ ] Nếu đóng tab trình duyệt và mở lại khi còn thời gian thi, toàn bộ trạng thái bài làm được khôi phục 100%.
- [ ] Hết giờ thi, hệ thống lập tức khóa quyền nhập liệu và tự động kích hoạt nộp bài.
