# Phase 02: Frontend Device Fingerprint, Activation Modal & Profile License View

## Objective

Xây dựng module tạo và quản lý mã nhận diện thiết bị ở Frontend (`deviceFingerprint.ts`), tích hợp `LicenseAPI` trong `frontend/src/services/api.ts`, thiết kế modal kích hoạt bản quyền `DeviceActivationModal.tsx` khi truy cập nội dung PRO, và hiển thị thẻ 2 License Key trong Tab Profile của học viên.

## Scope

- Files/modules may touch:
  - [frontend/src/types.ts](file:///c:/Nexis/ownedu/frontend/src/types.ts)
  - [frontend/src/services/api.ts](file:///c:/Nexis/ownedu/frontend/src/services/api.ts)
  - [frontend/src/utils/deviceFingerprint.ts](file:///c:/Nexis/ownedu/frontend/src/utils/deviceFingerprint.ts) (New)
  - [frontend/src/components/license/DeviceActivationModal.tsx](file:///c:/Nexis/ownedu/frontend/src/components/license/DeviceActivationModal.tsx) (New)
  - [frontend/src/pages/UserPage.tsx](file:///c:/Nexis/ownedu/frontend/src/pages/UserPage.tsx)

## Preconditions

- Phase 1 Backend API đã sẵn sàng và kiểm tra thành công.

## Tasks

1. **Client Device Fingerprint (`deviceFingerprint.ts`)**:
   - Viết hàm `getOrCreateDeviceId()`: Lấy UUID từ `localStorage.getItem('ownedu_device_id')`, nếu chưa có thì tạo mới và lưu lại.
   - Viết hàm `generateDeviceFingerprint()`: Băm thông tin trình duyệt gồm User-Agent, Screen width/height/colorDepth, Canvas 2D/WebGL hash, Timezone.
   - Viết hàm `getDeviceHumanName()`: Trả về tên dễ đọc như *"Chrome 128 trên Windows (1920x1080)"*.

2. **Frontend License API Client**:
   - Thêm `LicenseAPI` vào [frontend/src/services/api.ts](file:///c:/Nexis/ownedu/frontend/src/services/api.ts):
     - `getMyLicenses()`
     - `activateLicense(key: string)`
     - `verifyCurrentDevice()`
     - `getChatTicket()`
     - `sendChatMessage(message: string, targetKeyId?: string)`

3. **Device Activation Modal (`DeviceActivationModal.tsx`)**:
   - Giao diện hiện đại (glassmorphism/Tailwind):
     - Biểu tượng Khiên bảo mật `ShieldCheck`.
     - Tiêu đề: *"Xác Thực Bản Quyền Thiết Bị Cho Khóa Học PRO"*.
     - Danh sách 2 slot key của học viên:
       - Slot 1: Hiển thị trạng thái (Đã kích hoạt trên máy nào, hoặc còn trống).
       - Slot 2: Hiển thị trạng thái.
       - Nút *"Kích hoạt ngay trên máy tính này"* (1 click nếu đã có key trống).
       - Ô nhập License Key thủ công (dành cho trường hợp học viên copy key).
     - Nút trợ giúp: *"Thiết bị gặp sự cố hoặc đã hết lượt kích hoạt? Chat với Admin"*.

4. **Tích hợp Guard trong `UserPage.tsx`**:
   - Khi học viên click vào một Khóa học PRO hoặc Bài học PRO:
     - Kiểm tra nhanh `LicenseAPI.verifyCurrentDevice()`.
     - Nếu chưa hợp lệ $\rightarrow$ mở `DeviceActivationModal`.
     - Sau khi kích hoạt thành công $\rightarrow$ cho phép tiếp tục học.
   - Tại Tab `profile`: Thêm khu vực *"Bản Quyền & Thiết Bị Học Tập"* với 2 Cards trực quan hiển thị thông tin 2 máy đã gán, IP lần cuối, nút Copy key và nút Chat hỗ trợ.

## Acceptance Criteria

- Khi mở bài học PRO trên thiết bị chưa đăng ký key, modal kích hoạt xuất hiện và chặn truy cập.
- Kích hoạt thành công lưu trạng thái và cho phép xem bài học ngay lập tức.
- Profile hiển thị đầy đủ 2 thẻ License Key và trạng thái thiết bị rõ ràng.

## Verification

- Command: `bun x tsc --noEmit --project frontend/tsconfig.json`
- Expected: 0 errors.
