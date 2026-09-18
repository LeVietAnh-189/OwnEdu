# Tài liệu Yêu cầu Người dùng (URD) - ai-exam-generator

**Phân hệ**: `ai-exam-generator`  
**Microservice chịu trách nhiệm**: `ai-engine-worker`  
**Phiên bản**: 1.0.0  
**Trạng thái**: Draft  
**Truy vết (Traceability)**:
- [project-brief.md](file:///C:/Nexis/ownedu/docs/_product/project-brief.md)
- [discovery.md](file:///C:/Nexis/ownedu/docs/_product/discovery.md)
- Phân hệ tiền đề: [doc-ingestion-spec.md](file:///C:/Nexis/ownedu/docs/doc-ingestion/srs/doc-ingestion-spec.md)

---

## 1. Mục tiêu & Phạm vi (Objectives & Scope)
Phân hệ `ai-exam-generator` là trái tim thông minh của OwnEdu. Sau khi tài liệu học tập được bóc tách nội dung tại `document-service`, phân hệ này cho phép người dùng (sinh viên, học sinh, giáo viên) tùy biến cấu hình và kích hoạt AI để tự động tạo ra bộ đề thi hỗn hợp gồm cả trắc nghiệm (MCQ) và tự luận (Essay) bám sát tuyệt đối nội dung tài liệu với thang điểm rubric chuẩn hóa.

---

## 2. Phân tích Persona & Nhu cầu (Persona Needs)

### Persona 1: Sinh viên Nam (Tự học & Ôn thi đại học)
- **Nhu cầu**: Muốn tạo nhanh đề ôn tập 20 câu trắc nghiệm và 2 câu tự luận từ slide bài giảng 50 trang để tự kiểm tra kiến thức trước kỳ thi giữa kỳ.
- **Mong muốn**: Đề sinh ra không quá 1 phút, câu hỏi bám sát slide, trắc nghiệm có 4 phương án rõ ràng, câu tự luận có câu hỏi gợi ý tư duy.
- **Nỗi đau**: Tự đọc sách thì không biết mình nắm được bao nhiêu phần trăm, dùng ChatGPT web thì copy paste bị tràn context và ra câu hỏi lan man ngoài lề giáo trình.

### Persona 2: Cô Hương (Giáo viên THPT)
- **Nhu cầu**: Tải tài liệu chuyên đề hình học/văn học, muốn hệ thống sinh đề kiểm tra 45 phút gồm 15 câu trắc nghiệm (Nhận biết, Thông hiểu) và 1 câu tự luận (Vận dụng cao) có sẵn barem điểm chi tiết để phát cho học sinh.
- **Mong muốn**: Được xem trước (preview), biên tập lại câu từ hoặc đổi phương án nếu muốn trước khi phát hành đề.
- **Nỗi đau**: Soạn đề kiểm tra kèm barem chấm tự luận mất 3-4 tiếng mỗi tuần; cần công cụ giảm tải 80% thời gian soạn đề.

---

## 3. Danh sách Yêu cầu Người dùng (User Requirements Catalog)

| Mã Yêu cầu | Tên Yêu cầu | Mô tả Chi tiết | Mức độ Ưu tiên | Persona Mục tiêu |
| :--- | :--- | :--- | :--- | :--- |
| **UR-GEN-001** | Cấu hình cấu trúc đề thi | Người dùng có thể chỉ định số lượng câu trắc nghiệm (MCQ, 5-50 câu) và số lượng câu tự luận (Essay, 0-10 câu). | Bắt buộc (Must) | Nam, Cô Hương |
| **UR-GEN-002** | Chọn cấp độ nhận thức | Cho phép chọn phân bổ độ khó theo thang đo tư duy (Bloom): Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao. | Bắt buộc (Must) | Cô Hương, Nam |
| **UR-GEN-003** | Giới hạn phạm vi tài liệu | Người dùng có thể chọn toàn bộ tài liệu hoặc chọn các chương/trang cụ thể đã parse để sinh đề. | Nên có (Should) | Cô Hương |
| **UR-GEN-004** | Theo dõi tiến độ thời gian thực | Giao diện hiển thị thanh trạng thái sinh đề (Queueing -> Analyzing Context -> Generating Questions -> Completed) không bị đơ trình duyệt. | Bắt buộc (Must) | Nam, Cô Hương |
| **UR-GEN-005** | Xem trước & Tinh chỉnh đề thi | Sau khi AI sinh xong, người dùng có quyền chỉnh sửa câu từ, đổi thứ tự đáp án, sửa barem điểm trước khi lưu/làm bài. | Bắt buộc (Must) | Cô Hương, Nam |
| **UR-GEN-006** | Lưu trữ đề mẫu và Xuất bản | Cho phép lưu đề thi vào thư viện cá nhân hoặc chuyển tiếp trực tiếp vào `exam-service` để bắt đầu làm bài kiểm tra. | Bắt buộc (Must) | Nam, Cô Hương |

---

## 4. Tiêu chí Chấp nhận Tổng thể (Acceptance Criteria)
- [ ] Thời gian sinh bộ đề 20 câu MCQ + 2 câu Essay không vượt quá 45 giây.
- [ ] 100% câu hỏi MCQ có đúng 1 đáp án chính xác và 3 đáp án nhiễu logic, có giải thích vì sao đúng.
- [ ] 100% câu hỏi tự luận có barem chấm điểm (Rubric) chi tiết theo tiêu chí và mức điểm thành phần.
- [ ] Không xuất hiện ảo giác (hallucination) về mặt kiến thức vượt ra ngoài phạm vi tài liệu nguồn đã cung cấp.
