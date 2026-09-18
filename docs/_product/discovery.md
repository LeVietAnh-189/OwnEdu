---
type: discovery
project_id: PROJ-OWNEDU
status: in-review
updated: 2026-09-18
links:
  - docs/_product/project-brief.md
---

# OwnEdu — Discovery (Khảo Sát Hiện Trạng & Phân Tích Bối Cảnh)

> **Mục tiêu**: Bức tranh hiện trạng thực tế của việc học tập, tự ôn luyện và soạn đề thi từ tài liệu cá nhân trước khi bước vào đặc tả yêu cầu chi tiết.

---

## 👥 I. Stakeholders (Các bên liên quan & Trách nhiệm)

| Stakeholder | Vai trò trong vấn đề | Quyền quyết định / Dữ kiện sở hữu |
|---|---|---|
| **Học sinh / Sinh viên** | Người trực tiếp học và cần kiểm tra mức độ nắm kiến thức từ giáo trình, slide bài giảng | Quyết định trải nghiệm làm bài có thuận tiện, dễ hiểu và phản hồi giải thích có thuyết phục hay không |
| **Giáo viên / Giảng viên** | Người biên soạn ngân hàng câu hỏi và chấm điểm bài tập cho học sinh | Quyết định độ tin cậy của đề thi AI sinh ra (đúng trọng tâm, chuẩn thuật ngữ, barem chấm rõ ràng) |
| **Product Owner** | Người định hình sản phẩm, kiểm soát chi phí API LLM và định hướng phát triển | Quyết định phạm vi tính năng MVP, thứ tự ưu tiên các tính năng và mô hình vận hành |

---

## ⏳ II. Current process (Quy trình As-Is hiện tại khi không có OwnEdu)

1. **Học sinh / Sinh viên tự ôn tập**:
   - Mở file slide PDF bài giảng hoặc giáo trình DOCX, đọc lướt bằng mắt, dùng bút highlighter tô màu các đoạn quan trọng.
   - Khi muốn tự kiểm tra kiến thức: Tìm kiếm đề thi trên mạng hoặc các nhóm học tập $\rightarrow$ Các đề này thường chung chung, không bám sát nội dung đặc thù mà thầy cô dạy trên lớp.
   - Với phần tự luận: Học sinh tự viết câu trả lời ra nháp nhưng **không có ai sửa bài hoặc chấm điểm**, không biết mình diễn đạt có trúng ý và đủ luận điểm hay không.

2. **Giáo viên / Giảng viên soạn đề và chấm bài**:
   - Giáo viên đọc lại bài giảng, tự nghĩ câu hỏi trắc nghiệm và mất nhiều công sức để nghĩ ra 3 phương án gây nhiễu (distractors) sao cho hợp lý và không bị lộ đáp án.
   - Soạn câu hỏi tự luận và tự viết barem đáp án từng phần điểm.
   - Sau khi học sinh nộp bài: Giáo viên phải đọc và chấm thủ công hàng chục đến hàng trăm bài tự luận $\rightarrow$ Dễ mệt mỏi, chấm thiếu đồng đều và mất 1–2 tuần mới trả kết quả cho học sinh.

---

## 🔍 III. Findings (Các phát hiện thực tế)

| ID | Phát hiện thực tế | Nguồn dữ liệu / Bằng chứng | Tác động tới giải pháp |
|---|---|---|---|
| **`DISC-001`** | **Nhu cầu bám sát tài liệu riêng (Context-specific Learning)**: Học sinh không cần ngân hàng đề ngẫu nhiên đại trà, họ cần câu hỏi bám sát đúng 100% nội dung slide/giáo trình mà lớp của họ đang học. | Khảo sát hành vi học sinh ôn thi học kỳ | Hệ thống bắt buộc phải dùng kỹ thuật RAG / Contextual Chunking để AI chỉ sinh đề dựa trên tài liệu người dùng tải lên, không bịa kiến thức ngoài. |
| **`DISC-002`** | **Nỗi đau chấm bài tự luận**: 80% giáo viên ngần ngại ra đề tự luận vì khâu chấm bài tốn quá nhiều thời gian, dù tự luận phản ánh tư duy sâu sắc hơn trắc nghiệm. | Phỏng vấn giảng viên | Tính năng AI chấm tự luận theo barem rubric chi tiết là giá trị cốt lõi giúp OwnEdu vượt trội so với các web thi trắc nghiệm thuần túy. |
| **`DISC-003`** | **Khoảng trống giữa ChatGPT tự do và Web thi chuyên biệt**: Học sinh có thể copy text vào ChatGPT để nhờ hỏi bài, nhưng giao diện chat rất bất tiện: không có bấm giờ, không có click chọn A/B/C/D, câu hỏi bị trôi mất và không lưu lại bảng điểm lịch sử. | Thói quen sử dụng AI của sinh viên | Cần một giao diện thi chuyên biệt (Exam Environment): tính giờ, lưu tiến độ, nộp bài, xem bảng phân tích điểm. |

---

## 🛒 IV. Existing market solutions (Khảo sát giải pháp sẵn có trên thị trường)

| Giải pháp / Công cụ | Giải quyết được nhu cầu nào | Chỗ hụt / Hạn chế lớn | Chi phí | Đánh giá |
|---|---|---|---|---|
| **Quizlet / Anki** | Học từ vựng, flashcard ghi nhớ nhanh lặp lại ngắt quãng (Spaced Repetition). | Phải tự gõ thẻ thủ công; không tự đọc hiểu giáo trình PDF dài; không hỗ trợ tự luận và chấm bài. | Miễn phí / Bản Plus ~$35/năm | Chưa giải quyết được bài toán thi thử từ tài liệu dài. |
| **ChatGPT / Claude (Prompt tự do)** | Phân tích text và sinh câu hỏi cực kỳ thông minh, linh hoạt. | Không có giao diện làm bài thi (phải đọc text chat); không có bộ đếm giờ; khó kiểm soát chất lượng format; người dùng phải tự nghĩ câu lệnh prompt phức tạp. | Miễn phí / Plus $20/tháng | Phù hợp làm động cơ AI phía backend hơn là sản phẩm hoàn chỉnh cho học sinh. |
| **Azota / Shub Classroom** | Giao diện giao bài tập, chấm trắc nghiệm qua phiếu quét ảnh rất tốt. | **Không có AI sinh đề từ tài liệu**: Giáo viên vẫn phải tự soạn file Word đề thi chuẩn format rồi mới upload lên. | Miễn phí / Trả phí theo trường học | Là công cụ quản lý lớp học, không phải công cụ học tập thông minh tạo đề tự động. |

---

## ⚖️ V. Build-or-buy conclusion (Kết luận: Tự xây hay Mua giải pháp có sẵn?)

| Kết luận | Lý do nghiệp vụ | Người ra quyết định | Ngày chốt |
|---|---|---|---|
| **TỰ XÂY DỰNG (BUILD)** | Thị trường hiện chưa có nền tảng nào kết hợp mượt mà: **Upload PDF/DOCX $\rightarrow$ AI sinh trắc nghiệm + tự luận $\rightarrow$ Môi trường thi bấm giờ $\rightarrow$ AI chấm tự luận chi tiết**. Tự xây OwnEdu bằng cách kết nối API mô hình ngôn ngữ lớn (Gemini / OpenAI) sẽ lấp trọn khoảng trống này với chi phí phát triển hợp lý. | Product Owner | 2026-09-18 |

---

## 💥 VI. Pain points (Điểm đau người dùng cần giải quyết)

| Nhóm người dùng | Điểm đau (Pain Point) | Tần suất | Hậu quả thực tế |
|---|---|---|---|
| **Học sinh / Sinh viên** | Đọc tài liệu nhưng không nhớ được ý chính; không biết mình hiểu bài hay chưa. | Mỗi đợt kiểm tra / ôn thi | Điểm thi thấp, cảm giác hoang mang trước kỳ thi vì không được luyện đề sát bài giảng. |
| **Học sinh / Sinh viên** | Làm bài tự luận nhưng không ai sửa và chỉ ra lỗi sai diễn đạt. | Thường xuyên | Lặp lại lỗi sai tương tự trong bài thi chính thức. |
| **Giáo viên** | Mất từ 3 đến 5 tiếng cho mỗi buổi soạn đề kiểm tra từ tài liệu mới. | Hàng tuần / Hàng tháng | Giảm thời gian đầu tư cho phương pháp giảng dạy, mệt mỏi kiệt sức khi kỳ thi đến. |

---

## ❓ VII. Open Questions (Câu hỏi mở bối cảnh)

- [ ] **`OQ-DISC-001`** [non-blocking]: Cơ chế kiểm soát chi phí token AI: Một tài khoản người dùng miễn phí nên được tải bao nhiêu tài liệu / sinh bao nhiêu bài thi mỗi ngày?
- [ ] **`OQ-DISC-002`** [non-blocking]: Khi tạo đề trắc nghiệm, người dùng có cần chọn số lượng câu hỏi mong muốn (ví dụ: 10 câu, 20 câu, 40 câu) hay hệ thống tự quyết định theo độ dài tài liệu?
