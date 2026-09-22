# OwnEdu — Nền Tảng Khảo Thí & Đánh Giá Năng Lực Ứng Dụng AI

Dự án OwnEdu bao gồm:
- **Backend API Gateway & Microservices**: Node.js / Express + TypeScript (Chạy trực tiếp qua **Bun** trên cổng `3000`).
- **Frontend Web**: React 18 + Vite + TailwindCSS (Chạy qua **Bun** trên cổng `5173`).

---

## 🚀 Khởi Chạy Nhanh Bằng 1 Lệnh Duy Nhất (Khuyên Dùng)

Dự án đã được cấu hình tối ưu để khởi chạy đồng thời cả Backend và Frontend qua Bun bằng **1 câu lệnh duy nhất**:

```bash
bun dev
# hoặc
bun run dev
```

Hệ thống sẽ tự động:
1. Chạy Backend tại [http://localhost:3000](http://localhost:3000) (kiểm tra trạng thái tại [http://localhost:3000/health](http://localhost:3000/health)).
2. Chạy Frontend tại [http://localhost:5173](http://localhost:5173).
3. Hợp nhất luồng log với tiền tố trực quan `[backend]` và `[frontend]`.
4. Khi nhấn `Ctrl + C`, cả 2 dịch vụ sẽ được giải phóng an toàn, không gây kẹt cổng.

---

## 🛠️ Cài Đặt Ban Đầu (Nếu Cần Cài Lại Package)

```bash
# Cài đặt backend
cd backend
bun install

# Cài đặt frontend
cd ../frontend
bun install
```

---

## 📦 Cấu Trúc Dự Án

```
ownedu/
├── backend/                  # REST API Express & TypeScript
│   ├── src/
│   │   ├── index.ts          # API Gateway & Route entrypoint
│   │   ├── routes/           # Routes: AI, Upload, Exams, Grades, Analytics...
│   │   └── services/         # Mock AI Engine + Logic xử lý
│   └── package.json
├── frontend/                 # Giao diện người dùng Vite + React
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/            # 6 module giao diện theo nghiệp vụ BA
│   │   └── components/       # AI Settings Modal, Navbar, UI Components
│   └── package.json
├── dev.ts                    # Runner điều phối đa tiến trình Backend + Frontend
└── package.json              # Root package quản lý lệnh chạy tổng hợp
```
