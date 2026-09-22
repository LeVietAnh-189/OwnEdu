import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DocumentAPI, ExamAPI, SettingsAPI } from '../services/api';
import { DocumentItem, BloomLevel } from '../types';
import { AISettingsModal } from '../components/common/AISettingsModal';
import { useUserStore } from '../store/userStore';
import { 
  Sparkles, 
  Clock, 
  BrainCircuit, 
  Check, 
  AlertCircle,
  Cpu,
  Key
} from 'lucide-react';

export const ExamGeneratePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [title, setTitle] = useState<string>('');
  const [mcqCount, setMcqCount] = useState<number>(5);
  const [essayCount, setEssayCount] = useState<number>(1);
  const [timeLimit, setTimeLimit] = useState<number>(45);
  const [targetAudience, setTargetAudience] = useState<'HIGH_SCHOOL' | 'UNIVERSITY' | 'PROFESSIONAL'>('UNIVERSITY');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [bloomLevels, setBloomLevels] = useState<BloomLevel[]>([
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
  ]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const loadSettings = async () => {
    try {
      const s = await SettingsAPI.get();
      setHasGeminiKey(s.hasGeminiKey);
    } catch (e) {}
  };

  useEffect(() => {
    loadSettings();
    if (!id) return;
    const fetchDoc = async () => {
      try {
        const doc = await DocumentAPI.get(id);
        setDocument(doc);
        const baseName = doc.filename.replace(/\.[^/.]+$/, '');
        setTitle(`Đề kiểm tra: ${baseName}`);
      } catch (err) {
        console.error('Error fetching doc:', err);
      }
    };
    fetchDoc();
  }, [id]);

  const toggleBloom = (level: BloomLevel) => {
    if (bloomLevels.includes(level)) {
      if (bloomLevels.length > 1) {
        setBloomLevels(bloomLevels.filter((b) => b !== level));
      }
    } else {
      setBloomLevels([...bloomLevels, level]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await ExamAPI.generate({
        document_id: id,
        title,
        config: {
          mcq_count: mcqCount,
          essay_count: essayCount,
          bloom_levels: bloomLevels,
          target_audience: targetAudience,
          language,
          time_limit_minutes: timeLimit,
        },
      });

      navigate(`/exams/generating/${result.job_id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tạo tác vụ sinh đề.');
      setIsSubmitting(false);
    }
  };

  const bloomOptions: Array<{ level: BloomLevel; label: string; desc: string }> = [
    { level: 'REMEMBER', label: 'Nhận biết', desc: 'Định nghĩa, thuật ngữ, sự kiện cốt lõi' },
    { level: 'UNDERSTAND', label: 'Thông hiểu', desc: 'Giải thích bản chất, phân biệt sự khác biệt' },
    { level: 'APPLY', label: 'Vận dụng', desc: 'Giải quyết bài toán hoặc tình huống cụ thể' },
    { level: 'ANALYZE', label: 'Phân tích', desc: 'So sánh ưu/nhược điểm, mổ xẻ nguyên nhân sâu xa' },
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-orange-600" />
          <span>Cấu Hình Sinh Đề Thi Bằng AI</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tài liệu nguồn: <strong className="text-slate-800">{document?.filename || 'Đang tải...'}</strong>
        </p>
      </div>

      {/* AI Model Connection Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
        hasGeminiKey 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
          : 'bg-orange-50 border-orange-200 text-orange-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <Cpu className={`w-5 h-5 shrink-0 ${hasGeminiKey ? 'text-emerald-600' : 'text-orange-600'}`} />
          <div>
            <span className="font-bold text-slate-900 block">
              {hasGeminiKey 
                ? 'Đang kết nối: Google Gemini 1.5 / 2.0 Flash' 
                : 'Mô hình AI: Đang dùng bộ phân tích ngữ cảnh nội bộ'}
            </span>
            <span className="text-slate-600 text-[11px]">
              {hasGeminiKey 
                ? 'Sử dụng LLM phân tích ngữ nghĩa sâu, tạo 4 đáp án thông minh và barem rubric chuẩn mực (Đã được Quản trị viên kích hoạt).' 
                : (isAdmin 
                    ? 'Nhập Google Gemini API Key để sinh đề tự nhiên bám sát toàn văn giáo trình.'
                    : 'Hệ thống đang hoạt động ở chế độ phân tích chuẩn khảo thí Bloom.')}
            </span>
          </div>
        </div>

        {/* Only Admin can configure/change API Key */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shrink-0 self-start sm:self-auto transition-colors shadow-sm"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasGeminiKey ? 'Đổi API Key' : 'Cấu hình Gemini Key'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleGenerate} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Tiêu đề bộ đề thi:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:border-orange-600 focus:ring-1 focus:ring-orange-600 focus:outline-none"
            required
          />
        </div>

        {/* Sliders: MCQ & Essay Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Số câu trắc nghiệm (MCQ):
              </label>
              <span className="px-3 py-1 rounded-lg bg-orange-100 text-orange-700 font-mono font-bold text-sm">
                {mcqCount} câu
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={mcqCount}
              onChange={(e) => setMcqCount(parseInt(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Mỗi câu gồm 4 phương án A, B, C, D kèm giải thích chi tiết</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Số câu tự luận (Rubric):
              </label>
              <span className="px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-mono font-bold text-sm">
                {essayCount} câu
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={essayCount}
              onChange={(e) => setEssayCount(parseInt(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">Kèm câu trả lời chuẩn mực & barem rubric phân rã tiêu chí</p>
          </div>
        </div>

        {/* Bloom Taxonomy Checkbox Cards */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-orange-600" />
            <span>Phân bổ cấp độ nhận thức Bloom Taxonomy:</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bloomOptions.map((opt) => {
              const isChecked = bloomLevels.includes(opt.level);
              return (
                <div
                  key={opt.level}
                  onClick={() => toggleBloom(opt.level)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-orange-50/70 border-orange-300 text-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                      isChecked
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{opt.label}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Duration & Target Audience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Thời gian làm bài (Phút):</span>
            </label>
            <select
              value={timeLimit}
              onChange={(e) => setTimeLimit(parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:border-orange-600 focus:ring-1 focus:ring-orange-600 focus:outline-none"
            >
              <option value={15}>15 phút (Kiểm tra 15p)</option>
              <option value={30}>30 phút (Kiểm tra định kỳ)</option>
              <option value={45}>45 phút (Kiểm tra 1 tiết)</option>
              <option value={60}>60 phút (Giữa kỳ)</option>
              <option value={90}>90 phút (Cuối kỳ)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Đối tượng khảo thí:
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium focus:border-orange-600 focus:ring-1 focus:ring-orange-600 focus:outline-none"
            >
              <option value="HIGH_SCHOOL">Học sinh Phổ thông</option>
              <option value="UNIVERSITY">Sinh viên Đại học</option>
              <option value="PROFESSIONAL">Kỹ sư / Chuyên gia</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-4 rounded-xl font-bold text-base bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20 flex items-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            <span>{isSubmitting ? 'Đang khởi tạo...' : 'Kích hoạt AI Sinh Đề Thi Ngay'}</span>
          </button>
        </div>
      </form>

      {isAdmin && (
        <AISettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={loadSettings}
        />
      )}
    </div>
  );
};
