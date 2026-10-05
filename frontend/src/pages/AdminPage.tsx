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
  ArrowLeftRight,
  UploadCloud,
  ArrowLeft,
  FileCode,
  CheckSquare,
  Square,
  FileUp,
  Video,
  Film,
  Eye,
  EyeOff,
  Save,
  Zap,
  CheckCircle,
  Cloud,
  Youtube,
  FolderPlus,
  Folder,
  Edit,
  Edit3,
  ListChecks,
  Clock,
  Globe,
  FileEdit,
  Wrench,
  Settings2,
  ShieldAlert
} from 'lucide-react';
import { AdminAPI, DocumentAPI, UserAPI, VideoAPI, SettingsAPI, SystemSettingsData, SystemServiceAPI } from '../services/api';
import { AdminStats, Course, TokenUsageLog, DocumentItem, VideoItem, User, Chapter, Lesson, SystemServiceConfig } from '../types';
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

export const TOPIC_CODE_PREFIX: Record<string, string> = {
  'Lập trình': 'Prog',
  'Tiếng Anh': 'Eng',
  'Docker': 'Dck',
  'Git & Github': 'Git',
};

export const generateRandomCourseCode = (topic: string, currentCourses: Course[]): string => {
  const prefix = TOPIC_CODE_PREFIX[topic] || (topic.length >= 3 ? topic.slice(0, 3) : topic);
  const existingCodes = new Set(currentCourses.map(c => (c.code || '').trim().toLowerCase()));

  for (let i = 0; i < 1500; i++) {
    const num = Math.floor(Math.random() * 999) + 1;
    const formatted = String(num).padStart(3, '0');
    const candidate = `${prefix}${formatted}`;
    if (!existingCodes.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  for (let num = 1; num <= 999; num++) {
    const formatted = String(num).padStart(3, '0');
    const candidate = `${prefix}${formatted}`;
    if (!existingCodes.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  return `${prefix}${Date.now().toString().slice(-3)}`;
};

export interface SystemServiceItem {
  id: string;
  name: string;
  key: 'auth' | 'payment' | 'product' | 'cart';
  port: number;
  status: 'RUNNING' | 'MAINTENANCE';
  description: string;
  maintenanceMessage?: string;
  estimatedEndTime?: string;
  allowAdminBypass?: boolean;
  updatedAt?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  auth: ShieldCheck,
  payment: CreditCard,
  product: Package,
  cart: ShoppingCart,
};

// 4 services from the wireframe
const INITIAL_SYSTEM_SERVICES: SystemServiceItem[] = [
  {
    id: 'author-svc',
    name: 'Author Service',
    key: 'auth',
    port: 3001,
    status: 'RUNNING',
    description: 'Xác thực tài khoản, kiểm soát phiên đăng nhập JWT & phân quyền Super Admin / Admin',
    maintenanceMessage: 'Hệ thống xác thực tài khoản đang bảo trì định kỳ. Các phiên đăng nhập hiện tại vẫn hoạt động bình thường.',
    estimatedEndTime: '',
    allowAdminBypass: true,
    icon: ShieldCheck
  },
  {
    id: 'payment-svc',
    name: 'Payment Service',
    key: 'payment',
    port: 3002,
    status: 'RUNNING',
    description: 'Cổng thanh toán học phí, đăng ký gói Pro và đối soát hóa đơn giao dịch',
    maintenanceMessage: 'Cổng thanh toán đang bảo trì định kỳ để nâng cấp kênh thanh toán. Các khóa học đã sở hữu vẫn học bình thường.',
    estimatedEndTime: '',
    allowAdminBypass: true,
    icon: CreditCard
  },
  {
    id: 'product-svc',
    name: 'Product Service',
    key: 'product',
    port: 3003,
    status: 'RUNNING',
    description: 'Quản lý danh mục khóa học, kho giáo trình và đề thi khảo thí thông minh',
    maintenanceMessage: 'Hệ thống khóa học và đề thi đang trong quá trình đồng bộ dữ liệu bảo trì.',
    estimatedEndTime: '',
    allowAdminBypass: true,
    icon: Package
  },
  {
    id: 'cart-svc',
    name: 'Cart Service',
    key: 'cart',
    port: 3004,
    status: 'RUNNING',
    description: 'Giỏ hàng đăng ký môn học, tiến độ học tập và lưu vết bài thi của học viên',
    maintenanceMessage: 'Hệ thống giỏ hàng & đăng ký môn học đang bảo trì hệ thống.',
    estimatedEndTime: '',
    allowAdminBypass: true,
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
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'published' | 'draft'>('ALL');

  // Course form state (2-Step Creation Wizard)
  const [showAddCourse, setShowAddCourse] = useState<boolean>(false);
  const [courseStep, setCourseStep] = useState<1 | 2>(1);
  const [wizardMaterialTab, setWizardMaterialTab] = useState<'DOCUMENTS' | 'VIDEOS'>('DOCUMENTS');
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [courseTopic, setCourseTopic] = useState<string>('Lập trình');
  const [courseDept, setCourseDept] = useState<string>('Khoa Công nghệ Thông tin');
  const [courseDesc, setCourseDesc] = useState<string>('');
  const [courseIsFreeTier, setCourseIsFreeTier] = useState<boolean>(true);
  const [courseDocumentIds, setCourseDocumentIds] = useState<string[]>([]);
  const [courseVideoIds, setCourseVideoIds] = useState<string[]>([]);
  const [newCourseChapters, setNewCourseChapters] = useState<Chapter[]>([
    {
      id: 'ch_init_1',
      title: 'Chương 1: Giới thiệu & Khởi động',
      orderIndex: 1,
      lessons: [
        {
          id: 'les_init_1',
          title: 'Bài 1: Giới thiệu tổng quan môn học',
          orderIndex: 1,
          durationMinutes: 15,
          content: '# Giới thiệu tổng quan môn học\n\nChào mừng bạn đến với khóa học! Trong bài học này chúng ta sẽ tìm hiểu mục tiêu và lộ trình học tập.\n\n:::keypoint Điểm then chốt\nNắm vững lộ trình và cài đặt môi trường thực hành đầy đủ trước khi bắt đầu.\n:::\n',
          updatedAt: new Date().toISOString()
        }
      ]
    }
  ]);
  const [docSearchInWizard, setDocSearchInWizard] = useState<string>('');
  const [isUploadingCourseDoc, setIsUploadingCourseDoc] = useState<boolean>(false);
  const [uploadDocMsg, setUploadDocMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingCourseVideo, setIsUploadingCourseVideo] = useState<boolean>(false);
  const [uploadVideoMsg, setUploadVideoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [wizardVideoMode, setWizardVideoMode] = useState<'UPLOAD' | 'YOUTUBE'>('UPLOAD');
  const [wizardYoutubeUrl, setWizardYoutubeUrl] = useState<string>('');
  const [wizardYoutubeTitle, setWizardYoutubeTitle] = useState<string>('');
  const [isAddingWizardYoutube, setIsAddingWizardYoutube] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [isSubmittingCourse, setIsSubmittingCourse] = useState<boolean>(false);

  const handleAddNewCourseChapter = () => {
    const nextIdx = newCourseChapters.length + 1;
    const newChapter: Chapter = {
      id: `ch_${Date.now()}_${nextIdx}`,
      title: `Chương ${nextIdx}: Chương mới`,
      orderIndex: nextIdx,
      lessons: [
        {
          id: `les_${Date.now()}_1`,
          title: `Bài 1: Giới thiệu chương ${nextIdx}`,
          orderIndex: 1,
          durationMinutes: 15,
          content: `# Giới thiệu chương ${nextIdx}\n\nNội dung bài học đầu tiên của chương...\n`,
          updatedAt: new Date().toISOString()
        }
      ]
    };
    setNewCourseChapters(prev => [...prev, newChapter]);
  };

  const handleDeleteNewCourseChapter = (chapterId: string) => {
    if (newCourseChapters.length <= 1) {
      alert('Khóa học cần có ít nhất 1 chương học.');
      return;
    }
    setNewCourseChapters(prev => prev.filter(ch => ch.id !== chapterId));
  };

  const handleUpdateNewCourseChapterTitle = (chapterId: string, title: string) => {
    setNewCourseChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, title } : ch));
  };

  const handleAddNewCourseLesson = (chapterId: string) => {
    setNewCourseChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      const curLessons = ch.lessons || [];
      const nextLesIdx = curLessons.length + 1;
      const newLesson: Lesson = {
        id: `les_${Date.now()}_${nextLesIdx}`,
        title: `Bài ${nextLesIdx}: Bài học mới`,
        orderIndex: nextLesIdx,
        durationMinutes: 15,
        content: `# Bài ${nextLesIdx}: Bài học mới\n\nNhập nội dung bài học ở đây...\n`,
        updatedAt: new Date().toISOString()
      };
      return { ...ch, lessons: [...curLessons, newLesson] };
    }));
  };

  const handleDeleteNewCourseLesson = (chapterId: string, lessonId: string) => {
    setNewCourseChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      const curLessons = ch.lessons || [];
      if (curLessons.length <= 1) {
        alert('Mỗi chương cần có ít nhất 1 bài học.');
        return ch;
      }
      return { ...ch, lessons: curLessons.filter(l => l.id !== lessonId) };
    }));
  };

  const handleUpdateNewCourseLessonTitle = (chapterId: string, lessonId: string, title: string) => {
    setNewCourseChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      const curLessons = ch.lessons || [];
      return {
        ...ch,
        lessons: curLessons.map(l => l.id === lessonId ? { ...l, title } : l)
      };
    }));
  };

  const handleUpdateNewCourseLessonDuration = (chapterId: string, lessonId: string, durationMinutes: number) => {
    setNewCourseChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      const curLessons = ch.lessons || [];
      return {
        ...ch,
        lessons: curLessons.map(l => l.id === lessonId ? { ...l, durationMinutes } : l)
      };
    }));
  };

  // Manage course documents & videos modal state (for existing courses)
  const [selectedCourseForDocs, setSelectedCourseForDocs] = useState<Course | null>(null);
  const [editMaterialTab, setEditMaterialTab] = useState<'CURRICULUM' | 'DOCUMENTS' | 'VIDEOS'>('CURRICULUM');
  const [editCourseChapters, setEditCourseChapters] = useState<Chapter[]>([]);
  const [isLessonEditorOpen, setIsLessonEditorOpen] = useState<boolean>(false);
  const [editingLessonContext, setEditingLessonContext] = useState<{
    chapterId: string;
    chapterTitle: string;
    lesson: Lesson | null;
  } | null>(null);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState<string>('');
  const [editCourseDocIds, setEditCourseDocIds] = useState<string[]>([]);
  const [editCourseVideoIds, setEditCourseVideoIds] = useState<string[]>([]);
  const [isUpdatingCourseDocs, setIsUpdatingCourseDocs] = useState<boolean>(false);
  const [editDocSearch, setEditDocSearch] = useState<string>('');
  const [editDocUploadMsg, setEditDocUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingInEditModal, setIsUploadingInEditModal] = useState<boolean>(false);
  const [editVideoUploadMsg, setEditVideoUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingVideoInEditModal, setIsUploadingVideoInEditModal] = useState<boolean>(false);
  const [editVideoMode, setEditVideoMode] = useState<'UPLOAD' | 'YOUTUBE'>('UPLOAD');
  const [editYoutubeUrl, setEditYoutubeUrl] = useState<string>('');
  const [editYoutubeTitle, setEditYoutubeTitle] = useState<string>('');
  const [isAddingEditYoutube, setIsAddingEditYoutube] = useState<boolean>(false);

  // Video preview player modal state
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

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
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'RUNNING' | 'MAINTENANCE'>('ALL');
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);
  const [serviceToast, setServiceToast] = useState<string>('');
  const [selectedServiceForMaintenance, setSelectedServiceForMaintenance] = useState<SystemServiceItem | null>(null);
  const [maintenanceFormStatus, setMaintenanceFormStatus] = useState<'RUNNING' | 'MAINTENANCE'>('MAINTENANCE');
  const [maintenanceFormMessage, setMaintenanceFormMessage] = useState<string>('');
  const [maintenanceFormEta, setMaintenanceFormEta] = useState<string>('');
  const [maintenanceFormBypass, setMaintenanceFormBypass] = useState<boolean>(true);
  const [isUpdatingService, setIsUpdatingService] = useState<boolean>(false);

  // System Config (API Keys & Cloudflare R2) State
  const [configActiveModel, setConfigActiveModel] = useState<string>('gemini-3.5-flash');
  const [configGeminiKey, setConfigGeminiKey] = useState<string>('');
  const [configOpenAiKey, setConfigOpenAiKey] = useState<string>('');
  const [configR2AccountId, setConfigR2AccountId] = useState<string>('');
  const [configR2AccessKeyId, setConfigR2AccessKeyId] = useState<string>('');
  const [configR2SecretAccessKey, setConfigR2SecretAccessKey] = useState<string>('');
  const [configR2BucketName, setConfigR2BucketName] = useState<string>('ownedu-videos');
  const [configR2PublicDomain, setConfigR2PublicDomain] = useState<string>('');
  const [hasR2Configured, setHasR2Configured] = useState<boolean>(false);

  const [showGeminiKey, setShowGeminiKey] = useState<boolean>(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState<boolean>(false);
  const [showR2Secret, setShowR2Secret] = useState<boolean>(false);

  const [isTestingAI, setIsTestingAI] = useState<boolean>(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const [isTestingR2, setIsTestingR2] = useState<boolean>(false);
  const [r2TestResult, setR2TestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [saveConfigMsg, setSaveConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, coursesRes, tokensRes, docsRes, usersRes, videosRes, settingsRes, servicesRes] = await Promise.all([
        AdminAPI.getStats().catch(() => null),
        AdminAPI.getCourses().catch(() => []),
        AdminAPI.getTokens().catch(() => ({ logs: [], summary: { totalTokens: 0, estimatedCostUsd: 0, callCount: 0 } })),
        DocumentAPI.list().catch(() => []),
        UserAPI.list().catch(() => []),
        VideoAPI.list().catch(() => []),
        SettingsAPI.get().catch(() => null),
        SystemServiceAPI.list().catch(() => [])
      ]);

      if (servicesRes && servicesRes.length > 0) {
        setServices(servicesRes.map((s: SystemServiceConfig) => ({
          ...s,
          icon: SERVICE_ICONS[s.key] || ShieldCheck
        })));
      }

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
      if (videosRes) setVideos(videosRes);
      if (settingsRes) {
        if (settingsRes.activeModel) setConfigActiveModel(settingsRes.activeModel);
        if (settingsRes.geminiApiKey) setConfigGeminiKey(settingsRes.geminiApiKey);
        if (settingsRes.openaiApiKey) setConfigOpenAiKey(settingsRes.openaiApiKey);
        if (settingsRes.r2AccountId) setConfigR2AccountId(settingsRes.r2AccountId);
        if (settingsRes.r2AccessKeyId) setConfigR2AccessKeyId(settingsRes.r2AccessKeyId);
        if (settingsRes.r2SecretAccessKey) setConfigR2SecretAccessKey(settingsRes.r2SecretAccessKey);
        if (settingsRes.r2BucketName) setConfigR2BucketName(settingsRes.r2BucketName);
        if (settingsRes.r2PublicDomain) setConfigR2PublicDomain(settingsRes.r2PublicDomain);
        setHasR2Configured(settingsRes.hasR2Config);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAI = async (provider: 'gemini' | 'openai' = 'gemini') => {
    setIsTestingAI(true);
    setAiTestResult(null);
    try {
      const res = await SettingsAPI.testAI({
        provider,
        apiKey: provider === 'gemini' ? configGeminiKey.trim() : configOpenAiKey.trim(),
        model: configActiveModel
      });
      setAiTestResult({ success: true, message: res.message, latencyMs: res.latencyMs });
    } catch (err: any) {
      setAiTestResult({
        success: false,
        message: err.response?.data?.error?.message || err.message || 'Không thể kết nối đến máy chủ AI.'
      });
    } finally {
      setIsTestingAI(false);
    }
  };

  const handleTestR2 = async () => {
    setIsTestingR2(true);
    setR2TestResult(null);
    try {
      const res = await SettingsAPI.testR2({
        accountId: configR2AccountId.trim(),
        accessKeyId: configR2AccessKeyId.trim(),
        secretAccessKey: configR2SecretAccessKey.trim(),
        bucketName: configR2BucketName.trim()
      });
      setR2TestResult({ success: true, message: res.message, latencyMs: res.latencyMs });
    } catch (err: any) {
      setR2TestResult({
        success: false,
        message: err.response?.data?.error?.message || err.message || 'Không thể kết nối đến Cloudflare R2.'
      });
    } finally {
      setIsTestingR2(false);
    }
  };

  const handleSaveAllConfig = async () => {
    setIsSavingConfig(true);
    setSaveConfigMsg(null);
    try {
      const res = await SettingsAPI.save({
        active_model: configActiveModel,
        gemini_api_key: configGeminiKey.trim(),
        openai_api_key: configOpenAiKey.trim(),
        r2_account_id: configR2AccountId.trim(),
        r2_access_key_id: configR2AccessKeyId.trim(),
        r2_secret_access_key: configR2SecretAccessKey.trim(),
        r2_bucket_name: configR2BucketName.trim(),
        r2_public_domain: configR2PublicDomain.trim()
      });
      setHasR2Configured(res.hasR2Config);
      setSaveConfigMsg({ type: 'success', text: res.message || 'Đã lưu cấu hình và đồng bộ tệp .env thành công!' });
      loadAllData();
    } catch (err: any) {
      setSaveConfigMsg({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Không thể lưu cấu hình.'
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-poll video status while any video is being compressed with FFmpeg
  useEffect(() => {
    const hasProcessing = videos.some(v => v.status === 'PROCESSING');
    if (!hasProcessing) return;
    const timer = setInterval(async () => {
      try {
        const updatedVideos = await VideoAPI.list();
        setVideos(updatedVideos);
      } catch (e) {
        // silent fail
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [videos]);

  useEffect(() => {
    if (courseIsFreeTier) {
      setWizardVideoMode('YOUTUBE');
    }
  }, [courseIsFreeTier]);

  const handleStartAddCourse = (defaultTopic?: string) => {
    setCourseStep(1);
    setWizardMaterialTab('DOCUMENTS');
    const topic = defaultTopic || (selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic);
    setCourseTopic(topic);
    setCourseCode(generateRandomCourseCode(topic, courses));
    setCourseName('');
    setCourseDesc('');
    setCourseDept(topic);
    setCourseIsFreeTier(true);
    setCourseDocumentIds([]);
    setCourseVideoIds([]);
    setDocSearchInWizard('');
    setUploadDocMsg(null);
    setUploadVideoMsg(null);
    setFormError('');
    setShowAddCourse(true);
  };

  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!courseCode.trim() || !courseName.trim()) {
      setFormError('Mã môn học và Tên môn học không được để trống.');
      return;
    }
    setCourseStep(2);
  };

  const handleUploadDocInWizard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCourseDoc(true);
      setUploadDocMsg(null);
      const uploadedDoc = await DocumentAPI.upload(file);
      setDocuments(prev => [uploadedDoc, ...prev.filter(d => d.id !== uploadedDoc.id)]);
      setCourseDocumentIds(prev => prev.includes(uploadedDoc.id) ? prev : [...prev, uploadedDoc.id]);
      setUploadDocMsg({ type: 'success', text: `Đã nạp và gán tài liệu "${file.name}" vào khóa học!` });
    } catch (err: any) {
      setUploadDocMsg({ type: 'error', text: err.response?.data?.error?.message || 'Không thể tải lên tài liệu.' });
    } finally {
      setIsUploadingCourseDoc(false);
      e.target.value = '';
    }
  };

  const toggleDocInWizard = (docId: string) => {
    setCourseDocumentIds(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleUploadVideoInWizard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingCourseVideo(true);
      setUploadVideoMsg(null);
      const uploadedVideo = await VideoAPI.upload(file, file.name);
      setVideos(prev => [uploadedVideo, ...prev.filter(v => v.id !== uploadedVideo.id)]);
      setCourseVideoIds(prev => prev.includes(uploadedVideo.id) ? prev : [...prev, uploadedVideo.id]);
      setUploadVideoMsg({ type: 'success', text: `Đã tải lên "${file.name}"! FFmpeg đang nén ngầm (H.264 + Faststart)...` });
    } catch (err: any) {
      const errText = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Không thể tải lên video.';
      setUploadVideoMsg({ type: 'error', text: errText });
    } finally {
      setIsUploadingCourseVideo(false);
      e.target.value = '';
    }
  };

  const extractYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.trim().match(regExp);
    return match ? match[1] : null;
  };

  const handleAddYoutubeInWizard = async () => {
    if (!wizardYoutubeUrl.trim()) return;
    const yId = extractYoutubeId(wizardYoutubeUrl);
    if (!yId) {
      setUploadVideoMsg({ type: 'error', text: 'Đường dẫn YouTube không đúng định dạng. Ví dụ: https://www.youtube.com/watch?v=... hoặc https://youtu.be/...' });
      return;
    }
    try {
      setIsAddingWizardYoutube(true);
      setUploadVideoMsg(null);
      const newVideo = await VideoAPI.addYoutube({
        youtubeUrl: wizardYoutubeUrl.trim(),
        title: wizardYoutubeTitle.trim() || undefined,
      });
      setVideos(prev => [newVideo, ...prev.filter(v => v.id !== newVideo.id)]);
      setCourseVideoIds(prev => prev.includes(newVideo.id) ? prev : [...prev, newVideo.id]);
      setUploadVideoMsg({ type: 'success', text: `Đã gắn video YouTube: "${newVideo.title}"!` });
      setWizardYoutubeUrl('');
      setWizardYoutubeTitle('');
    } catch (err: any) {
      const errText = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Không thể gắn video YouTube.';
      setUploadVideoMsg({ type: 'error', text: errText });
    } finally {
      setIsAddingWizardYoutube(false);
    }
  };

  const toggleVideoInWizard = (vidId: string) => {
    setCourseVideoIds(prev =>
      prev.includes(vidId) ? prev.filter(id => id !== vidId) : [...prev, vidId]
    );
  };

  const handleCreateCourse = async (andEditFirstLesson: boolean = false, targetStatus: 'draft' | 'published' = 'draft') => {
    setFormError('');

    if (!courseCode.trim() || !courseName.trim()) {
      setCourseStep(1);
      setFormError('Mã môn học và Tên môn học không được để trống.');
      return;
    }

    try {
      setIsSubmittingCourse(true);
      const newCourse = await AdminAPI.createCourse({
        code: courseCode.trim(),
        name: courseName.trim(),
        topic: courseTopic.trim(),
        department: courseTopic.trim(),
        description: courseDesc.trim(),
        status: targetStatus,
        isFreeTier: courseIsFreeTier,
        tierRequired: courseIsFreeTier ? 'FREE' : 'PRO',
        documentIds: courseDocumentIds,
        videoIds: courseVideoIds,
        chapters: newCourseChapters
      });

      setCourses([newCourse, ...courses]);
      if (stats) setStats({ ...stats, coursesCount: stats.coursesCount + 1 });
      setCourseCode('');
      setCourseName('');
      setCourseDesc('');
      setCourseDocumentIds([]);
      setCourseVideoIds([]);
      setNewCourseChapters([
        {
          id: `ch_init_1`,
          title: 'Chương 1: Giới thiệu & Khởi động',
          orderIndex: 1,
          lessons: [
            {
              id: `les_init_1`,
              title: 'Bài 1: Giới thiệu tổng quan môn học',
              orderIndex: 1,
              durationMinutes: 15,
              content: '# Giới thiệu tổng quan môn học\n\nChào mừng bạn đến với khóa học! Trong bài học này chúng ta sẽ tìm hiểu mục tiêu và lộ trình học tập.\n\n:::keypoint Điểm then chốt\nNắm vững lộ trình và cài đặt môi trường thực hành đầy đủ trước khi bắt đầu.\n:::\n',
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ]);
      setCourseStep(1);
      setShowAddCourse(false);

      if (andEditFirstLesson) {
        const firstCh = newCourse.chapters?.[0];
        const firstLes = firstCh?.lessons?.[0];
        if (firstCh && firstLes) {
          navigate(`/admin/courses/${newCourse.id}/chapters/${firstCh.id}/lessons/${firstLes.id}`);
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Không thể tạo môn học mới.');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleToggleCourseStatus = async (courseId: string, currentStatus?: 'draft' | 'published') => {
    const nextStatus: 'draft' | 'published' = currentStatus === 'draft' ? 'published' : 'draft';
    try {
      await AdminAPI.updateCourse(courseId, { status: nextStatus });
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: nextStatus } : c));
      if (selectedCourseForDocs && selectedCourseForDocs.id === courseId) {
        setSelectedCourseForDocs(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái khóa học: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  // Manage documents, videos & curriculum on existing courses
  const handleOpenDocModal = (crs: Course) => {
    setSelectedCourseForDocs(crs);
    setEditMaterialTab('CURRICULUM');
    setEditCourseChapters(crs.chapters || []);
    setEditCourseDocIds(crs.documentIds || []);
    setEditCourseVideoIds(crs.videoIds || []);
    setEditDocSearch('');
    setEditDocUploadMsg(null);
    setEditVideoUploadMsg(null);
    setEditingChapterId(null);
    const isFree = crs.isFreeTier !== false && crs.tierRequired !== 'PRO';
    if (isFree) {
      setEditVideoMode('YOUTUBE');
    } else {
      setEditVideoMode('UPLOAD');
    }
  };

  // Chapter & Lesson Management Handlers
  const handleAddChapter = () => {
    const nextIdx = editCourseChapters.length + 1;
    const newChap: Chapter = {
      id: `chap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: `Chương ${nextIdx}: Tiêu đề chương mới`,
      orderIndex: nextIdx,
      lessons: []
    };
    setEditCourseChapters([...editCourseChapters, newChap]);
    setEditingChapterId(newChap.id);
    setEditingChapterTitle(newChap.title);
  };

  const handleStartEditChapter = (ch: Chapter) => {
    setEditingChapterId(ch.id);
    setEditingChapterTitle(ch.title);
  };

  const handleSaveChapterTitle = (chapterId: string) => {
    if (!editingChapterTitle.trim()) return;
    setEditCourseChapters(prev =>
      prev.map(ch => ch.id === chapterId ? { ...ch, title: editingChapterTitle.trim() } : ch)
    );
    setEditingChapterId(null);
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ chương này và các bài học bên trong?')) return;
    setEditCourseChapters(prev => prev.filter(ch => ch.id !== chapterId));
  };

  const handleOpenAddLesson = async (chapterId: string, chapterTitle: string) => {
    if (!selectedCourseForDocs) return;
    try {
      await AdminAPI.updateCourse(selectedCourseForDocs.id, {
        documentIds: editCourseDocIds,
        videoIds: editCourseVideoIds,
        chapters: editCourseChapters
      });
    } catch (e) {
      console.warn('Could not auto-save before navigating to lesson editor');
    }
    navigate(`/admin/courses/${selectedCourseForDocs.id}/chapters/${chapterId}/lessons/new`);
  };

  const handleOpenEditLesson = async (chapterId: string, chapterTitle: string, lesson: Lesson) => {
    if (!selectedCourseForDocs) return;
    try {
      await AdminAPI.updateCourse(selectedCourseForDocs.id, {
        documentIds: editCourseDocIds,
        videoIds: editCourseVideoIds,
        chapters: editCourseChapters
      });
    } catch (e) {
      console.warn('Could not auto-save before navigating to lesson editor');
    }
    navigate(`/admin/courses/${selectedCourseForDocs.id}/chapters/${chapterId}/lessons/${lesson.id}`);
  };

  const handleSaveLesson = (savedLesson: Lesson) => {
    if (!editingLessonContext) return;
    const { chapterId, lesson } = editingLessonContext;
    setEditCourseChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      const existingLessons = ch.lessons || [];
      if (lesson) {
        return {
          ...ch,
          lessons: existingLessons.map(l => l.id === savedLesson.id ? savedLesson : l)
        };
      } else {
        return {
          ...ch,
          lessons: [...existingLessons, savedLesson]
        };
      }
    }));
    setIsLessonEditorOpen(false);
    setEditingLessonContext(null);
  };

  const handleDeleteLesson = (chapterId: string, lessonId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài giảng này?')) return;
    setEditCourseChapters(prev => prev.map(ch => {
      if (ch.id !== chapterId) return ch;
      return {
        ...ch,
        lessons: (ch.lessons || []).filter(l => l.id !== lessonId)
      };
    }));
  };

  const handleDeleteVideo = async (videoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn video này khỏi hệ thống?')) return;
    try {
      await VideoAPI.delete(videoId);
      setVideos(prev => prev.filter(v => v.id !== videoId));
      setCourseVideoIds(prev => prev.filter(id => id !== videoId));
      setEditCourseVideoIds(prev => prev.filter(id => id !== videoId));
    } catch (err: any) {
      alert('Không thể xóa video: ' + (err.response?.data?.error?.message || err.message));
    }
  };

  const toggleDocInEditModal = (docId: string) => {
    setEditCourseDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const toggleVideoInEditModal = (vidId: string) => {
    setEditCourseVideoIds(prev =>
      prev.includes(vidId) ? prev.filter(id => id !== vidId) : [...prev, vidId]
    );
  };

  const handleSaveCourseDocs = async () => {
    if (!selectedCourseForDocs) return;
    try {
      setIsUpdatingCourseDocs(true);
      const updated = await AdminAPI.updateCourse(selectedCourseForDocs.id, {
        documentIds: editCourseDocIds,
        videoIds: editCourseVideoIds,
        chapters: editCourseChapters
      });
      setCourses(courses.map(c => c.id === updated.id ? updated : c));
      setSelectedCourseForDocs(updated);
      alert('Đã cập nhật bài giảng & học liệu khóa học thành công!');
    } catch (err) {
      alert('Không thể lưu thông tin khóa học.');
    } finally {
      setIsUpdatingCourseDocs(false);
    }
  };

  const handleUploadDocInEditModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingInEditModal(true);
      setEditDocUploadMsg(null);
      const uploadedDoc = await DocumentAPI.upload(file);
      setDocuments(prev => [uploadedDoc, ...prev.filter(d => d.id !== uploadedDoc.id)]);
      setEditCourseDocIds(prev => prev.includes(uploadedDoc.id) ? prev : [...prev, uploadedDoc.id]);
      setEditDocUploadMsg({ type: 'success', text: `Đã nạp thêm tài liệu: ${file.name}` });
    } catch (err: any) {
      setEditDocUploadMsg({ type: 'error', text: err.response?.data?.error?.message || 'Không thể tải lên tài liệu.' });
    } finally {
      setIsUploadingInEditModal(false);
      e.target.value = '';
    }
  };

  const handleUploadVideoInEditModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingVideoInEditModal(true);
      setEditVideoUploadMsg(null);
      const uploadedVideo = await VideoAPI.upload(file, file.name);
      setVideos(prev => [uploadedVideo, ...prev.filter(v => v.id !== uploadedVideo.id)]);
      setEditCourseVideoIds(prev => prev.includes(uploadedVideo.id) ? prev : [...prev, uploadedVideo.id]);
      setEditVideoUploadMsg({ type: 'success', text: `Đã tải lên video: ${file.name}! FFmpeg đang nén...` });
    } catch (err: any) {
      const errText = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Không thể tải lên video.';
      setEditVideoUploadMsg({ type: 'error', text: errText });
    } finally {
      setIsUploadingVideoInEditModal(false);
      e.target.value = '';
    }
  };

  const handleAddYoutubeInEditModal = async () => {
    if (!editYoutubeUrl.trim()) return;
    const yId = extractYoutubeId(editYoutubeUrl);
    if (!yId) {
      setEditVideoUploadMsg({ type: 'error', text: 'Đường dẫn YouTube không đúng định dạng. Ví dụ: https://www.youtube.com/watch?v=... hoặc https://youtu.be/...' });
      return;
    }
    try {
      setIsAddingEditYoutube(true);
      setEditVideoUploadMsg(null);
      const newVideo = await VideoAPI.addYoutube({
        youtubeUrl: editYoutubeUrl.trim(),
        title: editYoutubeTitle.trim() || undefined,
        courseId: selectedCourseForDocs?.id,
      });
      setVideos(prev => [newVideo, ...prev.filter(v => v.id !== newVideo.id)]);
      setEditCourseVideoIds(prev => prev.includes(newVideo.id) ? prev : [...prev, newVideo.id]);
      setEditVideoUploadMsg({ type: 'success', text: `Đã gắn video YouTube: "${newVideo.title}"!` });
      setEditYoutubeUrl('');
      setEditYoutubeTitle('');
    } catch (err: any) {
      const errText = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Không thể gắn video YouTube.';
      setEditVideoUploadMsg({ type: 'error', text: errText });
    } finally {
      setIsAddingEditYoutube(false);
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

  const getDefaultMaintenanceMessage = (svc: SystemServiceItem): string => {
    switch (svc.key) {
      case 'payment':
        return 'Cổng thanh toán đang bảo trì nâng cấp liên kết ngân hàng. Các khóa học đã sở hữu vẫn tiếp tục học bình thường.';
      case 'auth':
        return 'Hệ thống xác thực tài khoản đang bảo trì định kỳ. Các phiên đăng nhập hiện tại vẫn hoạt động bình thường.';
      case 'product':
        return 'Hệ thống khóa học và đề thi đang trong quá trình đồng bộ dữ liệu bảo trì.';
      case 'cart':
        return 'Hệ thống giỏ hàng & đăng ký môn học đang bảo trì hệ thống.';
      default:
        return `Dịch vụ ${svc.name} đang trong chế độ bảo trì kỹ thuật định kỳ.`;
    }
  };

  const handleOpenMaintenanceModal = (svc: SystemServiceItem, targetStatus?: 'RUNNING' | 'MAINTENANCE') => {
    setSelectedServiceForMaintenance(svc);
    setMaintenanceFormStatus(targetStatus || svc.status);
    setMaintenanceFormMessage(svc.maintenanceMessage || getDefaultMaintenanceMessage(svc));
    setMaintenanceFormEta(svc.estimatedEndTime || '');
    setMaintenanceFormBypass(svc.allowAdminBypass !== false);
  };

  const handleToggleServiceDirectly = async (svc: SystemServiceItem, targetStatus: 'RUNNING' | 'MAINTENANCE') => {
    try {
      setTogglingServiceId(svc.id);
      const updated = await SystemServiceAPI.toggleMaintenance(svc.id, {
        status: targetStatus,
        maintenanceMessage: svc.maintenanceMessage || getDefaultMaintenanceMessage(svc),
        estimatedEndTime: svc.estimatedEndTime || '',
        allowAdminBypass: svc.allowAdminBypass !== false
      });

      setServices(prev => prev.map(s => s.id === svc.id ? { ...s, ...updated } : s));
      const msg = targetStatus === 'RUNNING' 
        ? `Đã kết thúc bảo trì và mở lại ${svc.name}. Người dùng hiện có thể truy cập bình thường.` 
        : `Đã kích hoạt chế độ bảo trì cho ${svc.name}.`;
      setServiceToast(msg);
      setTimeout(() => setServiceToast(''), 4000);
    } catch (err: any) {
      alert('Không thể cập nhật trạng thái dịch vụ: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setTogglingServiceId(null);
    }
  };

  const handleSaveMaintenanceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForMaintenance) return;

    try {
      setIsUpdatingService(true);
      const updated = await SystemServiceAPI.toggleMaintenance(selectedServiceForMaintenance.id, {
        status: maintenanceFormStatus,
        maintenanceMessage: maintenanceFormMessage.trim(),
        estimatedEndTime: maintenanceFormEta.trim(),
        allowAdminBypass: maintenanceFormBypass
      });

      setServices(prev => prev.map(s => s.id === selectedServiceForMaintenance.id ? { ...s, ...updated } : s));
      setSelectedServiceForMaintenance(null);
      setServiceToast(`Đã lưu thiết lập dịch vụ ${selectedServiceForMaintenance.name} thành công.`);
      setTimeout(() => setServiceToast(''), 4000);
    } catch (err: any) {
      alert('Không thể lưu cấu hình bảo trì: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsUpdatingService(false);
    }
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

  // Filter courses by search, active topic, and publication status
  const filteredCourses = courses.filter(c => {
    const topic = getCourseTopic(c);
    const matchesSearch = 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTopic = selectedTopic === 'ALL' || topic === selectedTopic;
    const isDraft = c.status === 'draft';
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'published' && !isDraft) ||
      (statusFilter === 'draft' && isDraft);

    return matchesSearch && matchesTopic && matchesStatus;
  });

  // Calculate course counts
  const publishedCount = courses.filter(c => c.status !== 'draft').length;
  const draftCount = courses.filter(c => c.status === 'draft').length;

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
                          ? 'bg-orange-50/90 text-orange-900 font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Thanh tìm kiếm */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm khóa học theo tên môn học, mã môn (vd: PROG101, ENG101, DCK101, GIT101)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Nút Thêm khóa học */}
                <button
                  onClick={() => {
                    if (showAddCourse) {
                      setShowAddCourse(false);
                    } else {
                      handleStartAddCourse(selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic);
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-sm shadow-orange-600/20 shrink-0 cursor-pointer active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddCourse ? 'Đóng Biểu Mẫu' : 'Thêm khóa học'}</span>
                </button>
              </div>

              {/* -------------------------------------------------------- */}
              {/* ROW 2: 4 CHỦ ĐỀ WIREFRAME: Lập trình | Tiếng Anh | Docker | Git & Github */}
              {/* -------------------------------------------------------- */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {COURSE_TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = selectedTopic === topic.id;
                  const count = topicCounts[topic.id] || 0;

                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                          : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-orange-600 border border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-orange-600'}`} />
                        <span className="truncate">{topic.name}</span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ml-2 shrink-0 ${
                        isSelected ? 'bg-orange-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 2-STEP COURSE CREATION WIZARD */}
              {showAddCourse && (
                <div className="p-6 rounded-3xl bg-white border-2 border-orange-200 shadow-xl shadow-orange-600/5 space-y-6 animate-in fade-in slide-in-from-top-3 duration-200">
                  {/* Wizard Header & Stepper */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">
                          Thêm Khóa Học Mới
                        </h3>
                        <p className="text-xs text-slate-400">Điền thông tin và thiết lập chương trình học</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Step Indicator */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setCourseStep(1)}
                          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            courseStep === 1 
                              ? 'bg-white text-orange-600 shadow-xs' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <span>1. Điền thông tin</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!courseCode.trim() || !courseName.trim()) {
                              setFormError('Vui lòng điền Mã và Tên môn học trước khi sang bước thiết lập chương trình.');
                              return;
                            }
                            setFormError('');
                            setCourseStep(2);
                          }}
                          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                            courseStep === 2 
                              ? 'bg-white text-orange-600 shadow-xs' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <span>2. Chương & Bài giảng</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAddCourse(false)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* STEP 1: ĐIỀN THÔNG TIN & PHÂN GÓI */}
                  {courseStep === 1 && (
                    <form onSubmit={handleNextToStep2} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="font-bold text-slate-700 flex items-center gap-1.5">
                              <span>Mã Môn Học</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                Tự động sinh
                              </span>
                              <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setCourseCode(generateRandomCourseCode(courseTopic, courses))}
                              className="text-[11px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                              title="Tạo mã ngẫu nhiên khác"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Đổi mã</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            value={courseCode}
                            readOnly
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold cursor-not-allowed select-all focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1.5">
                            Chủ Đề (Topic) <span className="text-rose-500">*</span>:
                          </label>
                          <select
                            value={courseTopic}
                            onChange={(e) => {
                              const newTopic = e.target.value;
                              setCourseTopic(newTopic);
                              setCourseCode(generateRandomCourseCode(newTopic, courses));
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold cursor-pointer"
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
                            placeholder="Ví dụ: Lập trình TypeScript Nâng cao, Docker & Kubernetes Thực chiến..."
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-bold text-slate-700 mb-1.5">Mô tả tóm tắt nội dung môn học:</label>
                          <textarea
                            rows={2}
                            placeholder="Mục tiêu kiến thức, tài liệu giáo trình và chuẩn đầu ra..."
                            value={courseDesc}
                            onChange={(e) => setCourseDesc(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
                          />
                        </div>
                      </div>

                      {/* PHÂN GÓI TÀI KHOẢN (FREE / PRO) */}
                      <div className="pt-3 border-t border-slate-100">
                        <label className="block font-bold text-slate-800 text-xs mb-1">
                          Phân Gói Quyền Truy Cập (Tài khoản FREE hay PRO) <span className="text-rose-500">*</span>:
                        </label>
                        <p className="text-[11px] text-slate-400 mb-3">
                          Khóa học này có dành cho tài khoản miễn phí (FREE) học tập không, hay chỉ dành riêng cho hội viên PRO?
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Option FREE */}
                          <div
                            onClick={() => setCourseIsFreeTier(true)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                              courseIsFreeTier
                                ? 'border-emerald-500 bg-emerald-50/50 shadow-sm shadow-emerald-500/10'
                                : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border mt-0.5 shrink-0 ${
                              courseIsFreeTier ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {courseIsFreeTier && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">🟢 Mở cho Gói Miễn Phí (FREE)</span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                  Tất cả học viên
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Cho phép mọi tài khoản học viên (cả FREE và PRO) đều có thể xem môn học, tải tài liệu và làm bài luyện thi.
                              </p>
                            </div>
                          </div>

                          {/* Option PRO */}
                          <div
                            onClick={() => setCourseIsFreeTier(false)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                              !courseIsFreeTier
                                ? 'border-amber-500 bg-amber-50/50 shadow-sm shadow-amber-500/10'
                                : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border mt-0.5 shrink-0 ${
                              !courseIsFreeTier ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {!courseIsFreeTier && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">👑 Chỉ Dành Cho Gói PRO</span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                  Hội viên PRO VIP
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Khóa học chuyên sâu chỉ dành cho tài khoản nâng cấp PRO. Học viên miễn phí sẽ thấy biểu tượng khóa và yêu cầu nâng cấp.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setShowAddCourse(false)}
                          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                        >
                          <span>Tiếp tục: Chương & Bài giảng</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* STEP 2: NẠP TÀI LIỆU CHO KHÓA HỌC */}
                  {courseStep === 2 && (
                    <div className="space-y-5">
                      {/* Summary Banner */}
                      <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold bg-white text-orange-700 px-2.5 py-1 rounded-lg border border-orange-200">
                            {courseCode}
                          </span>
                          <span className="font-bold text-slate-900">{courseName}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-medium">{courseTopic}</span>
                        </div>
                        <div>
                          {courseIsFreeTier ? (
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Gói FREE (Mở rộng)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              <Crown className="w-3 h-3 text-amber-600" />
                              <span>Gói PRO (Chuyên sâu)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Curriculum Header */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-orange-600" />
                            <h4 className="font-bold text-sm text-slate-900">
                              Cấu Trúc Chương Trình Bài Giảng
                            </h4>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                              {newCourseChapters.length} chương • {newCourseChapters.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0)} bài học
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Khởi tạo danh sách chương và bài học. Sau khi tạo khóa học, bạn có thể click <strong>Soạn bài</strong> để viết nội dung bằng cách thêm các khối (đoạn văn, tiêu đề, khung bản lề, ảnh từ máy tính, video, code).
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddNewCourseChapter}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Thêm chương mới</span>
                        </button>
                      </div>

                      {/* Chapters & Lessons List */}
                      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                        {newCourseChapters.map((chapter, chIdx) => (
                          <div
                            key={chapter.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-all"
                          >
                            {/* Chapter Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-7 h-7 rounded-lg bg-orange-100/80 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                                  {chIdx + 1}
                                </span>

                                <input
                                  type="text"
                                  value={chapter.title}
                                  onChange={(e) => handleUpdateNewCourseChapterTitle(chapter.id, e.target.value)}
                                  placeholder={`Tên chương ${chIdx + 1}...`}
                                  className="px-3 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-900 focus:outline-none flex-1 max-w-lg transition shadow-2xs"
                                />

                                <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                  {chapter.lessons?.length || 0} bài học
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAddNewCourseLesson(chapter.id)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-600 hover:text-white transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Thêm bài học</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteNewCourseChapter(chapter.id)}
                                  disabled={newCourseChapters.length <= 1}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Xóa chương này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Lessons inside chapter */}
                            <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-orange-100">
                              {(chapter.lessons || []).map((lesson, lIdx) => (
                                <div
                                  key={lesson.id}
                                  className="p-3 rounded-xl bg-slate-50/80 hover:bg-orange-50/30 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                                >
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                      {lIdx + 1}
                                    </div>
                                    <input
                                      type="text"
                                      value={lesson.title}
                                      onChange={(e) => handleUpdateNewCourseLessonTitle(chapter.id, lesson.id, e.target.value)}
                                      placeholder={`Tên bài học ${lIdx + 1}...`}
                                      className="px-2.5 py-1 bg-white border border-slate-200 focus:border-orange-500 rounded-lg text-xs font-bold text-slate-800 focus:outline-none flex-1 max-w-md transition shadow-2xs"
                                    />
                                    <div className="flex items-center gap-1 shrink-0 text-slate-400">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      <input
                                        type="number"
                                        min={1}
                                        max={360}
                                        value={lesson.durationMinutes || 15}
                                        onChange={(e) => handleUpdateNewCourseLessonDuration(chapter.id, lesson.id, Number(e.target.value))}
                                        className="w-14 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-center text-xs font-mono font-semibold"
                                      />
                                      <span className="text-[10px]">phút</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                      <Sparkles className="w-3 h-3 text-indigo-600" />
                                      <span>Soạn bằng khối</span>
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNewCourseLesson(chapter.id, lesson.id)}
                                      disabled={(chapter.lessons || []).length <= 1}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Xóa bài học này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setCourseStep(1)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Quay lại: Thông tin</span>
                        </button>

                        <div className="flex flex-wrap items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => setShowAddCourse(false)}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          >
                            Hủy bỏ
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCreateCourse(false, 'draft')}
                            disabled={isSubmittingCourse}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all shadow-2xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                            title="Lưu khóa học dưới dạng bản nháp (học viên chưa nhìn thấy)"
                          >
                            {isSubmittingCourse ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FileEdit className="w-4 h-4 text-amber-600" />
                            )}
                            <span>Lưu bản nháp</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCreateCourse(true, 'draft')}
                            disabled={isSubmittingCourse}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                            title="Lưu bản nháp và chuyển ngay vào màn hình soạn thảo bài giảng đầu tiên bằng khối"
                          >
                            {isSubmittingCourse ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Edit3 className="w-4 h-4 text-orange-400" />
                            )}
                            <span>Lưu nháp & Soạn bài</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCreateCourse(false, 'published')}
                            disabled={isSubmittingCourse}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                            title="Xuất bản khóa học công khai ngay bây giờ để học viên nhìn thấy"
                          >
                            {isSubmittingCourse ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Globe className="w-4 h-4" />
                            )}
                            <span>Xuất bản khóa học</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* ROW 3: CÁC KHÓA HỌC THEO TỪNG CHỦ ĐỀ & TRẠNG THÁI */}
              {/* -------------------------------------------------------- */}
              <div className="space-y-4">
                {/* Status Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider pl-1">Trạng thái:</span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                        statusFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Tất cả ({courses.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('published')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
                        statusFilter === 'published'
                          ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Đã xuất bản ({publishedCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('draft')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
                        statusFilter === 'draft'
                          ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <FileEdit className="w-3.5 h-3.5 text-amber-500" />
                      <span>Bản nháp ({draftCount})</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 italic pr-1">
                    * Bản nháp chỉ hiển thị với Admin, học viên chỉ thấy các khóa đã xuất bản.
                  </span>
                </div>

                {/* Empty State */}
                {filteredCourses.length === 0 ? (
                  <div className="p-12 rounded-3xl border border-dashed border-slate-300 bg-white text-center space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="font-bold text-slate-700 text-sm">
                      {searchQuery 
                        ? 'Không tìm thấy khóa học nào phù hợp với từ khóa' 
                        : `Chưa có khóa học nào thuộc bộ lọc hiện tại`}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Nhấp vào nút "Thêm khóa học" ở trên để bổ sung môn học vào danh mục này.
                    </p>
                    <button
                      onClick={() => handleStartAddCourse(selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic)}
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
                      const isProTier = crs.isFreeTier === false || crs.tierRequired === 'PRO';
                      const attachedDocsCount = crs.documentIds ? crs.documentIds.length : 0;
                      const attachedVideosCount = crs.videoIds ? crs.videoIds.length : 0;
                      const totalMaterials = attachedDocsCount + attachedVideosCount;

                      return (
                        <div 
                          key={crs.id}
                          className="group bg-white rounded-2xl border border-slate-200/90 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5 transition-all p-5 flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            {/* Card Header: Code, Tier Badge & Topic Tag */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-black text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-lg tracking-wider">
                                  {crs.code}
                                </span>

                                {/* Tier Badge: FREE vs PRO */}
                                {isProTier ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                    <Crown className="w-3 h-3 text-amber-600" />
                                    <span>Gói PRO</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Gói FREE</span>
                                  </span>
                                )}

                                {/* Status Badge: Draft vs Published */}
                                {crs.status === 'draft' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200" title="Khóa học đang ở dạng Bản nháp và chỉ hiển thị với Admin">
                                    <FileEdit className="w-3 h-3 text-amber-600" />
                                    <span>Bản nháp</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200" title="Khóa học đã xuất bản công khai cho học viên">
                                    <Globe className="w-3 h-3 text-emerald-600" />
                                    <span>Đã xuất bản</span>
                                  </span>
                                )}
                              </div>

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

                          {/* Card Footer: Status Action & Details */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handleToggleCourseStatus(crs.id, crs.status)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                                crs.status === 'draft'
                                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200'
                                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title={crs.status === 'draft' ? 'Xuất bản khóa học này cho học viên nhìn thấy' : 'Chuyển về bản nháp (học viên sẽ không thấy)'}
                            >
                              {crs.status === 'draft' ? (
                                <>
                                  <Globe className="w-3.5 h-3.5" />
                                  <span>Xuất bản</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Về nháp</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenDocModal(crs)}
                              className="px-4 py-1.5 rounded-xl text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                              title="Xem chi tiết và quản lý khóa học"
                            >
                              <span>Chi tiết</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick Add Card at the end */}
                    <button
                      onClick={() => handleStartAddCourse(selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic)}
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tài khoản theo mã (OE-0001...), tên tài khoản hoặc email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium shadow-2xs"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
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
                    className="px-3 py-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 font-bold focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">Tất cả vai trò</option>
                    <option value="USER">User (Học viên)</option>
                    <option value="ADMIN">Admin (Quản trị)</option>
                  </select>

                  <select
                    value={userTierFilter}
                    onChange={(e) => setUserTierFilter(e.target.value as any)}
                    className="px-3 py-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 font-bold focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">Tất cả gói</option>
                    <option value="FREE">Gói Free</option>
                    <option value="PRO">Gói Pro</option>
                  </select>

                  <button
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-sm shadow-orange-600/20 shrink-0 cursor-pointer active:scale-[0.98]"
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
                    <option value="RUNNING">Đang hoạt động</option>
                    <option value="MAINTENANCE">Đang bảo trì</option>
                  </select>

                  <button
                    onClick={async () => {
                      await loadAllData();
                      setServiceToast('Đã làm mới trạng thái các dịch vụ hệ thống.');
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

              {/* Chú thích nguyên tắc vận hành bảo trì */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">
                    Cơ chế bảo trì hệ thống chuẩn (Graceful Maintenance Mode)
                  </p>
                  <p className="text-amber-800/90 leading-relaxed text-[11px]">
                    Khi bật chế độ bảo trì cho một dịch vụ (ví dụ Payment, Product, Cart), hệ thống sẽ <strong>tạm ngưng tiếp nhận giao dịch từ học viên</strong> và hiển thị thông báo rõ ràng, tránh để học viên gặp lỗi 502/treo tiền. Trong lúc này, tài khoản <strong>Quản trị viên (Admin) vẫn có quyền thử nghiệm</strong> để kiểm tra xem lỗi đã được khắc phục hoàn toàn hay chưa trước khi mở lại cho học viên.
                  </p>
                </div>
              </div>

              {/* BẢNG DỊCH VỤ HỆ THỐNG */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-4 px-6">Dịch vụ</th>
                      <th className="py-4 px-6 w-48">Trạng thái</th>
                      <th className="py-4 px-6 text-right w-56 whitespace-nowrap">Thao tác</th>
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
                        const ServiceIcon = svc.icon || ShieldCheck;
                        const isRunning = svc.status === 'RUNNING';
                        const isToggling = togglingServiceId === svc.id;

                        return (
                          <tr key={svc.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* 1. CỘT DỊCH VỤ */}
                            <td className="py-4 px-6">
                              <div className="flex items-start gap-3.5">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border mt-0.5 ${
                                  isRunning 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200 shadow-xs'
                                }`}>
                                  <ServiceIcon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-slate-900 text-sm">{svc.name}</span>
                                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                      Port {svc.port}
                                    </span>
                                    <span className="font-mono text-[10px] font-semibold text-slate-400">
                                      key: {svc.key}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">{svc.description}</p>

                                  {/* Thông báo chi tiết khi đang bảo trì */}
                                  {!isRunning && (
                                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs space-y-1 animate-in fade-in">
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Thông báo học viên nhìn thấy:</span>
                                        </div>
                                        {svc.estimatedEndTime && (
                                          <span className="font-semibold text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                            Dự kiến mở lại: {svc.estimatedEndTime}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-amber-900 font-medium italic">
                                        "{svc.maintenanceMessage || 'Dịch vụ đang trong thời gian bảo trì kỹ thuật định kỳ.'}"
                                      </p>
                                      {svc.allowAdminBypass !== false && (
                                        <div className="text-[10px] font-bold text-emerald-700 pt-0.5 flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          <span>Admin Bypass được bật: Quản trị viên vẫn có quyền gửi request test bình thường.</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* 2. CỘT TRẠNG THÁI */}
                            <td className="py-4 px-6 align-top pt-5">
                              {isRunning ? (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Đang hoạt động</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                  <span>Đang bảo trì</span>
                                </span>
                              )}
                            </td>

                            {/* 3. CỘT THAO TÁC */}
                            <td className="py-4 px-6 text-right whitespace-nowrap align-top pt-4">
                              <div className="flex items-center justify-end gap-2">
                                {isRunning ? (
                                  <button
                                    onClick={() => handleOpenMaintenanceModal(svc, 'MAINTENANCE')}
                                    disabled={isToggling}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 hover:border-amber-600 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                    title="Tạm ngưng nhận request từ học viên và bật thông báo bảo trì"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span>Bật bảo trì</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleOpenMaintenanceModal(svc)}
                                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer active:scale-95"
                                      title="Chỉnh sửa thông điệp hoặc thời gian dự kiến bảo trì"
                                    >
                                      <Settings2 className="w-3.5 h-3.5" />
                                      <span>Sửa thông báo</span>
                                    </button>

                                    <button
                                      onClick={() => handleToggleServiceDirectly(svc, 'RUNNING')}
                                      disabled={isToggling}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                                      title="Kết thúc bảo trì và mở lại dịch vụ công khai cho học viên"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>{isToggling ? 'Đang mở...' : 'Mở lại dịch vụ'}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {/* ======================================================== */}
              {/* MODAL THIẾT LẬP BẢO TRÌ DỊCH VỤ (MAINTENANCE SETTINGS MODAL) */}
              {/* ======================================================== */}
              {selectedServiceForMaintenance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
                  <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                    
                    {/* Modal Header */}
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900">
                            Thiết Lập Bảo Trì: {selectedServiceForMaintenance.name}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Port: {selectedServiceForMaintenance.port} • Phân hệ: {selectedServiceForMaintenance.key}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedServiceForMaintenance(null)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Form */}
                    <form onSubmit={handleSaveMaintenanceSettings} className="p-6 space-y-4">
                      
                      {/* Chọn trạng thái */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Trạng thái dịch vụ</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMaintenanceFormStatus('RUNNING')}
                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                              maintenanceFormStatus === 'RUNNING'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            <span>Hoạt động bình thường</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setMaintenanceFormStatus('MAINTENANCE')}
                            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                              maintenanceFormStatus === 'MAINTENANCE'
                                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                            <span>Chế độ bảo trì</span>
                          </button>
                        </div>
                      </div>

                      {/* Thông điệp bảo trì */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>Thông báo hiển thị cho học viên</span>
                          <span className="text-[10px] text-slate-400 font-normal">Hiển thị lịch sự trên giao diện</span>
                        </label>
                        <textarea
                          rows={3}
                          value={maintenanceFormMessage}
                          onChange={(e) => setMaintenanceFormMessage(e.target.value)}
                          placeholder="Nhập thông điệp bảo trì thân thiện..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition leading-relaxed"
                        />
                      </div>

                      {/* Thời gian dự kiến */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Thời gian dự kiến hoàn thành (Tùy chọn)
                        </label>
                        <div className="relative">
                          <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={maintenanceFormEta}
                            onChange={(e) => setMaintenanceFormEta(e.target.value)}
                            placeholder="Ví dụ: 16:30, Sau 45 phút, Hôm nay 18:00..."
                            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
                          />
                        </div>
                      </div>

                      {/* Cho phép Admin Bypass */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <label htmlFor="bypass-toggle" className="text-xs font-bold text-slate-800 cursor-pointer block">
                            Cho phép Quản trị viên (Admin) thử nghiệm trong lúc bảo trì
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Tài khoản Admin có quyền gọi API để test sửa lỗi mà không bị chặn.
                          </p>
                        </div>
                        <input
                          id="bypass-toggle"
                          type="checkbox"
                          checked={maintenanceFormBypass}
                          onChange={(e) => setMaintenanceFormBypass(e.target.checked)}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 cursor-pointer shrink-0"
                        />
                      </div>

                      {/* Live Preview Card */}
                      {maintenanceFormStatus === 'MAINTENANCE' && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-200 text-amber-950 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem trước giao diện học viên</span>
                          </div>
                          <p className="text-xs text-amber-900 font-medium italic">
                            "{maintenanceFormMessage || 'Dịch vụ đang trong chế độ bảo trì kỹ thuật định kỳ.'}"
                          </p>
                          {maintenanceFormEta && (
                            <p className="text-[11px] text-amber-800 font-bold">
                              ⏳ Dự kiến mở lại: {maintenanceFormEta}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Modal Footer Buttons */}
                      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedServiceForMaintenance(null)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingService}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                        >
                          {isUpdatingService ? 'Đang lưu...' : 'Lưu & Áp dụng ngay'}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CẤU HÌNH HỆ THỐNG, AI & CLOUDFLARE R2 */}
          {/* ======================================================== */}
          {activeTab === 'config' && (
            <div className="space-y-6 w-full">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <SlidersHorizontal className="w-6 h-6 text-orange-600" />
                    <span>Cấu Hình Hệ Thống, Trí Tuệ Nhân Tạo & Lưu Trữ R2</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Thiết lập trực tiếp Google Gemini API Key, OpenAI API Key và tài khoản Cloudflare R2 với nút kiểm tra kết nối thời gian thực.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAllConfig}
                  disabled={isSavingConfig}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isSavingConfig ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu Toàn Bộ Cấu Hình</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toast message if saved */}
              {saveConfigMsg && (
                <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
                  saveConfigMsg.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {saveConfigMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{saveConfigMsg.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSaveConfigMsg(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ========================================== */}
              {/* CARD 1: CẤU HÌNH TRÍ TUỆ NHÂN TẠO (AI) */}
              {/* ========================================== */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs shrink-0">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">1. Động Cơ Trí Tuệ Nhân Tạo (AI Engine)</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          Khảo Thí Chuẩn Bloom
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kết nối Google Gemini hoặc OpenAI để tự động phân tích ma trận kiến thức và sinh đề thi trắc nghiệm & tự luận.
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {configGeminiKey ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã nạp Gemini Key</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Chưa có Gemini Key</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Select AI Model */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Mô Hình Nền Tảng (Active AI Model)</span>
                      <span className="text-[11px] text-orange-600 font-semibold">Tối ưu cho Bloom Taxonomy</span>
                    </label>
                    <select
                      value={configActiveModel}
                      onChange={(e) => setConfigActiveModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition cursor-pointer"
                    >
                      <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Khuyến nghị - Nhanh, suy luận mạnh, chuẩn Bloom)</option>
                      <option value="gemini-3.1-flash-lite-preview">Google Gemini 3.1 Flash Lite (Siêu tiết kiệm token, tốc độ phản hồi cực nhanh)</option>
                      <option value="gemini-flash-latest">Google Gemini Flash Latest (Bản cập nhật tính năng mới nhất)</option>
                      <option value="gpt-4o-mini">OpenAI GPT-4o Mini (Mô hình nhỏ gọn của OpenAI)</option>
                      <option value="gpt-4o">OpenAI GPT-4o (Mô hình cao cấp đa phương thức của OpenAI)</option>
                    </select>
                  </div>

                  {/* Google Gemini API Key Input */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-orange-600" />
                        <span>Google Gemini API Key</span>
                      </label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-orange-600 hover:underline flex items-center gap-1"
                      >
                        <span>Lấy API Key miễn phí tại Google AI Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showGeminiKey ? 'text' : 'password'}
                        placeholder="Nhập khóa API Gemini (ví dụ: AIzaSy...)"
                        value={configGeminiKey}
                        onChange={(e) => setConfigGeminiKey(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showGeminiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                      >
                        {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* OpenAI API Key Input (Optional) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-slate-500" />
                        <span>OpenAI API Key (Tùy chọn phụ trợ)</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Chỉ cần nếu chọn mô hình GPT-4o</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showOpenAiKey ? 'text' : 'password'}
                        placeholder="Nhập OpenAI API Key (sk-proj-...)"
                        value={configOpenAiKey}
                        onChange={(e) => setConfigOpenAiKey(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showOpenAiKey ? 'Ẩn khóa' : 'Hiện khóa'}
                      >
                        {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Test Feedback */}
                {aiTestResult && (
                  <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                    aiTestResult.success 
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}>
                    {aiTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium">{aiTestResult.message}</span>
                  </div>
                )}

                {/* Action Buttons for AI */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleTestAI('gemini')}
                    disabled={isTestingAI || !configGeminiKey}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-40"
                  >
                    {isTestingAI ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-600" />
                        <span>Đang kiểm tra kết nối Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-orange-600 fill-current" />
                        <span>Kiểm tra kết nối Gemini</span>
                      </>
                    )}
                  </button>

                  {configOpenAiKey && (
                    <button
                      type="button"
                      onClick={() => handleTestAI('openai')}
                      disabled={isTestingAI}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-40"
                    >
                      <Zap className="w-3.5 h-3.5 text-slate-500 fill-current" />
                      <span>Kiểm tra kết nối OpenAI</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAllConfig}
                    disabled={isSavingConfig}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50 ml-auto"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Cấu Hình AI</span>
                  </button>
                </div>
              </div>

              {/* ========================================== */}
              {/* CARD 2: CẤU HÌNH LƯU TRỮ CLOUDFLARE R2 */}
              {/* ========================================== */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">2. Lưu Trữ Video Cloudflare R2 (S3-Compatible)</h3>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          Băng Thông Tải Về Miễn Phí 0đ
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Lưu trữ và phát trực tuyến video bài giảng dung lượng lớn qua mạng phân phối CDN toàn cầu của Cloudflare.
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {hasR2Configured ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Đã cấu hình Cloudflare R2</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        <span>Đang dùng Local Fallback (Stream cục bộ)</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Account ID */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Cloudflare Account ID</span>
                      <span className="text-[10px] text-slate-400 font-mono">CLOUDFLARE_R2_ACCOUNT_ID</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 8a7b9c6d5e4f3a2b1c0d9e8f7a6b5c4d"
                      value={configR2AccountId}
                      onChange={(e) => setConfigR2AccountId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Bucket Name */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Tên Bucket (Bucket Name)</span>
                      <span className="text-[10px] text-slate-400 font-mono">CLOUDFLARE_R2_BUCKET_NAME</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ownedu-videos"
                      value={configR2BucketName}
                      onChange={(e) => setConfigR2BucketName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Access Key ID */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>R2 Access Key ID</span>
                      <span className="text-[10px] text-slate-400 font-mono">CLOUDFLARE_R2_ACCESS_KEY_ID</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8"
                      value={configR2AccessKeyId}
                      onChange={(e) => setConfigR2AccessKeyId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Secret Access Key */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>R2 Secret Access Key</span>
                      <span className="text-[10px] text-slate-400 font-mono">CLOUDFLARE_R2_SECRET_ACCESS_KEY</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showR2Secret ? 'text' : 'password'}
                        placeholder="Nhập Secret Access Key bí mật của R2..."
                        value={configR2SecretAccessKey}
                        onChange={(e) => setConfigR2SecretAccessKey(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowR2Secret(!showR2Secret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showR2Secret ? 'Ẩn khóa' : 'Hiện khóa'}
                      >
                        {showR2Secret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Public Domain / Custom Domain (Optional) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Tên miền công khai / Custom Domain (Tùy chọn)</span>
                      <span className="text-[10px] text-slate-400 font-mono">CLOUDFLARE_R2_PUBLIC_DOMAIN</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: https://pub-xxxxxxxxxx.r2.dev hoặc https://media.ownedu.vn"
                      value={configR2PublicDomain}
                      onChange={(e) => setConfigR2PublicDomain(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                    <p className="text-[11px] text-slate-400">
                      Nếu đã kích hoạt tính năng "R2.dev subdomain" hoặc gắn Custom Domain trong Cloudflare, hãy điền vào đây để video được phân phối trực tiếp qua CDN.
                    </p>
                  </div>
                </div>

                {/* R2 Test Feedback */}
                {r2TestResult && (
                  <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${
                    r2TestResult.success 
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}>
                    {r2TestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-medium">{r2TestResult.message}</span>
                  </div>
                )}

                {/* Action Buttons for R2 */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestR2}
                    disabled={isTestingR2 || !configR2AccountId || !configR2AccessKeyId || !configR2SecretAccessKey}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-40"
                  >
                    {isTestingR2 ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Đang kiểm tra kết nối Cloudflare R2...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-indigo-600 fill-current" />
                        <span>Kiểm tra kết nối Cloudflare R2</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAllConfig}
                    disabled={isSavingConfig}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50 ml-auto"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Cấu Hình R2</span>
                  </button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p>
                  <strong>Bảo mật Quản trị:</strong> Mọi khóa API và thông tin xác thực sau khi lưu sẽ được tự động đồng bộ vào tệp <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono font-bold text-slate-800">.env</code> trên máy chủ. Học viên không thể xem hoặc truy cập các khóa này.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Course Documents Management Modal (For existing courses) */}
      {selectedCourseForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-slate-900 truncate">
                    Chi Tiết & Quản Lý Giáo Trình Khóa Học
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                    <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      {selectedCourseForDocs.code}
                    </span>
                    <span className="font-bold text-slate-800 truncate max-w-[260px]">{selectedCourseForDocs.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {selectedCourseForDocs.topic}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedCourseForDocs.isFreeTier !== false && selectedCourseForDocs.tierRequired !== 'PRO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedCourseForDocs.isFreeTier !== false && selectedCourseForDocs.tierRequired !== 'PRO' ? 'Gói FREE' : 'Gói PRO'}
                    </span>
                    {selectedCourseForDocs.status === 'draft' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <FileEdit className="w-3 h-3 text-amber-600" />
                        <span>Bản nháp (Đang ẩn)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>Đã xuất bản (Công khai)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseForDocs(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Material Tabs Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setEditMaterialTab('CURRICULUM')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  editMaterialTab === 'CURRICULUM'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  Chương trình bài giảng ({editCourseChapters.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0)} bài)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditMaterialTab('DOCUMENTS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  editMaterialTab === 'DOCUMENTS'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tài liệu tham khảo ({editCourseDocIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setEditMaterialTab('VIDEOS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                  editMaterialTab === 'VIDEOS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video kho ({editCourseVideoIds.length})</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
              {/* TAB 0: CURRICULUM & HYPERTEXT LESSONS */}
              {editMaterialTab === 'CURRICULUM' && (
                <div className="space-y-4">
                  {/* Top Action Bar */}
                  <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-orange-600" />
                        <span>Quản lý chương & Bài giảng tương tác</span>
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Soạn bài học dạng hypertext sinh động: đóng khung điểm then chốt, chèn code, ảnh và video.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm chương mới</span>
                    </button>
                  </div>

                  {/* Chapters List */}
                  {editCourseChapters.length === 0 ? (
                    <div className="p-10 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3 bg-slate-50/40">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-orange-600 mx-auto shadow-xs">
                        <FolderPlus className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-800">Khóa học chưa có chương mục nào</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Hãy thêm chương đầu tiên để bắt đầu phân loại và soạn các bài giảng tương tác cho học viên.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddChapter}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-xs cursor-pointer"
                      >
                        + Tạo Chương Đầu Tiên
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editCourseChapters.map((chapter, chIdx) => (
                        <div
                          key={chapter.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 transition-all hover:border-slate-300"
                        >
                          {/* Chapter Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className="w-7 h-7 rounded-lg bg-orange-100/70 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {chIdx + 1}
                              </span>

                              {editingChapterId === chapter.id ? (
                                <div className="flex items-center gap-1.5 flex-1 max-w-md">
                                  <input
                                    type="text"
                                    value={editingChapterTitle}
                                    onChange={(e) => setEditingChapterTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveChapterTitle(chapter.id)}
                                    autoFocus
                                    className="px-2.5 py-1 bg-white border border-orange-400 rounded-lg text-xs font-bold text-slate-900 focus:outline-none w-full shadow-2xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveChapterTitle(chapter.id)}
                                    className="px-2.5 py-1 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-500 cursor-pointer"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingChapterId(null)}
                                    className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs hover:bg-slate-200 cursor-pointer"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <h4 className="font-bold text-sm text-slate-900 truncate">
                                    {chapter.title}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditChapter(chapter)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                    title="Đổi tên chương"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}

                              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                {chapter.lessons?.length || 0} bài học
                              </span>
                            </div>

                            {/* Chapter Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenAddLesson(chapter.id, chapter.title)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-600 hover:text-white transition flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm bài học</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteChapter(chapter.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Xóa toàn bộ chương này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Lessons inside chapter */}
                          {(!chapter.lessons || chapter.lessons.length === 0) ? (
                            <div className="py-3 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                              Chưa có bài học trong chương này. Nhấp <strong className="text-orange-600 cursor-pointer" onClick={() => handleOpenAddLesson(chapter.id, chapter.title)}>+ Thêm bài học</strong> để bắt đầu soạn bài giảng.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {chapter.lessons.map((lesson, lIdx) => (
                                <div
                                  key={lesson.id}
                                  className="p-3 rounded-xl bg-slate-50/70 hover:bg-orange-50/20 border border-slate-200/90 flex items-center justify-between gap-3 transition group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                      {lIdx + 1}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-xs text-slate-800 truncate group-hover:text-orange-700 transition-colors">
                                        {lesson.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                        <span>{lesson.durationMinutes || 15} phút</span>
                                        {lesson.videoUrl && (
                                          <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                                            &bull; Có video
                                          </span>
                                        )}
                                        {lesson.content && lesson.content.includes(':::keypoint') && (
                                          <span className="text-purple-600 font-semibold flex items-center gap-0.5">
                                            &bull; Khung bản lề
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditLesson(chapter.id, chapter.title, lesson)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-700 bg-orange-50 group-hover:bg-orange-600 group-hover:text-white transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Soạn bài / Xem trước</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLesson(chapter.id, lesson.id)}
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                      title="Xóa bài học này"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* TAB 1: DOCUMENTS */}
              {editMaterialTab === 'DOCUMENTS' && (
                <>
                  {/* Upload New Document */}
                  <div className="p-4 rounded-2xl bg-orange-50/40 border border-orange-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-orange-600" />
                        <span>Nạp tài liệu mới cho khóa học này</span>
                      </span>
                      <span className="text-[11px] text-slate-400">PDF, DOCX, MD</span>
                    </div>
                    <label className="border border-dashed border-orange-300 hover:border-orange-500 bg-white rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition text-center group">
                      <input
                        type="file"
                        accept=".pdf,.docx,.md,.markdown,text/markdown,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={handleUploadDocInEditModal}
                        disabled={isUploadingInEditModal}
                      />
                      {isUploadingInEditModal ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
                      ) : (
                        <FileUp className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                      )}
                      <span className="font-semibold text-slate-700 group-hover:text-orange-600">
                        {isUploadingInEditModal ? 'Đang tải lên...' : 'Nhấp để chọn file tải lên và gán ngay'}
                      </span>
                    </label>
                    {editDocUploadMsg && (
                      <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                        editDocUploadMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {editDocUploadMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{editDocUploadMsg.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Select Existing Documents */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Chọn từ kho tài liệu hệ thống ({documents.length} tài liệu):
                      </span>
                      <span className="text-[11px] text-slate-400">Tích chọn để liên kết</span>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Lọc tài liệu theo tên..."
                        value={editDocSearch}
                        onChange={(e) => setEditDocSearch(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      {editDocSearch && (
                        <button
                          type="button"
                          onClick={() => setEditDocSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                      {documents
                        .filter(d => d.filename.toLowerCase().includes(editDocSearch.toLowerCase()))
                        .map(doc => {
                          const isChecked = editCourseDocIds.includes(doc.id);
                          return (
                            <div
                              key={doc.id}
                              onClick={() => toggleDocInEditModal(doc.id)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                                isChecked ? 'bg-orange-50/80 border-orange-300' : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                  isChecked ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <FileText className={`w-3.5 h-3.5 shrink-0 ${isChecked ? 'text-orange-600' : 'text-slate-400'}`} />
                                <span className="font-semibold text-slate-800 truncate text-[11px]">{doc.filename}</span>
                              </div>
                              <span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">
                                {doc.fileType}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Currently Attached Docs List */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="font-bold text-slate-800 block">
                      Tài liệu đang gán ({editCourseDocIds.length}):
                    </span>
                    {editCourseDocIds.length === 0 ? (
                      <p className="text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
                        ⚠️ Khóa học chưa có tài liệu văn bản nào.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {editCourseDocIds.map(id => {
                          const doc = documents.find(d => d.id === id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700"
                            >
                              <span className="max-w-[170px] truncate">{doc?.filename || id}</span>
                              <button
                                type="button"
                                onClick={() => toggleDocInEditModal(id)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* TAB 2: VIDEOS */}
              {editMaterialTab === 'VIDEOS' && (
                <>
                  {/* Nạp Video Mới cho Khóa học */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-indigo-600" />
                        <span>Nạp video bài giảng mới</span>
                      </span>

                      {/* Mode Switcher */}
                      {(() => {
                        const isEditCourseFree = selectedCourseForDocs?.isFreeTier !== false && selectedCourseForDocs?.tierRequired !== 'PRO';
                        return (
                          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                            <button
                              type="button"
                              disabled={isEditCourseFree}
                              onClick={() => !isEditCourseFree && setEditVideoMode('UPLOAD')}
                              title={isEditCourseFree ? 'Khóa học Free chỉ hỗ trợ gắn link YouTube' : 'Tải file video lên Cloudflare R2'}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                                isEditCourseFree
                                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                  : editVideoMode === 'UPLOAD'
                                    ? 'bg-white text-indigo-700 shadow-xs cursor-pointer'
                                    : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                              }`}
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Tải file lên R2 (Khóa Pro)</span>
                              {isEditCourseFree && <Lock className="w-3 h-3 text-slate-400" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditVideoMode('YOUTUBE')}
                              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                editVideoMode === 'YOUTUBE'
                                  ? 'bg-red-600 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              <Youtube className="w-3.5 h-3.5" />
                              <span>Gắn link YouTube (Khóa Free)</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Informational banner for Free courses */}
                    {selectedCourseForDocs?.isFreeTier !== false && selectedCourseForDocs?.tierRequired !== 'PRO' && (
                      <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                        <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Khóa học Free:</strong> Nút tải file lên Cloudflare R2 đã bị làm mờ & vô hiệu hóa nhằm tối ưu chi phí lưu trữ. Khóa học miễn phí chỉ hỗ trợ gắn link YouTube.
                        </span>
                      </div>
                    )}

                    {/* MODE 1: FILE UPLOAD */}
                    {editVideoMode === 'UPLOAD' ? (
                      <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">Tải tệp video từ máy tính</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                              Tối đa 2GB
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                              FFmpeg H.264
                            </span>
                          </div>
                        </div>

                        <label className="border border-dashed border-indigo-300 hover:border-indigo-500 bg-white rounded-xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition text-center group">
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv"
                            className="hidden"
                            onChange={handleUploadVideoInEditModal}
                            disabled={isUploadingVideoInEditModal}
                          />
                          {isUploadingVideoInEditModal ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : (
                            <Video className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                          )}
                          <span className="font-semibold text-slate-700 group-hover:text-indigo-600">
                            {isUploadingVideoInEditModal ? 'Đang tải lên & nén FFmpeg...' : 'Nhấp để chọn video bài giảng tải lên (tối đa 2GB)'}
                          </span>
                        </label>
                      </div>
                    ) : (
                      /* MODE 2: YOUTUBE EMBED */
                      <div className="space-y-3 bg-red-50/40 p-4 rounded-2xl border border-red-200/80">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                            <Youtube className="w-4 h-4 text-red-600" />
                            <span>Gắn video YouTube (Miễn phí 100% dung lượng, khuyên dùng cho khóa Free)</span>
                          </span>
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded">
                            YouTube Embed
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Đường dẫn video YouTube <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
                              value={editYoutubeUrl}
                              onChange={(e) => setEditYoutubeUrl(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Tên bài giảng hiển thị (Tùy chọn)
                            </label>
                            <input
                              type="text"
                              placeholder="Ví dụ: Bài 1 - Giới thiệu nhập môn"
                              value={editYoutubeTitle}
                              onChange={(e) => setEditYoutubeTitle(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                            />
                          </div>
                        </div>

                        {/* Live Thumbnail Preview */}
                        {extractYoutubeId(editYoutubeUrl) && (
                          <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-red-100">
                            <img
                              src={`https://img.youtube.com/vi/${extractYoutubeId(editYoutubeUrl)}/hqdefault.jpg`}
                              alt="YouTube Preview"
                              className="w-20 h-12 object-cover rounded-lg shadow-xs shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {editYoutubeTitle || `YouTube Video (${extractYoutubeId(editYoutubeUrl)})`}
                              </p>
                              <p className="text-[11px] text-red-600 font-mono">
                                ID: {extractYoutubeId(editYoutubeUrl)} • Tự động nhúng phát trực tiếp trong web
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[11px] text-slate-400">
                            Video phát trực tiếp qua iframe bảo mật, không tốn dung lượng R2 hay CPU máy chủ.
                          </p>
                          <button
                            type="button"
                            onClick={handleAddYoutubeInEditModal}
                            disabled={isAddingEditYoutube || !editYoutubeUrl.trim()}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-sm shadow-red-600/20 transition cursor-pointer disabled:opacity-40"
                          >
                            {isAddingEditYoutube ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>Gắn Video YouTube</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {editVideoUploadMsg && (
                      <div className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                        editVideoUploadMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {editVideoUploadMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{editVideoUploadMsg.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Select from System Videos */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 block">
                      Kho video hệ thống ({videos.length} video):
                    </span>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                      {videos.length === 0 ? (
                        <p className="text-center py-3 text-xs text-slate-400">Chưa có video nào. Hãy tải lên video ở trên.</p>
                      ) : (
                        videos.map(vid => {
                          const isChecked = editCourseVideoIds.includes(vid.id);
                          const isProcessing = vid.status === 'PROCESSING';

                          return (
                            <div
                              key={vid.id}
                              onClick={() => !isProcessing && toggleVideoInEditModal(vid.id)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                                isChecked ? 'bg-indigo-50/80 border-indigo-300' : 'bg-white border-slate-200 hover:border-slate-300'
                              } ${isProcessing ? 'opacity-70' : ''}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                  isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <div className="w-8 h-6 rounded bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                  {vid.thumbnailUrl ? (
                                    <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Video className="w-3 h-3 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-800 truncate text-[11px] block">{vid.title}</span>
                                  {vid.sourceType === 'YOUTUBE' ? (
                                    <span className="text-[9px] font-bold text-red-600 flex items-center gap-0.5">
                                      <Youtube className="w-2.5 h-2.5" />
                                      <span>YouTube (Khóa Free)</span>
                                    </span>
                                  ) : (
                                    vid.compressedSizeBytes ? (
                                      <span className="text-[9px] text-slate-400 font-mono">{(vid.compressedSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                                    ) : null
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isProcessing ? (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                                    Đang nén...
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewVideo(vid);
                                      }}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600"
                                      title="Xem thử"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteVideo(vid.id, e)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                                      title="Xóa video khỏi hệ thống"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {vid.durationSeconds ? `${Math.round(vid.durationSeconds)}s` : ''}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Attached Videos List */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="font-bold text-slate-800 block">
                      Video đang gán ({editCourseVideoIds.length}):
                    </span>
                    {editCourseVideoIds.length === 0 ? (
                      <p className="text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                        Khóa học chưa gắn video bài giảng nào.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {editCourseVideoIds.map(id => {
                          const vid = videos.find(v => v.id === id);
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-medium text-indigo-900"
                            >
                              <Video className="w-3 h-3 text-indigo-600" />
                              <span className="max-w-[170px] truncate">{vid?.title || id}</span>
                              {vid && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewVideo(vid)}
                                  className="text-indigo-400 hover:text-indigo-700"
                                  title="Xem trước"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleVideoInEditModal(id)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (selectedCourseForDocs) {
                    const idToDelete = selectedCourseForDocs.id;
                    setSelectedCourseForDocs(null);
                    handleDeleteCourse(idToDelete);
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                title="Xóa khóa học này khỏi hệ thống"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa khóa học</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedCourseForDocs) return;
                    await handleToggleCourseStatus(selectedCourseForDocs.id, selectedCourseForDocs.status);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 ${
                    selectedCourseForDocs.status === 'draft'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                  title={selectedCourseForDocs.status === 'draft' ? 'Xuất bản khóa học để học viên nhìn thấy' : 'Chuyển về bản nháp để ẩn khỏi học viên'}
                >
                  {selectedCourseForDocs.status === 'draft' ? (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Xuất bản khóa học</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Chuyển về bản nháp</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCourseForDocs(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveCourseDocs}
                  disabled={isUpdatingCourseDocs}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {isUpdatingCourseDocs ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Player Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  previewVideo.sourceType === 'YOUTUBE' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {previewVideo.sourceType === 'YOUTUBE' ? <Youtube className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm text-slate-100 truncate">{previewVideo.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                    {previewVideo.sourceType === 'YOUTUBE' ? (
                      <>
                        <span className="font-mono text-red-400 font-bold">YouTube HD</span>
                        <span>•</span>
                        <span className="text-slate-300 font-mono">ID: {previewVideo.youtubeId}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">Khóa học Free</span>
                      </>
                    ) : (
                      <>
                        {previewVideo.resolution && (
                          <span className="font-mono text-indigo-400 font-bold">{previewVideo.resolution}</span>
                        )}
                        {previewVideo.durationSeconds && (
                          <>
                            <span>•</span>
                            <span>{Math.round(previewVideo.durationSeconds)} giây</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">Codec H.264 Faststart (Khóa Pro)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="bg-black aspect-video flex items-center justify-center relative">
              {previewVideo.sourceType === 'YOUTUBE' || previewVideo.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${previewVideo.youtubeId}?rel=0&modestbranding=1&autoplay=1`}
                  title={previewVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full max-h-[60vh] aspect-video border-0"
                />
              ) : (
                <video
                  src={previewVideo.storageUrl}
                  poster={previewVideo.thumbnailUrl}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[60vh] object-contain"
                />
              )}
            </div>

            {/* Modal Footer with Compression Analytics / YouTube Details */}
            <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              {previewVideo.sourceType === 'YOUTUBE' ? (
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-red-950/80 text-red-300 font-bold border border-red-800/60 text-[11px] flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5 text-red-400" />
                    <span>YouTube Embed Player</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Phát trực tiếp qua thẻ HTML iframe • 0% tải CPU máy chủ & 0đ lưu trữ
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span>Gốc: <strong className="text-slate-200">{(previewVideo.originalSizeBytes / (1024 * 1024)).toFixed(2)} MB</strong></span>
                  {previewVideo.compressedSizeBytes && (
                    <>
                      <span>→</span>
                      <span>Nén FFmpeg: <strong className="text-emerald-400">{(previewVideo.compressedSizeBytes / (1024 * 1024)).toFixed(2)} MB</strong></span>
                      {previewVideo.compressionRatio && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60">
                          Tiết kiệm {previewVideo.compressionRatio}%
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {previewVideo.sourceType === 'YOUTUBE' ? 'YouTube NOCDN' : 'Cloudflare R2 / HTTP 206 Streaming'}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSaved={loadAllData}
      />
    </div>
  );
};
