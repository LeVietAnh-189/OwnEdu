# Phase 04: Integration & E2E Verification

## Objective

Kiểm thử toàn diện luồng hoạt động từ đầu đến cuối của hệ thống License Key & Device Lock: từ khi thanh toán nâng cấp PRO, cấp 2 key, kích hoạt 2 máy, ngăn chặn máy thứ 3, đổi IP mạng, gửi chat xin đổi máy, đến khi Admin duyệt reset key thành công.

## Scope

- Toàn bộ luồng tương tác giữa Backend và Frontend.
- Kiểm thử logic bảo mật, ràng buộc dữ liệu và trải nghiệm người dùng.

## Preconditions

- Phase 1, Phase 2, Phase 3 đã hoàn thành và mã nguồn không có lỗi biên dịch.

## Tasks

1. **Kiểm thử Luồng Mua Gói PRO $\rightarrow$ Cấp 2 Key**:
   - Sử dụng đơn hàng mẫu hoặc tạo đơn hàng SePay mới.
   - Khi thanh toán thành công, kiểm tra `my-licenses` trả về đúng 2 key dạng `OE-PRO-XXXX-XXXX` với trạng thái `ACTIVE` và `boundDevice = null`.

2. **Kiểm thử Kích Hoạt Thiết Bị 1 & Thiết Bị 2**:
   - Trình duyệt hiện tại: Bấm học bài PRO $\rightarrow$ Modal kích hoạt hiện ra $\rightarrow$ Chọn kích hoạt Key 1 $\rightarrow$ Thành công $\rightarrow$ Vào học bài PRO trơn tru.
   - Mở trình duyệt ẩn danh (hoặc trình duyệt thứ hai): Đăng nhập $\rightarrow$ Vào bài học PRO $\rightarrow$ Chọn kích hoạt Key 2 $\rightarrow$ Thành công.

3. **Kiểm thử Ngăn Chặn Thiết Bị 3 (Conflict Check)**:
   - Mở trình duyệt thứ ba: Cố tình nhập Key 1 hoặc Key 2 $\rightarrow$ Hệ thống phản hồi lỗi 409: *"Khóa này đã được sử dụng trên thiết bị [Tên thiết bị]".*
   - Bài học PRO bị chặn không cho truy cập.

4. **Kiểm thử Thay Đổi IP Mạng (Dynamic IP Check)**:
   - Mô phỏng thay đổi IP hoặc dùng IP khác trên máy 1 $\rightarrow$ Hệ thống vẫn cho phép học bình thường (vì Device Fingerprint trùng khớp), cập nhật `lastIp` mới trong hồ sơ máy.

5. **Kiểm thử Luồng Live Chat & Reset Slot của Admin**:
   - Từ trình duyệt thứ ba, học viên bấm *"Chat với Admin"* $\rightarrow$ Gửi tin nhắn *"Em mới đổi laptop, nhờ Admin reset giúp em Key 1"*.
   - Chuyển sang tài khoản Admin $\rightarrow$ Tab Bản quyền & Chat $\rightarrow$ Thấy tin nhắn của học viên $\rightarrow$ Bấm nút *"Duyệt Reset Key 1"*.
   - Học viên tại trình duyệt thứ ba kích hoạt lại Key 1 $\rightarrow$ Kích hoạt thành công rực rỡ!

6. **Kiểm tra Mã Nguồn & Bản Build**:
   - `bun x tsc --noEmit --project backend/tsconfig.json`
   - `bun x tsc --noEmit --project frontend/tsconfig.json`
   - `bun run build`

## Acceptance Criteria

- Cả 5 kịch bản kiểm thử đều hoạt động chính xác theo đúng yêu cầu đề ra.
- Giao diện mượt mà, thông báo tiếng Việt rõ ràng, bảo vệ triệt để khóa học PRO.

## Verification

- Backend & Frontend typechecks và build đạt exit code 0.
