# Tổng Quan Hệ Thống Tài Liệu (Documentation Summary)

OwnEdu là nền tảng quản lý học tập và khảo thí ứng dụng trí tuệ nhân tạo (AI), tự động chuyển đổi giáo trình và tài liệu học thuật thành các bộ đề thi chuẩn hóa theo thang đo nhận thức Bloom (Bloom's Taxonomy), tổ chức phòng thi trực tuyến tương tác, và thực hiện chấm điểm tự động cho cả câu hỏi trắc nghiệm lẫn bài tập tự luận theo tiêu chí Rubric.
Hệ thống được phát triển theo mô hình Monorepo TypeScript, sử dụng Express.js chạy trên Bun runtime cho Backend API Gateway và React 18 + Vite + Tailwind CSS cho giao diện người dùng Frontend.

## Hướng Dẫn Ngữ Cảnh Dành Cho Agent (Agent Context Guide)

Trước khi lập kế hoạch hoặc triển khai mã nguồn, hãy đọc tệp `docs/SUMMARY.md` này trước tiên. Chỉ tải các tài liệu chi tiết liên quan trực tiếp đến nhiệm vụ hiện tại, và ưu tiên các tài liệu trong mục `Quy Chuẩn Mã Nguồn (Code Standard)` để nắm bắt các quy ước triển khai. Nếu tài liệu có điểm xung đột với mã nguồn hoặc ý định của người dùng, hãy chủ động trao đổi để làm rõ trước khi thực hiện các thay đổi diện rộng.

## Kiến Trúc Hệ Thống (Architecture)

Thiết kế hệ thống, tương tác giữa các thành phần, luồng dữ liệu, lưu trữ và tích hợp dịch vụ bên ngoài.

| Tệp Tài Liệu | Nội Dung Tóm Tắt |
| ------------ | ---------------- |
| [system-design.md](file:///c:/Nexis/ownedu/docs/architecture/system-design.md) | Kiến trúc tổng quan đa tầng, điều phối tiến trình chạy bằng Bun, tương tác giữa các phân hệ và cơ chế lưu trữ HybridStore. |
| [data-pipelines.md](file:///c:/Nexis/ownedu/docs/architecture/data-pipelines.md) | Luồng bóc tách tài liệu (PDF/DOCX), hàng đợi sinh đề thi AI bất đồng bộ và quy trình chấm điểm Rubric tự động. |
| [video-and-storage.md](file:///c:/Nexis/ownedu/docs/architecture/video-and-storage.md) | Kiến trúc phân phối video kết hợp: lưu trữ Cloudflare R2 S3, phát trực tuyến HTTP 206 và nhúng video YouTube bảo mật. |

## Cấu Trúc Mã Nguồn (Codebase)

Tổ chức cây thư mục, điểm vào ứng dụng (entry points), mẫu thiết kế API và trách nhiệm của các module chính.

| Tệp Tài Liệu | Nội Dung Tóm Tắt |
| ------------ | ---------------- |
| [directory-structure.md](file:///c:/Nexis/ownedu/docs/codebase/directory-structure.md) | Bản đồ chi tiết cây thư mục toàn dự án bao gồm thư mục gốc, Backend, Frontend và dữ liệu lưu trữ. |
| [backend-modules.md](file:///c:/Nexis/ownedu/docs/codebase/backend-modules.md) | Chi tiết điểm khởi chạy `index.ts`, router điều phối `routes.ts`, cơ sở dữ liệu HybridStore và các dịch vụ xử lý. |
| [frontend-modules.md](file:///c:/Nexis/ownedu/docs/codebase/frontend-modules.md) | Điều hướng React Router, layout khung làm việc `UserLayout`, trang lớp học trực tuyến, phòng thi và quản lý trạng thái. |

## Quy Chuẩn Mã Nguồn (Code Standard)

Quy ước viết mã, quy tắc đặt tên, phiên bản công nghệ và quy trình làm việc phát triển.

| Tệp Tài Liệu | Nội Dung Tóm Tắt |
| ------------ | ---------------- |
| [conventions.md](file:///c:/Nexis/ownedu/docs/code-standard/conventions.md) | Tiêu chuẩn nghiêm ngặt TypeScript, cấu trúc đóng gói phản hồi API, quy chuẩn thiết kế giao diện Tailwind CSS. |
| [environment-and-tooling.md](file:///c:/Nexis/ownedu/docs/code-standard/environment-and-tooling.md) | Danh mục biến môi trường `.env`, lệnh thực thi với Bun runtime, quy ước cổng mạng và kiểm tra bản build. |

## Nghiệp Vụ & Mục Tiêu Dự Án (Project PDR)

Mục tiêu sản phẩm, chân dung người dùng, quy tắc nghiệp vụ giáo dục và các chính sách phân quyền.

| Tệp Tài Liệu | Nội Dung Tóm Tắt |
| ------------ | ---------------- |
| [product-goals.md](file:///c:/Nexis/ownedu/docs/project-pdr/product-goals.md) | Sứ mệnh nền tảng, chân dung người dùng (học viên, giảng viên, quản trị viên) và các giá trị cốt lõi giải quyết bài toán đào tạo. |
| [bloom-taxonomy-engine.md](file:///c:/Nexis/ownedu/docs/project-pdr/bloom-taxonomy-engine.md) | 4 cấp độ nhận thức Bloom (Nhớ, Hiểu, Vận dụng, Phân tích) và ma trận tiêu chí chấm điểm tự luận Rubric chi tiết. |
| [business-rules-and-tiers.md](file:///c:/Nexis/ownedu/docs/project-pdr/business-rules-and-tiers.md) | Phân quyền vai trò người dùng (`USER` vs `ADMIN`), chính sách gói học viên (`FREE` vs `PRO VIP`) và giới hạn tải video. |

## Tài Liệu Tham Khảo Khác (Other)

Các tài liệu nghiên cứu nghiệp vụ Business Analyst (BRD/URD/SRS), hợp đồng API và bản thiết kế kỹ thuật gốc của dự án.

| Tệp Tài Liệu | Nội Dung Tóm Tắt |
| ------------ | ---------------- |
| [_architecture/system-architecture.md](file:///c:/Nexis/ownedu/docs/_architecture/system-architecture.md) | Bản thiết kế kiến trúc kỹ thuật ban đầu và biểu đồ tương tác giữa các dịch vụ. |
| [_architecture/api-contracts.md](file:///c:/Nexis/ownedu/docs/_architecture/api-contracts.md) | Hợp đồng giao tiếp HTTP chi tiết, định dạng tham số đầu vào và đầu ra. |
| [_architecture/database-design.md](file:///c:/Nexis/ownedu/docs/_architecture/database-design.md) | Mô hình thực thể dữ liệu và cấu trúc lưu trữ cơ sở dữ liệu JSON. |
| [_architecture/frontend-architecture.md](file:///c:/Nexis/ownedu/docs/_architecture/frontend-architecture.md) | Thiết kế kiến trúc giao diện, quản lý luồng trạng thái và chuyển trang. |
| [_architecture/prompt-engineering-spec.md](file:///c:/Nexis/ownedu/docs/_architecture/prompt-engineering-spec.md) | Cấu trúc câu lệnh mẫu (prompts) cho AI, cấu hình nhiệt độ và quy tắc phân tích JSON. |
| [_product/project-brief.md](file:///c:/Nexis/ownedu/docs/_product/project-brief.md) | Bản tóm tắt dự án ban đầu, phạm vi sản phẩm và mục tiêu kinh doanh. |
| [ai-exam-generator/ai-exam-generator-brd.md](file:///c:/Nexis/ownedu/docs/ai-exam-generator/ai-exam-generator-brd.md) | Tài liệu yêu cầu nghiệp vụ chi tiết cho phân hệ tạo đề thi bằng AI. |
| [ai-grading-feedback/ai-grading-feedback-brd.md](file:///c:/Nexis/ownedu/docs/ai-grading-feedback/ai-grading-feedback-brd.md) | Tài liệu yêu cầu nghiệp vụ cho phân hệ chấm thi và nhận xét tự động. |
| [doc-ingestion/doc-ingestion-brd.md](file:///c:/Nexis/ownedu/docs/doc-ingestion/doc-ingestion-brd.md) | Tài liệu yêu cầu nghiệp vụ cho phân hệ tải lên và bóc tách tài liệu đa định dạng. |
| [interactive-testing/interactive-testing-brd.md](file:///c:/Nexis/ownedu/docs/interactive-testing/interactive-testing-brd.md) | Tài liệu yêu cầu nghiệp vụ cho phân hệ phòng thi trực tuyến bấm giờ. |
