import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';

interface TeacherOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  maxScore: number;
  currentScore: number;
  onSubmit: (newScore: number, reason: string) => Promise<void>;
}

export const TeacherOverrideModal: React.FC<TeacherOverrideModalProps> = ({
  isOpen,
  onClose,
  maxScore,
  currentScore,
  onSubmit,
}) => {
  const [newScore, setNewScore] = useState<string>(currentScore.toString());
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = parseFloat(newScore);

    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > maxScore) {
      setError(`Điểm số phải nằm trong khoảng từ 0 đến ${maxScore} điểm.`);
      return;
    }

    if (!reason.trim()) {
      setError('Vui lòng nhập lý do sư phạm điều chỉnh điểm để ghi vào Audit Trail.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(scoreVal, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi điều chỉnh điểm.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Teacher Grade Override</h3>
            <p className="text-xs text-slate-500">Can thiệp điểm số và ghi nhận Audit Trail</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Điểm số mới (Thang điểm tối đa {maxScore}đ):
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={maxScore}
              value={newScore}
              onChange={(e) => setNewScore(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold focus:border-orange-500 focus:bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Lý do sư phạm điều chỉnh điểm:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Thí sinh có luận điểm sáng tạo phù hợp với thực tiễn sản phẩm dù không giống 100% từ khóa của đáp án mẫu..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Xác nhận sửa điểm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
