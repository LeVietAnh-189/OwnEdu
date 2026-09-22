# Kiến trúc Hệ thống Microservices Toàn diện (System Architecture) - OwnEdu

**Dự án**: OwnEdu (Nền tảng Học tập & Đánh giá Năng lực Tự động bằng AI)  
**Công nghệ Chủ đạo**:
- **Frontend**: Vite + React 18+ + TypeScript + TailwindCSS
- **Backend**: Node.js (v20+ LTS) + Express.js + TypeScript
- **Database**: PostgreSQL 16+ Hybrid (SQL + NoSQL JSONB) & Redis 7+
- **Message Broker**: RabbitMQ (amqplib)
- **AI Core**: Google Gemini 1.5 Pro / OpenAI GPT-4o SDK
**Phiên bản**: 2.0.0 (Cập nhật Chuẩn Công nghệ: Node.js, Express, Vite, TailwindCSS)  
**Ngày cập nhật**: 2026-09-18  
**Tài liệu liên quan**:
- [project-brief.md](file:///C:/Nexis/ownedu/docs/_product/project-brief.md)
- [discovery.md](file:///C:/Nexis/ownedu/docs/_product/discovery.md)
- [microservices-event-bus.md](file:///C:/Nexis/ownedu/docs/_architecture/microservices-event-bus.md)

---

## 1. Bản đồ Ranh giới Microservices (Service Boundaries & Responsibilities)

Toàn bộ hệ thống OwnEdu được xây dựng trên nền tảng **Node.js + Express.js**, phân tách theo nguyên tắc Domain-Driven Design (DDD) thành 5 dịch vụ độc lập kết nối với giao diện **Vite + React + TailwindCSS**:

```mermaid
graph TD
    Client[Web Client: Vite + React + TailwindCSS] -->|REST / SSE qua HTTP/2| Gateway[api-gateway: Node.js Express]
    
    subgraph Core Microservices Cluster (Node.js + Express)
        Gateway -->|Reverse Proxy / Forward| DocSvc[document-service: Node.js Express]
        Gateway -->|Reverse Proxy / Forward| ExamSvc[exam-service: Node.js Express]
        Gateway -->|Reverse Proxy / Forward| GradingSvc[grading-service: Node.js Express]
    end

    subgraph Asynchronous AI Engine & Worker Cluster (Node.js)
        DocSvc -.->|Publishes: document.parsed| EventBus[(RabbitMQ: Topic ownedu.events)]
        ExamSvc -.->|Publishes: exam.generation.requested| EventBus
        ExamSvc -.->|Publishes: exam.attempt.submitted| EventBus
        GradingSvc -.->|Publishes: grading.essay.requested| EventBus
        
        EventBus -->|amqplib consumer| AIWorker[ai-engine-worker: Node.js Worker]
        AIWorker -.->|Publishes: exam.generation.completed| EventBus
        AIWorker -.->|Publishes: grading.essay.completed| EventBus
        
        EventBus -->|Consumes attempt submitted| GradingSvc
        EventBus -->|Consumes generation completed| ExamSvc
    end

    subgraph Storage & External Services Layer
        DocSvc --> CloudflareR2[(Cloudflare R2 - S3 SDK)]
        DocSvc --> DocDB[(PostgreSQL - document_db)]
        ExamSvc --> RedisCache[(Redis - ioredis Client)]
        ExamSvc --> ExamDB[(PostgreSQL - exam_db)]
        GradingSvc --> GradingDB[(PostgreSQL - grading_db)]
        AIWorker --> LLMProvider[AI SDK: @google/genai / openai]
    end
```

---

## 2. Chi tiết Đặc tả Từng Dịch vụ Backend (Node.js & Express)

### 2.1. `api-gateway` (Node.js + Express)
- **Gói thư viện cốt lõi**: `express`, `http-proxy-middleware`, `jsonwebtoken`, `express-rate-limit`, `helmet`, `cors`.
- **Trách nhiệm chính**:
  - Điểm tiếp nhận duy nhất cho toàn bộ traffic từ Web Client (Vite SPA).
  - Xác thực JWT token, trích xuất `X-User-Id`, `X-User-Role` chuyển tiếp xuống các service nội bộ.
  - Rate Limiting và chống tấn công DDoS (`express-rate-limit`).
  - Định tuyến (Reverse Proxy) tới các microservice tương ứng.

### 2.2. `document-service` (Node.js + Express)
- **Gói thư viện cốt lõi**: `express`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `pdf-parse`, `mammoth` (DOCX parser), `pg` (node-postgres).
- **Trách nhiệm chính**:
  - Quản lý metadata tài liệu học tập (`.pdf`, `.docx` $\le 25$MB).
  - Sinh S3/R2 Presigned Upload URL bằng `@aws-sdk/s3-request-presigner` để Client tải thẳng lên Storage.
  - Xử lý bóc tách text, heading, bảng biểu từ file PDF/DOCX.
  - Thuật toán Chunking RAG (1000 - 1500 ký tự, overlap 150 ký tự), lưu vào PostgreSQL.
  - Bắn sự kiện `document.parsed` vào RabbitMQ bằng `amqplib`.

### 2.3. `ai-engine-worker` (Node.js Background Worker)
- **Gói thư viện cốt lõi**: `amqplib`, `@google/generative-ai`, `openai`, `zod` (Schema Validator).
- **Trách nhiệm chính**:
  - Chạy ngầm độc lập (Headless Worker, không mở cổng HTTP public).
  - Tiêu thụ job từ hàng đợi RabbitMQ (`exam.generation.requested`, `grading.essay.requested`).
  - Dựng prompt ngữ cảnh RAG kết hợp Bloom Taxonomy, gọi LLM API với Structured JSON Output.
  - Thẩm định bài viết tự luận theo barem rubric chi tiết.
  - Cơ chế tự phục hồi JSON Schema (Self-Healing JSON repair).

### 2.4. `exam-service` (Node.js + Express)
- **Gói thư viện cốt lõi**: `express`, `ioredis`, `pg` (node-postgres), `amqplib`.
- **Trách nhiệm chính**:
  - Quản lý đề thi (Exam metadata, danh sách câu hỏi đa hình Hybrid JSONB).
  - Quản lý phiên làm bài trực tuyến (Exam Session / Attempt).
  - Server-Authoritative Timer: Khóa thời gian kết thúc cố định trên Redis.
  - High-frequency Auto-save: Ghi tạm vào Redis hash `< 10ms` và đồng bộ ngầm xuống PostgreSQL bằng hàm `jsonb_set`.
  - Phát hành sự kiện `exam.attempt.submitted` sang RabbitMQ.

### 2.5. `grading-service` (Node.js + Express)
- **Gói thư viện cốt lõi**: `express`, `amqplib`, `pg`.
- **Trách nhiệm chính**:
  - Chấm trắc nghiệm tức thì (Deterministic In-Memory Grader `< 50ms`).
  - Tiếp nhận kết quả chấm tự luận từ `ai-engine-worker`.
  - Tính tổng điểm thang 10 chuẩn hóa và phân tích năng lực Bloom (Radar chart data).
  - API Giáo viên ghi đè điểm (`POST /api/v1/attempts/{id}/override-grade`) kèm nhật ký Audit Trail.

---

## 3. Đặc tả Frontend (Vite + React + TailwindCSS)

- **Build Tool**: **Vite 5+** (Khởi động tức thì, Hot Module Replacement siêu tốc).
- **Styling**: **TailwindCSS 3.4+** (Hệ thống utility-first styling nhất quán, giao diện hiện đại, responsive mượt mà).
- **Routing**: `react-router-dom` v6.
- **State Management**: `zustand` (lưu trữ phiên thi, đồng bộ auto-save, cắm cờ câu hỏi) + `@tanstack/react-query` (quản lý server cache và mutation).
- **Biểu đồ**: `recharts` / `chart.js` vẽ Radar Chart năng lực Bloom.
- **Icon**: `lucide-react`.

---

## 4. Chiến lược Lưu trữ Dữ liệu (Database per Service)

1. Mỗi microservice sở hữu một Database Schema độc lập trên cụm **PostgreSQL 16+ Hybrid (SQL + NoSQL JSONB)**.
2. Tầng đệm **Redis 7+** kết nối qua thư viện `ioredis` để xử lý bộ đếm ngược thời gian thi và Auto-save tốc độ cao.
3. Object Storage **Cloudflare R2** dùng chung bucket phân cấp theo prefix: `/{user_id}/documents/{doc_id}/`.
