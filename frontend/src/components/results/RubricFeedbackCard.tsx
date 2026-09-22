import React from 'react';
import { EssayGradingResult, Question } from '../../types';
import { Award, CheckCircle, AlertTriangle, Edit3, MessageSquareQuote } from 'lucide-react';

interface RubricFeedbackCardProps {
  evaluation: EssayGradingResult;
  question?: Question;
  onTeacherOverride: (qId: string) => void;
}

export const RubricFeedbackCard: React.FC<RubricFeedbackCardProps> = ({
  evaluation,
  question,
  onTeacherOverride,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm mb-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Câu hỏi tự luận
            </span>
            <span className="text-sm font-bold text-slate-900">
              {question?.content.slice(0, 70)}...
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1 text-sm font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-emerald-700">{evaluation.earnedPoints}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-700">{evaluation.maxPoints} đ</span>
          </div>

          <button
            onClick={() => onTeacherOverride(evaluation.questionId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Giáo viên sửa điểm</span>
          </button>
        </div>
      </div>

      {/* AI General Comment */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
        <MessageSquareQuote className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-slate-700 mb-1">Nhận xét tổng thể từ AI:</h4>
          <p className="text-sm text-slate-700 leading-relaxed italic">
            "{evaluation.generalComment}"
          </p>
        </div>
      </div>

      {/* Rubric Criteria Breakdown */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-emerald-600" />
          <span>Chi tiết thẩm định từng tiêu chí Rubric</span>
        </h4>

        <div className="space-y-2.5">
          {evaluation.rubricEvaluations.map((item, idx) => {
            const isFull = item.earnedPoints === item.maxPoints;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {isFull ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800">
                      Tiêu chí {idx + 1}: {item.criteria}
                    </span>
                  </div>
                  <p className="text-slate-600 pl-6 leading-relaxed">
                    {item.feedback}
                  </p>
                </div>

                <div className="pl-6 sm:pl-0 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg font-bold ${
                      isFull
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.earnedPoints} / {item.maxPoints} đ
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
