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
  Youtube
} from 'lucide-react';
import { AdminAPI, DocumentAPI, UserAPI, VideoAPI, SettingsAPI, SystemSettingsData } from '../services/api';
import { AdminStats, Course, TokenUsageLog, DocumentItem, VideoItem, User } from '../types';
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
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Manage course documents & videos modal state (for existing courses)
  const [selectedCourseForDocs, setSelectedCourseForDocs] = useState<Course | null>(null);
  const [editMaterialTab, setEditMaterialTab] = useState<'DOCUMENTS' | 'VIDEOS'>('DOCUMENTS');
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
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'RUNNING' | 'STOPPED'>('ALL');
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);
  const [serviceToast, setServiceToast] = useState<string>('');

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
      const [statsRes, coursesRes, tokensRes, docsRes, usersRes, videosRes, settingsRes] = await Promise.all([
        AdminAPI.getStats().catch(() => null),
        AdminAPI.getCourses().catch(() => []),
        AdminAPI.getTokens().catch(() => ({ logs: [], summary: { totalTokens: 0, estimatedCostUsd: 0, callCount: 0 } })),
        DocumentAPI.list().catch(() => []),
        UserAPI.list().catch(() => []),
        VideoAPI.list().catch(() => []),
        SettingsAPI.get().catch(() => null)
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
    setCourseCode('');
    setCourseName('');
    setCourseDesc('');
    setCourseTopic(defaultTopic || (selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic));
    setCourseDept('Khoa Công nghệ Thông tin');
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

  const handleCreateCourse = async () => {
    setFormError('');

    if (!courseCode.trim() || !courseName.trim()) {
      setCourseStep(1);
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
        description: courseDesc.trim(),
        isFreeTier: courseIsFreeTier,
        tierRequired: courseIsFreeTier ? 'FREE' : 'PRO',
        documentIds: courseDocumentIds,
        videoIds: courseVideoIds
      });

      setCourses([newCourse, ...courses]);
      if (stats) setStats({ ...stats, coursesCount: stats.coursesCount + 1 });
      setCourseCode('');
      setCourseName('');
      setCourseDesc('');
      setCourseDocumentIds([]);
      setCourseVideoIds([]);
      setCourseStep(1);
      setShowAddCourse(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Không thể tạo môn học mới.');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Manage documents & videos on existing courses
  const handleOpenDocModal = (crs: Course) => {
    setSelectedCourseForDocs(crs);
    setEditMaterialTab('DOCUMENTS');
    setEditCourseDocIds(crs.documentIds || []);
    setEditCourseVideoIds(crs.videoIds || []);
    setEditDocSearch('');
    setEditDocUploadMsg(null);
    setEditVideoUploadMsg(null);
    const isFree = crs.isFreeTier !== false && crs.tierRequired !== 'PRO';
    if (isFree) {
      setEditVideoMode('YOUTUBE');
    } else {
      setEditVideoMode('UPLOAD');
    }
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
        videoIds: editCourseVideoIds
      });
      setCourses(courses.map(c => c.id === updated.id ? updated : c));
      setSelectedCourseForDocs(null);
    } catch (err) {
      alert('Không thể lưu danh sách tài liệu và video.');
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
                    setCourseTopic(selectedTopic === 'ALL' ? 'Lập trình' : selectedTopic);
                    setShowAddCourse(!showAddCourse);
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
                        <p className="text-xs text-slate-400">Quy trình 2 bước: Điền thông tin, phân gói và nạp tài liệu giáo trình</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Step Indicator */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setCourseStep(1)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            courseStep === 1 
                              ? 'bg-white text-orange-600 shadow-xs' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            courseStep === 1 ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>1</span>
                          <span>Thông tin & Phân gói</span>
                        </button>

                        <div className="w-4 h-[1px] bg-slate-300 mx-1" />

                        <button
                          type="button"
                          onClick={() => {
                            if (!courseCode.trim() || !courseName.trim()) {
                              setFormError('Vui lòng điền Mã và Tên môn học trước khi sang bước 2.');
                              return;
                            }
                            setFormError('');
                            setCourseStep(2);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                            courseStep === 2 
                              ? 'bg-white text-orange-600 shadow-xs' 
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                            courseStep === 2 ? 'bg-orange-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>2</span>
                          <span>Nạp tài liệu ({courseDocumentIds.length})</span>
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
                          <label className="block font-bold text-slate-700 mb-1.5">
                            Mã Môn Học <span className="text-rose-500">*</span>:
                          </label>
                          <input
                            type="text"
                            placeholder="Ví dụ: PROG101, ENG201, DCK101, GIT101..."
                            value={courseCode}
                            onChange={(e) => setCourseCode(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono font-bold"
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
                            placeholder="Ví dụ: Lập trình TypeScript Nâng cao, Docker & Kubernetes Thực chiến..."
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
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
                          <span>Tiếp tục: Nạp tài liệu (Bước 2)</span>
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

                      {/* Material Type Tabs */}
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <button
                          type="button"
                          onClick={() => setWizardMaterialTab('DOCUMENTS')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                            wizardMaterialTab === 'DOCUMENTS'
                              ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Tài liệu văn bản ({courseDocumentIds.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWizardMaterialTab('VIDEOS')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                            wizardMaterialTab === 'VIDEOS'
                              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          <span>Video bài giảng ({courseVideoIds.length})</span>
                        </button>
                      </div>

                      {/* TAB 1: DOCUMENTS */}
                      {wizardMaterialTab === 'DOCUMENTS' && (
                        <>
                          {/* TẢI LÊN TÀI LIỆU MỚI */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                <UploadCloud className="w-4 h-4 text-orange-600" />
                                <span>1. Tải lên tài liệu mới (.pdf, .docx, .md)</span>
                              </label>
                              <span className="text-[11px] text-slate-400">File tải lên sẽ tự động gắn vào khóa học này</span>
                            </div>

                            <label className="border-2 border-dashed border-orange-200 hover:border-orange-400 bg-orange-50/30 hover:bg-orange-50/60 transition-all rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer group text-center">
                              <input
                                type="file"
                                accept=".pdf,.docx,.md,.markdown,text/markdown,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="hidden"
                                onChange={handleUploadDocInWizard}
                                disabled={isUploadingCourseDoc}
                              />
                              <div className="w-10 h-10 rounded-xl bg-white border border-orange-200 group-hover:scale-110 flex items-center justify-center text-orange-600 shadow-xs transition-transform">
                                {isUploadingCourseDoc ? (
                                  <RefreshCw className="w-5 h-5 animate-spin text-orange-600" />
                                ) : (
                                  <FileUp className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-700 group-hover:text-orange-700">
                                  {isUploadingCourseDoc ? 'Đang tải lên & nạp tài liệu...' : 'Nhấp để chọn file hoặc kéo thả tài liệu giáo trình'}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Hỗ trợ định dạng PDF, Microsoft Word (.docx), và Markdown (.md)
                                </p>
                              </div>
                            </label>

                            {uploadDocMsg && (
                              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                                uploadDocMsg.type === 'success' 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}>
                                {uploadDocMsg.type === 'success' ? (
                                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                )}
                                <span>{uploadDocMsg.text}</span>
                              </div>
                            )}
                          </div>

                          {/* HOẶC CHỌN TỪ KHO TÀI LIỆU CÓ SẴN */}
                          <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-orange-600" />
                                <span>2. Hoặc chọn từ kho tài liệu sẵn có ({documents.length} tài liệu)</span>
                              </label>
                              <span className="text-[11px] text-slate-400">Tích chọn để liên kết tài liệu vào môn học</span>
                            </div>

                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Tìm kiếm tài liệu theo tên file..."
                                value={docSearchInWizard}
                                onChange={(e) => setDocSearchInWizard(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium"
                              />
                              {docSearchInWizard && (
                                <button
                                  type="button"
                                  onClick={() => setDocSearchInWizard('')}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200/80 rounded-xl p-2 bg-slate-50/50">
                              {documents.length === 0 ? (
                                <p className="text-center py-4 text-xs text-slate-400">
                                  Chưa có tài liệu nào trong hệ thống. Hãy tải lên tài liệu mới ở phía trên.
                                </p>
                              ) : (
                                documents
                                  .filter(d => d.filename.toLowerCase().includes(docSearchInWizard.toLowerCase()))
                                  .map(doc => {
                                    const isSelected = courseDocumentIds.includes(doc.id);
                                    return (
                                      <div
                                        key={doc.id}
                                        onClick={() => toggleDocInWizard(doc.id)}
                                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs select-none ${
                                          isSelected
                                            ? 'bg-orange-50/80 border-orange-300 shadow-xs'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                            isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300 bg-white'
                                          }`}>
                                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                          </div>
                                          <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                                          <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 truncate text-[11px]">{doc.filename}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                              <span className="uppercase font-mono font-bold text-slate-600">{doc.fileType}</span>
                                              <span>•</span>
                                              <span>{(doc.fileSizeBytes / 1024).toFixed(0)} KB</span>
                                              {doc.pageCount && (
                                                <>
                                                  <span>•</span>
                                                  <span>{doc.pageCount} trang</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                          isSelected ? 'bg-orange-200/80 text-orange-900' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                          {isSelected ? 'Đã chọn' : 'Chọn'}
                                        </span>
                                      </div>
                                    );
                                  })
                              )}
                            </div>
                          </div>

                          {/* DANH SÁCH TÀI LIỆU ĐÃ GẮN VÀO KHÓA HỌC */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800">
                                Tài liệu đã gán vào khóa học ({courseDocumentIds.length}):
                              </span>
                              {courseDocumentIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setCourseDocumentIds([])}
                                  className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                                >
                                  Bỏ chọn tất cả
                                </button>
                              )}
                            </div>

                            {courseDocumentIds.length === 0 ? (
                              <p className="text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
                                ℹ️ Chưa có tài liệu văn bản nào được chọn cho khóa học này.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {courseDocumentIds.map(docId => {
                                  const docItem = documents.find(d => d.id === docId);
                                  const name = docItem ? docItem.filename : docId;
                                  const ext = docItem?.fileType?.toUpperCase() || 'DOC';
                                  return (
                                    <span
                                      key={docId}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
                                    >
                                      <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-orange-100 text-orange-800 font-bold">
                                        {ext}
                                      </span>
                                      <span className="max-w-[180px] truncate">{name}</span>
                                      <button
                                        type="button"
                                        onClick={() => toggleDocInWizard(docId)}
                                        className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-rose-600"
                                        title="Gỡ khỏi khóa học"
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
                      {wizardMaterialTab === 'VIDEOS' && (
                        <>
                          {/* TẢI LÊN HOẶC GẮN LINK VIDEO */}
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                <Film className="w-4 h-4 text-indigo-600" />
                                <span>1. Nạp bài giảng video mới</span>
                              </label>

                              {/* Mode Switcher */}
                              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                                <button
                                  type="button"
                                  disabled={courseIsFreeTier}
                                  onClick={() => !courseIsFreeTier && setWizardVideoMode('UPLOAD')}
                                  title={courseIsFreeTier ? 'Khóa học Free chỉ hỗ trợ gắn link YouTube' : 'Tải file video lên Cloudflare R2'}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                                    courseIsFreeTier
                                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                                      : wizardVideoMode === 'UPLOAD'
                                        ? 'bg-white text-indigo-700 shadow-xs cursor-pointer'
                                        : 'text-slate-500 hover:text-slate-800 cursor-pointer'
                                  }`}
                                >
                                  <UploadCloud className="w-3.5 h-3.5" />
                                  <span>Tải file lên R2 (Khóa Pro)</span>
                                  {courseIsFreeTier && <Lock className="w-3 h-3 text-slate-400" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setWizardVideoMode('YOUTUBE')}
                                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    wizardVideoMode === 'YOUTUBE'
                                      ? 'bg-red-600 text-white shadow-xs'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  <Youtube className="w-3.5 h-3.5" />
                                  <span>Gắn link YouTube (Khóa Free)</span>
                                </button>
                              </div>
                            </div>

                            {/* Informational banner for Free courses */}
                            {courseIsFreeTier && (
                              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  <strong>Khóa học Free:</strong> Nút tải file lên Cloudflare R2 đã bị làm mờ & vô hiệu hóa nhằm tối ưu chi phí lưu trữ. Khóa học miễn phí chỉ hỗ trợ gắn link YouTube.
                                </span>
                              </div>
                            )}

                            {/* MODE 1: FILE UPLOAD */}
                            {wizardVideoMode === 'UPLOAD' ? (
                              <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50 transition-all rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer group text-center">
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv"
                                  className="hidden"
                                  onChange={handleUploadVideoInWizard}
                                  disabled={isUploadingCourseVideo}
                                />
                                <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 group-hover:scale-110 flex items-center justify-center text-indigo-600 shadow-xs transition-transform">
                                  {isUploadingCourseVideo ? (
                                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                                  ) : (
                                    <Video className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-700">
                                    {isUploadingCourseVideo ? 'Đang nạp file & khởi chạy FFmpeg...' : 'Nhấp để chọn video bài giảng tải lên'}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Hỗ trợ .mp4, .webm, .mov, .mkv (Tối đa 2GB) — Tự động nén H.264 & tạo ảnh bìa Poster
                                  </p>
                                </div>
                              </label>
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
                                      value={wizardYoutubeUrl}
                                      onChange={(e) => setWizardYoutubeUrl(e.target.value)}
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
                                      value={wizardYoutubeTitle}
                                      onChange={(e) => setWizardYoutubeTitle(e.target.value)}
                                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
                                    />
                                  </div>
                                </div>

                                {/* Live Thumbnail Preview */}
                                {extractYoutubeId(wizardYoutubeUrl) && (
                                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-red-100">
                                    <img
                                      src={`https://img.youtube.com/vi/${extractYoutubeId(wizardYoutubeUrl)}/hqdefault.jpg`}
                                      alt="YouTube Preview"
                                      className="w-20 h-12 object-cover rounded-lg shadow-xs shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-bold text-slate-800 truncate">
                                        {wizardYoutubeTitle || `YouTube Video (${extractYoutubeId(wizardYoutubeUrl)})`}
                                      </p>
                                      <p className="text-[11px] text-red-600 font-mono">
                                        ID: {extractYoutubeId(wizardYoutubeUrl)} • Tự động nhúng phát trực tiếp trong web
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
                                    onClick={handleAddYoutubeInWizard}
                                    disabled={isAddingWizardYoutube || !wizardYoutubeUrl.trim()}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-sm shadow-red-600/20 transition cursor-pointer disabled:opacity-40"
                                  >
                                    {isAddingWizardYoutube ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Plus className="w-3.5 h-3.5" />
                                    )}
                                    <span>Gắn Video YouTube</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {uploadVideoMsg && (
                              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                                uploadVideoMsg.type === 'success' 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                              }`}>
                                {uploadVideoMsg.type === 'success' ? (
                                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                )}
                                <span>{uploadVideoMsg.text}</span>
                              </div>
                            )}
                          </div>

                          {/* CHỌN TỪ KHO VIDEO HỆ THỐNG */}
                          <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                <Film className="w-4 h-4 text-indigo-600" />
                                <span>2. Chọn từ kho video bài giảng ({videos.length} video trong hệ thống)</span>
                              </label>
                              <span className="text-[11px] text-slate-400">Tích chọn để liên kết video vào môn học</span>
                            </div>

                            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-slate-200/80 rounded-xl p-2 bg-slate-50/50">
                              {videos.length === 0 ? (
                                <p className="text-center py-4 text-xs text-slate-400">
                                  Chưa có video nào trong kho lưu trữ. Hãy tải lên video bài giảng ở trên.
                                </p>
                              ) : (
                                videos.map(vid => {
                                  const isSelected = courseVideoIds.includes(vid.id);
                                  const isProcessing = vid.status === 'PROCESSING';
                                  return (
                                    <div
                                      key={vid.id}
                                      onClick={() => !isProcessing && toggleVideoInWizard(vid.id)}
                                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs select-none ${
                                        isSelected
                                          ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                                          : 'bg-white border-slate-200 hover:border-slate-300'
                                      } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                                        }`}>
                                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                        </div>

                                        {/* Thumbnail or Video Icon */}
                                        <div className="w-12 h-8 rounded-lg bg-slate-900 overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-700">
                                          {vid.thumbnailUrl ? (
                                            <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                                          ) : (
                                            <Video className="w-4 h-4 text-slate-400" />
                                          )}
                                          {vid.durationSeconds && (
                                            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[8px] font-mono text-white px-1 rounded">
                                              {Math.floor(vid.durationSeconds / 60)}:{String(Math.floor(vid.durationSeconds % 60)).padStart(2, '0')}
                                            </span>
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <p className="font-semibold text-slate-900 truncate text-[11px]">{vid.title}</p>
                                          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                                            {vid.sourceType === 'YOUTUBE' ? (
                                              <span className="font-bold text-red-600 flex items-center gap-1">
                                                <Youtube className="w-3 h-3" />
                                                <span>YouTube Embed (Khóa Free)</span>
                                              </span>
                                            ) : (
                                              <>
                                                {vid.resolution && <span className="font-mono font-bold text-indigo-700">{vid.resolution}</span>}
                                                {vid.compressedSizeBytes && (
                                                  <>
                                                    <span>•</span>
                                                    <span>{(vid.compressedSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                                                  </>
                                                )}
                                                {vid.compressionRatio && (
                                                  <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                                                    -{vid.compressionRatio}%
                                                  </span>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {isProcessing ? (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                                            <span>Đang nén FFmpeg...</span>
                                          </span>
                                        ) : (
                                          <>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewVideo(vid);
                                              }}
                                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                              title="Xem thử video"
                                            >
                                              <Play className="w-3.5 h-3.5 fill-current" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => handleDeleteVideo(vid.id, e)}
                                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                              title="Xóa video khỏi hệ thống"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                              isSelected ? 'bg-indigo-200 text-indigo-900' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                              {isSelected ? 'Đã chọn' : 'Chọn'}
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

                          {/* DANH SÁCH VIDEO ĐÃ GẮN VÀO KHÓA HỌC */}
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800">
                                Video đã gán vào khóa học ({courseVideoIds.length}):
                              </span>
                              {courseVideoIds.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setCourseVideoIds([])}
                                  className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                                >
                                  Bỏ chọn tất cả
                                </button>
                              )}
                            </div>

                            {courseVideoIds.length === 0 ? (
                              <p className="text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                                ℹ️ Khóa học chưa gắn video bài giảng nào (tùy chọn).
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {courseVideoIds.map(vidId => {
                                  const vid = videos.find(v => v.id === vidId);
                                  return (
                                    <div
                                      key={vidId}
                                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                          {vid?.thumbnailUrl ? (
                                            <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <Video className="w-4 h-4 text-slate-400" />
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold text-slate-800 truncate">{vid?.title || vidId}</p>
                                          {vid?.durationSeconds && (
                                            <p className="text-[10px] text-slate-400">
                                              {Math.round(vid.durationSeconds)} giây • {vid.resolution || 'HD'}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        {vid && (
                                          <button
                                            type="button"
                                            onClick={() => setPreviewVideo(vid)}
                                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                            title="Xem trước"
                                          >
                                            <Play className="w-3 h-3 fill-current" />
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => toggleVideoInWizard(vidId)}
                                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                          title="Gỡ khỏi khóa học"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Navigation buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setCourseStep(1)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Quay lại Bước 1</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddCourse(false)}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                          >
                            Hủy bỏ
                          </button>

                          <button
                            type="button"
                            onClick={handleCreateCourse}
                            disabled={isSubmittingCourse}
                            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                          >
                            {isSubmittingCourse ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Đang lưu khóa học...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>
                                  Hoàn tất & Lưu Khóa Học ({courseDocumentIds.length} tài liệu{courseVideoIds.length > 0 ? `, ${courseVideoIds.length} video` : ''})
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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

                            {/* Document & Video Status Indicator */}
                            <div className="pt-1">
                              {totalMaterials > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocModal(crs)}
                                  className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-orange-50/60 hover:border-orange-200 transition-colors cursor-pointer"
                                  title="Nhấp để xem và quản lý tài liệu & video của môn học này"
                                >
                                  <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 flex-wrap">
                                    <span className="flex items-center gap-1 text-blue-700">
                                      <BookOpen className="w-3.5 h-3.5" />
                                      <span>{attachedDocsCount} tài liệu</span>
                                    </span>
                                    {attachedVideosCount > 0 && (
                                      <span className="flex items-center gap-1 text-indigo-700">
                                        <Video className="w-3.5 h-3.5" />
                                        <span>{attachedVideosCount} video</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-semibold text-orange-600 hover:underline">
                                    Quản lý học liệu →
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDocModal(crs)}
                                  className="w-full text-left flex items-center justify-between p-2 rounded-xl bg-amber-50/80 border border-amber-200 hover:bg-amber-100/80 transition-colors cursor-pointer"
                                  title="Khóa học chưa có học liệu, nhấp để nạp thêm"
                                >
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>Chưa có học liệu (Trống)</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-amber-700 bg-white px-2 py-0.5 rounded-md border border-amber-200">
                                    + Nạp ngay
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Card Footer: Department & Action */}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]" title={crs.department}>
                              {crs.department || 'Khoa CNTT'}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleOpenDocModal(crs)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition flex items-center gap-1 cursor-pointer"
                                title="Gắn/Gỡ tài liệu giáo trình cho môn này"
                              >
                                <span>Tài liệu</span>
                              </button>

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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Quản Lý Tài Liệu Khóa Học
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      {selectedCourseForDocs.code}
                    </span>
                    <span>{selectedCourseForDocs.name}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseForDocs(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Material Tabs Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setEditMaterialTab('DOCUMENTS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  editMaterialTab === 'DOCUMENTS'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tài liệu ({editCourseDocIds.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setEditMaterialTab('VIDEOS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  editMaterialTab === 'VIDEOS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video bài giảng ({editCourseVideoIds.length})</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
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
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
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
                className="px-6 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isUpdatingCourseDocs ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
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
