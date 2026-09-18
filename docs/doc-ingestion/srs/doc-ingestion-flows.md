# Luồng Tương tác Hệ thống (System Flows) - doc-ingestion

**Phân hệ**: `doc-ingestion` (Microservice: `document-service`)  
**Tài liệu liên quan**:
- [doc-ingestion-spec.md](file:///C:/Nexis/ownedu/docs/doc-ingestion/srs/doc-ingestion-spec.md)
- [doc-ingestion-brd.md](file:///C:/Nexis/ownedu/docs/doc-ingestion/doc-ingestion-brd.md)
- [doc-ingestion-usecase-index.md](file:///C:/Nexis/ownedu/docs/doc-ingestion/usecases/doc-ingestion-usecase-index.md)

---

## 1. Sơ đồ Luồng Swimlane Xử lý Tài liệu (End-to-End Swimlane)

Sơ đồ phân chia ranh giới trách nhiệm rõ ràng giữa **Client (Web UI)**, **API Gateway**, **Document Service (Core Engine)**, và **Storage / DB**:

![Sơ đồ Luồng Swimlane Tải và Xử lý Tài liệu](file:///C:/Nexis/ownedu/docs/doc-ingestion/srs/doc-ingestion-swimlane.svg)

---

## 2. Diễn giải Chi tiết các Pha (Phase Execution Details)

### Pha 1: Pre-Validation & Presigned URL Request
1. Người dùng kéo thả hoặc chọn tệp `.pdf` hoặc `.docx`.
2. Client kiểm tra dung lượng ($\le 25\text{MB}$) và định dạng hợp lệ (`RULE-DOC-INGEST-001`, `002`). Nếu sai, chặn ngay ở UI.
3. Client gửi request `POST /api/v1/documents/presign-upload` kèm metadata và JWT.
4. **API Gateway** xác thực token, rate limiting (`10 req/min/user`) và forward sang **Document Service**.
5. **Document Service** tạo bản ghi trạng thái `UPLOADING` và sinh S3/R2 Presigned Upload URL với TTL = 15 phút (`RULE-DOC-INGEST-003`).

### Pha 2: Direct Upload to Object Storage
1. Client nhận presigned URL và tải tệp trực tiếp lên Object Storage (Cloudflare R2 / AWS S3) thông qua HTTP PUT.
2. Quá trình tải trực tiếp giúp giảm tải băng thông và I/O của Backend cluster, hỗ trợ tệp lớn đến 25MB mượt mà.
3. Khi upload hoàn tất (HTTP 200), Client gửi tín hiệu xác nhận: `POST /api/v1/documents/{id}/confirm-upload`.

### Pha 3: Pipeline Xử lý Bóc tách & Chunking Nội dung
1. Document Service chuyển trạng thái tài liệu sang `PROCESSING`.
2. Đọc file stream từ Storage, kiểm tra Magic Bytes thực tế (`application/pdf` hoặc `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
3. Khởi chạy worker trích xuất text:
   - Nếu là PDF: Phân tích số trang ($\le 150$), trích xuất text qua PDF parser (nhận diện layout đoạn văn, tiêu đề).
   - Nếu là DOCX: Phân tích XML bóc tách cấu trúc heading, bullet list và bảng biểu.
4. Thuật toán **Chunking & RAG Indexing** (`RULE-DOC-INGEST-004`):
   - Cắt text thành từng đoạn từ 1000 đến 1500 ký tự với độ gối đầu (overlap) 150 ký tự.
   - Lưu trữ các chunk vào cơ sở dữ liệu `document_chunks` liên kết với `tenant_id` và `user_id`.
5. Đổi trạng thái sang `PARSED`, phát hành sự kiện `DOCUMENT_PARSED` lên Message Bus để phân hệ tiếp theo (`ai-engine-worker`) có thể sẵn sàng sinh bài tập.

### Pha 4: Xử lý Ngoại lệ (Exception Handling)
- Nếu tệp bị hỏng (corrupted) hoặc vượt quá 150 trang: Ghi nhận mã lỗi `E-DOC-INGEST-003` hoặc `E-DOC-INGEST-004`, cập nhật trạng thái `FAILED`, dọn dẹp storage tạm và thông báo chi tiết cho người dùng trên giao diện.
