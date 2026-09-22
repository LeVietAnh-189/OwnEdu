import React from 'react';
import { useExamStore } from '../../store/examStore';
import { MCQOptionsGroup } from './MCQOptionsGroup';
import { EssayEditor } from './EssayEditor';
import { Flag, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';

export const QuestionViewer: React.FC = () => {
  const {
    questions,
    currentIndex,
    answers,
    selectOption,
    updateEssayText,
    toggleFlag,
    goToQuestion,
  } = useExamStore();

  const currentQ = questions[currentIndex];
  if (!currentQ) {
    return <div className="p-8 text-center text-slate-500">Không có dữ liệu câu hỏi.</div>;
  }

  const currentAns = answers[currentQ.id];
  const isFlagged = Boolean(currentAns?.isFlagged);
  const total = questions.length;

  const bloomColorMap: Record<string, string> = {
    REMEMBER: 'bg-sky-50 text-sky-700 border-sky-200',
    UNDERSTAND: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    APPLY: 'bg-amber-50 text-amber-700 border-amber-200',
    ANALYZE: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const bloomLabelMap: Record<string, string> = {
    REMEMBER: 'Nhận biết',
    UNDERSTAND: 'Thông hiểu',
    APPLY: 'Vận dụng',
    ANALYZE: 'Phân tích',
  };

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col justify-between border border-slate-200 bg-white shadow-sm min-h-[580px]">
      {/* Question Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-extrabold text-base sm:text-lg text-slate-900">
              Câu {(currentIndex + 1).toString().padStart(2, '0')} / {total.toString().padStart(2, '0')}
            </span>

            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                bloomColorMap[currentQ.bloomLevel] || 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {bloomLabelMap[currentQ.bloomLevel] || currentQ.bloomLevel}
            </span>

            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
              {currentQ.points} điểm
            </span>
          </div>

          {/* Flag button */}
          <button
            onClick={() => toggleFlag(currentQ.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              isFlagged
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 ${isFlagged ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>{isFlagged ? 'Đã cắm cờ xem lại' : 'Đánh dấu xem lại'}</span>
          </button>
        </div>

        {/* Question Content */}
        <div className="mt-6">
          <h2 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
            {currentQ.content}
          </h2>
        </div>

        {/* Answer Section */}
        {currentQ.type === 'MCQ' && currentQ.options && (
          <MCQOptionsGroup
            options={currentQ.options}
            selectedOption={currentAns?.selectedOption}
            onSelect={(key) => selectOption(currentQ.id, key)}
          />
        )}

        {currentQ.type === 'ESSAY' && (
          <EssayEditor
            value={currentAns?.essayText || ''}
            onChange={(text) => updateEssayText(currentQ.id, text)}
            rubricCount={currentQ.rubricCount || currentQ.rubric?.length}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
        <button
          onClick={() => goToQuestion(currentIndex - 1)}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        <button
          onClick={() => goToQuestion(currentIndex + 1)}
          disabled={currentIndex === total - 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-orange-600/20 transition-all"
        >
          <span>Câu tiếp theo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
