import React, { useState, useEffect } from 'react';
import {
  X,
  Terminal,
  Database,
  Code2,
  FileCode,
  Globe,
  Sparkles,
  Check,
  Save,
  RotateCcw,
  Eye,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Course } from '../../types';
import { AdminAPI } from '../../services/api';
import { SUPPORTED_LANGUAGES, DEFAULT_STARTER_CODES, CourseSandbox } from './CourseSandbox';

export interface AdminSandboxConfigModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedCourse: Course) => void;
}

export const AdminSandboxConfigModal: React.FC<AdminSandboxConfigModalProps> = ({
  course,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen || !course) return null;

  const [hasSandbox, setHasSandbox] = useState<boolean>(() => {
    if (course.hasSandbox !== undefined) return course.hasSandbox;
    // Auto-enable for courses with SQL or code in name
    return Boolean(
      course.code?.toLowerCase().includes('sql') ||
      course.name?.toLowerCase().includes('sql') ||
      course.topic?.toLowerCase().includes('lập trình')
    );
  });

  const [sandboxLanguage, setSandboxLanguage] = useState<string>(() => {
    if (course.sandboxLanguage) return course.sandboxLanguage;
    if (course.code?.toLowerCase().includes('sql') || course.name?.toLowerCase().includes('sql')) return 'sql';
    if (course.name?.toLowerCase().includes('python')) return 'python';
    if (course.name?.toLowerCase().includes('react') || course.name?.toLowerCase().includes('javascript') || course.name?.toLowerCase().includes('web')) return 'javascript';
    return 'universal';
  });

  const [sandboxTitle, setSandboxTitle] = useState<string>(() => {
    if (course.sandboxTitle) return course.sandboxTitle;
    const found = SUPPORTED_LANGUAGES.find(l => l.id === (course.sandboxLanguage || 'universal'));
    return found ? `${found.label.split(' ')[0]} Sandbox` : 'Code Sandbox';
  });

  const [sandboxInitialCode, setSandboxInitialCode] = useState<string>(() => {
    if (course.sandboxInitialCode) return course.sandboxInitialCode;
    return DEFAULT_STARTER_CODES[sandboxLanguage] || DEFAULT_STARTER_CODES.python;
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto-update suggested title and initial code when changing language
  const handleLanguageChange = (lang: string) => {
    setSandboxLanguage(lang);
    const found = SUPPORTED_LANGUAGES.find(l => l.id === lang);
    if (found) {
      setSandboxTitle(`${found.label.split(' ')[0]} Sandbox`);
    }
    if (!sandboxInitialCode || sandboxInitialCode === DEFAULT_STARTER_CODES[sandboxLanguage]) {
      setSandboxInitialCode(DEFAULT_STARTER_CODES[lang] || '');
    }
  };

  const handleUseDefaultTemplate = () => {
    setSandboxInitialCode(DEFAULT_STARTER_CODES[sandboxLanguage] || '');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMsg('');

      const updated = await AdminAPI.updateCourse(course.id, {
        hasSandbox,
        sandboxLanguage,
        sandboxTitle: sandboxTitle.trim(),
        sandboxInitialCode: sandboxInitialCode,
      });

      onSaved(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Không thể lưu cấu hình Sandbox.');
    } finally {
      setIsSaving(false);
    }
  };

  // Temporary mock course for preview
  const previewCourse: Course = {
    ...course,
    hasSandbox: true,
    sandboxLanguage,
    sandboxTitle,
    sandboxInitialCode,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-orange-50/50 via-white to-amber-50/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-orange-100/80 border border-orange-200 flex items-center justify-center text-orange-600 shadow-xs shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                  {course.code}
                </span>
                <h3 className="font-bold text-base text-slate-900 truncate">
                  Cấu hình Sandbox thực hành
                </h3>
              </div>
              <p className="text-xs text-slate-500 truncate">
                Khóa học: <span className="font-semibold text-slate-700">{course.name}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Toggle Switch */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label htmlFor="toggle-sandbox" className="font-bold text-sm text-slate-900 cursor-pointer block">
                Kích hoạt Sandbox thực hành cho khóa học này
              </label>
              <p className="text-xs text-slate-500">
                Khi bật, học viên sẽ nhìn thấy tab Sandbox bên cạnh danh sách bài học để gõ code và chạy ngay trong trình duyệt.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="toggle-sandbox"
                type="checkbox"
                checked={hasSandbox}
                onChange={(e) => setHasSandbox(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {hasSandbox && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <span>Chọn loại Sandbox / Ngôn ngữ lập trình chính:</span>
                  <span className="text-orange-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const Icon = lang.icon;
                    const isSelected = sandboxLanguage === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`p-3 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50/70 border-orange-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${lang.color}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {lang.label.split(' (')[0]}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {lang.label.includes('(') ? `(${lang.label.split('(')[1]}` : 'Trình thực thi'}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sandbox Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-xs text-slate-800">
                  Tên hiển thị tab Sandbox cho học viên:
                </label>
                <input
                  type="text"
                  value={sandboxTitle}
                  onChange={(e) => setSandboxTitle(e.target.value)}
                  placeholder="Ví dụ: Python Playground, SQL Sandbox..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              {/* Starter Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-xs text-slate-800">
                    Đoạn code mẫu ban đầu (Starter Code):
                  </label>
                  <button
                    type="button"
                    onClick={handleUseDefaultTemplate}
                    className="text-[11px] font-bold text-orange-700 hover:text-orange-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Lấy code mẫu gợi ý</span>
                  </button>
                </div>
                <textarea
                  value={sandboxInitialCode}
                  onChange={(e) => setSandboxInitialCode(e.target.value)}
                  rows={6}
                  placeholder="Nhập code mẫu để học viên thấy ngay khi mở Sandbox..."
                  className="w-full p-3 font-mono text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 shadow-2xs resize-y"
                />
                <p className="text-[11px] text-slate-400">
                  * Đoạn mã này sẽ được hiển thị sẵn trong khung soạn thảo khi học viên mở Sandbox lần đầu.
                </p>
              </div>

              {/* Preview Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isPreviewOpen ? 'Ẩn xem trước' : 'Xem trước giao diện Sandbox học viên'}</span>
                </button>
              </div>

              {/* Live Preview Embed */}
              {isPreviewOpen && (
                <div className="rounded-2xl border border-slate-300 p-2 bg-slate-100/50 space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1 px-1">
                    <Sparkles className="w-3 h-3 text-orange-500" />
                    <span>Trải nghiệm Sandbox trực tiếp:</span>
                  </div>
                  <div className="h-[480px]">
                    <CourseSandbox course={previewCourse} isEmbedded />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            {isSaving ? (
              <span>Đang lưu...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu cấu hình Sandbox</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSandboxConfigModal;
