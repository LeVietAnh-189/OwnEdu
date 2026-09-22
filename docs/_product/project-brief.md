---
type: project-brief
project_id: PROJ-OWNEDU
status: in-review
updated: 2026-09-18
links: []
---

# OwnEdu — Project Brief (Hồ Sơ Sơ Bộ Dự Án)

> **Dự án**: Nền tảng học tập thông minh chuyển đổi tài liệu học tập thành đề thi & chấm điểm tự động bằng AI  
> **Phiên bản**: v1.0.0 (Giai đoạn khởi tạo Khảo sát - Discovery)

---

## 🎯 I. Problem (Vấn đề thực tế)

1. **Đối với Học sinh & Sinh viên**:
   - Khi tiếp cận các tài liệu học tập dài (slide bài giảng, giáo trình PDF, tài liệu ôn thi DOCX), người học thường tiếp thu thụ động (chỉ đọc lướt), khó tự kiểm chứng xem mình đã thực sự hiểu và ghi nhớ kiến thức hay chưa.
   - Thiếu các bộ câu hỏi ôn tập bám sát chính xác tài liệu riêng mà giảng viên trên lớp cung cấp; việc tự tìm đề trên mạng thường lan man, không khớp trọng tâm môn học.

2. **Đối với Giáo viên / Giảng viên**:
   - Mất rất nhiều thời gian và công sức để soạn ngân hàng câu hỏi (trắc nghiệm 4 lựa chọn, câu hỏi tự luận theo barem) từ tài liệu bài giảng mới.
   - Quá tải trong khâu chấm bài tự luận thủ công cho số lượng lớn học sinh, dẫn đến việc phản hồi kết quả và chỉ ra lỗi sai bị chậm trễ.

---

## 👥 II. Intended users & Phân quyền hệ thống (2 Vai trò cốt lõi)

| Phân quyền (Role) | Đối tượng đại diện | Mục đích & Phạm vi sử dụng |
|---|---|---|
| **Role `USER`** | **Học sinh, Sinh viên, Giảng viên** | **Dùng để học tập & khảo thí**: Tải tài liệu/giáo trình lên, yêu cầu AI sinh đề thi chuẩn Bloom, làm bài thi trực tuyến (MCQ + Tự luận), nhận kết quả chấm điểm tức thì kèm radar phân tích năng lực và lộ trình học tập. |
| **Role `ADMIN`** | **Quản trị viên (Admin)** | **Quản trị toàn diện hệ thống**: Quản lý tài nguyên lưu trữ & bóc tách chunks, quản lý danh mục môn học/khóa học, theo dõi hạn ngạch & thống kê token AI tiêu thụ, quản lý tài khoản người dùng và thiết lập API Key (Gemini, OpenAI). |

---

## 🏆 III. Desired outcome (Kết quả mong muốn)

| Mục tiêu đạt được | Dấu hiệu quan sát đo lường được |
|---|---|
| **Tải tài liệu thuận tiện** | Hệ thống tiếp nhận mượt mà các tệp văn bản định dạng `.pdf` và `.docx`. |
| **Sinh đề thông minh đa dạng** | Tự động sinh đề thi gồm cả **Trắc nghiệm khách quan (MCQ)** và **Câu hỏi tự luận** kèm đáp án chuẩn và giải thích chi tiết. |
| **Môi trường làm bài thi tương tác** | Giao diện làm bài trực tuyến có đồng hồ đếm ngược thời gian, lưu trạng thái bài làm khi đang làm. |
| **Chấm điểm & Phản hồi bằng AI** | - Trắc nghiệm: Chấm điểm 100% tự động, hiển thị câu đúng/sai tức thì.<br>- Tự luận: AI phân tích bài làm, đối chiếu với barem đáp án, chấm điểm thang điểm 10 và nhận xét chi tiết từng ý đạt/chưa đạt. |

---

## 👑 IV. Decision owner (Người ra quyết định)

| Vai trò | Tên / Định danh | Phạm vi quyết định | Trạng thái phê duyệt | Ngày phê duyệt | Ghi chú |
|---|---|---|---|---|---|
| **Product Owner** | User (Project Lead) | Toàn bộ phạm vi tính năng, luồng nghiệp vụ và chuẩn nghiệm thu | In-review | 2026-09-18 | Định hình ý tưởng OwnEdu |

---

## 🚧 V. Scope constraints (Ràng buộc phạm vi MVP)

1. **Định dạng tệp hỗ trợ**: Phiên bản đầu tiên tập trung xử lý chuẩn xác 2 định dạng phổ biến nhất: **PDF** (chứa text) và Word (**DOCX**).
2. **Ngôn ngữ**: Hỗ trợ xử lý văn bản và sinh đề thi bằng cả **Tiếng Việt** và **Tiếng Anh**.
3. **Mức độ câu hỏi**: Hỗ trợ phân cấp câu hỏi theo các mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng).
4. **Cách thức trả lời tự luận**: Học sinh nhập văn bản trực tiếp trên khung soạn thảo của website.

---

## 💡 VI. Assumptions (Giả định cốt lõi)

- Các tệp PDF và DOCX tải lên là tài liệu có lớp ký tự văn bản chuẩn (text-layer), cho phép bóc tách nội dung trực tiếp qua parser backend.
- Mô hình ngôn ngữ lớn (LLM như Gemini / OpenAI) có khả năng trích xuất thông tin ngữ nghĩa và chấm bài tự luận theo barem thang điểm quy định.

---

## ❓ VII. Open Questions (Câu hỏi mở)

- [ ] **`OQ-PROJ-001`** [non-blocking]: Trong giai đoạn MVP, nếu người dùng tải lên file PDF scan dạng ảnh chụp (không có text-layer), hệ thống nên từ chối và báo lỗi yêu cầu file text, hay cần tích hợp sẵn mô-đun OCR bóc chữ từ ảnh?
- [ ] **`OQ-PROJ-002`** [non-blocking]: Khi tạo đề, người dùng có cần quyền tùy chỉnh số lượng câu hỏi (ví dụ: chọn đúng 10 câu trắc nghiệm, 2 câu tự luận) và tỉ lệ độ khó không, hay để AI tự cân đối mặc định?
