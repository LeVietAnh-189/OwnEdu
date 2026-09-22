import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Phone, MapPin, ShieldCheck, FileText, HelpCircle, ArrowRight, X, ArrowLeftRight } from 'lucide-react';
import { useUserStore } from '../store/userStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, switchRole, isLoading } = useUserStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [authModal, setAuthModal] = useState<'LOGIN' | 'REGISTER' | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleToggleRole = async () => {
    const nextRole = isAdmin ? 'USER' : 'ADMIN';
    await switchRole(nextRole);
    if (nextRole === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/user');
    }
  };

  const handleQuickAuth = async (role: 'USER' | 'ADMIN' = 'USER') => {
    await switchRole(role);
    setAuthModal(null);
    if (role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/user');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between">
      {/* ======================================================== */}
      {/* 1. HEADER: TÊN WEB, NÚT ĐỔI VAI TRÒ & 2 NÚT ĐĂNG NHẬP, ĐĂNG KÝ */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Tên web & Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-400 p-0.5 shadow-md shadow-orange-600/15 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                OwnEdu
              </span>
            </div>
          </Link>

          {/* Nút Chuyển Vai Trò & 2 Nút: Đăng nhập, Đăng ký */}
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher */}
            <button
              onClick={handleToggleRole}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs cursor-pointer active:scale-95 ${
                isAdmin 
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                  : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
              }`}
              title="Nhấp để chuyển đổi vai trò và điều hướng nhanh sang Admin hoặc User"
            >
              <ArrowLeftRight className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Vai trò:</span>
              <strong className="font-extrabold">
                {isAdmin ? 'ADMIN (Quản trị)' : 'USER (Học tập)'}
              </strong>
            </button>

            <button
              onClick={() => setAuthModal('LOGIN')}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50/60 transition-all cursor-pointer"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setAuthModal('REGISTER')}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 active:scale-95 transition-all cursor-pointer"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. NỘI DUNG Ở GIỮA: HIỆN TẠI ĐỂ TRỐNG (THEO YÊU CẦU CỦA BẠN) */}
      {/* ======================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        {/* Khu vực để trống - sẵn sàng để thiết kế nội dung sau */}
        <div className="w-full h-full min-h-[360px] rounded-3xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-700">Khu vực nội dung trang chủ</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Phần nội dung ở giữa hiện đang được để trống sẵn sàng cho bạn thiết kế chi tiết sau.
          </p>
        </div>
      </main>

      {/* ======================================================== */}
      {/* 3. FOOTER: THÔNG TIN, CHÍNH SÁCH, ĐIỀU KHOẢN, LIÊN HỆ */}
      {/* ======================================================== */}
      <footer className="w-full bg-slate-50 border-t border-slate-200/80 text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Cột 1: Thông tin thương hiệu */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-600 to-amber-400 p-0.5">
                  <div className="w-full h-full bg-white rounded-[6px] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <span className="text-lg font-black text-slate-900">OwnEdu</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nền tảng công nghệ giáo dục hiện đại, hỗ trợ bóc tách giáo trình, ngân hàng câu hỏi khảo thí thông minh và lộ trình học tập cá nhân hóa.
              </p>
            </div>

            {/* Cột 2: Thông tin & Khám phá */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Thông tin
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#about" className="hover:text-orange-600 transition">Về chúng tôi</a>
                </li>
                <li>
                  <a href="#courses" className="hover:text-orange-600 transition">Khóa học nổi bật</a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-orange-600 transition">Câu hỏi thường gặp</a>
                </li>
              </ul>
            </div>

            {/* Cột 3: Chính sách & Điều khoản */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Chính sách & Điều khoản
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#terms" className="hover:text-orange-600 transition">Điều khoản sử dụng</a>
                </li>
                <li>
                  <a href="#privacy" className="hover:text-orange-600 transition">Chính sách bảo mật</a>
                </li>
                <li>
                  <a href="#payment" className="hover:text-orange-600 transition">Chính sách thanh toán & hoàn học phí</a>
                </li>
              </ul>
            </div>

            {/* Cột 4: Liên hệ */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Liên hệ
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>support@ownedu.vn</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>1900 6868 (8:00 - 21:00)</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>Hà Nội & TP. Hồ Chí Minh</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2026 OwnEdu. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>Bảo mật dữ liệu chuẩn mã hóa</span>
              <span>•</span>
              <span>Chuyển đổi số giáo dục</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ (QUICK AUTH CHO PHÉP VÀO USER HOẶC ADMIN) */}
      {/* ======================================================== */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => setAuthModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {authModal === 'LOGIN' ? 'Đăng nhập vào OwnEdu' : 'Đăng ký tài khoản mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {authModal === 'LOGIN'
                  ? 'Truy cập cổng học tập cá nhân hóa & bài thi khảo thí AI'
                  : 'Bắt đầu hành trình học tập cùng OwnEdu ngay hôm nay'}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email:</label>
                <input
                  type="email"
                  placeholder="name@ownedu.vn"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleQuickAuth('USER')}
                className="w-full py-3 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 transition cursor-pointer"
              >
                {authModal === 'LOGIN' ? 'Đăng nhập (Vào Cổng Học Viên)' : 'Tạo tài khoản & Bắt đầu học'}
              </button>

              <button
                onClick={() => handleQuickAuth('ADMIN')}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Đăng nhập nhanh với quyền Quản Trị Viên (Admin)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
