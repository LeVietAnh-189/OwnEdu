# Quy Tắc Nghiệp Vụ & Phân Hạng Gói Cước (Business Rules & Tiers)

Tài liệu này xác định các chính sách phân quyền, quy tắc nghiệp vụ cốt lõi và giới hạn quyền lợi giữa hai phân hạng thành viên: **Học viên Miễn phí (Free Tier)** và **Học viên Cao cấp (Pro VIP Tier)** trong hệ thống OwnEdu.

---

## 1. Bảng so sánh quyền lợi gói cước (Tiers Matrix)

| Tiêu chí so sánh | Học viên Miễn phí (Free Tier) | Học viên Cao cấp (Pro VIP Tier) |
| :--- | :--- | :--- |
| **Giá dịch vụ** | 0 VNĐ | Trả phí theo tháng hoặc theo khóa học |
| **Nguồn phát video** | YouTube nhúng (`youtube-nocookie.com`) | Cloudflare R2 Streaming độ phân giải cao |
| **Bộ điều khiển video** | Cơ bản (giao diện YouTube iframe) | Chuyên nghiệp: chỉnh tốc độ 0.5x - 2.0x, nhớ vị trí xem |
| **Trải nghiệm quảng cáo** | Tùy thuộc vào chính sách của YouTube | 100% không quảng cáo, đường truyền riêng biệt |
| **Tạo đề thi khảo thí AI** | Giới hạn tối đa 3 đề thi / ngày | Không giới hạn số lượng tạo đề |
| **Chấm điểm bài luận AI Rubric** | Tối đa 1 bài nộp / ngày, nhận xét ngắn | Không giới hạn bài nộp, nhận xét chi tiết 4 tiêu chí |
| **Tải tài liệu đính kèm** | Đọc trực tuyến trong trình duyệt | Cho phép tải về máy (.pdf, .docx, file mã nguồn) |
| **Cấp chứng chỉ hoàn thành** | Không hỗ trợ | Tự động cấp chứng chỉ số có mã xác thực QR |

---

## 2. Quy tắc nghiệp vụ phân quyền Backend (Authorization Rules)

### 2.1 Kiểm tra quyền truy cập Video (`video.controller.ts`)
- Khi người dùng gửi yêu cầu lấy thông tin bài học (`GET /api/courses/:courseId/lessons/:lessonId`):
  1. Kiểm tra trạng thái bài học: Nếu bài học được đánh dấu là `isPreview: true`, bất kỳ người dùng nào (kể cả chưa đăng nhập) đều được phép xem.
  2. Nếu bài học thuộc diện Pro VIP (`isPro: true`):
     - Hệ thống kiểm tra trường `tier` trong hồ sơ người dùng.
     - Nếu `tier !== 'pro'` và người dùng không phải là `instructor` sở hữu khóa học hoặc `admin`: Trả về mã lỗi `403 Forbidden` kèm thông báo *"Nội dung này dành riêng cho thành viên Pro VIP. Vui lòng nâng cấp tài khoản."*
     - Nếu đủ điều kiện: Sinh URL stream an toàn từ Cloudflare R2 hoặc cấp presigned token có thời hạn ngắn (15 phút).

### 2.2 Giới hạn hạn mức gọi AI (Rate Limiting AI Usage)
- Nhằm kiểm soát chi phí API Google Gemini, hệ thống áp dụng hạn mức:
  - **Free Tier**: Mỗi tài khoản chỉ được phép gọi chức năng sinh đề thi từ tài liệu tối đa 3 lần/ngày. Khi vượt quá, API trả về mã lỗi `429 Too Many Requests`.
  - **Pro VIP Tier**: Áp dụng hạn mức mềm (50 lần/ngày) để chống hành vi lạm dụng bot hoặc cào dữ liệu.

---

## 3. Quy trình nâng cấp tài khoản (Upgrade Flow)

```text
[ Học viên Free ]
        │
        ▼ Bấm "Nâng cấp Pro VIP" tại giao diện bài học bị khóa hoặc bảng giá
[ Trang Thanh toán ]
        │
        ▼ Học viên quét mã VietQR hoặc thanh toán trực tuyến
[ Cổng Thanh toán Webhook ]
        │
        ▼ Server nhận callback xác nhận giao dịch thành công
[ Cập nhật HybridStore ]
        │
        ├── Đổi `user.tier = 'pro'`
        ├── Ghi nhận thời hạn `user.proExpiresAt = Date.now() + 30 days`
        └── Sinh sự kiện thông báo cho học viên
        │
        ▼
[ Mở khóa toàn bộ video R2 & tính năng AI không giới hạn ]
```

---

## 4. Chính sách bảo vệ bản quyền nội dung

1. **Khóa liên kết trực tiếp R2**: Video trong bucket R2 không được công khai link trực tiếp (No Public S3 Bucket Access). Tất cả phải đi qua lớp xác thực của máy chủ Express hoặc sử dụng Cloudflare Presigned Signed Cookie có gắn địa chỉ IP người dùng.
2. **Chặn công cụ tải xuống đơn giản**: Giao diện trình phát video tắt menu chuột phải (`onContextMenu={e => e.preventDefault()}`), ẩn thanh tải xuống mặc định của trình duyệt (`controlsList="nodownload"`).
3. **Chống gian lận khi làm bài thi**:
   - Ghi nhận thời gian bắt đầu và kết thúc làm bài.
   - Theo dõi số lần học viên chuyển tab hoặc rời khỏi cửa sổ làm bài thi để cảnh báo giảng viên trong bảng báo cáo.
