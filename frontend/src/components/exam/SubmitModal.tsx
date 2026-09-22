import React from 'react';
import { AlertCircle, CheckCircle2, Flag, Send, X } from 'lucide-react';
import { useExamStore } from '../../store/examStore';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  const { questions, answers } = useExamStore();

  if (!isOpen) return null;

  const total = questions.length;
  const answered = questions.filter((q) => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (ans.type === 'MCQ') return Boolean(ans.selectedOption);
    if (ans.type === 'ESSAY') return Boolean(ans.essayText && ans.essayText.trim().length > 0);
    return false;
  }).length;

  const unanswered = total - answered;
  const flagged = questions.filter((q) => answers[q.id]?.isFlagged).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-slate-200 bg-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Xác Nhận Nộp Bài Thi</h3>
            <p className="text-xs text-slate-500">Kiểm tra lại bài làm trước khi nộp chính thức</p>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="space-y-2.5 my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Số câu đã hoàn thành:
            </span>
            <span className="font-bold text-emerald-700">{answered} / {total} câu</span>
          </div>

          {unanswered > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Số câu chưa làm:
              </span>
              <span className="font-bold text-rose-600">{unanswered} câu</span>
            </div>
          )}

          {flagged > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-600" />
                Số câu cắm cờ xem lại:
              </span>
              <span className="font-bold text-amber-700">{flagged} câu</span>
            </div>
          )}
        </div>

        {unanswered > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              Bạn vẫn còn <strong>{unanswered}</strong> câu hỏi chưa trả lời. Nếu nộp ngay bây giờ, các câu chưa làm sẽ nhận 0 điểm.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Tiếp tục làm bài
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <span>Đang chấm điểm...</span>
            ) : (
              <span>Nộp bài ngay</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
