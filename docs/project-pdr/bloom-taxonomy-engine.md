# Động Cơ Khảo Thí Bloom & Tiêu Chuẩn Chấm Rubric (Bloom Engine)

Thang đo nhận thức Bloom (Bloom's Revised Taxonomy) và ma trận tiêu chí đánh giá (Rubric) là hai trụ cột phương pháp luận sư phạm cốt lõi trong hệ thống tạo đề thi và chấm điểm của OwnEdu.

---

## 1. Ứng dụng Thang đo nhận thức Bloom

Thay vì tạo các câu hỏi ngẫu nhiên chỉ dựa trên sự trùng lặp từ khóa, động cơ AI của OwnEdu phân loại câu hỏi theo 4 cấp bậc nhận thức tiến bộ:

```text
▲ [4. Phân tích (Analyze)]      ──> So sánh, mổ xẻ nguyên nhân, phân biệt quan điểm
│ [3. Vận dụng (Apply)]        ──> Áp dụng công thức, xử lý tình huống thực tế
│ [2. Thông hiểu (Understand)]  ──> Giải thích khái niệm, tóm tắt ý chính
│ [1. Nhận biết (Remember)]    ──> Nhớ lại định nghĩa, sự kiện, thuật ngữ
```

### 1.1 Chi tiết 4 cấp bậc nhận thức

| Bậc nhận thức | Động từ hành động | Mục tiêu sư phạm | Ví dụ thực tế |
| :--- | :--- | :--- | :--- |
| **1. Nhận biết** *(Remember)* | Liệt kê, gọi tên, định nghĩa, nhận dạng | Kiểm tra khả năng ghi nhớ các khái niệm, định lý cơ bản từ tài liệu bài giảng | *"HTTP Status Code nào biểu thị lỗi không tìm thấy tài nguyên?"* |
| **2. Thông hiểu** *(Understand)* | Giải thích, minh họa, phân loại, tóm lược | Đo lường mức độ thấu hiểu bản chất vấn đề, diễn đạt lại bằng ngôn ngữ riêng | *"Tại sao kiến trúc microservices thường cần đến API Gateway?"* |
| **3. Vận dụng** *(Apply)* | Tính toán, áp dụng, triển khai, giải quyết | Vận dụng quy tắc hoặc thuật toán đã học để xử lý một bài toán cụ thể | *"Hãy viết hàm đệ quy trong JavaScript để tính dãy số Fibonacci"* |
| **4. Phân tích** *(Analyze)* | So sánh, phân biệt, mổ xẻ, chỉ ra điểm yếu | Phân tách vấn đề phức tạp thành các phần nhỏ, so sánh ưu nhược điểm | *"So sánh sự khác nhau về độ trễ và chi phí băng thông giữa Cloudflare R2 và AWS S3"* |

---

## 2. Tiêu chuẩn chấm bài luận theo Rubric đa tiêu chí

Đối với các câu hỏi tự luận mở, OwnEdu thiết lập prompt chuyên sâu để Gemini AI đóng vai trò như một hội đồng giám khảo công tâm, chấm điểm dựa trên bảng Rubric 4 tiêu chuẩn:

### 2.1 Bảng ma trận Rubric chấm điểm

| Tiêu chí | Trọng số | Mô tả đánh giá |
| :--- | :---: | :--- |
| **1. Tính chính xác về kiến thức** *(Accuracy)* | 40% | Câu trả lời có đúng bản chất kiến thức trong bài giảng không? Có xuất hiện sai sót căn bản nào không? |
| **2. Tính mạch lạc & Lập luận logic** *(Logic & Flow)* | 25% | Cấu trúc bài viết có rõ ràng, dẫn dắt từ giả thuyết đến kết luận hợp lý hay không? |
| **3. Bằng chứng & Dẫn chứng minh họa** *(Evidence)* | 20% | Có đưa ra ví dụ thực tế, số liệu hoặc trích đoạn cụ thể để chứng minh luận điểm không? |
| **4. Văn phong & Thuật ngữ chuyên ngành** *(Terminology)* | 15% | Sử dụng thuật ngữ chuyên môn có chuẩn xác không? Trình bày có gãy gọn, đúng ngữ pháp không? |

### 2.2 Cấu trúc kết quả chấm điểm trả về

Mỗi bài luận nộp lên sẽ được trả về kết quả dạng JSON có cấu trúc hoàn chỉnh:

```json
{
  "totalScore": 8.5,
  "maxScore": 10.0,
  "criteriaBreakdown": [
    { "criterion": "Chính xác kiến thức", "score": 3.5, "max": 4.0, "comment": "Nắm vững khái niệm chính, giải thích đúng cơ chế." },
    { "criterion": "Lập luận logic", "score": 2.0, "max": 2.5, "comment": "Mạch lập luận rõ ràng, các ý bổ trợ tốt cho nhau." },
    { "criterion": "Dẫn chứng minh họa", "score": 1.5, "max": 2.0, "comment": "Có ví dụ nhưng chưa đào sâu vào trường hợp ngoại lệ." },
    { "criterion": "Văn phong & Thuật ngữ", "score": 1.5, "max": 1.5, "comment": "Sử dụng đúng các thuật ngữ kỹ thuật tiêu chuẩn." }
  ],
  "strengths": [
    "Khả năng tổng hợp kiến thức từ tài liệu tốt",
    "Diễn đạt khúc chiết, mạch lạc"
  ],
  "weaknesses": [
    "Chưa đề cập đến yếu tố tối ưu hiệu năng khi chịu tải cao"
  ],
  "recommendations": "Nên xem lại Bài học 4 phần Tối ưu hóa bộ nhớ đệm để hoàn thiện phương án phân tích."
}
```

---

## 3. Cơ chế kiểm soát chống ảo giác (Grounded Generation)

Để bảo đảm câu hỏi và đáp án luôn bám sát 100% nội dung giảng dạy của giảng viên, hệ thống áp dụng kỹ thuật **Grounded Prompting**:
- Tài liệu đính kèm được trích xuất text nguyên bản và truyền trực tiếp vào Context Window của Gemini.
- Prompt chỉ định nghiêm ngặt: *“Chỉ tạo câu hỏi dựa trên các thông tin xuất hiện trong ngữ cảnh được cung cấp. Nếu tài liệu không đủ thông tin, không được tự suy diễn hoặc lấy kiến thức bên ngoài.”*
- Mọi câu hỏi trắc nghiệm đều bắt buộc đi kèm trường `referenceSnippet` chỉ rõ đoạn văn trong giáo trình làm căn cứ cho đáp án đúng.
