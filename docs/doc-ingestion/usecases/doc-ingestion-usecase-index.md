---
type: usecase-index
feature: doc-ingestion
status: approved
updated: 2026-09-18
links:
  - docs/doc-ingestion/srs/doc-ingestion-spec.md
---

# doc-ingestion — Use Cases Index (Chỉ Mục Kịch Bản Sử Dụng)

## Use cases (Danh sách use case)

| # | ID | Slug | Level | Status | Actor primary | Covers FR | Screens | Errors (E-*) | Priority | Updated |
|---|----|------|-------|--------|---------------|-----------|---------|--------------|:---:|---------|
| 1 | UC-DOC-INGEST-001 | [uc-upload-document](uc-upload-document.md) | sea | approved | Học sinh / Giáo viên | FR-DOC-INGEST-001, FR-DOC-INGEST-002, FR-DOC-INGEST-003, FR-DOC-INGEST-004, FR-DOC-INGEST-005, RULE-DOC-INGEST-001, 002, 004 | UploadZone, ProcessingModal | E-DOC-INGEST-001, E-DOC-INGEST-002, E-DOC-INGEST-003, E-DOC-INGEST-004 | P0 | 2026-09-18 |
| 2 | UC-DOC-INGEST-002 | [uc-preview-parsed-content](uc-preview-parsed-content.md) | sea | approved | Học sinh / Giáo viên | FR-DOC-INGEST-006 | DocumentPreviewModal | — | P1 | 2026-09-18 |
| 3 | UC-DOC-INGEST-003 | [uc-manage-document-library](uc-manage-document-library.md) | sea | approved | Học sinh / Giáo viên | FR-DOC-INGEST-007, FR-DOC-INGEST-008, RULE-DOC-INGEST-003 | MyLibraryPage | E-DOC-INGEST-005 | P1 | 2026-09-18 |

---

## Thứ tự đọc (Reading order)

| Thứ tự | UC | Giai đoạn | Vì sao ở vị trí này |
|:---:|---|---|---|
| **1** | [uc-upload-document](uc-upload-document.md) | Nạp dữ liệu đầu vào | Phải có tệp được tải lên và bóc tách thành công thì mới có dữ liệu hiển thị và quản lý |
| **2** | [uc-preview-parsed-content](uc-preview-parsed-content.md) | Kiểm tra tính chính xác | Người dùng kiểm tra bản tóm tắt và các đoạn kiến thức trước khi kích hoạt tạo đề |
| **3** | [uc-manage-document-library](uc-manage-document-library.md) | Quản trị thư viện học tập | Tổ chức kho tài liệu, gắn thẻ môn học và dọn dẹp các tệp cũ không còn dùng |

---

## CRUD matrix (Ma trận CRUD)

| UC \ Entity | Document | DocumentChunk | StorageFile (R2) | IngestEvent |
|---|:---:|:---:|:---:|:---:|
| [uc-upload-document](uc-upload-document.md) | **C** R U | **C** | **C** | **C** |
| [uc-preview-parsed-content](uc-preview-parsed-content.md) | **R** | **R** | — | — |
| [uc-manage-document-library](uc-manage-document-library.md) | **R U D** | **D** | **D** | — |
