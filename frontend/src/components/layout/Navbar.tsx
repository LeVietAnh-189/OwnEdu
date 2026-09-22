import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, UploadCloud, GraduationCap, Cpu, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import { AISettingsModal } from '../common/AISettingsModal';
import { useUserStore } from '../../store/userStore';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const { currentUser, fetchCurrentUser, switchRole, isLoading } = useUserStore();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN';

  const navItems = [
    { name: 'Cổng Học Viên', path: '/user', icon: GraduationCap },
    { name: 'Thư viện & Đề thi', path: '/dashboard', icon: BookOpen },
    ...(isAdmin ? [{ name: 'Bảng Quản Trị (Admin)', path: '/admin', icon: ShieldCheck }] : []),
  ];

  const handleToggleRole = async () => {
    const nextRole = isAdmin ? 'USER' : 'ADMIN';
    await switchRole(nextRole);
    if (nextRole === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/user');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-400 p-0.5 shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  OwnEdu
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                  AI Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Chuyển đổi giáo trình thành đề thi chuẩn Bloom</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher */}
            <button
              onClick={handleToggleRole}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                isAdmin 
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                  : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
              }`}
              title="Nhấp để chuyển đổi giữa Role User và Role Admin"
            >
              <ArrowLeftRight className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Vai trò:</span>
              <strong className="font-extrabold">
                {isAdmin ? 'ADMIN (Quản trị)' : 'USER (Học tập)'}
              </strong>
            </button>

            {/* AI Config - Admin Only */}
            {isAdmin && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all shadow-sm"
                title="Cấu hình Google Gemini / OpenAI API Key (Chỉ dành cho Admin)"
              >
                <Cpu className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden lg:inline">Cấu hình AI</span>
              </button>
            )}

            {/* User Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-amber-600" />
              ) : (
                <GraduationCap className="w-4 h-4 text-orange-600" />
              )}
              <span className="font-bold text-slate-800 hidden sm:inline">
                {currentUser?.fullName?.split(' ')[0] || (isAdmin ? 'Admin' : 'Nam')}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {currentUser?.role || 'USER'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {isAdmin && (
        <AISettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
};
