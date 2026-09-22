import React from 'react';
import { useExamStore } from '../../store/examStore';
import { Check, Flag, Send } from 'lucide-react';

interface QuestionPaletteProps {
  onSubmitClick: () => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({ onSubmitClick }) => {
  const { questions, answers, currentIndex, goToQuestion } = useExamStore();

  const answeredCount = questions.filter((q) => {
    const ans = answers[q.id];
    if (!ans) return false;
    if (ans.type === 'MCQ') return Boolean(ans.selectedOption);
    if (ans.type === 'ESSAY') return Boolean(ans.essayText && ans.essayText.trim().length > 0);
    return false;
  }).length;

  const flaggedCount = questions.filter((q) => answers[q.id]?.isFlagged).length;
  const totalCount = questions.length;
  const unansweredCount = totalCount - answeredCount;

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
          Bảng câu hỏi ({answeredCount}/{totalCount})
        </h3>
      </div>

      {/* Grid of buttons */}
      <div className="grid grid-cols-5 gap-2.5 overflow-y-auto max-h-[380px] pr-1 py-1">
        {questions.map((q, idx) => {
          const ans = answers[q.id];
          const isSelected = currentIndex === idx;
          const isAnswered = ans?.type === 'MCQ' 
            ? Boolean(ans.selectedOption) 
            : Boolean(ans?.essayText && ans.essayText.trim().length > 0);
          const isFlagged = Boolean(ans?.isFlagged);

          let buttonClasses = 'h-11 rounded-xl font-bold text-sm relative transition-all flex items-center justify-center ';

          if (isSelected) {
            buttonClasses += 'ring-2 ring-orange-500 bg-orange-50 text-orange-700 shadow-sm ';
          } else if (isFlagged) {
            buttonClasses += 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 ';
          } else if (isAnswered) {
            buttonClasses += 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 ';
          } else {
            buttonClasses += 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 ';
          }

          const padNum = (idx + 1).toString().padStart(2, '0');

          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(idx)}
              className={buttonClasses}
            >
              <span>{padNum}</span>
              {isFlagged && (
                <Flag className="w-2.5 h-2.5 text-amber-500 absolute top-1 right-1 fill-amber-500" />
              )}
              {isAnswered && !isFlagged && (
                <Check className="w-2.5 h-2.5 text-emerald-600 absolute top-1 right-1 stroke-[3]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-400" />
            <span>Đã trả lời</span>
          </div>
          <span className="font-semibold text-emerald-700">{answeredCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400" />
            <span>Cần xem lại</span>
          </div>
          <span className="font-semibold text-amber-700">{flaggedCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" />
            <span>Chưa làm</span>
          </div>
          <span className="font-semibold text-slate-500">{unansweredCount}</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-auto pt-6">
        <button
          onClick={onSubmitClick}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          <span>NỘP BÀI THI CHÍNH THỨC</span>
        </button>
      </div>
    </div>
  );
};
