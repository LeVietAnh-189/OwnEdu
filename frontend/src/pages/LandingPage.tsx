import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Phone, MapPin, X, ArrowLeftRight, LogOut, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ExternalLink, ShieldCheck } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { SettingsAPI } from '../services/api';

declare global {
  interface Window {
    google?: any;
  }
}

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, switchRole, isLoading, loginWithGoogle, loginWithMockGoogle, logout, fetchAuthConfig, googleClientId } = useUserStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [authModal, setAuthModal] = useState<'LOGIN' | 'REGISTER' | null>(null);
  const [effectiveClientId, setEffectiveClientId] = useState<string>(googleClientId || '');
  const [clientIdInput, setClientIdInput] = useState<string>('');
  const [isSavingClientId, setIsSavingClientId] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load configuration on mount
  useEffect(() => {
    fetchAuthConfig().then((cid) => {
      if (cid) {
        setEffectiveClientId(cid);
        setClientIdInput(cid);
      }
    });
  }, [fetchAuthConfig]);

  // Initialize Google Identity Services (GIS) button and prompt
  useEffect(() => {
    if (!authModal) return;

    let checkInterval: any = null;

    const setupGoogleGsi = () => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id) {
        return false;
      }

      if (!effectiveClientId) {
        return true; // Script loaded but no client ID
      }

      try {
        window.google.accounts.id.initialize({
          client_id: effectiveClientId,
          callback: async (response: any) => {
            if (response && response.credential) {
              setIsAuthenticating(true);
              setAuthError(null);
              try {
                const loggedIn = await loginWithGoogle(response.credential);
                setAuthModal(null);
                if (loggedIn.role === 'ADMIN') {
                  navigate('/admin');
                } else {
                  navigate('/user');
                }
              } catch (err: any) {
                setAuthError(err?.response?.data?.error?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
              } finally {
                setIsAuthenticating(false);
              }
            }
          },
          auto_select: true, // Nếu trình duyệt đã có tài khoản Google, tự động hiện gợi ý đăng nhập ngay
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('google-signin-btn-container');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 320,
          });
        }

        // Kích hoạt One Tap Account Chooser nếu trên trình duyệt đã đăng nhập Google
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('[Google GIS] One Tap prompt not displayed:', notification.getNotDisplayedReason());
          }
        });

        return true;
      } catch (err) {
        console.error('[Google GIS Error]:', err);
        return false;
      }
    };

    // Attempt immediately or poll if script is still loading
    const initialized = setupGoogleGsi();
    if (!initialized) {
      checkInterval = setInterval(() => {
        if (setupGoogleGsi()) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [authModal, effectiveClientId, loginWithGoogle, navigate]);

  const handleSaveClientId = async () => {
    if (!clientIdInput.trim()) return;
    try {
      setIsSavingClientId(true);
      setAuthError(null);
      await SettingsAPI.save({ google_client_id: clientIdInput.trim() });
      setEffectiveClientId(clientIdInput.trim());
      await fetchAuthConfig();
    } catch (err: any) {
      setAuthError(err?.message || 'Không thể lưu Google Client ID');
    } finally {
      setIsSavingClientId(false);
    }
  };

  const handleMockLogin = async (role: 'USER' | 'ADMIN') => {
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      const email = role === 'ADMIN' ? 'admin@ownedu.edu.vn' : 'sinhvien.google@gmail.com';
      const name = role === 'ADMIN' ? 'Quản Trị Viên Google (Admin)' : 'Nguyễn Văn Nam (Google User)';
      const loggedIn = await loginWithMockGoogle({
        email,
        name,
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      });
      setAuthModal(null);
      if (role === 'ADMIN' || loggedIn.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch (err: any) {
      setAuthError(err?.response?.data?.error?.message || 'Lỗi khi đăng nhập thử nghiệm');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleToggleRole = async () => {
    const nextRole = isAdmin ? 'USER' : 'ADMIN';
    await switchRole(nextRole);
    if (nextRole === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/user');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between">
      {/* ======================================================== */}
      {/* 1. HEADER: TÊN WEB, NÚT ĐỔI VAI TRÒ & NÚT ĐĂNG NHẬP GOOGLE */}
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

          {/* User Status / Quick Switch & Auth Buttons */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Role Switcher */}
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

                {/* Profile Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-6 h-6 rounded-full object-cover border border-orange-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-rose-600 text-white font-black flex items-center justify-center text-[10px]">
                      {currentUser.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="font-bold text-slate-800 hidden sm:inline max-w-[120px] truncate">
                    {currentUser.fullName}
                  </span>
                </div>

                {/* Direct Portal Link */}
                <button
                  onClick={() => navigate(isAdmin ? '/admin' : '/user')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  {isAdmin ? 'Vào Quản Trị' : 'Vào Học Ngay'}
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setAuthModal('LOGIN')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-orange-600 hover:bg-orange-50/60 transition-all cursor-pointer border border-transparent hover:border-orange-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Đăng nhập</span>
                </button>
                <button
                  onClick={() => setAuthModal('REGISTER')}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. NỘI DUNG Ở GIỮA: KHU VỰC CHỜ THIẾT KẾ CHI TIẾT */}
      {/* ======================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-full h-full min-h-[360px] rounded-3xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-slate-700">Khu vực nội dung trang chủ</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Hệ thống xác thực Google One Tap & Google OAuth 2.0 đã sẵn sàng.
          </p>
          {!currentUser && (
            <button
              onClick={() => setAuthModal('LOGIN')}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Đăng nhập với Google để bắt đầu</span>
            </button>
          )}
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
              <span>Đăng nhập an toàn qua Google OAuth 2.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* MODAL ĐĂNG NHẬP DUY NHẤT BẰNG TÀI KHOẢN GOOGLE */}
      {/* ======================================================== */}
      {authModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-8 space-y-6 relative text-slate-900">
            <button
              onClick={() => setAuthModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Dialog */}
            <div className="space-y-2 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-center mb-1 shadow-sm">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {authModal === 'LOGIN' ? 'Đăng nhập với Google' : 'Đăng ký tài khoản Google'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Đăng nhập an toàn qua API của Google. Hệ thống tự động đồng bộ hồ sơ học tập và đồng bộ phiên thi.
              </p>
            </div>

            {/* Yêu cầu tính năng trực quan */}
            <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Đã đăng nhập Google trên trình duyệt:</strong> Chỉ cần chọn tài khoản để vào ngay.</span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                <span><strong>Chưa đăng nhập:</strong> Nhập email và mật khẩu Google như bình thường trên cửa sổ xác thực của Google.</span>
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Google Identity Services Render Container */}
            <div className="space-y-4 pt-1 flex flex-col items-center">
              {isAuthenticating ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-xs font-bold text-slate-600">
                  <RefreshCw className="w-6 h-6 text-orange-600 animate-spin" />
                  <span>Đang xác thực thông tin tài khoản Google...</span>
                </div>
              ) : (
                <div id="google-signin-btn-container" className="flex justify-center w-full min-h-[44px]" />
              )}

              {/* In case Google Client ID is not configured yet */}
              {!effectiveClientId && (
                <div className="w-full bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 space-y-3 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <KeyRound className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Cấu hình Google OAuth Client ID</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Để kích hoạt nút Google Sign-In chính thức, vui lòng dán <strong>Client ID</strong> từ Google Cloud Console (hoặc cấu hình trong file <code>.env</code>):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="VD: 123456...apps.googleusercontent.com"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveClientId}
                      disabled={isSavingClientId || !clientIdInput.trim()}
                      className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isSavingClientId ? 'Lưu...' : 'Lưu'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-700 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Lấy Client ID từ Google Cloud</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Nút đăng nhập thử nghiệm (Mô phỏng tài khoản Google) */}
              <div className="w-full pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] text-center text-slate-400 font-medium">
                  {effectiveClientId ? 'Hoặc đăng nhập nhanh chế độ thử nghiệm:' : 'Bạn cũng có thể trải nghiệm ngay luồng đăng nhập:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMockLogin('USER')}
                    disabled={isAuthenticating}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>⚡ Học viên (Demo)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMockLogin('ADMIN')}
                    disabled={isAuthenticating}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>⚡ Quản trị Admin (Demo)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
