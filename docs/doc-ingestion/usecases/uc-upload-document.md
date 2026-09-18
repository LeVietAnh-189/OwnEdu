---
type: usecase
feature: doc-ingestion
usecase_id: UC-DOC-INGEST-001
status: approved
updated: 2026-09-18
links:
  - docs/doc-ingestion/srs/doc-ingestion-spec.md
---

# UC-DOC-INGEST-001: Tải lên tài liệu học tập & Xử lý bóc tách văn bản nền

## Goal and actors (Mục tiêu và tác nhân)
- **Primary actor**: Học sinh / Sinh viên / Giáo viên
- **Supporting system**: `api-gateway`, `document-service`, Cloudflare R2, Message Queue
- **Goal**: Tải lên tệp tài liệu PDF/DOCX từ máy tính lên hệ thống, lưu trữ an toàn, bóc tách text và phân đoạn kiến thức sẵn sàng cho việc sinh đề thi.
- **Trigger**: Người dùng kéo thả file vào khung upload hoặc nhấn nút "Tải tài liệu lên".
- **Covers**: `FR-DOC-INGEST-001`, `FR-DOC-INGEST-002`, `FR-DOC-INGEST-003`, `FR-DOC-INGEST-004`, `FR-DOC-INGEST-005`, `RULE-DOC-INGEST-001`, `RULE-DOC-INGEST-002`, `RULE-DOC-INGEST-004`.

## Preconditions (Điều kiện trước)
- Người dùng đã đăng nhập vào OwnEdu và có token phiên làm việc hợp lệ.
- Tệp tài liệu có định dạng `.pdf` hoặc `.docx` với dung lượng $\le 25$MB.

## Success guarantee (Điều đảm bảo khi thành công)
- Tệp gốc được lưu trữ nguyên vẹn trên Cloudflare R2.
- Bản ghi tài liệu được tạo trong bảng `documents` với trạng thái `PARSED`.
- Các phân đoạn văn bản được bóc tách sạch sẽ và lưu vào bảng `document_chunks`.
- Phát sự kiện `document.ingested` sang Message Queue để kích hoạt AI Engine.
- Giao diện người dùng chuyển sang trạng thái "Đã sẵn sàng tạo đề thi".

## Main success flow (Luồng chính)
1. Người dùng kéo thả tệp (ví dụ `Giao_trinh_Kinh_te_vi_mo.pdf`) vào vùng tải lên trên trang web.
2. Web Client kiểm tra nhanh dung lượng và đuôi tệp tại trình duyệt:
   - Dung lượng $\le 25$MB $\rightarrow$ Hiển thị thanh tiến độ upload (0% $\rightarrow$ 100%).
3. Client gửi request Multipart `POST /api/documents/upload` tới `api-gateway`.
4. `api-gateway` xác thực JWT token và chuyển tiếp request tới `document-service`.
5. `document-service` kiểm tra MIME-type và tạo bản ghi metadata trong cơ sở dữ liệu (`status: UPLOADING`).
6. Service stream tệp trực tiếp lên Cloudflare R2 Object Storage $\rightarrow$ Chuyển trạng thái sang `PROCESSING`.
7. Service kích hoạt Background Worker bóc tách nội dung:
   - Đọc các trang PDF, trích xuất text UTF-8 tiếng Việt.
   - Làm sạch văn bản: Bỏ header/footer lặp trang, bỏ số trang.
   - Cắt văn bản thành các đoạn (chunks) 1.000–1.500 ký tự (overlap 150 ký tự).
   - Ghi các chunks vào bảng `document_chunks`.
8. Quá trình xử lý thành công, service cập nhật `status = 'PARSED'`, phát sự kiện `document.ingested` vào Message Queue.
9. Web Client nhận được thông báo hoàn tất qua Polling hoặc WebSocket $\rightarrow$ Hiển thị nút "Tạo đề thi ngay" và "Xem trước nội dung".

## Alternative and error flows (Luồng thay thế và luồng lỗi)
### E1 — Tệp vượt quá dung lượng 25MB
- Điều kiện: Người dùng chọn file nặng 35MB.
- Hành động: Client chặn ngay lập tức, hiển thị thông báo lỗi `E-DOC-INGEST-001: Tệp vượt quá dung lượng tối đa 25MB`.

### E2 — Định dạng tệp không hợp lệ
- Điều kiện: Người dùng chọn tệp `.exe`, `.zip` hoặc đổi đuôi file `.png` thành `.pdf`.
- Hành động: Service kiểm tra magic bytes phát hiện sai MIME-type, từ chối xử lý và trả về mã lỗi `E-DOC-INGEST-002: Định dạng tệp không được hỗ trợ`.

### E3 — Tệp PDF scan ảnh không có chữ
- Điều kiện: Người dùng tải lên file PDF scan từ máy photocopy chỉ toàn ảnh chụp mờ.
- Hành động: Worker bóc tách phát hiện tổng số từ trích xuất $< 50$ từ trên toàn bộ tài liệu $\rightarrow$ Đổi trạng thái sang `FAILED`, thông báo lỗi `E-DOC-INGEST-004: Tài liệu là ảnh scan không chứa lớp văn bản`.

## Failure guarantee (Điều đảm bảo khi thất bại)
- Nếu quá trình bóc tách bị lỗi, hệ thống dọn dẹp các chunk lỗi và đánh dấu bản ghi là `FAILED`, kèm lý do lỗi rõ ràng để người dùng biết và thử lại với file khác.
