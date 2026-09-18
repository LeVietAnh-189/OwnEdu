# Tài liệu Yêu cầu Người dùng (URD) - ai-grading-feedback

**Phân hệ**: `ai-grading-feedback`  
**Microservice chịu trách nhiệm**: `grading-service` (phối hợp cùng `ai-engine-worker`)  
**Phiên bản**: 1.0.0  
**Trạng thái**: Draft  
**Truy vết (Traceability)**:
- [project-brief.md](file:///C:/Nexis/ownedu/docs/_product/project-brief.md)
- [discovery.md](file:///C:/Nexis/ownedu/docs/_product/discovery.md)
- Phân hệ tiền đề: [interactive-testing-spec.md](file:///C:/Nexis/ownedu/docs/interactive-testing/srs/interactive-testing-spec.md)

---

## 1. Mục tiêu & Phạm vi (Objectives & Scope)
Phân hệ `ai-grading-feedback` giải quyết trọn vẹn khâu cuối cùng trong chu trình học tập: Chấm điểm bài thi tự động cho cả câu hỏi trắc nghiệm (ngay lập tức) và câu hỏi tự luận (chấm theo barem rubric bằng AI), đồng thời cung cấp bảng phân tích năng lực chi tiết kèm giải thích cặn kẽ giúp người học tiến bộ.

---

## 2. Phân tích Persona & Nhu cầu (Persona Needs)

### Persona 1: Sinh viên Nam (Người học)
- **Nhu cầu**: Nộp bài xong muốn biết điểm ngay. Câu trắc nghiệm sai câu nào thì muốn xem giải thích vì sao sai. Câu tự luận viết xong không chỉ muốn một con số chung chung (như 7/10) mà muốn biết mình được điểm ở tiêu chí nào, trừ điểm ở ý nào và nên đọc lại phần nào trong giáo trình.
- **Nỗi đau**: Làm bài tự luận ở trường thường phải đợi giáo viên chấm 1-2 tuần mới có điểm, lúc đó đã quên hết nội dung mình viết và bài học không còn tính thời sự.

### Persona 2: Cô Hương (Giáo viên)
- **Nhu cầu**: Khi giao bài cho lớp 40 học sinh, hệ thống chấm tự động toàn bộ trắc nghiệm và đề xuất điểm tự luận sơ bộ kèm nhận xét theo barem rubric của cô. Cô chỉ cần duyệt lại (review) hoặc chỉnh sửa điểm nếu muốn, giúp cô tiết kiệm 95% thời gian chấm bài.
- **Nỗi đau**: Chấm 40 bài văn/luận mỗi tuần gây kiệt sức và dễ bị chủ quan (mệt mỏi ở các bài cuối làm lệch thang điểm).

---

## 3. Danh sách Yêu cầu Người dùng (User Requirements Catalog)

| Mã Yêu cầu | Tên Yêu cầu | Mô tả Chi tiết | Mức độ Ưu tiên | Persona Mục tiêu |
| :--- | :--- | :--- | :--- | :--- |
| **UR-GRADE-001** | Chấm trắc nghiệm tức thì | Ngay khi nộp bài, hệ thống tính toán kết quả trắc nghiệm và hiển thị đáp án đúng/sai kèm giải thích cặn kẽ trong vòng 1-2 giây. | Bắt buộc (Must) | Nam, Cô Hương |
| **UR-GRADE-002** | Chấm tự luận theo Barem Rubric | AI đối chiếu bài làm của thí sinh với từng tiêu chí rubric của đề thi, chấm điểm thành phần và nêu lý do tại sao đạt/không đạt điểm tối đa. | Bắt buộc (Must) | Nam, Cô Hương |
| **UR-GRADE-003** | Lời khuyên cải thiện cá nhân hóa | AI chỉ ra các lỗ hổng kiến thức cụ thể (Knowledge Gaps) và dẫn link tới chính xác các trang trong tài liệu PDF/DOCX ban đầu để ôn tập. | Bắt buộc (Must) | Nam |
| **UR-GRADE-004** | Báo cáo phân tích năng lực | Biểu đồ radar phân tích năng lực theo cấp độ tư duy Bloom (Nhận biết, Thông hiểu, Vận dụng, Phân tích) và tỷ lệ phần trăm làm đúng. | Nên có (Should) | Nam, Cô Hương |
| **UR-GRADE-005** | Giáo viên xem xét & can thiệp điểm | Giáo viên có quyền xem toàn bộ bài làm, lời giải thích của AI, ghi đè (override) điểm số hoặc bổ sung nhận xét thủ công. | Bắt buộc (Must) | Cô Hương |

---

## 4. Tiêu chí Chấp nhận Tổng thể (Acceptance Criteria)
- [ ] Chấm trắc nghiệm hoàn tất và hiển thị kết quả trong < 3 giây sau khi nộp.
- [ ] Chấm tự luận bằng AI (1-3 câu) hoàn tất trong < 30 giây.
- [ ] Nhận xét tự luận bám sát barem rubric, không dùng câu chung chung như "bài viết tốt", mà phải chỉ rõ ý nào đạt điểm, ý nào thiếu sót.
- [ ] Bảng điểm tổng kết hiển thị đầy đủ: Điểm trắc nghiệm, Điểm tự luận, Tổng điểm thang 10, Thời gian làm bài và Lời khuyên ôn tập.
