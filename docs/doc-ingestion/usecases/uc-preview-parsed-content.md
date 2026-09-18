---
type: usecase
feature: doc-ingestion
usecase_id: UC-DOC-INGEST-002
status: approved
updated: 2026-09-18
links:
  - docs/doc-ingestion/srs/doc-ingestion-spec.md
---

# UC-DOC-INGEST-002: Xem trước nội dung bóc tách & Cấu trúc tài liệu

## Goal and actors (Mục tiêu và tác nhân)
- **Primary actor**: Học sinh / Giáo viên
- **Goal**: Xem lại bản tóm lược văn bản đã được hệ thống bóc tách (số trang, số lượng từ, các phân đoạn trích dẫn) để đảm bảo chất lượng nội dung trước khi ra lệnh cho AI sinh đề thi.
- **Trigger**: Người dùng nhấp vào nút "Xem trước nội dung" (Preview) tại tài liệu vừa tải lên hoặc trong thư viện cá nhân.
- **Covers**: `FR-DOC-INGEST-006`.

## Preconditions (Điều kiện trước)
- Tài liệu đang ở trạng thái `PARSED` (đã bóc tách thành công).
- Người dùng là chủ sở hữu hợp pháp của tài liệu.

## Success guarantee (Điều đảm bảo khi thành công)
- Hiển thị đầy đủ thông tin thống kê: Tên file, kích thước, tổng số trang, tổng số từ tiếng Việt/Anh.
- Hiển thị danh sách các phân đoạn (chunks) văn bản mẫu rõ ràng, mạch lạc, không bị lỗi font hay ký tự rác.

## Main success flow (Luồng chính)
1. Người dùng nhấp nút "Xem trước nội dung" trên thẻ tài liệu.
2. Web Client gửi request `GET /api/documents/{id}` tới backend.
3. `document-service` kiểm tra quyền sở hữu (`user_id = current_user`), truy vấn thông tin tài liệu và top 5 chunks văn bản đầu tiên.
4. Giao diện mở hộp thoại `DocumentPreviewModal`:
   - Thanh thông số: Tên tệp, số trang, ước lượng số lượng câu hỏi có thể sinh ra (ví dụ: ~30 câu trắc nghiệm).
   - Khung đọc văn bản: Hiển thị các đoạn trích dẫn bài học đã được phân đoạn sạch sẽ.
5. Người dùng kiểm tra thấy nội dung chuẩn xác và nhấp nút "Chuyển sang bước Tạo đề thi".
6. Hệ thống chuyển tiếp sang màn hình cấu hình đề thi của phân hệ `ai-exam-generator`.
