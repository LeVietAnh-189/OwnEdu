import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles,
  BookOpen, 
  GraduationCap, 
  FileText, 
  User as UserIcon, 
  Search, 
  X, 
  ChevronRight, 
  LogOut, 
  ArrowLeftRight, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Play, 
  ArrowRight, 
  UploadCloud, 
  ShieldCheck, 
  Crown, 
  CreditCard, 
  Award, 
  Calendar, 
  Mail, 
  Code2, 
  Languages, 
  Box, 
  GitBranch,
  ExternalLink,
  BookMarked,
  BarChart3,
  Trash2,
  Loader2
} from 'lucide-react';
import { AdminAPI, DocumentAPI, ExamAPI } from '../services/api';
import { Course, DocumentItem, Exam } from '../types';
import { useUserStore } from '../store/userStore';

type UserTab = 'courses' | 'my-courses' | 'my-documents' | 'profile';

interface MenuItem {
  id: UserTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
}

// 4 Topics consistent with system
export const USER_COURSE_TOPICS = [
  { id: 'ALL', name: 'Tất cả chủ đề', icon: Layers },
  { id: 'Lập trình', name: 'Lập trình', icon: Code2 },
  { id: 'Tiếng Anh', name: 'Tiếng Anh', icon: Languages },
  { id: 'Docker', name: 'Docker', icon: Box },
  { id: 'Git & Github', name: 'Git & Github', icon: GitBranch },
] as const;

export const UserPage: React.FC = () => {
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
  
  // Active Tab: 'courses' | 'my-courses' | 'my-documents' | 'profile'
  const [activeTab, setActiveTab] = useState<UserTab>('courses');
  
  // Topic filter for Courses
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [courseList, docList, examList] = await Promise.all([
          AdminAPI.getCourses().catch(() => []),
          DocumentAPI.list().catch(() => []),
          ExamAPI.list().catch(() => [])
        ]);
        setCourses(courseList);
        setDocuments(docList);
        setExams(examList);
      } catch (err) {
        console.error('Error loading user portal data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDeleteDocument = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${name}" không?`)) return;
    try {
      await DocumentAPI.delete(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      alert('Không thể xóa tài liệu. Vui lòng thử lại!');
    }
  };

  // Direct File Upload from Computer (native file explorer)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  const handleOpenPicker = () => {
    fileInputRef.current?.click();
  };

  const processUploadFile = async (file: File) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      alert('Hệ thống chỉ hỗ trợ tệp định dạng .PDF hoặc .DOCX!');
      return;
    }

    try {
      setIsUploading(true);
      setUploadErrorMsg(null);
      setUploadSuccessMsg(null);

      const uploadedDoc = await DocumentAPI.upload(file);
      setDocuments(prev => [uploadedDoc, ...prev]);
      setUploadSuccessMsg(`Tải lên và bóc tách thành công tài liệu: "${file.name}"`);
      setTimeout(() => setUploadSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Lỗi tải tài liệu:', err);
      const msg = err.response?.data?.error?.message || 'Không thể bóc tách tài liệu. Vui lòng thử lại!';
      setUploadErrorMsg(msg);
      setTimeout(() => setUploadErrorMsg(null), 6000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUploadFile(file);
    }
  };

  // Left sidebar menu definition (The 4 user tabs)
  const menuItems: MenuItem[] = [
    {
      id: 'courses',
      label: 'Khóa học',
      description: 'Khám phá danh mục môn học',
      icon: BookOpen,
      count: courses.length > 0 ? courses.length : undefined
    },
    {
      id: 'my-courses',
      label: 'Khóa học của tôi',
      description: 'Tiến độ học tập & chứng chỉ',
      icon: GraduationCap,
      count: 3
    },
    {
      id: 'my-documents',
      label: 'Tài liệu của tôi',
      description: 'Kho giáo trình & đề ôn tập',
      icon: FileText,
      count: documents.length > 0 ? documents.length : undefined
    },
    {
      id: 'profile',
      label: 'Thông tin cá nhân',
      description: 'Hồ sơ, tài khoản & gói học',
      icon: UserIcon,
      badge: currentUser?.tier === 'PRO' ? 'PRO' : 'FREE'
    }
  ];

  const currentTab = menuItems.find(m => m.id === activeTab);

  const handleLogout = () => {
    navigate('/');
  };

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    const matchTopic = selectedTopic === 'ALL' || c.topic === selectedTopic || c.department === selectedTopic;
    const matchSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTopic && matchSearch;
  });

  // Mock enrolled courses for "Khóa học của tôi"
  const enrolledCourses = [
    {
      id: 'enrolled-1',
      code: 'PROG101',
      title: 'Lập Trình Web Fullstack Hiện Đại với React & Node.js',
      topic: 'Lập trình',
      progress: 75,
      completedLessons: 18,
      totalLessons: 24,
      lastActive: '2 giờ trước',
      icon: Code2
    },
    {
      id: 'enrolled-2',
      code: 'DCK101',
      title: 'Docker & Kubernetes Thực Chiến Cho Developer',
      topic: 'Docker',
      progress: 45,
      completedLessons: 9,
      totalLessons: 20,
      lastActive: 'Hôm qua',
      icon: Box
    },
    {
      id: 'enrolled-3',
      code: 'ENG101',
      title: 'Tiếng Anh Chuyên Ngành CNTT & Luyện Phỏng Vấn IT',
      topic: 'Tiếng Anh',
      progress: 90,
      completedLessons: 27,
      totalLessons: 30,
      lastActive: '3 ngày trước',
      icon: Languages
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full text-slate-900">
      {/* 1. TOP HEADER (Đồng bộ bố cục với Admin) */}
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between shadow-xs">
        {/* Left Brand */}
        <div className="flex items-center gap-3">
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
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                  HỌC VIÊN
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 block">
                Cổng học tập & khảo thí cá nhân
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Contextual Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 flex-1 px-6">
          <Link to="/" className="hover:text-orange-600 transition flex items-center gap-1 text-slate-400">
            <span>Trang chủ</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-bold flex items-center gap-1.5">
            {currentTab?.label}
          </span>
          {activeTab === 'courses' && selectedTopic !== 'ALL' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                {selectedTopic}
              </span>
            </>
          )}
        </div>

        {/* Right Cell: Vai trò, User Profile & Đăng xuất */}
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
            title="Nhấp để chuyển đổi vai trò sang Admin / User"
          >
            <ArrowLeftRight className={`w-3.5 h-3.5 ${isUserLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Vai trò:</span>
            <strong className="font-extrabold">
              {isAdmin ? 'ADMIN (Quản trị)' : 'USER (Học tập)'}
            </strong>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/90 text-xs shadow-xs">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-rose-600 text-white font-black flex items-center justify-center text-[10px] shadow-xs">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 text-xs">
                {currentUser?.fullName || 'Học viên'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Đang trực tuyến" />
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-50 text-orange-800 border border-orange-200">
              {currentUser?.tier || 'PRO'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            title="Về trang chủ"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
            <span className="font-medium">Thoát</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BODY (Sidebar left & Content right) */}
      <div className="flex-1 w-full flex items-stretch">
        
        {/* LEFT SIDEBAR (The 4 user tabs requested by user) */}
        <aside className="w-64 sm:w-72 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0 p-4">
          <div className="space-y-6">
            <div>
              <div className="px-3 pb-2.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
                Menu Học Tập
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
                        {item.count !== undefined && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            isActive ? 'bg-orange-200/80 text-orange-900' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.count}
                          </span>
                        )}

                        {item.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500" />
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
              Không giới hạn số lần bóc tách tài liệu & sinh đề thi Bloom Taxonomy AI.
            </p>
            <button
              onClick={() => setActiveTab('profile')}
              className="w-full py-1.5 text-center text-xs font-bold text-orange-700 hover:text-orange-800 bg-white/80 hover:bg-white rounded-xl border border-orange-200 shadow-xs transition"
            >
              Xem chi tiết quyền lợi
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 p-2 min-h-[calc(100vh-64px)] overflow-y-auto">
          
          {/* ======================================================== */}
          {/* TAB 1: KHÓA HỌC */}
          {/* ======================================================== */}
          {activeTab === 'courses' && (
            <div className="space-y-2 w-full">
              {/* Top Row: Search & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm môn học theo tên, mã học phần (PROG101, ENG101, DCK101...)..."
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

                <div className="text-xs text-slate-500 font-medium px-2">
                  Tìm thấy <strong className="text-slate-900 font-bold">{filteredCourses.length}</strong> môn học
                </div>
              </div>

              {/* Topic Selector Pills */}
              <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {USER_COURSE_TOPICS.map((topic) => {
                    const Icon = topic.icon;
                    const isSelected = selectedTopic === topic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopic(topic.id)}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                            : 'bg-slate-50 text-slate-700 hover:bg-orange-50 hover:text-orange-700 border border-slate-100'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-orange-600'}`} />
                        <span className="truncate">{topic.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Courses Grid */}
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                  Đang tải danh sách khóa học...
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700">Chưa có môn học nào thuộc chủ đề này</p>
                  <p className="text-xs text-slate-400">Bạn có thể chọn chủ đề khác hoặc thử lại với từ khóa tìm kiếm.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredCourses.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                            {c.code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {c.topic || c.department || 'Công nghệ'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                          {c.name}
                        </h3>

                        <p className="text-xs text-slate-500 line-clamp-2 font-normal leading-relaxed">
                          {c.description || 'Chương trình đào tạo chuẩn khảo thí với ngân hàng câu hỏi Bloom Taxonomy & chấm AI.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>45 tiết</span>
                        </span>
                        <button
                          onClick={() => setActiveTab('my-courses')}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          <span>Đăng ký học</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: KHÓA HỌC CỦA TÔI */}
          {/* ======================================================== */}
          {activeTab === 'my-courses' && (
            <div className="space-y-2 w-full">
              {/* Quick Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                    <BookMarked className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Đang học</p>
                    <h4 className="text-2xl font-black text-slate-900">3 môn</h4>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tiến độ chung</p>
                    <h4 className="text-2xl font-black text-slate-900">70%</h4>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Thời gian học</p>
                    <h4 className="text-2xl font-black text-slate-900">24 giờ</h4>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Chứng chỉ đạt</p>
                    <h4 className="text-2xl font-black text-slate-900">1 bài thi</h4>
                  </div>
                </div>
              </div>

              {/* Enrolled Courses List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-orange-600" />
                    <span>Danh Sách Khóa Học Đang Theo Dõi</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {enrolledCourses.map((c) => {
                    const Icon = c.icon;
                    return (
                      <div
                        key={c.id}
                        className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {c.code}
                              </span>
                              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                {c.topic}
                              </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900">
                              {c.title}
                            </h4>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>Đã hoàn thành: <strong className="text-slate-700">{c.completedLessons}/{c.totalLessons}</strong> bài học</span>
                              <span>•</span>
                              <span>Lần học gần nhất: {c.lastActive}</span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar & Continue Button */}
                        <div className="w-full md:w-64 space-y-2 shrink-0">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">Tiến độ hoàn thành</span>
                            <span className="text-orange-600">{c.progress}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full transition-all duration-500"
                              style={{ width: `${c.progress}%` }}
                            />
                          </div>
                          <button
                            onClick={() => navigate('/')}
                            className="w-full mt-2 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>Vào học & làm đề thi</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: TÀI LIỆU CỦA TÔI */}
          {/* ======================================================== */}
          {activeTab === 'my-documents' && (
            <div className="space-y-2 w-full">
              {/* Hidden Native File Input (Direct OS File Explorer) */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Upload Status Banners */}
              {uploadSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadSuccessMsg}</span>
                  </div>
                  <button onClick={() => setUploadSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {uploadErrorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadErrorMsg}</span>
                  </div>
                  <button onClick={() => setUploadErrorMsg(null)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Giáo Trình & Tài Liệu Cá Nhân Đã Bóc Tách
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleOpenPicker}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 shrink-0 cursor-pointer active:scale-[0.98] disabled:opacity-60"
                  title="Nhấp để mở thư mục trên máy tính và chọn tệp PDF hoặc DOCX"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang bóc tách file...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Tải lên tài liệu mới</span>
                    </>
                  )}
                </button>
              </div>

              {/* Documents List */}
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                  Đang tải danh sách tài liệu...
                </div>
              ) : documents.length === 0 ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleOpenPicker}
                  className={`p-10 sm:p-14 rounded-3xl border-2 border-dashed transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer select-none ${
                    isDragging
                      ? 'border-orange-500 bg-orange-50/90 scale-[1.01] shadow-lg shadow-orange-500/10'
                      : 'border-slate-200 hover:border-orange-400 bg-white hover:bg-orange-50/20 shadow-xs'
                  }`}
                >
                  {isUploading ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
                        <Loader2 className="w-7 h-7 animate-spin" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        Đang bóc tách & phân đoạn tài liệu RAG...
                      </h4>
                      <p className="text-xs text-slate-500">
                        AI đang đọc cấu trúc đề mục và chia nhỏ thành các đoạn tri thức chuẩn
                      </p>
                    </div>
                  ) : isDragging ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto shadow-md shadow-orange-600/30 animate-bounce">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-black text-orange-700">
                        Thả tệp vào đây để tải lên ngay!
                      </h4>
                      <p className="text-xs text-orange-600 font-semibold">
                        Hỗ trợ tệp định dạng .PDF hoặc .DOCX
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-md">
                      <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center mx-auto transition-transform hover:scale-110">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          Kéo thả tệp vào đây, hoặc bấm để chọn tệp
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Hỗ trợ tệp văn bản định dạng <strong className="text-slate-800">.PDF</strong> & <strong className="text-slate-800">.DOCX</strong> (Dung lượng tối đa 25MB)
                        </p>
                      </div>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700">
                          <span>Tải tài liệu ngay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                            {doc.fileType}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã bóc tách
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 line-clamp-2" title={doc.filename}>
                          {doc.filename}
                        </h4>

                        <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl">
                          <p>Số từ văn bản: <strong className="text-slate-800">{doc.totalWords || 0}</strong> từ</p>
                          <p>Phân đoạn RAG: <strong className="text-slate-800">{doc.chunksCount || 0}</strong> chunks (1.200 ký tự)</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Link
                          to={`/documents/${doc.id}/generate`}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Sinh Đề Thi Chuẩn Bloom</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                          title="Xóa tài liệu này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: THÔNG TIN CÁ NHÂN */}
          {/* ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-2 w-full">
              {/* Profile Card Header */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-orange-600 via-rose-500 to-amber-400 p-1 shadow-lg shadow-orange-600/20 shrink-0">
                  <div className="w-full h-full bg-white rounded-[20px] flex items-center justify-center text-3xl font-black text-orange-600">
                    {currentUser?.fullName?.charAt(0) || 'U'}
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-2xl font-black text-slate-900">
                      {currentUser?.fullName || 'Học viên'}
                    </h2>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                      Mã: OE-8821
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Trực tuyến
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentUser?.email || 'sinhvien@ownedu.vn'}</span>
                  </p>

                  <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tham gia hệ thống từ tháng 01/2026</span>
                  </p>
                </div>
              </div>

              {/* Membership & Subscription Tier Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 border border-orange-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/25">
                      <Crown className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-black text-slate-900">Gói Tài Khoản: Gói PRO</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Thời hạn sử dụng: Vĩnh viễn (Tài khoản thử nghiệm)</p>
                    </div>
                  </div>

                  <button
                    onClick={() => alert('Gói Pro của bạn đang hoạt động đầy đủ quyền lợi!')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-orange-700 border border-orange-200 hover:bg-orange-50 shadow-xs transition"
                  >
                    Quản lý gói học
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-white/80 border border-orange-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Bóc tách giáo trình</span>
                    <p className="text-sm font-black text-slate-900">Không giới hạn</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/80 border border-orange-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Khảo thí AI Bloom</span>
                    <p className="text-sm font-black text-slate-900">4 Cấp độ nhận thức</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/80 border border-orange-100 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Chấm tự luận Rubric</span>
                    <p className="text-sm font-black text-slate-900">Chi tiết theo tiêu chí</p>
                  </div>
                </div>
              </div>

              {/* Tab Placeholder Notice for Future User Design */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700">
                  Giao diện phần Thông tin cá nhân sẵn sàng cho bạn thiết kế chi tiết
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Bạn có thể bổ sung các biểu mẫu đổi mật khẩu, cập nhật avatar, thiết lập thông báo hoặc bảng điểm cá nhân tại đây.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default UserPage;
