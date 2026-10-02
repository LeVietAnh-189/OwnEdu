import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Sparkles,
  BookOpen, 
  GraduationCap, 
  FileText, 
  Search, 
  X, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Play, 
  ArrowRight, 
  ArrowLeft,
  UploadCloud, 
  Crown, 
  Award, 
  Calendar, 
  Mail, 
  Code2, 
  Languages, 
  Box, 
  GitBranch,
  BookMarked,
  BarChart3,
  Trash2,
  Loader2,
  FileCheck,
  Edit2,
  Lock,
  Video,
  Film,
  Youtube,
  CreditCard,
  Receipt,
  QrCode,
  AlertCircle,
  ExternalLink,
  SlidersHorizontal,
  Filter,
  RotateCcw,
  ArrowUpDown,
  Check,
  Tag
} from 'lucide-react';
import { AdminAPI, DocumentAPI, ExamAPI, VideoAPI, PaymentAPI } from '../services/api';
import { Course, DocumentItem, Exam, VideoItem, PaymentOrder } from '../types';
import { useUserStore } from '../store/userStore';
import { ProUpgradeModal } from '../components/payment/ProUpgradeModal';

export const USER_COURSE_TOPICS = [
  { id: 'ALL', name: 'Tất cả chủ đề', icon: Layers },
  { id: 'Lập trình', name: 'Lập trình', icon: Code2 },
  { id: 'Tiếng Anh', name: 'Tiếng Anh', icon: Languages },
  { id: 'Docker', name: 'Docker', icon: Box },
  { id: 'Git & Github', name: 'Git & Github', icon: GitBranch },
] as const;

export const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, fetchCurrentUser } = useUserStore();

  const activeTabParam = searchParams.get('tab') as 'courses' | 'my-courses' | 'my-documents' | 'my-exams' | 'profile' | null;
  const activeTab = activeTabParam || 'courses';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  
  // Filters for Courses
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPricing, setSelectedPricing] = useState<'ALL' | 'FREE' | 'PRO'>('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState<'ALL' | 'VIDEO' | 'DOCS'>('ALL');
  const [selectedSort, setSelectedSort] = useState<'NEWEST' | 'NAME_ASC' | 'NAME_DESC' | 'MOST_LESSONS'>('NEWEST');

  const handleResetCourseFilters = () => {
    setSelectedTopic('ALL');
    setSearchQuery('');
    setSelectedPricing('ALL');
    setSelectedMaterial('ALL');
    setSelectedSort('NEWEST');
  };

  const isCourseFilterActive = selectedTopic !== 'ALL' || searchQuery.trim() !== '' || selectedPricing !== 'ALL' || selectedMaterial !== 'ALL' || selectedSort !== 'NEWEST';

  // Data states
  const [courses, setCourses] = useState<Course[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Payment & Pro states
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'profile') {
      setIsLoadingOrders(true);
      PaymentAPI.getOrders()
        .then(res => setOrders(res || []))
        .catch(() => setOrders([]))
        .finally(() => setIsLoadingOrders(false));
    }
  }, [activeTab]);

  // Course Classroom & Active Lesson state
  const courseIdParam = searchParams.get('courseId');
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [courseDetailTab, setCourseDetailTab] = useState<'VIDEOS' | 'DOCUMENTS'>('VIDEOS');
  const [activeLessonVideo, setActiveLessonVideo] = useState<VideoItem | null>(null);

  const activeCourse = (activeTab === 'courses' && courseIdParam)
    ? (courses.find(c => c.id === courseIdParam) || selectedCourseForDetail)
    : selectedCourseForDetail;

  useEffect(() => {
    if (activeCourse) {
      const attachedVideoIds = activeCourse.videoIds || [];
      const courseVids = videos.filter(v => attachedVideoIds.includes(v.id));
      if (courseVids.length > 0) {
        setActiveLessonVideo(prev => {
          if (prev && courseVids.some(v => v.id === prev.id)) {
            return prev;
          }
          return courseVids[0];
        });
      } else {
        setActiveLessonVideo(null);
      }
    } else {
      setActiveLessonVideo(null);
    }
  }, [activeCourse?.id, videos]);

  const handleOpenCourse = (c: Course) => {
    setSelectedCourseForDetail(c);
    setSearchParams({ tab: 'courses', courseId: c.id });
  };

  const handleBackToCourses = () => {
    setSelectedCourseForDetail(null);
    setSearchParams({ tab: 'courses' });
  };

  const getYoutubeEmbedId = (vid: VideoItem): string | null => {
    if (vid.youtubeId) return vid.youtubeId;
    if (!vid.youtubeUrl) return null;
    const match = vid.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [courseList, docList, videoList, examList] = await Promise.all([
          AdminAPI.getCourses().catch(() => []),
          DocumentAPI.list().catch(() => []),
          VideoAPI.list().catch(() => []),
          ExamAPI.list().catch(() => [])
        ]);
        setCourses(courseList);
        setDocuments(docList);
        setVideos(videoList);
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

  const handleStartExam = async (examId: string) => {
    try {
      const data = await ExamAPI.startAttempt(examId);
      navigate(`/exams/${examId}/take?attempt=${data.attempt_id}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể bắt đầu làm bài thi.');
    }
  };

  const handleDeleteExam = async (id: string, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ đề thi "${title}" không?`)) return;
    try {
      await ExamAPI.delete(id);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Không thể xóa bộ đề thi. Vui lòng thử lại!');
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
    if (!name.endsWith('.pdf') && !name.endsWith('.docx') && !name.endsWith('.md') && !name.endsWith('.markdown')) {
      alert('Hệ thống hỗ trợ tệp định dạng .PDF, .DOCX hoặc .MD (Markdown)!');
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

  // Filtered and sorted courses
  const filteredCourses = courses
    .filter((c) => {
      // Topic filter
      const matchTopic = selectedTopic === 'ALL' || c.topic === selectedTopic || c.department === selectedTopic;
      
      // Keyword search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        c.name.toLowerCase().includes(q) || 
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));

      // Pricing / Access tier filter
      const isPro = c.isFreeTier === false || c.tierRequired === 'PRO';
      let matchPricing = true;
      if (selectedPricing === 'FREE') matchPricing = !isPro;
      if (selectedPricing === 'PRO') matchPricing = isPro;

      // Attached materials filter
      let matchMaterial = true;
      if (selectedMaterial === 'VIDEO') matchMaterial = Boolean(c.videoIds && c.videoIds.length > 0);
      if (selectedMaterial === 'DOCS') matchMaterial = Boolean(c.documentIds && c.documentIds.length > 0);

      return matchTopic && matchSearch && matchPricing && matchMaterial;
    })
    .sort((a, b) => {
      if (selectedSort === 'NAME_ASC') return a.name.localeCompare(b.name, 'vi');
      if (selectedSort === 'NAME_DESC') return b.name.localeCompare(a.name, 'vi');
      if (selectedSort === 'MOST_LESSONS') {
        const countA = (a.videoIds?.length || 0) + (a.documentIds?.length || 0);
        const countB = (b.videoIds?.length || 0) + (b.documentIds?.length || 0);
        return countB - countA;
      }
      // 'NEWEST' default
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto">
      {/* ======================================================== */}
      {/* TAB 1: KHÓA HỌC */}
      {/* ======================================================== */}
      {activeTab === 'courses' && (
        activeCourse ? (
          <div className="space-y-4 w-full animate-in fade-in duration-200">
            {/* Unified Compact Course Header Box */}
            {(() => {
              const isProCourse = activeCourse.isFreeTier === false || activeCourse.tierRequired === 'PRO';
              const attachedVideoIds = activeCourse.videoIds || [];
              const attachedDocIds = activeCourse.documentIds || [];
              const courseVideos = videos.filter(v => attachedVideoIds.includes(v.id));
              const courseDocs = documents.filter(d => attachedDocIds.includes(d.id));

              return (
                <>
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={handleBackToCourses}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 font-bold text-xs transition border border-slate-200 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                        title="Quay lại danh sách khóa học"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Quay lại</span>
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-base sm:text-lg font-black text-slate-900 truncate">
                            {activeCourse.name}
                          </h1>
                          {isProCourse ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                              <Crown className="w-3 h-3 text-amber-600" />
                              <span>PRO</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Miễn phí</span>
                            </span>
                          )}
                        </div>
                        {activeCourse.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5 max-w-2xl">
                            {activeCourse.description}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Main Classroom Workspace: Video Player + Playlist / Materials */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Video Player Theater & Active Lesson (8 cols) */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
                        {/* Video Screen Area */}
                        <div className="aspect-video w-full bg-black flex items-center justify-center relative">
                          {activeLessonVideo ? (
                            activeLessonVideo.sourceType === 'YOUTUBE' || activeLessonVideo.youtubeId ? (
                              <iframe
                                key={activeLessonVideo.id}
                                src={`https://www.youtube-nocookie.com/embed/${getYoutubeEmbedId(activeLessonVideo)}?rel=0&modestbranding=1&autoplay=0`}
                                title={activeLessonVideo.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full border-0 aspect-video"
                              />
                            ) : (
                              <video
                                key={activeLessonVideo.id}
                                src={activeLessonVideo.storageUrl}
                                poster={activeLessonVideo.thumbnailUrl}
                                controls
                                playsInline
                                className="w-full h-full object-contain aspect-video"
                              />
                            )
                          ) : (
                            <div className="p-8 text-center space-y-3 text-slate-400">
                              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                                <Video className="w-8 h-8" />
                              </div>
                              <p className="font-bold text-slate-200 text-sm">Chưa có video bài giảng nào cho môn học này</p>
                              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Giảng viên phụ trách bộ môn sẽ sớm cập nhật video bài giảng và học liệu trực tuyến.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Under Player Lesson Info Bar */}
                        {activeLessonVideo && (
                          <div className="p-4 bg-slate-900/95 border-t border-slate-800/80">
                            <h2 className="text-base font-bold text-white tracking-tight truncate">
                              {activeLessonVideo.title}
                            </h2>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Course Content (Playlist & Documents) (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
                        {/* Tabs Switcher */}
                        <div className="p-2 bg-slate-50/70 border-b border-slate-200/80 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCourseDetailTab('VIDEOS')}
                            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              courseDetailTab === 'VIDEOS'
                                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Bài giảng ({courseVideos.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCourseDetailTab('DOCUMENTS')}
                            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              courseDetailTab === 'DOCUMENTS'
                                ? 'bg-white text-orange-700 shadow-sm border border-slate-200/80'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5 text-orange-600" />
                            <span>Tài liệu ({courseDocs.length})</span>
                          </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
                          {courseDetailTab === 'VIDEOS' && (
                            courseVideos.length === 0 ? (
                              <div className="py-12 px-4 text-center space-y-2">
                                <Video className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="font-bold text-slate-700 text-xs">Chưa có video bài giảng</p>
                                <p className="text-[11px] text-slate-400">Các bài giảng số hóa sẽ sớm được cập nhật.</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {courseVideos.map((vid, idx) => {
                                  const isCurrentPlaying = activeLessonVideo?.id === vid.id;
                                  return (
                                    <div
                                      key={vid.id}
                                      onClick={() => setActiveLessonVideo(vid)}
                                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                                        isCurrentPlaying
                                          ? 'border-indigo-500 bg-indigo-50/60 shadow-xs'
                                          : 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-14 h-10 rounded-xl bg-slate-900 overflow-hidden shrink-0 relative flex items-center justify-center border border-slate-800">
                                          {vid.thumbnailUrl ? (
                                            <img src={vid.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                          ) : (
                                            <Video className="w-4 h-4 text-slate-400" />
                                          )}
                                          <div className={`absolute inset-0 flex items-center justify-center ${
                                            isCurrentPlaying ? 'bg-indigo-950/60' : 'bg-black/30 group-hover:bg-black/10'
                                          }`}>
                                            <Play className={`w-3.5 h-3.5 ${isCurrentPlaying ? 'text-indigo-300 fill-indigo-300 animate-pulse' : 'text-white fill-white'}`} />
                                          </div>
                                        </div>

                                        <div className="min-w-0 space-y-0.5">
                                          <p className={`font-bold text-xs truncate ${
                                            isCurrentPlaying ? 'text-indigo-950 font-black' : 'text-slate-800 group-hover:text-indigo-600'
                                          }`}>
                                            {idx + 1}. {vid.title}
                                          </p>
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                            {vid.sourceType === 'YOUTUBE' ? (
                                              <span className="text-red-600 font-bold">YouTube</span>
                                            ) : (
                                              <span className="text-indigo-600 font-bold">Video HD</span>
                                            )}
                                            {vid.durationSeconds && (
                                              <>
                                                <span>•</span>
                                                <span>{Math.floor(vid.durationSeconds / 60)}:{String(Math.floor(vid.durationSeconds % 60)).padStart(2, '0')}</span>
                                              </>
                                            )}
                                            {isCurrentPlaying && (
                                              <span className="ml-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                                                Đang phát
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveLessonVideo(vid);
                                        }}
                                        className={`p-2 rounded-xl transition ${
                                          isCurrentPlaying
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-700'
                                        }`}
                                        title={isCurrentPlaying ? 'Đang phát bài này' : 'Phát bài học này'}
                                      >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          )}

                          {courseDetailTab === 'DOCUMENTS' && (
                            courseDocs.length === 0 ? (
                              <div className="py-12 px-4 text-center space-y-2">
                                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                                <p className="font-bold text-slate-700 text-xs">Chưa có tài liệu đính kèm</p>
                                <p className="text-[11px] text-slate-400">Giáo trình và tài liệu sẽ hiển thị ở đây.</p>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {courseDocs.map((doc, idx) => (
                                  <div
                                    key={doc.id}
                                    className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 text-xs shadow-xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="w-6 h-6 rounded-lg bg-orange-50 text-orange-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                        {idx + 1}
                                      </span>
                                      <FileText className="w-4 h-4 text-orange-600 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-800 truncate text-[11px]">{doc.filename}</p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
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

                                    <button
                                      type="button"
                                      onClick={() => navigate(`/documents/${doc.id}/generate`)}
                                      className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                                      title="Sinh đề thi AI từ giáo trình này"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>Luyện thi AI</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
            {/* ======================================================== */}
            {/* CỘT TRÁI (8 / 9 cột): Danh sách môn học & Bộ tìm kiếm */}
            {/* ======================================================== */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
              {/* Row 1: Search Input */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm môn học theo tên, mã môn, chủ đề đào tạo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-2xs transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Row 2: Topic Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {USER_COURSE_TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = selectedTopic === topic.id;
                  const topicCount = topic.id === 'ALL' 
                    ? courses.length 
                    : courses.filter(c => c.topic === topic.id || c.department === topic.id).length;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/25'
                          : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
                      <span className="whitespace-nowrap">{topic.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-orange-700/60 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {topicCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Row 3: Active Filters & Results Summary Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap bg-white/70 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/70 text-xs">
                <div className="flex items-center gap-2 flex-wrap text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Hiển thị <span className="text-orange-600 font-bold">{filteredCourses.length}</span> / {courses.length} môn học
                  </span>

                  {/* Active Chips */}
                  {selectedTopic !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                      Chủ đề: {selectedTopic}
                      <button onClick={() => setSelectedTopic('ALL')} className="hover:text-orange-950 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedPricing !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                      Gói: {selectedPricing === 'FREE' ? 'Miễn phí' : 'PRO VIP'}
                      <button onClick={() => setSelectedPricing('ALL')} className="hover:text-amber-950 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedMaterial !== 'ALL' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-semibold">
                      {selectedMaterial === 'VIDEO' ? 'Có Video bài giảng' : 'Có Giáo trình PDF'}
                      <button onClick={() => setSelectedMaterial('ALL')} className="hover:text-orange-950 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold">
                      Từ khóa: "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="hover:text-slate-900 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                {isCourseFilterActive && (
                  <button
                    onClick={handleResetCourseFilters}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer ml-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại tất cả</span>
                  </button>
                )}
              </div>

              {/* Courses Grid */}
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                  Đang tải danh sách khóa học...
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-slate-700">Không tìm thấy khóa học nào phù hợp</p>
                  <p className="text-xs text-slate-400">Bạn có thể xóa bớt bộ lọc hoặc chọn mức giá / chủ đề khác.</p>
                  {isCourseFilterActive && (
                    <button
                      onClick={handleResetCourseFilters}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer mt-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Xóa toàn bộ bộ lọc</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCourses.map((c) => {
                    const isProTier = c.isFreeTier === false || c.tierRequired === 'PRO';
                    const isUserPro = currentUser?.tier === 'PRO';
                    const canAccess = !isProTier || isUserPro;
                    const hasVideos = c.videoIds && c.videoIds.length > 0;
                    const hasDocs = c.documentIds && c.documentIds.length > 0;

                    return (
                      <div
                        key={c.id}
                        className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-2.5">
                          {/* Badges Row */}
                          <div className="flex items-center justify-between gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {isProTier ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  <span>Gói PRO VIP</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Miễn phí</span>
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {c.topic || c.department || 'Công nghệ'}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                            {c.name}
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-slate-500 line-clamp-2 font-normal leading-relaxed">
                            {c.description || 'Chương trình đào tạo chuẩn khảo thí với ngân hàng câu hỏi Bloom Taxonomy & chấm AI.'}
                          </p>

                          {/* Metadata Tags (Videos, Docs) */}
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                            {hasVideos && (
                              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                <Video className="w-3 h-3 text-orange-500" />
                                <span>{c.videoIds!.length} bài giảng</span>
                              </span>
                            )}
                            {hasDocs && (
                              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                <FileText className="w-3 h-3 text-amber-500" />
                                <span>Tài liệu PDF</span>
                              </span>
                            )}
                            {!hasVideos && !hasDocs && (
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>45 tiết học</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-slate-400">
                            {c.code}
                          </span>
                          {canAccess ? (
                            <button
                              onClick={() => handleOpenCourse(c)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-600 text-orange-700 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                              <span>Vào học</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setIsUpgradeModalOpen(true)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer border border-amber-200 shadow-2xs active:scale-[0.98]"
                              title="Nâng cấp tài khoản PRO để học môn này"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Mở khóa PRO</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* CỘT PHẢI (4 / 3 cột): BỘ LỌC KHÓA HỌC & BANNER PRO VIP */}
            {/* ======================================================== */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-20">
              {/* Filter Panel Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Bộ Lọc Khóa Học</h4>
                      <p className="text-[10px] text-slate-400">Tùy biến tìm kiếm</p>
                    </div>
                  </div>

                  {isCourseFilterActive && (
                    <button
                      onClick={handleResetCourseFilters}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      title="Đặt lại bộ lọc"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Đặt lại</span>
                    </button>
                  )}
                </div>

                {/* Filter 1: Học phí / Gói học (Price Tier) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>Học phí & Gói học</span>
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: 'ALL', label: 'Tất cả mức giá', count: courses.length },
                      { 
                        id: 'FREE', 
                        label: 'Miễn phí (Free)', 
                        count: courses.filter(c => c.isFreeTier !== false && c.tierRequired !== 'PRO').length
                      },
                      { 
                        id: 'PRO', 
                        label: 'Gói PRO VIP', 
                        count: courses.filter(c => c.isFreeTier === false || c.tierRequired === 'PRO').length
                      },
                    ].map((opt) => {
                      const isSelected = selectedPricing === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedPricing(opt.id as any)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left border ${
                            isSelected
                              ? 'bg-orange-50/80 border-orange-500 text-orange-950 font-bold shadow-2xs'
                              : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200/70 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected ? 'border-orange-600 bg-orange-600' : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span>{opt.label}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isSelected ? 'bg-orange-200/70 text-orange-900' : 'bg-slate-200/70 text-slate-600'
                          }`}>
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter 2: Hình thức học liệu (Materials) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                    <span>Học liệu đi kèm</span>
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: 'ALL', label: 'Tất cả tài nguyên', icon: Layers },
                      { id: 'VIDEO', label: 'Có Video bài giảng', icon: Video },
                      { id: 'DOCS', label: 'Có Giáo trình & PDF', icon: FileText },
                    ].map((opt) => {
                      const isSelected = selectedMaterial === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedMaterial(opt.id as any)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left border ${
                            isSelected
                              ? 'bg-orange-50/80 border-orange-500 text-orange-950 font-bold shadow-2xs'
                              : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200/70 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                            <span>{opt.label}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter 3: Sắp xếp (Sorting) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sắp xếp thứ tự</span>
                  </label>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                  >
                    <option value="NEWEST">Mới cập nhật gần đây</option>
                    <option value="NAME_ASC">Tên môn học (A → Z)</option>
                    <option value="NAME_DESC">Tên môn học (Z → A)</option>
                    <option value="MOST_LESSONS">Nhiều bài học / học liệu nhất</option>
                  </select>
                </div>
              </div>

              {/* Special Pro VIP Promotion Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/15 border border-amber-200/80 space-y-3 relative overflow-hidden shadow-2xs">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-900 leading-tight">Đặc Quyền PRO VIP</h5>
                    <p className="text-[10px] text-amber-700 font-medium">Trải nghiệm học tập đỉnh cao</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-amber-900 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Mở khóa toàn bộ bài giảng Video & Khóa học</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Bóc tách tài liệu & Sinh đề thi AI chuẩn Bloom</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Chấm điểm tự luận & Phân tích lỗ hổng kiến thức</span>
                  </div>
                </div>

                {currentUser?.tier === 'PRO' ? (
                  <div className="pt-1">
                    <div className="w-full py-2 px-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-900 text-center text-xs font-bold flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Bạn đã là PRO VIP</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/30 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Nâng cấp PRO chỉ từ 69k</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* ======================================================== */}
      {/* TAB 2: KHÓA HỌC CỦA TÔI */}
      {/* ======================================================== */}
      {activeTab === 'my-courses' && (
        <div className="space-y-6 w-full">
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

                    {/* Progress Bar & Action */}
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
                        onClick={() => setActiveTab('my-exams')}
                        className="w-full mt-2 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Vào ôn luyện & làm đề thi</span>
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
        <div className="space-y-6 w-full">
          {/* Hidden Native File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.md,.markdown,text/markdown,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

          {/* Header Action Bar (Liền mạch, không đóng hộp rườm rà) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kho Giáo Trình & Tài Liệu Bóc Tách
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Hỗ trợ định dạng PDF, DOCX và Markdown
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenPicker}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 shrink-0 cursor-pointer active:scale-[0.98] disabled:opacity-60"
              title="Nhấp để mở thư mục trên máy tính và chọn tệp PDF, DOCX hoặc MD"
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

          {/* Documents List / Upload Drop Area */}
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
                    Hỗ trợ tệp định dạng .PDF, .DOCX hoặc .MD (Markdown)
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
                      Hỗ trợ tệp văn bản định dạng <strong className="text-slate-800">.PDF</strong>, <strong className="text-slate-800">.DOCX</strong> & <strong className="text-slate-800">.MD</strong> (Dung lượng tối đa 25MB)
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
                        {doc.fileType} {doc.parserEngine === 'mineru' ? '• MinerU' : (doc.parserEngine === 'direct-markdown' ? '• Markdown trực tiếp' : '')}
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
                      title="Mở cấu hình sinh câu hỏi AI cho tài liệu này (Menu bên cạnh luôn được giữ nguyên)"
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
      {/* TAB 4: ĐỀ THI & KHẢO THÍ */}
      {/* ======================================================== */}
      {activeTab === 'my-exams' && (
        <div className="space-y-6 w-full">
          {/* Header Action Bar (Liền mạch, không đóng hộp rườm rà) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Ngân Hàng Đề Thi & Khảo Thí AI Bloom
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Tổng hợp các bộ đề thi đã sinh bằng AI từ tài liệu giáo trình
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('my-documents')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition-all shadow-md shadow-orange-600/20 shrink-0 cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sinh thêm đề thi từ tài liệu</span>
            </button>
          </div>

          {/* Exams Grid */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              Đang tải danh sách đề thi...
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <Layers className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700">Chưa có bộ đề thi nào được tạo</p>
              <p className="text-xs text-slate-400">
                Hãy vào tab "Tài liệu của tôi" và bấm nút "Sinh Đề Thi Chuẩn Bloom" để tạo đề thi đầu tiên.
              </p>
              <button
                onClick={() => setActiveTab('my-documents')}
                className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white inline-flex items-center gap-2 shadow-sm transition"
              >
                <FileText className="w-4 h-4" />
                <span>Đến kho tài liệu của tôi</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((exam) => {
                const isPub = exam.status === 'PUBLISHED';
                return (
                  <div
                    key={exam.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            isPub 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {isPub ? 'Đã xuất bản' : 'Bản nháp / Đang duyệt'}
                        </span>
                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {exam.suggestedDurationMinutes} phút
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2" title={exam.title}>
                        {exam.title}
                      </h4>

                      <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl">
                        <div className="flex justify-between">
                          <span>Số lượng câu hỏi:</span>
                          <strong className="text-slate-800">{exam.questions?.length || 0} câu</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Tổng điểm tối đa:</span>
                          <strong className="text-emerald-600">{exam.totalScore || 10} điểm</strong>
                        </div>
                        {exam.accessCode && (
                          <div className="flex justify-between">
                            <span>Mã truy cập:</span>
                            <span className="font-mono font-bold text-slate-700">{exam.accessCode}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleStartExam(exam.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Vào làm bài thi</span>
                      </button>

                      <Link
                        to={`/exams/${exam.id}/review`}
                        className="p-2 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 transition-colors shrink-0"
                        title="Xem lại và chỉnh sửa nội dung câu hỏi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors shrink-0 cursor-pointer"
                        title="Xóa bộ đề thi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: THÔNG TIN CÁ NHÂN & GÓI PRO */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6 w-full">
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
                  ID: {currentUser?.id || 'OE-USER'}
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Trực tuyến
                </span>
                {currentUser?.tier === 'PRO' && (
                  <span className="px-2.5 py-0.5 text-xs font-extrabold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-200" />
                    PRO VIP
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser?.email || 'sinhvien@ownedu.vn'}</span>
              </p>

              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Vai trò: <strong className="text-slate-700 uppercase">{currentUser?.role || 'STUDENT'}</strong></span>
              </p>
            </div>
          </div>

          {/* Membership & Subscription Tier Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 border border-orange-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                  currentUser?.tier === 'PRO'
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-orange-600/25'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <Crown className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-slate-900">
                      Gói Tài Khoản: {currentUser?.tier === 'PRO' ? 'Gói PRO VIP' : 'Gói Miễn Phí (Standard)'}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      currentUser?.tier === 'PRO'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {currentUser?.tier === 'PRO' ? 'Đang hoạt động' : 'Hạn chế quyền lợi'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {currentUser?.tier === 'PRO' ? (
                      currentUser?.proExpiresAt ? (
                        <>Hạn sử dụng: <strong className="text-orange-700 font-bold">{new Date(currentUser.proExpiresAt).toLocaleDateString('vi-VN')}</strong></>
                      ) : (
                        'Thời hạn sử dụng: Vĩnh viễn (Tài khoản thử nghiệm)'
                      )
                    ) : (
                      'Chỉ sinh được tối đa 3 đề thi/ngày. Nâng cấp ngay để mở khóa toàn bộ tính năng AI.'
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-600/20 hover:from-amber-600 hover:to-orange-700 transition cursor-pointer flex items-center gap-2"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span>{currentUser?.tier === 'PRO' ? 'Gia hạn gói Pro VIP' : 'Nâng cấp Pro VIP ngay'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/80 border border-orange-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Bóc tách giáo trình</span>
                <p className="text-sm font-black text-slate-900">
                  {currentUser?.tier === 'PRO' ? 'Không giới hạn dung lượng' : 'Tối đa 10MB / file'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/80 border border-orange-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Khảo thí AI Bloom</span>
                <p className="text-sm font-black text-slate-900">
                  {currentUser?.tier === 'PRO' ? 'Không giới hạn 4 cấp độ' : 'Tối đa 3 đề thi / ngày'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/80 border border-orange-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Chấm tự luận Rubric AI</span>
                <p className="text-sm font-black text-slate-900">
                  {currentUser?.tier === 'PRO' ? 'Phân tích đa chiều chuyên sâu' : 'Nhận xét cơ bản'}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction History Section (SePay VietQR) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                <h3 className="text-base font-bold text-slate-900">Lịch Sử Giao Dịch Nâng Cấp (SePay VietQR)</h3>
              </div>
              <button
                onClick={() => {
                  setIsLoadingOrders(true);
                  PaymentAPI.getOrders()
                    .then(res => setOrders(res || []))
                    .catch(() => setOrders([]))
                    .finally(() => setIsLoadingOrders(false));
                }}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                Làm mới
              </button>
            </div>

            {isLoadingOrders ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                <span>Đang tải lịch sử giao dịch...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p>Bạn chưa có giao dịch thanh toán nào.</p>
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="mt-3 px-4 py-1.5 rounded-xl text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition cursor-pointer"
                >
                  Nâng cấp Pro ngay
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Mã đơn</th>
                      <th className="py-3 px-4">Nội dung CK</th>
                      <th className="py-3 px-4">Gói dịch vụ</th>
                      <th className="py-3 px-4">Số tiền</th>
                      <th className="py-3 px-4">Phương thức</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {o.orderCode}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                            {o.paymentCode || `OE${o.orderCode}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {o.description || (o.planId === 'PRO_MONTHLY' ? 'Gói 1 Tháng' : o.planId === 'PRO_QUARTERLY' ? 'Gói 3 Tháng' : 'Gói 1 Năm')}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {o.amount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                            <QrCode className="w-3.5 h-3.5 text-orange-600" />
                            VietQR (SePay)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {o.status === 'PAID' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Thành công
                            </span>
                          ) : o.status === 'PENDING' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Chờ chuyển khoản
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              <X className="w-3 h-3" />
                              Đã hủy
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(o.createdAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pro VIP Upgrade Modal (SePay VietQR) */}
      <ProUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => {
          fetchCurrentUser();
          PaymentAPI.getOrders().then(res => setOrders(res || [])).catch(() => {});
        }}
      />
    </div>
  );
};

export default UserPage;
