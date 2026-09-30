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
  X
} from 'lucide-react';
import { AdminAPI, DocumentAPI, ExamAPI } from '../../services/api';
import { useUserStore } from '../../store/userStore';

export type UserTabKey = 'courses' | 'my-courses' | 'my-documents' | 'my-exams' | 'profile';

interface MenuItem {
  id: UserTabKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  countKey?: 'courses' | 'documents' | 'exams';
  badge?: string;
}

export const UserLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, switchRole, isLoading: isUserLoading, fetchCurrentUser } = useUserStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [counts, setCounts] = useState<{ courses: number; documents: number; exams: number }>({
    courses: 0,
    documents: 0,
    exams: 0,
  });

  useEffect(() => {
    fetchCurrentUser();
    const fetchCounts = async () => {
      try {
        const [cList, dList, eList] = await Promise.all([
          AdminAPI.getCourses().catch(() => []),
          DocumentAPI.list().catch(() => []),
          ExamAPI.list().catch(() => [])
        ]);
        setCounts({
          courses: cList.length,
          documents: dList.length,
          exams: eList.length,
        });
      } catch (err) {
        console.error('Failed to load counts in layout:', err);
      }
    };
    fetchCounts();
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
      countKey: 'courses',
    },
    {
      id: 'my-courses',
      label: 'Khóa học của tôi',
      description: 'Tiến độ học tập & chứng chỉ',
      icon: GraduationCap,
      path: '/user?tab=my-courses',
      countKey: undefined,
    },
    {
      id: 'my-documents',
      label: 'Tài liệu của tôi',
      description: 'Kho giáo trình & bóc tách PDF',
      icon: FileText,
      path: '/user?tab=my-documents',
      countKey: 'documents',
    },
    {
      id: 'my-exams',
      label: 'Đề thi & Khảo thí',
      description: 'Ngân hàng câu hỏi & làm bài thi',
      icon: Layers,
      path: '/user?tab=my-exams',
      countKey: 'exams',
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

  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4">
        <div className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-400">
          Menu Học Tập
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const countVal = item.countKey ? counts[item.countKey] : (item.id === 'my-courses' ? 3 : undefined);

            return (
              <Link
                key={item.id}
                to={item.path}
                className={`w-full group text-left flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-50/90 text-orange-950 font-bold border border-orange-200/80 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive 
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

                <div className="shrink-0 ml-2">
                  {countVal !== undefined && countVal > 0 && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-orange-200/80 text-orange-900' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {countVal}
                    </span>
                  )}

                  {item.badge && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-500" />
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Card: Membership Widget */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/60 border border-orange-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-black text-orange-950">Gói Pro Sinh Viên</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
            Đang kích hoạt
          </span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
          Không giới hạn bóc tách tài liệu & sinh bộ đề thi chuẩn Bloom Taxonomy AI.
        </p>
        <Link
          to="/user?tab=profile"
          className="block w-full py-1.5 text-center text-xs font-bold text-orange-700 hover:text-orange-800 bg-white/80 hover:bg-white rounded-xl border border-orange-200 shadow-xs transition"
        >
          Xem chi tiết quyền lợi
        </Link>
      </div>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs cursor-pointer active:scale-95 ${
              isAdmin 
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
        {/* DESKTOP SIDEBAR: Luôn cố định bên cạnh, KHÔNG BAO GIỜ BỊ MẤT */}
        <aside className="hidden md:flex w-64 lg:w-72 border-r border-slate-200/80 bg-white shrink-0 p-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          {renderSidebarContent()}
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
              {renderSidebarContent()}
            </aside>
          </div>
        )}

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 min-h-[calc(100vh-64px)] overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UserLayout;
