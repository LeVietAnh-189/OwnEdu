import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  FileText,
  User as UserIcon,
  LogOut,
  ArrowLeftRight,
  ChevronRight,
  Crown,
  Layers,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useLayoutStore } from '../../store/layoutStore';
import { ProUpgradeModal } from '../payment/ProUpgradeModal';

export type UserTabKey = 'courses' | 'my-courses' | 'my-documents' | 'my-exams' | 'profile';

interface MenuItem {
  id: UserTabKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

export const UserLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, switchRole, isLoading: isUserLoading, fetchCurrentUser } = useUserStore();
  const { isSidebarCollapsed, toggleSidebar } = useLayoutStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, searchParams]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleToggleRole = async () => {
    const nextRole = isAdmin ? 'USER' : 'ADMIN';
    await switchRole(nextRole);
    if (nextRole === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/user');
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  // Determine active tab/item
  const currentTabParam = searchParams.get('tab') as UserTabKey | null;
  let activeTab: UserTabKey = 'courses';

  if (location.pathname === '/user' || location.pathname === '/portal') {
    activeTab = currentTabParam || 'courses';
  } else if (location.pathname.startsWith('/documents/')) {
    activeTab = 'my-documents';
  } else if (location.pathname.startsWith('/exams/') || location.pathname === '/dashboard') {
    activeTab = 'my-exams';
  }

  const menuItems: MenuItem[] = [
    {
      id: 'courses',
      label: 'Khóa học',
      description: 'Khám phá danh mục môn học',
      icon: BookOpen,
      path: '/user?tab=courses',
    },
    {
      id: 'my-courses',
      label: 'Khóa học của tôi',
      description: 'Tiến độ học tập & chứng chỉ',
      icon: GraduationCap,
      path: '/user?tab=my-courses',
    },
    {
      id: 'my-documents',
      label: 'Tài liệu của tôi',
      description: 'Kho giáo trình & bóc tách PDF',
      icon: FileText,
      path: '/user?tab=my-documents',
    },
    {
      id: 'my-exams',
      label: 'Đề thi & Khảo thí',
      description: 'Ngân hàng câu hỏi & làm bài thi',
      icon: Layers,
      path: '/user?tab=my-exams',
    },
    {
      id: 'profile',
      label: 'Thông tin cá nhân',
      description: 'Hồ sơ, tài khoản & gói học',
      icon: UserIcon,
      path: '/user?tab=profile',
      badge: currentUser?.tier === 'PRO' ? 'PRO' : 'FREE',
    },
  ];

  const currentMenuItem = menuItems.find(m => m.id === activeTab);

  // Dynamic contextual breadcrumb
  const renderBreadcrumb = () => {
    const isDocGenerate = location.pathname.includes('/generate');
    const isDocUpload = location.pathname === '/documents/upload';
    const isExamWait = location.pathname.startsWith('/exams/generating');
    const isExamReview = location.pathname.includes('/review');
    const isExamResult = location.pathname.includes('/results');

    return (
      <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 flex-1 px-4 max-w-2xl truncate">
        <Link to="/" className="hover:text-orange-600 transition flex items-center gap-1 text-slate-400 shrink-0">
          <span>Trang chủ</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        <Link
          to={currentMenuItem?.path || '/user'}
          className={`hover:text-orange-600 transition shrink-0 ${!isDocGenerate && !isDocUpload && !isExamWait && !isExamReview && !isExamResult && !searchParams.get('courseId') ? 'text-slate-900 font-bold' : 'text-slate-500'}`}
        >
          {currentMenuItem?.label || 'Cổng học tập'}
        </Link>

        {searchParams.get('courseId') && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 truncate">
              Học & xem bài giảng
            </span>
          </>
        )}

        {isDocGenerate && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 truncate">
              Cấu hình sinh đề thi AI
            </span>
          </>
        )}
        {isDocUpload && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 truncate">
              Tải tài liệu mới
            </span>
          </>
        )}
        {isExamWait && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 truncate">
              Đang sinh đề thi AI
            </span>
          </>
        )}
        {isExamReview && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 truncate">
              Kiểm duyệt câu hỏi AI
            </span>
          </>
        )}
        {isExamResult && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200 truncate">
              Báo cáo điểm & Thẩm định Bloom
            </span>
          </>
        )}
      </div>
    );
  };

  const renderSidebarContent = (collapsed: boolean = false) => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-3">
        {/* Header / Collapse toggle row */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between px-2'} mb-1`}>
          {!collapsed && (
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Menu Học Tập
            </span>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="hidden md:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title={collapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4 text-orange-600" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (collapsed) {
              return (
                <div key={item.id} className="relative group flex justify-center">
                  <Link
                    to={item.path}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                  {/* Floating tooltip */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500 text-slate-900">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full group text-left flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${isActive
                    ? 'bg-orange-50/90 text-orange-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/25'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                    }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold leading-tight truncate">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <div className="shrink-0 ml-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-500" />
                      {item.badge}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Card: Membership Widget */}
      {collapsed ? (
        <div className="relative group flex justify-center py-2">
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 border border-orange-200/90 flex items-center justify-center text-amber-600 hover:text-amber-700 shadow-xs hover:scale-105 transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4 text-amber-500" />
          </button>
          <div className="absolute left-full ml-3 bottom-2 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {currentUser?.tier === 'PRO' ? 'Gói Pro VIP Sinh Viên' : 'Nâng cấp Pro VIP'}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-orange-50/60 border border-orange-200/90 space-y-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-black text-slate-900">
                {currentUser?.tier === 'PRO' ? 'Gói Pro VIP Sinh Viên' : 'Tài Khoản Miễn Phí'}
              </span>
            </div>
            <div className="flex items-center">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${currentUser?.tier === 'PRO'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentUser?.tier === 'PRO' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {currentUser?.tier === 'PRO' ? 'Đang kích hoạt' : 'Hạn chế 3 đề/ngày'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
            {currentUser?.tier === 'PRO'
              ? 'Không giới hạn bóc tách tài liệu & sinh bộ đề thi chuẩn Bloom Taxonomy AI.'
              : 'Nâng cấp ngay qua VietQR để mở khóa không giới hạn AI & bài giảng Video R2.'}
          </p>
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="w-full py-1.5 text-center text-xs font-bold text-orange-700 hover:text-orange-800 bg-white/90 hover:bg-white rounded-xl border border-orange-200 shadow-xs transition cursor-pointer"
          >
            {currentUser?.tier === 'PRO' ? 'Xem chi tiết & Gia hạn' : 'Nâng cấp Pro VIP ngay'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-900">
      {/* 1. TOP HEADER (Cố định, luôn hiện diện) */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-xs">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/user" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-400 p-0.5 shadow-md shadow-orange-600/15 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900">
                  Own Edu
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                  HỌC VIÊN
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 block hidden sm:block">
                Cổng học tập & khảo thí cá nhân
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Contextual Breadcrumb */}
        {renderBreadcrumb()}

        {/* Right Cell: Vai trò, User Profile & Đăng xuất */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Nút chuyển đổi vai trò */}
          <button
            onClick={handleToggleRole}
            disabled={isUserLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs cursor-pointer active:scale-95 ${isAdmin
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
              }`}
            title="Nhấp để chuyển đổi vai trò sang Admin / User"
          >
            <ArrowLeftRight className={`w-3.5 h-3.5 ${isUserLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Vai trò:</span>
            <strong className="font-extrabold">
              {isAdmin ? 'ADMIN' : 'USER'}
            </strong>
          </button>

          {/* Pro VIP Upgrade CTA Button */}
          {currentUser?.tier !== 'PRO' ? (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs hover:shadow-md hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer active:scale-95"
            >
              <Crown className="w-3.5 h-3.5 text-amber-100" />
              <span>Nâng cấp Pro</span>
            </button>
          ) : (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
              title="Gói Pro VIP đang hoạt động - Nhấp để xem hạn dùng hoặc gia hạn"
            >
              <Crown className="w-3.5 h-3.5 text-emerald-600" />
              <span>PRO VIP</span>
            </button>
          )}

          {/* User Profile Pill */}
          <Link
            to="/user?tab=profile"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs shadow-xs transition"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-rose-600 text-white font-black flex items-center justify-center text-[10px] shadow-xs">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="font-bold text-slate-800 text-xs">
                {currentUser?.fullName || 'Học viên'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Đang trực tuyến" />
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-50 text-orange-800 border border-orange-200">
              {currentUser?.tier || 'PRO'}
            </span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Về trang chủ"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
            <span className="hidden sm:inline font-medium">Thoát</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY (Sidebar luôn ở bên trái, Content bên phải) */}
      <div className="flex-1 w-full flex items-stretch relative">
        {/* DESKTOP SIDEBAR: Thu gọn khi mở SQL sandbox hoặc bấm nút toggle */}
        <aside className={`hidden md:flex flex-col justify-between border-r border-slate-200/80 bg-white shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto transition-[width,padding] duration-200 ease-out will-change-[width] ${
          isSidebarCollapsed ? 'w-16 p-2.5' : 'w-64 lg:w-72 p-4'
        }`}>
          {renderSidebarContent(isSidebarCollapsed)}
        </aside>

        {/* MOBILE SIDEBAR DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-white h-full p-4 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slideRight">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <span className="font-bold text-sm text-slate-800">Menu Học Tập</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderSidebarContent(false)}
            </aside>
          </div>
        )}

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 min-h-[calc(100vh-64px)] overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Pro VIP Upgrade Modal (SePay VietQR) */}
      <ProUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => fetchCurrentUser()}
      />
    </div>
  );
};

export default UserLayout;
