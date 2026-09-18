---
type: brd
feature: doc-ingestion
status: in-review
updated: 2026-09-18
links:
  - docs/doc-ingestion/doc-ingestion-urd.md
---

# doc-ingestion — Business Requirements (Yêu Cầu Nghiệp Vụ)

> **Phân hệ**: Quản lý & Bóc tách Tài liệu Học tập (`document-service`)  
> **Mục tiêu**: Xây dựng kênh nạp dữ liệu đầu vào chuẩn xác, an toàn và tối ưu chi phí hạ tầng cho nền tảng OwnEdu.

---

## 📌 I. Executive summary (Tóm tắt cho lãnh đạo)

Phân hệ `doc-ingestion` là cửa ngõ dữ liệu đầu tiên của OwnEdu. Nhiệm vụ cốt lõi là chuyển đổi các tệp bài giảng, giáo trình phi cấu trúc (PDF, DOCX) thành văn bản chuẩn hóa, sạch sẽ và được phân đoạn thông minh (Chunking). Đây là nền móng quyết định chất lượng của các câu hỏi trắc nghiệm và tự luận do AI sinh ra ở các dịch vụ phía sau.

---

## 🎯 II. Business objectives (Mục tiêu nghiệp vụ)

| Mã Mục Tiêu | Mục tiêu nghiệp vụ | Thước đo thành công (KPIs) | Nguồn liên kết |
|:---|---|---|:---:|
| **`BR-DOC-INGEST-001`** | **Tỷ lệ bóc tách thành công cao**: Đảm bảo hệ thống đọc hiểu và trích xuất đúng văn bản tiếng Việt/tiếng Anh từ các tệp tài liệu hợp lệ. | $\ge 98\%$ tệp PDF/DOCX hợp lệ được bóc tách văn bản chuẩn xác, không bị lỗi font hay mất đoạn. | `UR-DOC-INGEST-001` |
| **`BR-DOC-INGEST-002`** | **Tối ưu hóa chi phí Token LLM**: Tự động lọc bỏ các thành phần rác (header, footer lặp lại, mục lục trống, số trang) trước khi lưu trữ và gửi sang AI Engine. | Giảm ít nhất $25\%$ lượng token dư thừa khi đưa văn bản vào ngữ cảnh (Prompt Context) của mô hình AI. | `UR-DOC-INGEST-003` |
| **`BR-DOC-INGEST-003`** | **Tốc độ phản hồi thời gian thực**: Thời gian từ lúc người dùng tải file lên đến khi hệ thống xử lý xong và sẵn sàng sinh đề phải nhanh chóng. | Thời gian xử lý $\le 10$ giây đối với tệp tài liệu dưới 50 trang. | `UR-DOC-INGEST-001` |

---

## 🔭 III. Business scope (Phạm vi nghiệp vụ)

### 1. Trong phạm vi (In scope - MVP)
- Tiếp nhận tải lên tệp định dạng `.pdf` (text-layer) và `.docx` với dung lượng $\le 25$MB.
- Lưu trữ tệp gốc an toàn trên Object Storage (Cloudflare R2 / S3).
- Bóc tách văn bản, trích xuất cấu trúc đề mục (H1, H2, H3), số lượng từ, số trang.
- Tự động làm sạch văn bản (loại bỏ ký tự lạ, header/footer lặp trang).
- Quản lý kho tài liệu cá nhân: Liệt kê danh sách, đổi tên, gắn nhãn môn học, xóa tệp.
- Phát sinh sự kiện (Event message) `DocumentIngestedEvent` qua Message Queue để thông báo cho `ai-engine-service`.

### 2. Ngoài phạm vi (Out of scope - Các giai đoạn sau)
- Xử lý nhận dạng quang học OCR cho tệp PDF scan dạng ảnh chụp mờ hoặc chữ viết tay (sẽ phát triển ở Phase 2).
- Hỗ trợ định dạng file trình chiếu PowerPoint (`.pptx`) hoặc bảng tính (`.xlsx`).
- Chỉnh sửa trực tiếp nội dung văn bản gốc trên website.

---

## 🔒 IV. Business rules (Quy tắc nghiệp vụ cốt lõi)

| Mã Quy Tắc | Tên Quy Tắc | Nội Dung & Ràng Buộc Nghiệp Vụ | Căn Cứ / Lý Do | Nguồn |
|:---|---|---|---|:---:|
| **`RULE-DOC-INGEST-001`** | **Kiểm tra định dạng nghiêm ngặt (MIME-type Validation)** | Chỉ chấp nhận tệp có phần mở rộng `.pdf` hoặc `.docx` và MIME-type thực sự là `application/pdf` hoặc `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. Từ chối ngay các tệp đổi đuôi giả mạo. | Chống mã độc và tấn công tệp tin độc hại. | `UR-DOC-INGEST-005` |
| **`RULE-DOC-INGEST-002`** | **Giới hạn kích thước & độ dài tệp** | Mỗi tệp tải lên không được vượt quá **25MB** và không quá **150 trang**. Nếu vượt quá ngưỡng, hệ thống từ chối xử lý và yêu cầu người dùng tách nhỏ file. | Bảo vệ tài nguyên CPU/RAM của `document-service`, chống nghẽn hàng đợi. | Ràng buộc hạ tầng |
| **`RULE-DOC-INGEST-003`** | **Cô lập quyền sở hữu tài liệu (Tenant Isolation)** | Tài liệu tải lên bởi tài khoản nào thì chỉ duy nhất tài khoản đó có quyền truy cập, đọc nội dung, tạo đề hoặc xóa tệp. Không cho phép truy cập chéo giữa các người dùng. | Bảo vệ quyền riêng tư và bản quyền tài liệu cá nhân của học sinh/giáo viên. | `UR-DOC-INGEST-004` |
| **`RULE-DOC-INGEST-004`** | **Quy tắc phân đoạn kiến thức (Chunking Strategy)** | Văn bản sau khi bóc tách được chia thành các đoạn (chunks) có độ dài từ 1.000 đến 1.500 ký tự với độ gối đầu (overlap) 150 ký tự, ưu tiên cắt tại ranh giới câu hoặc tiêu đề đoạn văn. | Đảm bảo tính liền mạch của ngữ cảnh khi đưa vào LLM sinh câu hỏi. | `BR-DOC-INGEST-002` |

---

## 💰 V. Cost-benefit (Chi phí và Lợi ích)

| Hạng mục | Chi phí / Lợi ích | Cách thức ước lượng | Nguồn căn cứ |
|---|---|---|:---:|
| **Chi phí Lưu trữ Object Storage (R2)** | Chi phí rất thấp (khoảng $0.015/GB/tháng, miễn phí egress bandwidth). | 1.000 người dùng $\times$ trung bình 5 file (10MB/file) = 50GB $\rightarrow$ Dưới $1/tháng. | Cloudflare R2 Pricing |
| **Lợi ích tiết kiệm Token AI** | Tiết kiệm từ $20\% - 30\%$ chi phí API gọi LLM nhờ bộ lọc rác và chunking thông minh. | So với việc ném toàn bộ văn bản thô chưa lọc vào prompt. | Thử nghiệm kỹ thuật RAG |
| **Trải nghiệm người dùng** | Tăng tỷ lệ hoàn thành tạo đề từ $40\%$ lên $90\%$ nhờ khâu kiểm tra và báo lỗi minh bạch. | Khảo sát mức độ hài lòng người dùng. | `DISC-001` |

---

## ⚠️ VI. Risks and dependencies (Rủi ro và Phụ thuộc)

| Rủi ro / Phụ thuộc | Mức độ tác động | Phương án ứng phó (Mitigation) |
|---|---|---|
| **Người dùng tải file PDF scan dạng ảnh thuần** | Trung bình: Parser không lấy được chữ, trả về văn bản rỗng | Kiểm tra dung lượng text bóc tách: Nếu $< 100$ ký tự trên 10 trang $\rightarrow$ Chủ động báo lỗi hướng dẫn người dùng: "Tài liệu là ảnh scan, vui lòng dùng file có chữ". |
| **Tệp DOCX chứa bảng biểu phức tạp hoặc công thức toán MathType** | Cao: Công thức toán bị vỡ định dạng hoặc mất bảng | Sử dụng thư viện bóc tách chuyên dụng hỗ trợ trích xuất bảng dạng Markdown và giữ nguyên ký hiệu LaTeX. |
| **Dịch vụ Object Storage bị gián đoạn kết nối** | Cao: Không lưu được tệp gốc | Cấu hình cơ chế Retry 3 lần kèm bộ nhớ đệm tạm thời (Local Temp Storage). |
