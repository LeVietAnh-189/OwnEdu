import React, { useState, useId } from 'react';
import {
  X,
  UploadCloud,
  FileCode,
  Sparkles,
  BookOpen,
  Layers,
  Code2,
  Table,
  Video,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Edit3,
  Clock,
  Bot,
  Wand2,
  FileText,
  HelpCircle
} from 'lucide-react';
import { parseHtmlToLessons, ParsedLessonResult } from '../../utils/htmlCourseParser';
import { AIAPI } from '../../services/api';
import { Lesson } from '../../types';

export interface CloneLessonModalProps {
  isOpen: boolean;
  chapterTitle: string;
  currentLessonCount: number;
  onClose: () => void;
  onAddLessons: (newLessons: Lesson[], andEditFirst?: boolean) => Promise<void>;
}

export const CloneLessonModal: React.FC<CloneLessonModalProps> = ({
  isOpen,
  chapterTitle,
  currentLessonCount,
  onClose,
  onAddLessons,
}) => {
  const fileInputId = useId();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawHtmlContent, setRawHtmlContent] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedLessonResult | null>(null);

  // Form Fields
  const [lessonTitle, setLessonTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  // AI Block Structuring States
  const [isAIStructuring, setIsAIStructuring] = useState<boolean>(false);
  const [aiSuccessInfo, setAiSuccessInfo] = useState<{ provider: string; model?: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processHtmlFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setErrorMessage('Vui lòng chọn đúng tệp có đuôi .html hoặc .htm');
      return;
    }
    processHtmlFile(file);
  };

  const processHtmlFile = (file: File) => {
    setSelectedFile(file);
    setErrorMessage('');
    setAiSuccessInfo(null);

    const defaultTitleFromFile = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setErrorMessage('Tệp HTML trống hoặc không thể đọc được.');
        return;
      }
      setRawHtmlContent(content);

      try {
        const res = parseHtmlToLessons(content, {
          baseOrderIndex: currentLessonCount + 1,
          defaultTitle: defaultTitleFromFile,
        });
        setParsedData(res);
        setLessonTitle(res.mainTitle || defaultTitleFromFile);
        setDurationMinutes(res.lesson.durationMinutes || 15);
      } catch (err: any) {
        setErrorMessage('Lỗi phân tích cú pháp HTML: ' + (err.message || 'Không xác định'));
      }
    };
    reader.onerror = () => {
      setErrorMessage('Đã xảy ra lỗi khi đọc tệp tin từ máy tính.');
    };
    reader.readAsText(file);
  };

  // Kích hoạt AI quan sát và phân tách các khối bài giảng chuẩn OwnEdu
  const handleAIStructure = async () => {
    if (!rawHtmlContent || isAIStructuring) return;

    try {
      setIsAIStructuring(true);
      setErrorMessage('');

      const result = await AIAPI.structureLesson({
        htmlContent: rawHtmlContent,
        lessonTitle: lessonTitle.trim() || undefined,
      });

      if (result && result.markdown) {
        const updatedLesson: Lesson = {
          ...(parsedData?.lesson || {
            id: `les_${Date.now()}_1`,
            orderIndex: currentLessonCount + 1,
          }),
          title: result.title || lessonTitle,
          durationMinutes: Math.max(10, Math.min(60, Math.round(result.markdown.length / 250) * 5 || 20)),
          content: result.markdown,
        };

        setParsedData({
          lesson: updatedLesson,
          mainTitle: result.title || lessonTitle,
          stats: {
            totalSections: result.stats.totalHeadings,
            totalCodeBlocks: result.stats.totalCodeBlocks,
            totalCallouts: result.stats.totalCallouts,
            totalTables: result.stats.totalTables,
            totalImages: parsedData?.stats.totalImages || 0,
            totalVideos: parsedData?.stats.totalVideos || 0,
          },
        });

        if (result.title) {
          setLessonTitle(result.title);
        }

        setAiSuccessInfo({
          provider: result.provider || 'AI',
          model: result.model,
        });
      }
    } catch (err: any) {
      setErrorMessage(
        'Không thể gọi AI phân tách khối: ' + (err.response?.data?.error || err.message || 'Lỗi kết nối')
      );
    } finally {
      setIsAIStructuring(false);
    }
  };

  const handleSave = async (andEditFirst: boolean = false) => {
    if (!parsedData) {
      setErrorMessage('Vui lòng chọn tệp HTML hợp lệ trước.');
      return;
    }

    if (!lessonTitle.trim()) {
      setErrorMessage('Tiêu đề bài giảng không được để trống.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const finalLesson: Lesson = {
        ...parsedData.lesson,
        title: lessonTitle.trim(),
        durationMinutes: durationMinutes || 15,
      };

      await onAddLessons([finalLesson], andEditFirst);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể lưu bài giảng vào chương.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setRawHtmlContent('');
    setParsedData(null);
    setAiSuccessInfo(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Clone bài giảng từ tệp HTML</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Chuẩn hóa OwnEdu</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Nạp thành 1 bài giảng hoàn chỉnh vào chương: <span className="font-semibold text-slate-700">{chapterTitle}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD HTML FILE */}
          {!parsedData ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/50 transition-all rounded-3xl p-10 text-center space-y-4 cursor-pointer group"
              onClick={() => document.getElementById(fileInputId)?.click()}
            >
              <input
                id={fileInputId}
                type="file"
                accept=".html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-3xl bg-white border border-indigo-100 flex items-center justify-center mx-auto shadow-sm group-hover:scale-105 transition-transform text-indigo-600">
                <FileCode className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-slate-800">
                  Kéo và thả tệp HTML bài giảng vào đây, hoặc <span className="text-indigo-600 underline">chọn tệp từ máy tính</span>
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Toàn bộ các đề mục, khối code, bài tập và bảng dữ liệu trong file sẽ được giữ nguyên vẹn trong 1 bài giảng chuẩn
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-slate-500 bg-white border border-slate-200 shadow-2xs">
                <span>Chấp nhận: .html, .htm</span>
              </div>
            </div>
          ) : (
            /* STEP 2: CONFIGURE LESSON & PREVIEW CONTENT */
            <div className="space-y-4">
              {/* File Info & Stats Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{selectedFile?.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {(selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) : '0')} KB • Bài giảng sẵn sàng
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {parsedData.stats.totalSections > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{parsedData.stats.totalSections} đề mục</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    <Code2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{parsedData.stats.totalCodeBlocks} code block</span>
                  </span>
                  {parsedData.stats.totalCallouts > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>{parsedData.stats.totalCallouts} ghi chú</span>
                    </span>
                  )}
                  {parsedData.stats.totalTables > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      <Table className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{parsedData.stats.totalTables} bảng</span>
                    </span>
                  )}
                  {((parsedData.stats.totalQuizzes || 0) > 0) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                      <span>{parsedData.stats.totalQuizzes} trắc nghiệm</span>
                    </span>
                  )}

                  <label className="text-xs text-indigo-700 hover:underline font-bold cursor-pointer ml-1">
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    Chọn file khác
                  </label>
                </div>
              </div>

              {/* AI OBSERVATION & BLOCK SPLITTER BAR */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-pink-50/30 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        AI Quan Sát & Phân Tách Khối Chuẩn OwnEdu
                      </h4>
                      {aiSuccessInfo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Đã phân tách ({aiSuccessInfo.provider})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>Khuyên dùng</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
                      AI quan sát HTML: chữ to/đậm $\rightarrow$ Tiêu đề, chữ thường $\rightarrow$ Đoạn văn, khung màu $\rightarrow$ Ghi chú, bảng $\rightarrow$ Khối bảng, mã lệnh $\rightarrow$ Khối code. Loại bỏ các nút ngoại lai và bảo toàn 100% kiến thức.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAIStructure}
                  disabled={isAIStructuring || isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-600/20 shrink-0 disabled:opacity-50"
                >
                  {isAIStructuring ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>AI đang quan sát...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>{aiSuccessInfo ? 'Phân tách lại bằng AI' : 'Phân tách khối bằng AI'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Lesson Title & Duration Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tiêu đề bài giảng:</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Nhập tiêu đề bài giảng..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Thời lượng:</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-bold text-slate-900 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">phút</span>
                  </div>
                </div>
              </div>

              {/* PREVIEW FULL LESSON CONTENT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Xem trước nội dung các khối ({parsedData.lesson.content.length} ký tự):
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 italic">
                    {aiSuccessInfo ? 'Đã chuẩn hóa thành các khối rành mạch bằng AI' : 'Bóc tách cấu trúc nội dung'}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl bg-white p-3.5 max-h-64 overflow-y-auto space-y-2 shadow-2xs">
                  <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed select-all bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {parsedData.lesson.content}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting || isAIStructuring}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Hủy
          </button>

          {parsedData && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSubmitting || isAIStructuring}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                Thêm vào chương
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSubmitting || isAIStructuring}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>Thêm & Soạn trực quan ngay</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
