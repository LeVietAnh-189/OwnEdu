---
type: urd
feature: doc-ingestion
status: in-review
updated: 2026-09-18
links:
  - docs/_product/project-brief.md
  - docs/_product/discovery.md
---

# doc-ingestion — User Requirements (Yêu Cầu Người Dùng)

> **Phân hệ**: Quản lý & Bóc tách Tài liệu Học tập (`document-service`)  
> **Kiến trúc**: Microservice tiếp nhận file, lưu trữ Object Storage và xử lý bóc tách văn bản nền.

---

## 👥 I. Users and context (Người dùng và bối cảnh)

| Vai trò người dùng | Bối cảnh / Động lực sử dụng | Khó khăn hiện tại |
|---|---|---|
| **Sinh viên / Học sinh** | Nhận file slide bài giảng PDF từ giảng viên, giáo trình Word DOCX dài 50-150 trang chuẩn bị cho đợt thi học kỳ | Đọc thủ công rất mệt mỏi, không thể copy-paste từng đoạn vào ChatGPT vì vượt quá giới hạn ngữ cảnh hoặc format bị vỡ |
| **Giáo viên / Giảng viên** | Có sẵn tài liệu bài đọc, giáo án word, muốn đưa vào hệ thống để làm nguồn dữ liệu sinh đề kiểm tra | Phải ngồi copy từng bài đọc, chỉnh sửa định dạng thủ công rất mất thời gian |

---

## 👤 II. Persona (Chân dung người dùng tiêu biểu)

### 1. Persona 1: Sinh viên đại học
* **Tên**: Nguyễn Tuấn Nam (21 tuổi, Sinh viên năm 3 ngành Quản trị Kinh doanh).
* **Mục tiêu**: Ôn thi môn Quản trị Tài chính từ bộ slide bài giảng 120 trang dạng PDF.
* **Kỹ năng công nghệ**: Trung bình khá (thường dùng Google Drive, Canva, ChatGPT).
* **Bực bội lớn nhất**: *"Mỗi môn có cả chục file PDF slide, đọc xong không nhớ gì, copy vào AI thì lúc nhận lúc không vì file quá nặng."*
* **Kỳ vọng**: *"Chỉ cần kéo thả file PDF lên web, hệ thống tự đọc hiểu và báo 'Đã sẵn sàng tạo đề thi' trong vài giây."*

### 2. Persona 2: Giáo viên phổ thông
* **Tên**: Cô Lê Thu Hương (38 tuổi, Giáo viên Tiếng Anh & Luyện thi THPT).
* **Mục tiêu**: Tải các file đề cương bài đọc hiểu DOCX lên để AI tự tạo bài tập trắc nghiệm và tự luận cho học sinh trong lớp.
* **Kỹ năng công nghệ**: Cơ bản (thành thạo Word, Zalo, Google Forms).
* **Bực bội lớn nhất**: *"File Word có nhiều bảng biểu và chú thích, phần mềm khác hay bị lỗi phông chữ tiếng Việt hoặc mất đoạn."*
* **Kỳ vọng**: *"Tải file Word lên nguyên vẹn, nhận diện chuẩn bảng biểu và phân tách rõ từng chuyên đề."*

---

## 🗺️ III. User journey (Hành trình người dùng)

| # | Giai đoạn hành trình | Thao tác người dùng | Trở ngại thực tế thường gặp | Nhu cầu người dùng liên quan |
|:---:|---|---|---|---|
| **1** | **Chọn & Tải tài liệu** | Kéo thả file PDF hoặc DOCX từ máy tính vào vùng upload của OwnEdu | Mạng chậm khiến upload bị đơ; không biết file đang tải đến đâu; file scan không có chữ | `UR-DOC-INGEST-001`, `UR-DOC-INGEST-005` |
| **2** | **Xác thực & Xử lý** | Chờ hệ thống bóc tách văn bản và làm sạch | Không biết hệ thống đang làm gì (quay vòng vô định); không biết bao giờ xong | `UR-DOC-INGEST-001`, `UR-DOC-INGEST-003` |
| **3** | **Kiểm tra kết quả** | Xem trước (Preview) nội dung text đã bóc tách và các chương mục | Text bị dính liền chữ, lỗi mã UTF-8 tiếng Việt, lẫn quảng cáo rác ở chân trang | `UR-DOC-INGEST-002`, `UR-DOC-INGEST-003` |
| **4** | **Lưu trữ & Phân loại** | Đặt tên tài liệu, gắn thẻ môn học (Toán, Sử, Triết học...) vào thư viện | Thư viện lộn xộn khó tìm lại file cũ để tạo đề lần sau | `UR-DOC-INGEST-004` |
| **5** | **Chuyển tiếp sinh đề** | Nhấn nút "Tạo đề thi từ tài liệu này" | — | Liên kết sang phân hệ `ai-exam-generator` |

---

## 🎯 IV. User needs (Danh mục Nhu cầu người dùng cốt lõi)

| Mã Yêu Cầu | Nhu cầu của người dùng | Vì sao việc này quan trọng? | Kết quả mong đợi | Nguồn gốc |
|:---|---|---|---|:---:|
| **`UR-DOC-INGEST-001`** | **Tải lên đa định dạng thuận tiện**: Hỗ trợ kéo thả cả tệp `.pdf` và `.docx` với dung lượng tối đa 25MB, có thanh hiển thị tiến độ phần trăm rõ ràng. | Người dùng ghét cảm giác chờ đợi mà không biết tệp có tải thành công hay không. | Tải tệp lên mượt mà trong dưới 5 giây, có phản hồi phần trăm trực quan. | `DISC-001` |
| **`UR-DOC-INGEST-002`** | **Xem trước nội dung bóc tách (Parsed Content Preview)**: Cho phép người dùng xem nhanh bản tóm tắt cấu trúc tài liệu (Số trang, số lượng từ, các đề mục chính). | Người dùng cần an tâm rằng hệ thống đã đọc được đúng nội dung cốt lõi trước khi cho AI sinh câu hỏi. | Hiển thị bản tóm lược mục lục và đoạn trích văn bản đã làm sạch. | `DISC-003` |
| **`UR-DOC-INGEST-003`** | **Lọc rác và phân đoạn thông minh (Text Sanitization & Chunking)**: Hệ thống tự động loại bỏ số trang lặp lại, header/footer, bảng rỗng và phân chia bài học theo từng chương/mục logic. | Giảm chi phí token LLM và giúp AI không sinh ra câu hỏi ngớ ngẩn (như hỏi về số trang hay tên trường ở chân trang). | Văn bản đầu ra sạch sẽ, mạch lạc bám sát nội dung bài học. | `DISC-001` |
| **`UR-DOC-INGEST-004`** | **Quản lý Thư viện tài liệu cá nhân**: Cho phép xem danh sách tài liệu đã tải lên, đổi tên, gắn thẻ môn học, xóa tài liệu cũ và tìm kiếm nhanh. | Người dùng học nhiều môn khác nhau cần một kho lưu trữ ngăn nắp để tái sử dụng nhiều lần. | Giao diện "Kho tài liệu của tôi" dạng thẻ/danh sách trực quan. | Persona 1 |
| **`UR-DOC-INGEST-005`** | **Bắt lỗi và hướng dẫn khắc phục minh bạch**: Khi tải file bị hỏng, file scan ảnh không có text hoặc file đặt mật khẩu bảo vệ, hệ thống phải thông báo lý do cụ thể và cách xử lý. | Tránh tình trạng người dùng tưởng web bị lỗi khi tải lên file không hợp lệ. | Thông báo lỗi thân thiện: "Tệp PDF của bạn là dạng ảnh chụp, vui lòng sử dụng tệp có lớp văn bản". | `DISC-003` |

---

## 🔒 V. Constraints affecting users (Ràng buộc ảnh hưởng đến người dùng)

| Loại ràng buộc | Mô tả chi tiết | Nguồn gốc / Cơ sở |
|---|---|---|
| **Kỹ thuật (Hạ tầng)** | Giới hạn kích thước tệp tối đa 25MB và số trang tối đa 150 trang cho mỗi tệp trong phiên bản MVP. | Tránh tràn RAM của `document-service` khi bóc tách đa luồng. |
| **Bảo mật & Riêng tư** | Tài liệu tải lên mặc định ở chế độ Riêng tư (Private), chỉ tài khoản người tải lên mới có quyền xem và sinh đề thi. | Tuân thủ bảo vệ quyền sở hữu trí tuệ giáo trình của người dùng. |
| **Định dạng hợp lệ** | Hệ thống chỉ tiếp nhận tệp có MIME-type hợp lệ (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`). Tệp đặt mật khẩu phải được gỡ khóa trước khi tải lên. | Ràng buộc an toàn xử lý tệp tin. |

---

## ❓ VI. Open Questions (Câu hỏi mở)

- [ ] **`OQ-DOC-INGEST-001`** [non-blocking]: Trong tương lai, người dùng có cần tính năng chọn một vài trang cụ thể trong file PDF dài (ví dụ: chỉ chọn trang 20 đến trang 45) để sinh đề thay vì xử lý toàn bộ file không?
- [ ] **`OQ-DOC-INGEST-002`** [non-blocking]: Tài liệu sau khi tải lên có nên được lưu trữ vĩnh viễn trên Cloudflare R2 hay tự động dọn dẹp sau 30 ngày để tiết kiệm dung lượng lưu trữ?
