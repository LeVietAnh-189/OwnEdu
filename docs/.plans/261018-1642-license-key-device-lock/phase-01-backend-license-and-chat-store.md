# Phase 01: Backend License & Chat Store, APIs

## Objective

Xây dựng toàn bộ hạ tầng Backend cho tính năng bản quyền thiết bị: mô hình dữ liệu (`LicenseKeyItem`, `LicenseDeviceBinding`, `LicenseChatTicket`), các phương thức trong `HybridStore` (tự động cấp 2 key khi mua PRO, kích hoạt key, kiểm tra thiết bị, reset slot), và các API endpoints tại `routes.ts`.

## Scope

- Files/modules may touch:
  - [backend/src/types.ts](file:///c:/Nexis/ownedu/backend/src/types.ts)
  - [backend/src/db/hybridStore.ts](file:///c:/Nexis/ownedu/backend/src/db/hybridStore.ts)
  - [backend/src/gateway/routes.ts](file:///c:/Nexis/ownedu/backend/src/gateway/routes.ts)
- Files/modules must not touch:
  - Frontend components
  - AI generator modules

## Preconditions

- Backend build đang hoạt động ổn định không có lỗi TypeScript (`tsc --noEmit`).

## Tasks

1. **Context & Types**:
   - Mở [backend/src/types.ts](file:///c:/Nexis/ownedu/backend/src/types.ts), định nghĩa các interfaces:
     - `LicenseStatus`: `'ACTIVE' | 'REVOKED' | 'EXPIRED'`
     - `LicenseDeviceBinding`: `deviceId`, `deviceFingerprint`, `deviceName`, `activatedAt`, `lastIp`, `lastActiveAt`
     - `LicenseKeyItem`: `id`, `key`, `userId`, `userEmail`, `orderCode`, `slotIndex` (1 | 2), `status`, `boundDevice`, `expiresAt`, `createdAt`, `updatedAt`
     - `LicenseChatTicket`: `id`, `userId`, `userName`, `userEmail`, `targetKeyId`, `status`, `messages`, `createdAt`, `updatedAt`
     - Cập nhật `DatabaseSchema` trong `hybridStore.ts` để lưu `licenseKeys: LicenseKeyItem[]` và `licenseChatTickets: LicenseChatTicket[]`.

2. **HybridStore Logic**:
   - Bổ sung hàm `generateUserLicenseKeys(userId: string, expiresAt?: string)`: Sinh đúng 2 key ngẫu nhiên dạng `OE-PRO-XXXX-XXXX` (ví dụ `OE-PRO-98B2-A41F`), gán slotIndex 1 và 2.
   - Bổ sung logic tự động gọi `generateUserLicenseKeys` khi tài khoản được nâng cấp PRO trong `upgradeUserToPro` và `updatePaymentOrderStatus`.
   - Bổ sung hàm `getUserLicenses(userId: string)`: Trả về danh sách key của user.
   - Bổ sung hàm `activateLicenseKey(params: { userId: string, key: string, deviceId: string, deviceFingerprint: string, deviceName: string, ip: string })`:
     - So khớp key có thuộc về userId hay không.
     - Kiểm tra key đã bị gán cho `deviceId` khác chưa. Nếu đã bị gán $\rightarrow$ throw error kèm thông tin máy cũ.
     - Nếu chưa bị gán hoặc đã gán cho chính `deviceId` này $\rightarrow$ cập nhật `boundDevice` và `lastIp`, trả về thành công.
   - Bổ sung hàm `verifyDeviceAccess(userId: string, deviceId: string, ip?: string)`: Kiểm tra xem `deviceId` này đã kích hoạt key nào của user hay chưa.
   - Bổ sung hàm `adminResetLicenseSlot(keyId: string)`: Admin xóa `boundDevice` của key để giải phóng slot.
   - Bổ sung các hàm quản lý `LicenseChatTicket`: `getTickets`, `getTicketByUserId`, `createOrReplyTicket`, `adminResolveTicket`.

3. **API Gateway Routes**:
   - `GET /api/licenses/my-licenses`: Lấy danh sách 2 keys của user hiện tại.
   - `POST /api/licenses/activate`: Kích hoạt key cho thiết bị hiện tại (nhận `key`, `deviceId`, `fingerprint`, `deviceName`).
   - `POST /api/licenses/verify-device`: Kiểm tra xem thiết bị này có quyền truy cập khóa học PRO hay không.
   - `GET /api/licenses/admin/all`: Lấy danh sách toàn bộ licenses hệ thống (dành cho Admin).
   - `POST /api/licenses/admin/reset`: Admin reset slot cho một key cụ thể.
   - `GET /api/licenses/tickets`: Lấy ticket chat của user (hoặc tất cả tickets nếu là Admin).
   - `POST /api/licenses/tickets/message`: Gửi tin nhắn chat mới trong ticket.

4. **Verify**:
   - Chạy `bun x tsc --noEmit --project backend/tsconfig.json` đảm bảo không lỗi kiểu dữ liệu.

## Acceptance Criteria

- API cấp và quản lý license phản hồi chuẩn envelope `{ success: true, data: ... }`.
- Nếu kích hoạt key đã dùng trên máy khác, API trả về mã lỗi `409` kèm thông báo tiếng Việt rõ ràng.
- Giao dịch PRO thành công luôn sinh đủ 2 key cho user.

## Verification

- Command: `bun x tsc --noEmit --project backend/tsconfig.json`
- Expected: 0 errors.

## Idempotence and Recovery

- Tệp `data/store.json` tự động tạo mảng `licenseKeys` và `licenseChatTickets` rỗng nếu chưa tồn tại.
- Có thể reset mảng license mà không ảnh hưởng tới dữ liệu khóa học.
