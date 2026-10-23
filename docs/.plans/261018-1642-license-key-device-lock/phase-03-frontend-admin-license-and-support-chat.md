# Phase 03: Frontend Admin License Management & Live Support Chat

## Objective

Xây dựng tính năng Live Chat trao đổi giữa Học viên và Admin về vấn đề bản quyền thiết bị, tích hợp giao diện quản lý License Keys và duyệt 1-Click Reset Slot trong Admin Console.

## Scope

- Files/modules may touch:
  - [frontend/src/components/license/LicenseChatModal.tsx](file:///c:/Nexis/ownedu/frontend/src/components/license/LicenseChatModal.tsx) (New)
  - [frontend/src/pages/AdminPage.tsx](file:///c:/Nexis/ownedu/frontend/src/pages/AdminPage.tsx)
  - [frontend/src/components/admin/AdminLicenseTab.tsx](file:///c:/Nexis/ownedu/frontend/src/components/admin/AdminLicenseTab.tsx) (New hoặc nhúng vào AdminPage)

## Preconditions

- Phase 1 & Phase 2 hoàn thành.

## Tasks

1. **Hộp thoại Live Chat cho Học viên (`LicenseChatModal.tsx`)**:
   - Mở ra khi học viên bấm *"Chat với Admin"* từ modal kích hoạt hoặc từ tab Profile.
   - Hiển thị danh sách tin nhắn trao đổi hai chiều giữa Học viên và Quản trị viên.
   - Input gửi tin nhắn kèm tự động đính kèm thông tin thiết bị (`Device Snapshot`).
   - Có cơ chế polling định kỳ hoặc refresh khi gửi để nhận phản hồi mới từ Admin.

2. **Quản lý Bản Quyền trong Admin Console (`AdminPage.tsx`)**:
   - Thêm tab hoặc phân hệ *"Bản Quyền & Thiết Bị (DRM & Licenses)"* trong Admin Console:
     - Bảng thống kê: Tổng số License Keys, Số thiết bị đang hoạt động, Số yêu cầu đổi máy đang chờ duyệt.
     - Bảng danh sách Keys theo học viên:
       - Mã học viên, Tên, Email.
       - Mã License Key (`OE-PRO-XXXX-XXXX`), Slot 1 / Slot 2.
       - Tên thiết bị gắn kèm, Ngày kích hoạt, Địa chỉ IP gần nhất.
       - Nút thao tác: **"Reset Slot (Hủy liên kết máy)"** với popup xác nhận.
     - Phân hệ Hộp thư / Chat hỗ trợ học viên:
       - Danh sách cuộc hội thoại đang mở (kèm badge đỏ khi có tin nhắn chưa xử lý).
       - Khung xem nội dung chat chi tiết, ô nhập tin nhắn trả lời học viên.
       - Nút **"Duyệt Hủy Khóa Cũ Cho Học Viên Này"** nằm ngay phía trên khung chat để Admin xử lý chỉ với 1 click mà không cần tra cứu thủ công.

## Acceptance Criteria

- Học viên gửi tin nhắn từ User Portal $\rightarrow$ Tin nhắn lập tức xuất hiện trong Admin Console.
- Admin bấm Reset Slot $\rightarrow$ License Key chuyển về trạng thái trống (`boundDevice = null`), học viên nhận được thông báo trong chat và có thể kích hoạt lại trên máy mới.

## Verification

- Command: `bun x tsc --noEmit --project frontend/tsconfig.json`
- Expected: 0 errors.
