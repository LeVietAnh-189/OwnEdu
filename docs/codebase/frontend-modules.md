# Các Phân Hệ Và Module Frontend (Frontend Modules)

Giao diện OwnEdu được xây dựng bằng React 18, Vite và Tailwind CSS, mang lại trải nghiệm học tập hiện đại, mượt mà và trực quan.

---

## 1. Cấu trúc tổ chức Frontend

Mã nguồn frontend trong thư mục `frontend/src` được phân chia thành các thành phần chuyên biệt:

```text
frontend/src/
├── components/          # Thành phần giao diện dùng chung
│   ├── common/          # Nút bấm (Button), Hộp thoại (Modal), Huy hiệu (Badge), Spinner
│   ├── layout/          # Thanh điều hướng (Navbar), Thanh bên (Sidebar), Chân trang (Footer)
│   ├── video/           # Trình phát video đa chế độ UnifiedVideoPlayer
│   └── exam/            # Thẻ câu hỏi Bloom, Bảng đồng hồ đếm ngược, Thanh chỉ số câu
├── context/             # Quản lý trạng thái toàn cục (AuthContext, CourseContext)
├── hooks/               # Custom hooks logic (useAuth, useExamTimer, useVideoProgress)
├── pages/               # Các trang màn hình chính
│   ├── auth/            # Trang Đăng nhập, Đăng ký
│   ├── dashboard/       # Bảng điều khiển học viên, tiến độ các khóa đang học
│   ├── courses/         # Danh mục khóa học, trang chi tiết khóa học
│   ├── learning/        # Phòng học tương tác (Video player + bài tập + tài liệu)
│   ├── exam/            # Màn hình làm đề thi AI, nộp bài và xem đánh giá chi tiết
│   └── studio/          # Không gian giảng viên tạo khóa, tải video và tài liệu
├── services/            # Lớp kết nối HTTP API với Backend (Axios client)
└── types/               # Khai báo kiểu dữ liệu TypeScript cho giao diện
```

---

## 2. Các thành phần giao diện nòng cốt

### 2.1 Trình phát Video Hợp nhất (`UnifiedVideoPlayer.tsx`)
- **Vị trí**: `src/components/video/UnifiedVideoPlayer.tsx`
- **Đặc điểm nổi bật**:
  - Tự động nhận diện nguồn video: Kiểm tra URL xem là video YouTube hay video lưu trữ trên Cloudflare R2 / máy chủ nội bộ.
  - Video YouTube an toàn: Tự động chuyển đổi link sang domain bảo mật `https://www.youtube-nocookie.com/embed/{id}`, tắt các video đề xuất từ kênh khác (`rel=0`), bảo vệ quyền riêng tư học viên.
  - Video Pro VIP (HTML5 Video): Hỗ trợ đầy đủ bộ điều khiển chuyên nghiệp:
    - Điều chỉnh tốc độ phát: 0.75x, 1.0x, 1.25x, 1.5x, 2.0x.
    - Nhớ mốc thời gian xem dở: Tự động lưu tiến độ video vào local state/backend khi học viên thoát trang.
    - Hạn chế thao tác chuột phải và tải xuống trái phép đối với video bản quyền.

### 2.2 Không gian Phòng học Trực tuyến (`pages/learning/`)
- Bố cục 2 cột tiêu chuẩn giáo dục trực tuyến:
  - Cột chính (trái): Trình phát video độ phân giải cao kèm khu vực ghi chú và tài liệu đính kèm (.pdf).
  - Cột phụ (phải): Danh sách chương mục, hiển thị biểu tượng trạng thái từng bài (Đã hoàn thành, Đang học, Bị khóa).
  - Tự động chuyển bài tiếp theo khi video phát xong hoặc người học bấm nút xác nhận hoàn thành.

### 2.3 Giao diện Khảo thí AI & Thang đo Bloom (`pages/exam/`)
- Hiển thị đề thi thông minh:
  - Thẻ nhận diện mức độ nhận thức: Gắn nhãn màu sắc trực quan tương ứng với 4 bậc Bloom (Xanh lá: Nhận biết, Xanh dương: Thông hiểu, Cam: Vận dụng, Đỏ: Phân tích).
  - Lưới điều hướng câu hỏi (Question Navigation Matrix): Giúp học viên nhảy nhanh đến câu hỏi bất kỳ, hiển thị trạng thái đã chọn đáp án hoặc còn trống.
  - Bảng tổng kết kết quả: Phân tích tỷ lệ đúng/sai theo từng cấp bậc nhận thức, kèm lời giải thích chi tiết được Gemini AI tạo ra.

### 2.4 Không gian Giảng viên (`pages/studio/`)
- Quản lý cấu trúc bài giảng trực quan kéo thả.
- Form tải lên tài liệu học tập và cấu hình đề thi:
  - Cho phép tải file PDF/DOCX làm căn cứ tạo đề.
  - Chọn tỷ lệ câu hỏi trắc nghiệm / tự luận.
  - Tùy chỉnh tỷ lệ phần trăm các bậc nhận thức Bloom mong muốn.

---

## 3. Quản lý trạng thái và Kết nối API

- **`AuthContext.tsx`**: Lưu trữ trạng thái đăng nhập, thông tin người dùng và quyền hạn (`role`, `tier`). Tự động tải lại thông tin khi mở lại trình duyệt nếu token còn hiệu lực trong `localStorage`.
- **`services/api.ts`**: Cấu hình Axios Interceptors:
  - Request Interceptor: Tự động đính kèm `Authorization: Bearer <token>` vào mọi yêu cầu gửi lên server.
  - Response Interceptor: Bắt lỗi mã HTTP 401 (hết hạn token) để điều hướng về trang đăng nhập và hiển thị thông báo lỗi thân thiện.
