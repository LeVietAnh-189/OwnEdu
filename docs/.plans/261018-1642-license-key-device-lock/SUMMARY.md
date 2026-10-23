# Implementation Plan: License Key Device Lock & Admin Live Support Chat

> Created: 2026-10-18 16:42:00

## Purpose / Big Picture

Cung cấp giải pháp bảo vệ bản quyền tài nguyên khóa học PRO trong OwnEdu: Mỗi khi học viên nâng cấp gói PRO, hệ thống tự động cấp **2 License Key** độc lập (tương ứng tối đa 2 thiết bị cá nhân như Laptop và PC). Mỗi key được khóa chặt với **Device Fingerprint** (Mã vân tay thiết bị/trình duyệt) + lưu vết IP mạng. Nếu học viên cần đổi máy (do máy hỏng, cài lại win), họ có thể mở **khung chat trực tiếp với Admin** để gửi lý do và Admin có thể duyệt **1-Click Reset Slot** ngay lập tức.

## Objective

- Ngăn chặn triệt để hành vi chia sẻ tài khoản PRO dùng chung nhiều người.
- Đảm bảo trải nghiệm học tập mượt mà cho học viên chính chủ khi đổi mạng Wi-Fi/4G (không bị khóa nhầm do IP động).
- Xây dựng luồng hỗ trợ cấp lại/đổi máy thân thiện thông qua kênh chat tích hợp giữa Học viên và Admin.

## Context and Orientation

- **Tài liệu liên quan**:
  - [system-design.md](file:///c:/Nexis/ownedu/docs/architecture/system-design.md)
  - [business-rules-and-tiers.md](file:///c:/Nexis/ownedu/docs/project-pdr/business-rules-and-tiers.md)
  - [conventions.md](file:///c:/Nexis/ownedu/docs/code-standard/conventions.md)
- **Tệp nguồn chính**:
  - Backend Data Store & Types: [backend/src/types.ts](file:///c:/Nexis/ownedu/backend/src/types.ts), [backend/src/db/hybridStore.ts](file:///c:/Nexis/ownedu/backend/src/db/hybridStore.ts)
  - Backend API Gateway: [backend/src/gateway/routes.ts](file:///c:/Nexis/ownedu/backend/src/gateway/routes.ts)
  - Frontend Services: [frontend/src/services/api.ts](file:///c:/Nexis/ownedu/frontend/src/services/api.ts)
  - Frontend User View: [frontend/src/pages/UserPage.tsx](file:///c:/Nexis/ownedu/frontend/src/pages/UserPage.tsx)
  - Frontend Admin View: [frontend/src/pages/AdminPage.tsx](file:///c:/Nexis/ownedu/frontend/src/pages/AdminPage.tsx)
  - Frontend Hypertext / Lesson View: [frontend/src/components/HypertextRenderer.tsx](file:///c:/Nexis/ownedu/frontend/src/components/HypertextRenderer.tsx)

## Scope

### In scope
1. Tự động sinh 2 License Key độc lập (`OE-PRO-XXXX-XXXX`) khi thanh toán nâng cấp PRO thành công (SePay hoặc Admin cấp PRO).
2. Backend lưu trữ quan hệ License Key $\leftrightarrow$ Device Binding (`deviceId`, `fingerprint`, `deviceName`, `lastIp`, `activatedAt`).
3. Frontend sinh và lưu trữ `deviceId` + `fingerprint` trong LocalStorage/IndexedDB.
4. Kiểm soát truy cập nội dung PRO: Chặn xem bài học / video / đề thi PRO nếu máy hiện tại chưa kích hoạt 1 trong 2 key hợp lệ của tài khoản.
5. Modal kích hoạt License Key trực tiếp trên giao diện khi gặp bài học PRO.
6. Hiển thị 2 thẻ License Key trên Tab Profile của học viên kèm trạng thái thiết bị đang liên kết.
7. Kênh Live Chat / Ticket hỗ trợ đổi thiết bị giữa Học viên và Admin.
8. Giao diện Quản trị License Keys và Duyệt Reset Slot 1-Click trong Admin Console.

### Out of scope
- Cài đặt phần mềm driver hoặc extension trình duyệt can thiệp sâu vào kernel OS (chỉ chạy trên Web API chuẩn).
- Tích hợp SMS OTP (sử dụng Live Chat trực tiếp trong nền tảng).

## Architecture & Approach

- **Device Fingerprinting**: Thu thập các thông số client-side chuẩn (User-Agent, Canvas WebGL renderer hash, Color Depth, Screen Resolution, Platform, Timezone) kết hợp UUID ngẫu nhiên bền vững trong `localStorage`.
- **Tách biệt 2 Slot**:
  - Slot 1: Key A $\rightarrow$ Bound to Device 1.
  - Slot 2: Key B $\rightarrow$ Bound to Device 2.
- **Quy trình Reset Slot**:
  - Khi Admin bấm `Reset Slot`, key chuyển về trạng thái `UNBOUND` (`boundDevice = null`).
  - Thiết bị cũ bị hủy quyền truy cập nội dung PRO ngay lập tức ở lần request kế tiếp.
  - Thiết bị mới có thể kích hoạt lại bằng chính mã key đó.

## Progress

- [x] Brainstorm & Yêu cầu nghiệp vụ được người dùng phê duyệt
- [x] Phase 1: Backend License & Chat Store, APIs (Completed & Verified)
- [x] Phase 2: Frontend Device Fingerprint, License Activation Modal & Profile Cards (Completed & Verified)
- [x] Phase 3: Frontend Admin License Console & Live Support Chat (Completed & Verified)
- [x] Phase 4: Integration & E2E Verification (Completed & Build Passed Exit Code 0)

## Phases

- [x] **Phase 1 [M]: Backend License Models, HybridStore & Gateway APIs** — Thêm kiểu dữ liệu LicenseKey, ChatTicket; tích hợp tự động cấp key khi thanh toán PRO; xây dựng các API kích hoạt, kiểm tra máy và chat hỗ trợ.
- [x] **Phase 2 [M]: Frontend Fingerprinting, Activation Modal & Profile License View** — Tiện ích tạo Device Fingerprint, Modal yêu cầu nhập key khi mở bài học PRO, Tab Profile quản lý 2 thiết bị.
- [x] **Phase 3 [M]: Frontend Admin License Management & Live Support Chat** — Giao diện Admin xem thiết bị, 1-click Reset Slot, và Hộp thoại Chat phản hồi học viên hai chiều.
- [x] **Phase 4 [S]: End-to-End Verification & Edge Cases** — Kiểm thử toàn diện kịch bản 2 máy, chặn máy thứ 3, đổi mạng Wi-Fi/4G không bị văng, và quy trình Admin duyệt reset slot.

## Key Changes

- [backend/src/types.ts](file:///c:/Nexis/ownedu/backend/src/types.ts): Bổ sung `LicenseKeyItem`, `LicenseDeviceBinding`, `LicenseChatTicket`.
- [backend/src/db/hybridStore.ts](file:///c:/Nexis/ownedu/backend/src/db/hybridStore.ts): Thêm schema lưu trữ licenses và chat tickets, hàm sinh 2 keys khi `upgradeUserToPro`, các hàm kích hoạt, xác thực máy, reset slot.
- [backend/src/gateway/routes.ts](file:///c:/Nexis/ownedu/backend/src/gateway/routes.ts): Thêm cụm endpoint `/api/licenses/*` và `/api/licenses/tickets/*`.
- [frontend/src/services/api.ts](file:///c:/Nexis/ownedu/frontend/src/services/api.ts): Bổ sung `LicenseAPI`.
- [frontend/src/utils/deviceFingerprint.ts](file:///c:/Nexis/ownedu/frontend/src/utils/deviceFingerprint.ts): Module trích xuất vân tay trình duyệt an toàn.
- [frontend/src/components/license/DeviceActivationModal.tsx](file:///c:/Nexis/ownedu/frontend/src/components/license/DeviceActivationModal.tsx): Modal kích hoạt bản quyền thiết bị.
- [frontend/src/components/license/LicenseChatModal.tsx](file:///c:/Nexis/ownedu/frontend/src/components/license/LicenseChatModal.tsx): Khung chat xin cấp lại key với Admin.
- [frontend/src/pages/UserPage.tsx](file:///c:/Nexis/ownedu/frontend/src/pages/UserPage.tsx): Tích hợp kiểm tra device bản quyền khi click học bài PRO và quản lý keys trong Profile.
- [frontend/src/pages/AdminPage.tsx](file:///c:/Nexis/ownedu/frontend/src/pages/AdminPage.tsx): Tab Quản lý Bản quyền Thiết bị & Duyệt chat reset key.

## Validation and Acceptance

- `bun x tsc --noEmit --project backend/tsconfig.json` exit code 0.
- `bun x tsc --noEmit --project frontend/tsconfig.json` exit code 0.
- Kiểm thử kịch bản:
  1. Người dùng nâng cấp PRO $\rightarrow$ Sinh đúng 2 key dạng `OE-PRO-XXXX-XXXX`.
  2. Kích hoạt Máy 1 với Key 1 $\rightarrow$ Thành công.
  3. Kích hoạt Máy 2 với Key 2 $\rightarrow$ Thành công.
  4. Máy 3 dùng lại Key 1 hoặc Key 2 $\rightarrow$ Bị chặn kèm thông báo rõ ràng.
  5. Máy 1 đổi IP mạng $\rightarrow$ Vẫn tiếp tục học bình thường mà không bị văng.
  6. Học viên gửi tin nhắn chat $\rightarrow$ Admin nhận được và duyệt Reset 1-Click $\rightarrow$ Máy mới kích hoạt lại thành công.

## Idempotence and Recovery

- Toàn bộ dữ liệu lưu trữ tại `data/store.json`. Nếu có lỗi, có thể khôi phục từ snapshot hoặc reset bảng license mà không ảnh hưởng tới dữ liệu khóa học hay người dùng.

## Decision Log

- 2026-10-18 16:40:00 — Quyết định: Sử dụng Device Fingerprint kết hợp lưu vết IP thay vì khóa cứng IP đơn thuần. Lý do: Mạng di động 4G và Wi-Fi tại Việt Nam có dải IP thay đổi liên tục, khóa cứng IP sẽ làm văng học viên hợp lệ.
- 2026-10-18 16:40:30 — Quyết định: Cung cấp tính năng Live Chat trực tiếp với Admin thay vì hệ thống ticket email rườm rà. Lý do: Giúp xử lý nhanh chóng vấn đề đổi máy/hỏng máy cho học viên ngay trong nền tảng.
