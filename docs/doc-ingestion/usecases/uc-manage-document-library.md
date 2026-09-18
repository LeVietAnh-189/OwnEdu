---
type: usecase
feature: doc-ingestion
usecase_id: UC-DOC-INGEST-003
status: approved
updated: 2026-09-18
links:
  - docs/doc-ingestion/srs/doc-ingestion-spec.md
---

# UC-DOC-INGEST-003: Quản lý kho tài liệu học tập cá nhân

## Goal and actors (Mục tiêu và tác nhân)
- **Primary actor**: Học sinh / Giáo viên
- **Goal**: Quản lý danh sách các tài liệu đã tải lên, tìm kiếm theo tên, gắn nhãn môn học và xóa các tệp cũ không còn sử dụng.
- **Trigger**: Người dùng truy cập trang "Kho tài liệu của tôi" (`/library`).
- **Covers**: `FR-DOC-INGEST-007`, `FR-DOC-INGEST-008`, `RULE-DOC-INGEST-003`.

## Preconditions (Điều kiện trước)
- Người dùng đã đăng nhập vào hệ thống.

## Success guarantee (Điều đảm bảo khi thành công)
- Hiển thị chính xác danh sách tài liệu thuộc quyền sở hữu của người dùng hiện tại (cô lập 100% dữ liệu).
- Thao tác xóa tài liệu sẽ loại bỏ an toàn cả bản ghi metadata, chunks trong database và tệp tin trên Object Storage R2.

## Main success flow (Luồng chính)
1. Người dùng truy cập thanh điều hướng chọn mục "Kho tài liệu" (`/library`).
2. Web Client gửi `GET /api/documents?page=1&limit=20` kèm token xác thực.
3. Service trả về danh sách các tệp tài liệu: Tên file, loại file (PDF/DOCX), kích thước, số lượng đề thi đã tạo từ file này, thời gian tải lên.
4. Người dùng có thể:
   - **Tìm kiếm**: Gõ từ khóa vào ô tìm kiếm để lọc tài liệu theo tên.
   - **Gắn nhãn môn học**: Nhấp vào biểu tượng nhãn để gắn thẻ môn (ví dụ: `Kinh tế vi mô`, `Tiếng Anh`, `Lịch sử Đảng`).
   - **Xóa tài liệu**: Nhấp biểu tượng thùng rác tại tài liệu không còn sử dụng $\rightarrow$ Xác nhận hộp thoại cảnh báo $\rightarrow$ Service thực hiện xóa dữ liệu và làm mới danh sách.
