# Kiến Trúc Phân Phối Video & Lưu Trữ Đám Mây

## 1. Mô Hình Phân Phối Video Đa Tầng (Hybrid Video Delivery)

OwnEdu xây dựng kiến trúc phân cấp video bài giảng nhằm tối ưu hóa chi phí vận hành máy chủ, đồng thời đảm bảo trải nghiệm cao cấp cho các khóa học trả phí:

| Tiêu chí | Khóa Học Miễn Phí (Free Tier) | Khóa Học Nâng Cao (PRO VIP Tier) |
| :--- | :--- | :--- |
| **Nền tảng lưu trữ** | Google YouTube (Chế độ Không công khai - Unlisted) | Cloudflare R2 (Lưu trữ hướng đối tượng chuẩn S3) |
| **Chi phí băng thông** | Miễn phí 100% (YouTube chi trả lưu lượng) | Miễn phí 100% chi phí tải về (Cloudflare R2 Egress Free) |
| **Giao diện trình phát** | Khung nhúng bảo mật YouTube (`youtube-nocookie.com`) | Trình phát video HTML5 thuần, có hỗ trợ HTTP 206 Streaming |
| **Thương hiệu & Watermark** | Có logo/nhận diện YouTube theo quy định của Google | 100% Sạch sẽ, không dính logo bên thứ ba, tùy biến toàn diện |
| **Cách thức tải lên** | Dán đường dẫn URL / Video ID YouTube | Tải trực tiếp tệp video MP4 (hỗ trợ tối đa 2GB) |

---

## 2. Tích Hợp Đám Mây Cloudflare R2

### 2.1 Cấu hình trong `.env`
Các thông số cần thiết được đặt tại tệp `.env` gốc của dự án:
- `R2_ACCOUNT_ID`: Mã tài khoản Cloudflare của bạn.
- `R2_ACCESS_KEY_ID` & `R2_SECRET_ACCESS_KEY`: Cặp khóa truy cập chuẩn tương thích Amazon S3.
- `R2_BUCKET_NAME`: Tên thùng chứa video (ví dụ: `ownedu-storage`).
- `R2_PUBLIC_DOMAIN`: Tên miền công khai hoặc CDN phân phối (ví dụ: `https://pub-....r2.dev`).

### 2.2 Khởi tạo kết nối S3
Trong mã nguồn `backend/src/services/videoService.ts`:
```typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

---

## 3. Tối Ưu Hóa Phát Trực Tuyến (HTTP 206 Partial Content)

Khi phân phối video lưu trữ nội bộ hoặc qua API Gateway, máy chủ hỗ trợ đầy đủ tiêu chuẩn header `Range`:
1. Trình duyệt gửi yêu cầu kèm header `Range: bytes=0-1048575` (tải đoạn video 1MB đầu tiên để phát ngay).
2. Máy chủ phản hồi mã `HTTP 206 Partial Content`, thiết lập `Content-Range: bytes 0-1048575/tổng_dung_lượng` và `Accept-Ranges: bytes`.
3. Nhờ cơ chế này, học viên có thể kéo thanh trượt tua bài học đến bất kỳ mốc thời gian nào tức thì mà không cần phải chờ tải xong toàn bộ dung lượng video.

---

## 4. Cơ Chế Nhúng Video YouTube Bảo Mật

Đối với các khóa học miễn phí, giảng viên có thể cung cấp đường dẫn YouTube dưới các dạng thông dụng:
- Dạng xem chuẩn: `https://www.youtube.com/watch?v=...`
- Dạng rút gọn: `https://youtu.be/...`
- Dạng nhúng: `https://www.youtube.com/embed/...`

Hàm `extractYoutubeId` trong backend sẽ tự động tách mã ID gồm 11 ký tự ngẫu nhiên. Khi hiển thị cho học viên, hệ thống nhúng qua tên miền `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` để không lưu cookie theo dõi người dùng và hạn chế hiển thị các video đề xuất ngoài khóa học.
