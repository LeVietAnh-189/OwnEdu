# Quy Chuẩn Hợp Đồng API Toàn Hệ Thống (API Contracts & Specification) - OwnEdu

**Dự án**: OwnEdu  
**Phiên bản**: 1.0.0  
**Giao thức**: RESTful JSON qua HTTPS & Server-Sent Events (SSE) qua HTTP/2  
**Tài liệu liên quan**:
- [system-architecture.md](file:///C:/Nexis/ownedu/docs/_architecture/system-architecture.md)
- [database-design.md](file:///C:/Nexis/ownedu/docs/_architecture/database-design.md)

---

## 1. Cấu Trúc Đóng Gói Chuẩn (Standard Response Envelope)

Mọi endpoint REST của OwnEdu đều trả về theo một chuẩn Envelope thống nhất để Client dễ dàng xử lý bằng TypeScript interceptors:

### 1.1. Thành công (`HTTP 200 / 201 / 202`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-18T23:30:00.000Z",
    "request_id": "req_88aa-99bb-00cc"
  }
}
```

### 1.2. Phân trang (`Paginated List`)
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 142,
    "total_pages": 8
  },
  "meta": { ... }
}
```

### 1.3. Lỗi chuẩn hóa (`HTTP 4xx / 5xx`)
```json
{
  "success": false,
  "error": {
    "code": "E-GEN-001",
    "message": "Số lượng câu hỏi không hợp lệ.",
    "details": [
      {
        "field": "mcq_count",
        "issue": "Giá trị phải nằm trong khoảng từ 1 đến 50 câu."
      }
    ]
  },
  "meta": {
    "timestamp": "2026-09-18T23:30:05.000Z",
    "request_id": "req_88aa-99bb-00cc"
  }
}
```

---

## 2. Tiêu Chuẩn Xác Thực & Phân Quyền (Authentication & Headers)

- Mọi request yêu cầu đăng nhập phải gửi kèm Header:
  `Authorization: Bearer <JWT_TOKEN>`
- API Gateway sẽ giải mã JWT và tự động đính kèm các Header nội bộ xuống Microservice:
  - `X-User-Id`: UUID của người dùng hiện tại.
  - `X-User-Role`: `USER` (Học sinh/Sinh viên/Giảng viên dùng học tập) | `ADMIN` (Quản trị hệ thống).
  - `X-User-Tier`: `FREE` | `PRO`.

---

## 3. Danh Mục Endpoint REST & Streaming

### 3.1. Phân hệ `document-service` (Đường dẫn: `/api/v1/documents`)

| Method | Endpoint | Quyền | Mục đích |
| :--- | :--- | :--- | :--- |
| `POST` | `/presign-upload` | User | Gửi filename, size, mime_type; nhận presigned R2 URL upload trực tiếp. |
| `POST` | `/{id}/confirm-upload` | User | Báo upload thành công; trigger pipeline bóc tách & chunking. |
| `GET` | `/` | User | Lấy danh sách tài liệu cá nhân (hỗ trợ phân trang `?page=1&limit=20`). |
| `GET` | `/{id}` | User | Xem trạng thái tài liệu (`PROCESSING`, `PARSED`, `FAILED`). |
| `GET` | `/{id}/chunks` | User | Xem danh sách các đoạn text đã chunking để preview. |
| `DELETE`| `/{id}` | User | Xóa mềm tài liệu khỏi thư viện. |

---

### 3.2. Phân hệ `exam-service` & `ai-engine-worker` (Đường dẫn: `/api/v1/exams`)

| Method | Endpoint | Quyền | Mục đích |
| :--- | :--- | :--- | :--- |
| `POST` | `/generate` | User | Tiếp nhận cấu hình (MCQ, Essay, Bloom) và đẩy job sinh đề vào hàng đợi (`202 Accepted`). |
| `GET` | `/jobs/{job_id}/stream`| User | **Kênh SSE (Server-Sent Events)** streaming tiến độ 15% -> 45% -> 85% -> 100%. |
| `GET` | `/{id}` | User | Lấy toàn bộ chi tiết đề thi ở màn hình Review. |
| `PUT` | `/{id}/questions/{q_id}`| Owner | Sửa câu từ, đổi đáp án đúng hoặc sửa barem rubric của câu hỏi. |
| `POST` | `/{id}/publish` | Owner | Chuyển trạng thái đề sang `PUBLISHED` để bắt đầu làm bài. |
| `POST` | `/{id}/start` | User | Thí sinh bắt đầu làm bài; server cấp `attempt_id` và khóa đồng hồ `expires_at`. |

---

### 3.3. Phân hệ `interactive-testing` (Đường dẫn: `/api/v1/attempts`)

| Method | Endpoint | Quyền | Mục đích |
| :--- | :--- | :--- | :--- |
| `GET` | `/{attempt_id}` | Student | Lấy câu hỏi bài thi & khôi phục bài làm nháp dở dang. |
| `PUT` | `/{attempt_id}/answers/{q_id}` | Student | **Auto-save**: Lưu lựa chọn MCQ hoặc nội dung tự luận (< 100ms). |
| `PUT` | `/{attempt_id}/flags` | Student | Bật/tắt cờ đánh dấu câu hỏi cần xem lại (Flagged questions array). |
| `POST` | `/{attempt_id}/submit` | Student | Nộp bài thi chính thức (khóa quyền sửa, đẩy sang hàng đợi chấm). |

---

### 3.4. Phân hệ `grading-service` (Đường dẫn: `/api/v1/attempts/{id}/result`)

| Method | Endpoint | Quyền | Mục đích |
| :--- | :--- | :--- | :--- |
| `GET` | `/{attempt_id}/result` | Student/Teacher | Xem toàn bộ bảng điểm, radar Bloom, giải thích trắc nghiệm, rubric tự luận và gợi ý ôn tập. |
| `POST` | `/{attempt_id}/override-grade`| Teacher | Giáo viên điều chỉnh điểm số câu tự luận, thêm nhận xét sư phạm và lưu audit log. |

---

## 4. Đặc Tả Chi Tiết Payload Trọng Tâm

### 4.1. `POST /api/v1/documents/presign-upload`
**Request Body:**
```json
{
  "filename": "Kien_truc_Phan_mem_Microservices.pdf",
  "file_size_bytes": 14285700,
  "mime_type": "application/pdf"
}
```
**Response Body:**
```json
{
  "success": true,
  "data": {
    "document_id": "doc_8f9c2d1e-a4b5-4c6d-8e7f-1a2b3c4d5e6f",
    "upload_url": "https://storage.ownedu.vn/uploads/doc_8f9c2d1e?X-Amz-Signature=...",
    "expires_in_seconds": 900
  }
}
```

### 4.2. `PUT /api/v1/attempts/{attempt_id}/answers/{q_id}` (Auto-Save)
**Request Body (MCQ):**
```json
{
  "answer_type": "MCQ",
  "selected_option": "B"
}
```
**Request Body (Essay):**
```json
{
  "answer_type": "ESSAY",
  "essay_text": "Tách riêng qua Message Queue giúp giảm tải API Gateway nhờ cơ chế xử lý bất đồng bộ..."
}
```
**Response Body (`HTTP 200 OK`):**
```json
{
  "success": true,
  "data": {
    "question_id": "q_02",
    "saved_at": "2026-09-18T23:35:10.120Z"
  }
}
```
