# Mục Tiêu Sản Phẩm & Chân Dung Người Dùng (Product Goals)

Tài liệu này xác định tầm nhìn dài hạn, giá trị cốt lõi và các phân khúc đối tượng sử dụng nền tảng giáo dục trực tuyến OwnEdu.

---

## 1. Tầm nhìn và Sứ mệnh

**OwnEdu** được định vị là nền tảng học tập và khảo thí số thế hệ mới, giải quyết triệt để hai bài toán lớn nhất của việc học trực tuyến hiện nay:
1. **Thiếu tính tương tác và đo lường sâu**: Học viên thường chỉ xem video một cách thụ động, thiếu cơ chế kiểm tra đánh giá chuẩn mực theo mức độ tư duy.
2. **Chi phí hạ tầng video và khảo thí tốn kém**: Giảng viên và trung tâm đào tạo gặp khó khăn khi phải trả phí duy trì máy chủ video đắt đỏ và tốn hàng tuần lễ để soạn thảo ngân hàng đề thi.

**Sứ mệnh của OwnEdu**: Kết hợp sức mạnh của **Google Gemini AI** và **Thang đo nhận thức Bloom (Bloom's Taxonomy)** để tự động hóa việc tạo đề thi chất lượng cao, chấm bài luận chi tiết theo Rubric, đồng thời tối ưu hóa chi phí lưu trữ phân phát video bằng mô hình lai (YouTube + Cloudflare R2).

---

## 2. Các mục tiêu sản phẩm then chốt (Key Product Goals)

### Mục tiêu 1: Khảo thí bám sát tài liệu học (100% Grounded Assessment)
- Sinh câu hỏi tự động trực tiếp từ giáo trình, slide bài giảng hoặc tài liệu PDF/DOCX do giảng viên cung cấp.
- Ngăn chặn hoàn toàn hiện tượng suy diễn hoặc cung cấp thông tin sai lệch ngoài tài liệu học tập.

### Mục tiêu 2: Chuẩn hóa theo Thang đo nhận thức Bloom
- Mỗi câu hỏi trắc nghiệm hay tự luận đều được phân bổ chính xác vào 1 trong 4 bậc nhận thức: **Nhận biết (Remember)**, **Thông hiểu (Understand)**, **Vận dụng (Apply)**, và **Phân tích (Analyze)**.
- Báo cáo phân tích sau thi giúp học viên nhận biết rõ điểm mạnh và lỗ hổng kiến thức theo từng bậc tư duy.

### Mục tiêu 3: Chấm điểm bài luận khách quan với Rubric đa tiêu chí
- Ứng dụng AI phân tích bài viết tự luận của học viên theo bảng tiêu chí chấm điểm rõ ràng: mức độ chính xác của kiến thức, lập luận logic, bằng chứng chứng minh và văn phong diễn đạt.
- Cung cấp lời nhận xét cá nhân hóa và hướng dẫn cách khắc phục lỗi sai.

### Mục tiêu 4: Tối ưu chi phí truyền dẫn video (Zero-Egress Strategy)
- Tận dụng hạ tầng miễn phí của YouTube cho các khóa học nhập môn/cộng đồng với trình phát bảo vệ quyền riêng tư `youtube-nocookie.com`.
- Sử dụng Cloudflare R2 với chi phí zero-egress (không tốn phí băng thông tải ra) cho các nội dung chuyên sâu gói Pro VIP, đảm bảo trải nghiệm bảo mật và phát mượt mà.

---

## 3. Chân dung người dùng mục tiêu (User Personas)

### 3.1 Học viên (Student / Learner)
- **Đặc điểm**: Học sinh, sinh viên, người đi làm có nhu cầu tự nâng cao kỹ năng chuyên môn.
- **Nhu cầu cốt lõi**:
  - Giao diện phòng học tinh gọn, dễ theo dõi tiến độ từng chương.
  - Video phát mượt mà, có thể tăng giảm tốc độ và lưu lại vị trí xem dở.
  - Làm bài kiểm tra ngay sau bài học để củng cố kiến thức và nhận kết quả tức thì.
  - Được giải thích rõ ràng tại sao chọn đáp án đó là đúng hoặc sai.

### 3.2 Giảng viên & Tác giả khóa học (Instructor / Course Creator)
- **Đặc điểm**: Thầy cô giáo, chuyên gia đào tạo, người sáng tạo nội dung giáo dục.
- **Nhu cầu cốt lõi**:
  - Tải lên tài liệu giáo trình có sẵn (.pdf, .docx) và để AI tự động tạo ngân hàng đề thi trong vài chục giây.
  - Tùy chỉnh tỷ lệ câu hỏi dễ/khó dựa trên Thang đo Bloom để đánh giá đúng năng lực học viên.
  - Tiết kiệm hàng chục giờ chấm bài luận thủ công nhờ công cụ chấm tự động theo Rubric.
  - Quản lý dễ dàng các bài giảng video miễn phí và video trả phí cao cấp.

### 3.3 Quản trị viên hệ thống (Administrator)
- **Đặc điểm**: Đội ngũ kỹ thuật vận hành nền tảng OwnEdu.
- **Nhu cầu cốt lõi**:
  - Bảng điều khiển quản lý người dùng, phân quyền truy cập và giám sát trạng thái tài nguyên R2 S3.
  - Theo dõi hạn mức sử dụng Gemini AI Token để kiểm soát chi phí hoạt động.
