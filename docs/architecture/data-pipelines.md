# Luồng Dữ Liệu & Quy Trình Xử Lý (Data Pipelines)

## 1. Quy Trình Bóc Tách Giáo Trình & Tài Liệu (Document Ingestion)

```
[Người dùng tải file: PDF / DOCX / MD]
       |
       v
[Bộ tiếp nhận Multer (lưu tạm tại backend/data/uploads)]
       |
       +---> [Điều hướng theo định dạng]
                 |
                 +---> File PDF  ---> pdfjs-dist / MinerU OCR
                 +---> File DOCX ---> mammoth trích xuất văn bản
                 +---> File MD   ---> Chuẩn hóa chuỗi văn bản UTF-8
       |
       v
[Bộ chuẩn hóa nội dung văn bản]
       |
       +---> Đếm số trang, số ký tự, kích thước tệp
       +---> Nhận diện tiêu đề chương mục và cấu trúc tài liệu
       |
       v
[Lưu trữ vào HybridStore]
  Tạo bản ghi DocumentItem mới trong store.json
```

### Cam kết kỹ thuật của luồng:
- Các đuôi file được hỗ trợ: `.pdf`, `.docx`, `.md`, `.markdown`.
- Vị trí lưu trữ: Các tệp nhị phân được đặt trong thư mục `backend/data/uploads/` và được sinh mã định danh UUID ngẫu nhiên để chống trùng tên file.
- Cơ chế chịu lỗi: Nếu phân hệ OCR nâng cao gặp sự cố, hệ thống tự động chuyển sang cơ chế bóc tách văn bản nội bộ an toàn.

---

## 2. Quy Trình Tạo Đề Thi AI Bất Đồng Bộ (AI Exam Generation)

Quá trình sinh câu hỏi được thực hiện bất đồng bộ và được theo dõi trạng thái qua mã định danh tác vụ `jobId`:

```
[Frontend gửi yêu cầu: POST /api/v1/exams/generate]
       |
       v
[Khởi tạo tiến trình: Trạng thái = 'GENERATING', trả về jobId]
       |
       v
[Chuẩn bị ngữ cảnh cho AI]
  - Đọc nội dung giáo trình được chọn làm tài liệu học tập
  - Cắt lát văn bản phù hợp cửa sổ ngữ cảnh (lên tới 32.000 ký tự)
  - Đưa ma trận phân bổ Bloom vào câu lệnh (Ví dụ: 30% Nhớ, 30% Hiểu, 25% Vận dụng, 15% Phân tích)
       |
       v
[Gọi Mô hình Trí tuệ Nhân tạo (Google Gemini / OpenAI)]
  - Sử dụng System Prompt yêu cầu xuất định dạng chuẩn JSON Schema
  - Ép kiểu dữ liệu câu hỏi chặt chẽ (options A, B, C, D, đáp án đúng, giải thích)
       |
       v
[Kiểm tra & Hậu xử lý dữ liệu]
  - Kiểm tra tính đầy đủ của các phương án lựa chọn
  - Xác thực đáp án chính xác và tiêu chí Rubric cho câu tự luận
  - Tính toán tổng điểm và thời gian làm bài khuyến nghị
       |
       v
[Hoàn tất tiến trình: Trạng thái = 'COMPLETED']
  - Lưu đối tượng Đề thi (Exam) vào HybridStore
  - Frontend định kỳ polling nhận tín hiệu hoàn tất -> Tự động chuyển đến màn hình duyệt đề / thi thử
```

---

## 3. Luồng Khảo Thí & Chấm Điểm AI Theo Tiêu Chí Rubric

```
[Thí sinh bấm vào thi: POST /api/v1/exams/:id/start]
       |
       v
[Khởi tạo lượt thi (Attempt): Trạng thái = 'IN_PROGRESS', bắt đầu đếm ngược]
       |
       v
[Phòng thi tương tác]
  - Tự động lưu bài làm (Auto-save) định kỳ để chống mất dữ liệu khi mất mạng
  - Đếm thời gian làm bài và theo dõi trạng thái trả lời từng câu
       |
       v
[Nộp bài thi: POST /api/v1/exams/:id/submit]
       |
       +---> [Phân hệ chấm Trắc nghiệm tự động]
       |       - So sánh tức thì: câu trả lời học viên === đáp án đúng
       |       - Tổng hợp điểm số và tỷ lệ chính xác theo từng cấp độ nhận thức Bloom
       |
       +---> [Phân hệ AI chấm Tự luận theo Rubric]
               - Gửi bài viết của thí sinh cùng tiêu chí Rubric của câu hỏi đến AI
               - Đánh giá theo 4 tiêu chuẩn: Tính chính xác, Độ sâu, Tính logic, Trình bày
               - Xuất kết quả: Điểm số thành phần, điểm mạnh, điểm yếu và gợi ý học tập
       |
       v
[Tổng hợp Báo cáo Kết quả Toàn diện]
  - Điểm tổng kết (thang 10 hoặc thang 100)
  - Biểu đồ phân tích phổ năng lực nhận thức Bloom (Radar Chart)
  - Lưu kết quả Attempt vào store.json
  - Chuyển hướng người dùng xem chi tiết báo cáo tại /exams/:id/results/:attemptId
```
