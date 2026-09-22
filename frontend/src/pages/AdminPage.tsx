import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles,
  BookOpen, 
  Users, 
  Activity, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Layers, 
  HardDrive, 
  Coins, 
  Cpu, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Key,
  Server,
  ChevronRight,
  SlidersHorizontal,
  Search,
  ExternalLink,
  GraduationCap,
  Code2,
  Languages,
  Box,
  GitBranch,
  X,
  Tag,
  ArrowRight,
  UserPlus,
  Mail,
  Check,
  Lock,
  Crown,
  CreditCard,
  Package,
  ShoppingCart,
  Power,
  Play,
  ArrowLeftRight
} from 'lucide-react';
import { AdminAPI, DocumentAPI, UserAPI } from '../services/api';
import { AdminStats, Course, TokenUsageLog, DocumentItem, User } from '../types';
import { AISettingsModal } from '../components/common/AISettingsModal';
import { useUserStore } from '../store/userStore';

interface MenuItem {
  id: 'courses' | 'users' | 'system' | 'config';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
}

// The 4 key topics requested by user in wireframe
export const COURSE_TOPICS = [
  { id: 'Lập trình', name: 'Lập trình', icon: Code2, color: 'orange', desc: 'Ngôn ngữ lập trình, kiến trúc mã nguồn & giải thuật' },
  { id: 'Tiếng Anh', name: 'Tiếng Anh', icon: Languages, color: 'amber', desc: 'Tiếng Anh chuyên ngành IT, đọc tài liệu & chứng chỉ' },
  { id: 'Docker', name: 'Docker', icon: Box, color: 'sky', desc: 'Containerization, microservices & tối ưu hạ tầng' },
  { id: 'Git & Github', name: 'Git & Github', icon: GitBranch, color: 'rose', desc: 'Kiểm soát phiên bản mã nguồn & CI/CD Pipelines' },
] as const;

export interface SystemServiceItem {
  id: string;
  name: string;
  key: string;
  port: number;
  status: 'RUNNING' | 'STOPPED';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 4 services from the wireframe
const INITIAL_SYSTEM_SERVICES: SystemServiceItem[] = [
  {
    id: 'author-svc',
    name: 'Author Service',
    key: 'auth',
    port: 3001,
    status: 'RUNNING',
    description: 'Xác thực tài khoản, kiểm soát phiên đăng nhập JWT & phân quyền Super Admin / Admin',
    icon: ShieldCheck
  },
  {
    id: 'payment-svc',
    name: 'Payment Service',
    key: 'payment',
    port: 3002,
    status: 'STOPPED',
    description: 'Cổng thanh toán học phí, đăng ký gói Pro và đối soát hóa đơn giao dịch',
    icon: CreditCard
  },
  {
    id: 'product-svc',
    name: 'Product Service',
    key: 'product',
    port: 3003,
    status: 'RUNNING',
    description: 'Quản lý danh mục khóa học, kho giáo trình và đề thi khảo thí thông minh',
    icon: Package
  },
  {
    id: 'cart-svc',
    name: 'Cart Service',
    key: 'cart',
    port: 3004,
    status: 'RUNNING',
    description: 'Giỏ hàng đăng ký môn học, tiến độ học tập và lưu vết bài thi của học viên',
    icon: ShoppingCart
  }
];

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, switchRole, isLoading: isUserLoading } = useUserStore();
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
  
  // Navigation tabs: 'courses' | 'users' | 'system' | 'config'
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'system' | 'config'>('courses');
  
  // Topic filter for Courses tab
  const [selectedTopic, setSelectedTopic] = useState<string>('Lập trình');
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tokenLogs, setTokenLogs] = useState<TokenUsageLog[]>([]);
  const [tokenSummary, setTokenSummary] = useState({ totalTokens: 0, estimatedCostUsd: 0, callCount: 0 });
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Course form state
  const [showAddCourse, setShowAddCourse] = useState<boolean>(false);
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [courseTopic, setCourseTopic] = useState<string>('Lập trình');
  const [courseDept, setCourseDept] = useState<string>('Khoa Công nghệ Thông tin');
  const [courseDesc, setCourseDesc] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState<boolean>(false);

  // User management state
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [userTierFilter, setUserTierFilter] = useState<'ALL' | 'FREE' | 'PRO'>('ALL');
  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserEmail, setNewUserEmail] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'USER' | 'ADMIN'>('USER');
  const [newUserTier, setNewUserTier] = useState<'FREE' | 'PRO'>('FREE');
  const [userFormError, setUserFormError] = useState<string>('');
  const [isSubmittingUser, setIsSubmittingUser] = useState<boolean>(false);

  // User Action Modal state
  const [selectedUserModal, setSelectedUserModal] = useState<User | null>(null);
  const [modalTier, setModalTier] = useState<'FREE' | 'PRO'>('FREE');
  const [isUpdatingTier, setIsUpdatingTier] = useState<boolean>(false);
  const [modalSuccessMsg, setModalSuccessMsg] = useState<string>('');

  // Quản lý hệ thống: Services state
  const [services, setServices] = useState<SystemServiceItem[]>(INITIAL_SYSTEM_SERVICES);
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'RUNNING' | 'STOPPED'>('ALL');
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);
  const [serviceToast, setServiceToast] = useState<string>('');

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, coursesRes, tokensRes, docsRes, usersRes] = await Promise.all([
        AdminAPI.getStats().catch(() => null),
        AdminAPI.getCourses().catch(() => []),
        AdminAPI.getTokens().catch(() => ({ logs: [], summary: { totalTokens: 0, estimatedCostUsd: 0, callCount: 0 } })),
        DocumentAPI.list().catch(() => []),
        UserAPI.list().catch(() => [])
      ]);

      if (statsRes) {
        setStats(statsRes);
        if (statsRes.users && statsRes.users.length > 0) {
          setUsers(statsRes.users);
        }
      }
      if (usersRes && usersRes.length > 0) {
        setUsers(usersRes);
      }
      if (coursesRes) setCourses(coursesRes);
      if (tokensRes) {
        setTokenLogs(tokensRes.logs || []);
        setTokenSummary(tokensRes.summary || { totalTokens: 0, estimatedCostUsd: 0, callCount: 0 });
      }
      if (docsRes) setDocuments(docsRes);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!courseCode.trim() || !courseName.trim()) {
      setFormError('Mã môn học và Tên môn học không được để trống.');
      return;
    }

    try {
      setIsSubmittingCourse(true);
      const newCourse = await AdminAPI.createCourse({
        code: courseCode.trim().toUpperCase(),
        name: courseName.trim(),
        topic: courseTopic.trim(),
        department: courseDept.trim(),
        description: courseDesc.trim()
      });

      setCourses([newCourse, ...courses]);
      if (stats) setStats({ ...stats, coursesCount: stats.coursesCount + 1 });
      setCourseCode('');
      setCourseName('');
      setCourseDesc('');
      setShowAddCourse(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Không thể tạo môn học mới.');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa môn học này?')) return;
    try {
      await AdminAPI.deleteCourse(id);
      setCourses(courses.filter(c => c.id !== id));
      if (stats) setStats({ ...stats, coursesCount: Math.max(0, stats.coursesCount - 1) });
    } catch (err) {
      alert('Không thể xóa môn học');
    }
  };

  const handleLogout = async () => {
    await switchRole('USER');
    navigate('/');
  };

  const handleOpenUserModal = (u: User) => {
    setSelectedUserModal(u);
    setModalTier(u.tier);
    setModalSuccessMsg('');
  };

  const handleSaveTier = async () => {
    if (!selectedUserModal) return;
    try {
      setIsUpdatingTier(true);
      setModalSuccessMsg('');
      await UserAPI.update(selectedUserModal.id, { tier: modalTier });
      setUsers(users.map(u => u.id === selectedUserModal.id ? { ...u, tier: modalTier } : u));
      setSelectedUserModal({ ...selectedUserModal, tier: modalTier });
      setModalSuccessMsg('Đã lưu thay đổi gói tài khoản thành công!');
      setTimeout(() => setModalSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể cập nhật gói tài khoản.');
    } finally {
      setIsUpdatingTier(false);
    }
  };

  const handleDeleteUserFromModal = async () => {
    if (!selectedUserModal) return;
    const isSuperAdmin = selectedUserModal.code === 'OE-0000' || selectedUserModal.email === 'admin@ownedu.edu.vn';
    if (isSuperAdmin) {
      alert('Không thể xóa tài khoản Super Admin (Toàn quyền hệ thống)!');
      return;
    }
    if (currentUser?.id === selectedUserModal.id) {
      alert('Không thể xóa tài khoản đang đăng nhập!');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${selectedUserModal.fullName}"?`)) return;

    try {
      await UserAPI.delete(selectedUserModal.id);
      setUsers(users.filter(u => u.id !== selectedUserModal.id));
      if (stats) setStats({ ...stats, usersCount: Math.max(0, stats.usersCount - 1) });
      setSelectedUserModal(null);
    } catch (err) {
      alert('Không thể xóa tài khoản');
    }
  };

  const handleToggleService = (svc: SystemServiceItem) => {
    setTogglingServiceId(svc.id);
    const nextStatus = svc.status === 'RUNNING' ? 'STOPPED' : 'RUNNING';
    setTimeout(() => {
      setServices(prev => prev.map(s => s.id === svc.id ? { ...s, status: nextStatus } : s));
      setTogglingServiceId(null);
      setServiceToast(`Đã ${nextStatus === 'RUNNING' ? 'bật' : 'tắt'} ${svc.name} thành công.`);
      setTimeout(() => setServiceToast(''), 3500);
    }, 300);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    if (!newUserName.trim() || !newUserEmail.trim()) {
      setUserFormError('Họ tên và Email không được để trống.');
      return;
    }

    try {
      setIsSubmittingUser(true);
      const created = await UserAPI.create({
        fullName: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        tier: newUserTier
      });

      setUsers([...users, created]);
      if (stats) setStats({ ...stats, usersCount: stats.usersCount + 1 });
      setNewUserName('');
      setNewUserEmail('');
      setShowAddUser(false);
    } catch (err: any) {
      setUserFormError(err.response?.data?.error?.message || 'Không thể tạo tài khoản mới.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      await UserAPI.delete(id);
      setUsers(users.filter(u => u.id !== id));
      if (stats) setStats({ ...stats, usersCount: Math.max(0, stats.usersCount - 1) });
    } catch (err) {
      alert('Không thể xóa người dùng');
    }
  };

  const menuItems: MenuItem[] = [
    { 
      id: 'courses', 
      label: 'Quản lý khóa học', 
      description: 'Chương trình & theo từng chủ đề',
      icon: BookOpen, 
      count: courses.length 
    },
    { 
      id: 'users', 
      label: 'Quản lý tài khoản', 
      description: 'Phân quyền Admin & Học viên',
      icon: Users, 
      count: users.length || stats?.usersCount || 4 
    },
    { 
      id: 'system', 
      label: 'Quản lý hệ thống', 
      description: 'Máy chủ, tài nguyên & logs',
      icon: Activity, 
      badge: 'Online' 
    },
    { 
      id: 'config', 
      label: 'Cấu hình', 
      description: 'Thiết lập AI & Tham số hệ thống',
      icon: SlidersHorizontal 
    },
  ];

  const currentTab = menuItems.find(m => m.id === activeTab);

  // Filter users by search, role, tier
  const filteredUsers = users.filter((u, idx) => {
    const code = u.code || (u.role === 'ADMIN' ? 'OE-0000' : `OE-${String(idx + 1).padStart(4, '0')}`);
    const matchesSearch =
      code.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesTier = userTierFilter === 'ALL' || u.tier === userTierFilter;
    return matchesSearch && matchesRole && matchesTier;
  });

  // Helper to get course topic safely (fall back to Lập trình if unassigned)
  const getCourseTopic = (c: Course): string => {
    if (c.topic) return c.topic;
    // Guess based on name or code
    if (/ENG|IELTS|TOEIC|tiếng anh/i.test(c.code + ' ' + c.name)) return 'Tiếng Anh';
    if (/DCK|DOCKER|K8S|container/i.test(c.code + ' ' + c.name)) return 'Docker';
    if (/GIT|GITHUB|CI\/CD|branch/i.test(c.code + ' ' + c.name)) return 'Git & Github';
    return 'Lập trình';
  };

  // Filter courses by search and active topic
  const filteredCourses = courses.filter(c => {
    const topic = getCourseTopic(c);
    const matchesSearch = 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTopic === 'ALL') {
      return matchesSearch;
    }
    return matchesSearch && topic === selectedTopic;
  });

  // Calculate course counts per topic
  const topicCounts = COURSE_TOPICS.reduce<Record<string, number>>((acc, t) => {
    acc[t.id] = courses.filter(c => getCourseTopic(c) === t.id).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      
      {/* 1. TOP HEADER BAR */}
      <header className="sticky top-0 z-30 w-full h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shadow-xs">
        
        {/* Left Cell: Brand logo & name (Khớp khung Own Edu trên wireframe) */}
        <div className="w-64 sm:w-72 flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
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
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">
                  ADMIN
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 block">
                Bảng điều khiển quản trị
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Contextual Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 flex-1 px-6">
          <Link to="/" className="hover:text-orange-600 transition flex items-center gap-1 text-slate-400">
            <span>Cổng sinh viên</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-bold flex items-center gap-1.5">
            {currentTab?.label}
          </span>
          {activeTab === 'courses' && selectedTopic !== 'ALL' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                {selectedTopic}
              </span>
            </>
          )}
        </div>

        {/* Right Cell: Vai trò Toggle, Admin Profile & Đăng xuất */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Nút chuyển đổi vai trò giữa Admin & User */}
          <button
            onClick={handleToggleRole}
            disabled={isUserLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs cursor-pointer active:scale-95 ${
              isAdmin 
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
            }`}
            title="Nhấp để chuyển đổi vai trò sang User / Admin"
          >
            <ArrowLeftRight className={`w-3.5 h-3.5 ${isUserLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Vai trò:</span>
            <strong className="font-extrabold">
              {isAdmin ? 'ADMIN (Quản trị)' : 'USER (Học tập)'}
            </strong>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-xs shadow-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-rose-600 text-white font-black flex items-center justify-center text-[10px] shadow-xs">
              A
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 text-xs">Admin</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Đang trực tuyến" />
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Quản trị viên
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Đăng xuất khỏi bảng quản trị"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY (Sidebar left & Content right) */}
      <div className="flex-1 w-full flex items-stretch">
        
        {/* LEFT SIDEBAR (The 4 wireframe tabs) */}
        <aside className="w-64 sm:w-72 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0 p-4">
          <div className="space-y-6">
            <div>
              <div className="px-3 pb-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                Menu Quản Trị
              </div>

              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full group text-left flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-orange-50/90 text-orange-900 font-bold border border-orange-100/80 shadow-xs'
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
                        {item.count !== undefined && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-orange-200/80 text-orange-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.count}
                          </span>
                        )}

                        {item.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 p-2 min-h-[calc(100vh-64px)] overflow-y-auto">
          
          {/* ======================================================== */}
          {/* TAB 1: QUẢN LÝ KHÓA HỌC (THIẾT KẾ ĐÚNG THEO WIREFRAME ẢNH) */}
          {/* ======================================================== */}
          {activeTab === 'courses' && (
            <div className="space-y-2 w-full">
              
              {/* -------------------------------------------------------- */}
              {/* ROW 1: THANH TÌM KIẾM (CENTER/LEFT) & THÊM KHÓA HỌC (RIGHT) */}
              {/* -------------------------------------------------------- */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                {/* Thanh tìm kiếm */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm khóa học theo tên môn học, mã môn (vd: PROG101, ENG101, DCK101, GIT101)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Nút Thêm khóa học */}
                <button
                  onClick={() => {
                    setCourseTopic(selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic);
                    setShowAddCourse(!showAddCourse);
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 shrink-0 cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddCourse ? 'Đóng Biểu Mẫu' : 'Thêm khóa học'}</span>
                </button>
              </div>

              {/* -------------------------------------------------------- */}
              {/* ROW 2: 4 CHỦ ĐỀ WIREFRAME: Lập trình | Tiếng Anh | Docker | Git & Github */}
              {/* -------------------------------------------------------- */}
              <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {COURSE_TOPICS.map((topic) => {
                    const Icon = topic.icon;
                    const isSelected = selectedTopic === topic.id;
                    const count = topicCounts[topic.id] || 0;

                    return (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                            : 'bg-slate-50 text-slate-700 hover:bg-orange-50/60 hover:text-orange-700 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-orange-600'}`} />
                          <span className="truncate">{topic.name}</span>
                        </div>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                          isSelected ? 'bg-orange-700 text-white' : 'bg-slate-200/80 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Thêm Môn Học (Collapsible Modal/Card) */}
              {showAddCourse && (
                <form 
                  onSubmit={handleCreateCourse} 
                  className="p-6 rounded-3xl bg-white border-2 border-orange-200 shadow-xl shadow-orange-600/5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">
                          Thêm Khóa Học Mới
                        </h3>
                        <p className="text-[11px] text-slate-400">Khai báo môn học theo chủ đề tương ứng</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddCourse(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {formError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Mã Môn Học <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: PROG101, ENG201, DCK101, GIT101..."
                        value={courseCode}
                        onChange={(e) => setCourseCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Chủ Đề (Topic) <span className="text-rose-500">*</span>:
                      </label>
                      <select
                        value={courseTopic}
                        onChange={(e) => setCourseTopic(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold"
                      >
                        {COURSE_TOPICS.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Tên Khóa Học / Môn Học <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Lập trình TypeScript Nâng cao, Docker & Kubernetes..."
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1.5">Khoa / Viện / Bộ môn phụ trách:</label>
                      <input
                        type="text"
                        value={courseDept}
                        onChange={(e) => setCourseDept(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1.5">Mô tả tóm tắt nội dung môn học:</label>
                      <textarea
                        rows={2}
                        placeholder="Mục tiêu kiến thức, đề cương tài liệu liên kết..."
                        value={courseDesc}
                        onChange={(e) => setCourseDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddCourse(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCourse}
                      className="px-6 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingCourse ? 'Đang lưu...' : 'Lưu Khóa Học'}
                    </button>
                  </div>
                </form>
              )}

              {/* -------------------------------------------------------- */}
              {/* ROW 3: CÁC KHÓA HỌC THEO TỪNG CHỦ ĐỀ */}
              {/* -------------------------------------------------------- */}
              <div className="space-y-4">
                {/* Empty State */}
                {filteredCourses.length === 0 ? (
                  <div className="p-12 rounded-3xl border border-dashed border-slate-300 bg-white text-center space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-slate-700 text-sm">
                      {searchQuery 
                        ? 'Không tìm thấy khóa học nào phù hợp với từ khóa' 
                        : `Chưa có khóa học nào thuộc chủ đề "${selectedTopic}"`}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Nhấp vào nút "Thêm khóa học" ở trên để bổ sung môn học vào danh mục này.
                    </p>
                    <button
                      onClick={() => {
                        setCourseTopic(selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic);
                        setShowAddCourse(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 transition border border-orange-200 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm khóa học cho chủ đề này</span>
                    </button>
                  </div>
                ) : (
                  /* Course Grid / Cards */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCourses.map((crs) => {
                      const topicName = getCourseTopic(crs);
                      const topicConfig = COURSE_TOPICS.find(t => t.id === topicName);
                      const TopicIcon = topicConfig?.icon || Tag;

                      return (
                        <div 
                          key={crs.id}
                          className="group bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all p-5 flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            {/* Card Header: Code & Topic Tag */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-black text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg tracking-wider">
                                {crs.code}
                              </span>

                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 group-hover:bg-orange-50 group-hover:text-orange-700 group-hover:border-orange-200 transition-colors">
                                <TopicIcon className="w-3 h-3 text-orange-500" />
                                <span>{topicName}</span>
                              </span>
                            </div>

                            {/* Course Title */}
                            <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-orange-600 transition-colors">
                              {crs.name}
                            </h3>

                            {/* Description */}
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {crs.description || 'Chưa có thông tin mô tả cho môn học này.'}
                            </p>
                          </div>

                          {/* Card Footer: Department & Action */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[170px]" title={crs.department}>
                              {crs.department || 'Khoa CNTT'}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <Link
                                to="/documents/upload"
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition flex items-center gap-1"
                                title="Nạp tài liệu & sinh đề cho môn học này"
                              >
                                <span>Nạp giáo trình</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>

                              <button
                                onClick={() => handleDeleteCourse(crs.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Xóa môn học này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick Add Card at the end */}
                    <button
                      onClick={() => {
                        setCourseTopic(selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic);
                        setShowAddCourse(true);
                      }}
                      className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/20 p-6 flex flex-col items-center justify-center text-center space-y-2 text-slate-400 hover:text-orange-600 transition cursor-pointer group min-h-[190px]"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 group-hover:border-orange-300 group-hover:scale-110 flex items-center justify-center transition-all shadow-xs">
                        <Plus className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="font-bold text-xs text-slate-700 group-hover:text-orange-700">
                        + Thêm khóa học mới
                      </span>
                      <span className="text-[11px] text-slate-400">
                        vào danh mục {selectedTopic === 'ALL' ? 'hệ thống' : selectedTopic}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: QUẢN LÝ TÀI KHOẢN (THIẾT KẾ ĐÚNG THEO WIREFRAME ẢNH) */}
          {/* ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-2 w-full">
              
              {/* Action Toolbar: Search & Add Account */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tài khoản theo mã (OE-0001...), tên tài khoản hoặc email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filters & Add Account */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="USER">User (Học viên)</option>
                    <option value="ADMIN">Admin (Quản trị)</option>
                  </select>

                  <select
                    value={userTierFilter}
                    onChange={(e) => setUserTierFilter(e.target.value as any)}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="ALL">Tất cả gói</option>
                    <option value="FREE">Gói Free</option>
                    <option value="PRO">Gói Pro</option>
                  </select>

                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 shrink-0 cursor-pointer active:scale-[0.98]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{showAddUser ? 'Đóng Biểu Mẫu' : 'Thêm tài khoản'}</span>
                  </button>
                </div>
              </div>

              {/* Form Thêm Người Dùng (Collapsible) */}
              {showAddUser && (
                <form 
                  onSubmit={handleCreateUser} 
                  className="p-6 rounded-3xl bg-white border-2 border-orange-200 shadow-xl shadow-orange-600/5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">
                          Thêm Tài Khoản Người Dùng Mới
                        </h3>
                        <p className="text-[11px] text-slate-400">Tạo tài khoản học viên hoặc phân quyền quản trị viên</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Super Admin privilege note */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/80 text-amber-950 text-xs flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-extrabold flex items-center gap-1.5 text-amber-900">
                        <Crown className="w-3.5 h-3.5 text-amber-600" />
                        Đặc quyền Super Admin (Toàn quyền hệ thống)
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Chỉ có Super Admin mới có quyền tạo thêm tài khoản Quản trị viên (Admin) hoặc Học viên. Các quản trị viên thông thường không thể tạo hay phân quyền tài khoản admin.
                      </p>
                    </div>
                  </div>

                  {userFormError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{userFormError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Tên Tài Khoản (Họ và tên) <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Nguyễn Văn D..."
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Địa Chỉ Email <span className="text-rose-500">*</span>:
                      </label>
                      <input
                        type="email"
                        placeholder="Ví dụ: dnv@gmail.com..."
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Vai Trò (Role) <span className="text-rose-500">*</span>:
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold"
                      >
                        <option value="USER">User (Học viên)</option>
                        <option value="ADMIN">Admin (Quản trị viên)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1.5">
                        Gói Tài Khoản (Tier) <span className="text-rose-500">*</span>:
                      </label>
                      <select
                        value={newUserTier}
                        onChange={(e) => setNewUserTier(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold"
                      >
                        <option value="FREE">Gói Free (Miễn phí)</option>
                        <option value="PRO">Gói Pro (Cao cấp)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingUser}
                      className="px-6 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmittingUser ? 'Đang lưu...' : 'Lưu Tài Khoản'}
                    </button>
                  </div>
                </form>
              )}

              {/* BẢNG QUẢN LÝ TÀI KHOẢN (6 CỘT ĐÚNG THEO WIREFRAME: Mã | Tên tài khoản | Email | Gói | Vai trò | Thao tác) */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-4 px-6 w-32">Mã</th>
                      <th className="py-4 px-6">Tên tài khoản</th>
                      <th className="py-4 px-6">Email</th>
                      <th className="py-4 px-6 w-28">Gói</th>
                      <th className="py-4 px-6 w-44">Vai trò</th>
                      {/* Cột thao tác cuối cùng: Thanh bên trên cùng không ghi gì cả */}
                      <th className="py-4 px-6 text-right w-28 whitespace-nowrap"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-600">Không tìm thấy tài khoản nào phù hợp.</p>
                          <p className="text-slate-400 mt-0.5">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => {
                        const code = u.code || (u.role === 'ADMIN' ? 'OE-0000' : `OE-${String(idx + 1).padStart(4, '0')}`);
                        const isCurrent = currentUser?.id === u.id;

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* 1. CỘT MÃ */}
                            <td className="py-4 px-6 font-mono font-bold text-xs text-orange-700">
                              <span className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100/80 inline-block">
                                {code}
                              </span>
                            </td>

                            {/* 2. CỘT TÊN TÀI KHOẢN */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-100 to-orange-50 border border-orange-200 text-orange-700 font-black flex items-center justify-center text-xs shrink-0">
                                  {u.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{u.fullName}</span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 3. CỘT EMAIL */}
                            <td className="py-4 px-6 text-xs text-slate-700 font-mono">
                              <a 
                                href={`mailto:${u.email}`} 
                                className="underline decoration-slate-300 hover:decoration-orange-500 hover:text-orange-600 transition-colors"
                              >
                                {u.email}
                              </a>
                            </td>

                            {/* 4. CỘT GÓI */}
                            <td className="py-4 px-6">
                              {u.tier === 'PRO' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-50 to-orange-50 text-orange-800 border border-orange-200">
                                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Pro</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Free
                                </span>
                              )}
                            </td>

                            {/* 5. CỘT VAI TRÒ */}
                            <td className="py-4 px-6">
                              {code === 'OE-0000' || u.email === 'admin@ownedu.edu.vn' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-900 border border-amber-300 shadow-xs" title="Super Admin - Toàn quyền hệ thống">
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Super Admin</span>
                                </span>
                              ) : u.role === 'ADMIN' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Admin</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                  <Users className="w-3.5 h-3.5 text-orange-600" />
                                  <span>User</span>
                                </span>
                              )}
                            </td>

                            {/* 6. CỘT THAO TÁC - Nút Thao tác duy nhất (không icon, nằm trên 1 dòng) */}
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleOpenUserModal(u)}
                                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white border border-orange-200 hover:border-orange-600 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
                              >
                                Thao tác
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* CỬA SỔ / MODAL THAO TÁC CHI TIẾT TÀI KHOẢN */}
              {selectedUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div 
                    className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Modal Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-orange-50/40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/20 font-bold">
                          <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="font-extrabold text-base text-slate-900 leading-snug">
                            Chi tiết tài khoản & Thao tác
                          </h2>
                          <p className="text-xs text-slate-500 font-medium">
                            Mã hệ thống: <span className="font-mono font-bold text-orange-600">{selectedUserModal.code || (selectedUserModal.role === 'ADMIN' ? 'OE-0000' : 'OE-USER')}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedUserModal(null)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto space-y-5 text-xs">
                      
                      {/* Success Alert */}
                      {modalSuccessMsg && (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{modalSuccessMsg}</span>
                        </div>
                      )}

                      {/* 1. Thông tin người dùng */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-500 text-white font-black text-lg flex items-center justify-center shadow-xs shrink-0">
                            {selectedUserModal.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-slate-900 truncate">
                                {selectedUserModal.fullName}
                              </h3>
                              {currentUser?.id === selectedUserModal.id && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono truncate">{selectedUserModal.email}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Hoạt động
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Gói tài khoản (CÓ SẴN VÀ CHO PHÉP ĐỔI) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-orange-600" />
                            <span>Gói dịch vụ (Cho phép đổi)</span>
                          </label>
                          <span className="text-[11px] text-slate-400 font-medium">Chọn gói & bấm Lưu thay đổi</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Option FREE */}
                          <button
                            type="button"
                            onClick={() => setModalTier('FREE')}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                              modalTier === 'FREE'
                                ? 'border-orange-600 bg-orange-50/50 ring-2 ring-orange-500/20 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800">Gói Free</span>
                              {modalTier === 'FREE' && <Check className="w-4 h-4 text-orange-600 font-bold" />}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Tài khoản miễn phí, giới hạn lượt hỏi đáp AI và học tài liệu căn bản.
                            </p>
                          </button>

                          {/* Option PRO */}
                          <button
                            type="button"
                            onClick={() => setModalTier('PRO')}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                              modalTier === 'PRO'
                                ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-500/20 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-xs text-rose-800 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                                Gói Pro
                              </span>
                              {modalTier === 'PRO' && <Check className="w-4 h-4 text-rose-600 font-bold" />}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Không giới hạn AI, sinh đề thi trắc nghiệm & tự luận kèm chấm điểm chuyên sâu.
                            </p>
                          </button>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handleSaveTier}
                            disabled={isUpdatingTier || modalTier === selectedUserModal.tier}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            {isUpdatingTier ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Đang lưu...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Lưu thay đổi gói</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 3. Vai trò (KHÔNG ĐƯỢC PHÉP ĐỔI - KHÓA BẢO MẬT) */}
                      <div className="space-y-2.5 pt-3 border-t border-slate-100">
                        <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Vai Trò Hệ Thống (Không được phép đổi)</span>
                        </label>

                        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                            {selectedUserModal.code === 'OE-0000' || selectedUserModal.email === 'admin@ownedu.edu.vn' ? (
                              <ShieldCheck className="w-4 h-4 text-amber-700" />
                            ) : selectedUserModal.role === 'ADMIN' ? (
                              <ShieldCheck className="w-4 h-4 text-amber-700" />
                            ) : (
                              <Users className="w-4 h-4 text-slate-700" />
                            )}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-amber-950">
                                {selectedUserModal.code === 'OE-0000' || selectedUserModal.email === 'admin@ownedu.edu.vn'
                                  ? 'Super Admin (Toàn quyền hệ thống)'
                                  : selectedUserModal.role === 'ADMIN'
                                  ? 'Admin (Quản trị viên)'
                                  : 'User (Học viên)'}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200/90 text-amber-900 border border-amber-300">
                                🔒 Đã khóa
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-900/80 leading-relaxed">
                              Vai trò tài khoản không thể chỉnh sửa tại đây. Quyền hạn quản trị tối cao thuộc về <strong>Super Admin (Toàn quyền hệ thống)</strong>. Chỉ có Super Admin mới có thẩm quyền khởi tạo hoặc phân quyền tài khoản Admin mới cho hệ thống.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 4. Thao tác nâng cao: Xóa tài khoản */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-700 block text-xs">Vùng quản trị</span>
                          <span className="text-[11px] text-slate-400">Xóa tài khoản này khỏi danh sách hệ thống</span>
                        </div>

                        <button
                          type="button"
                          onClick={handleDeleteUserFromModal}
                          disabled={selectedUserModal.code === 'OE-0000' || selectedUserModal.email === 'admin@ownedu.edu.vn' || currentUser?.id === selectedUserModal.id}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          title={selectedUserModal.code === 'OE-0000' ? 'Không thể xóa tài khoản Super Admin' : 'Xóa tài khoản này'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa tài khoản</span>
                        </button>
                      </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedUserModal(null)}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ======================================================== */}
          {/* TAB 3: QUẢN LÝ HỆ THỐNG */}
          {/* ======================================================== */}
          {activeTab === 'system' && (
            <div className="space-y-2 w-full">
              
              {/* Header Toolbar: Search, Filters & Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                {/* Thanh tìm kiếm service */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm dịch vụ hệ thống (Author, Payment, Product, Cart)..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                  />
                  {serviceSearch && (
                    <button
                      onClick={() => setServiceSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Bộ lọc trạng thái & làm mới */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value as any)}
                    className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-bold focus:bg-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="RUNNING">Đang chạy</option>
                    <option value="STOPPED">Đã dừng</option>
                  </select>

                  <button
                    onClick={() => {
                      setServiceToast('Đã làm mới trạng thái các microservice hệ thống.');
                      setTimeout(() => setServiceToast(''), 3000);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm mới</span>
                  </button>
                </div>
              </div>

              {/* Toast thông báo */}
              {serviceToast && (
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                    <span>{serviceToast}</span>
                  </div>
                  <button onClick={() => setServiceToast('')} className="text-orange-400 hover:text-orange-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* BẢNG DỊCH VỤ HỆ THỐNG (3 CỘT ĐÚNG THEO WIREFRAME: Dịch vụ | Trạng thái | Thao tác) */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-4 px-6">Dịch vụ</th>
                      <th className="py-4 px-6 w-48">Trạng thái</th>
                      <th className="py-4 px-6 text-right w-44 whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {services
                      .filter(svc => {
                        const matchesSearch = svc.name.toLowerCase().includes(serviceSearch.toLowerCase()) || 
                          svc.description.toLowerCase().includes(serviceSearch.toLowerCase());
                        const matchesFilter = serviceFilter === 'ALL' || svc.status === serviceFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((svc) => {
                        const ServiceIcon = svc.icon;
                        const isRunning = svc.status === 'RUNNING';
                        const isToggling = togglingServiceId === svc.id;

                        return (
                          <tr key={svc.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* 1. CỘT DỊCH VỤ */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3.5">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                                  isRunning 
                                    ? 'bg-orange-50 text-orange-700 border-orange-200/80 shadow-xs' 
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  <ServiceIcon className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900 text-sm">{svc.name}</span>
                                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                      Port {svc.port}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-0.5 max-w-md line-clamp-1">{svc.description}</p>
                                </div>
                              </div>
                            </td>

                            {/* 2. CỘT TRẠNG THÁI */}
                            <td className="py-4 px-6">
                              {isRunning ? (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Đang chạy</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                                  <span>Đã dừng</span>
                                </span>
                              )}
                            </td>

                            {/* 3. CỘT THAO TÁC */}
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              {isRunning ? (
                                <button
                                  onClick={() => handleToggleService(svc)}
                                  disabled={isToggling}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{isToggling ? 'Đang xử lý...' : 'Tắt service'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleService(svc)}
                                  disabled={isToggling}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>{isToggling ? 'Đang xử lý...' : 'Bật service'}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CẤU HÌNH */}
          {/* ======================================================== */}
          {activeTab === 'config' && (
            <div className="space-y-2 w-full">
              <div className="pb-4 border-b border-slate-200/80">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                  <SlidersHorizontal className="w-6 h-6 text-orange-600" />
                  <span>Cấu Hình Hệ Thống & Trí Tuệ Nhân Tạo</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Thiết lập Google Gemini API Key, OpenAI API Key và các tham số sinh đề khảo thí chuẩn Bloom
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <Cpu className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Quản Trị API Key & Mô Hình AI</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chỉ tài khoản Quản trị viên mới có quyền cập nhật khóa API và lựa chọn mô hình nền tảng
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="text-slate-500 font-medium">Mô hình AI đang kích hoạt cho hệ thống:</div>
                    <div className="font-black text-orange-700 text-base flex items-center gap-2">
                      <span>{stats?.activeModel || 'Google Gemini 1.5 Flash'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                        Khuyến nghị
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs leading-relaxed flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Bảo mật cấp độ Quản trị</span>
                      Khóa API được lưu trữ tập trung và che giấu an toàn trên máy chủ tại file <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">.env</code>. Người dùng thông thường không thể xem hoặc chỉnh sửa.
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      onClick={() => setIsAiModalOpen(true)}
                      className="px-6 py-3 rounded-2xl font-bold text-sm bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 flex items-center gap-2.5 transition cursor-pointer active:scale-[0.98]"
                    >
                      <Key className="w-4 h-4" />
                      <span>Cấu Hình API Key & Mô Hình AI</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSaved={loadAllData}
      />
    </div>
  );
};
