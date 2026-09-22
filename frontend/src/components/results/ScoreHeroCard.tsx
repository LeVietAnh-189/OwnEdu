import React from 'react';
import { Trophy, CheckCircle2, Clock, Award, ShieldCheck } from 'lucide-react';
import { GradeReport } from '../../types';

interface ScoreHeroCardProps {
  report: GradeReport;
  examTitle: string;
}

export const ScoreHeroCard: React.FC<ScoreHeroCardProps> = ({ report, examTitle }) => {
  const isPassed = report.finalScore >= 5.0;
  const isExcellent = report.finalScore >= 8.0;

  const minutes = Math.floor(report.completionTimeSeconds / 60);
  const seconds = report.completionTimeSeconds % 60;

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 bg-white shadow-sm relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-orange-50/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
                Báo cáo kết quả khảo thí
              </span>
              {report.status === 'OVERRIDDEN' && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Giáo viên đã sửa điểm</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {examTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>
              Thời gian làm bài: <strong className="text-slate-800">{minutes} phút {seconds} giây</strong>
            </span>
          </div>
        </div>

        {/* Big 3 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {/* Total Score */}
          <div className={`p-6 rounded-2xl border transition-all ${
            isExcellent 
              ? 'bg-gradient-to-br from-orange-50 to-emerald-50 border-emerald-300 shadow-xs'
              : isPassed
              ? 'bg-slate-50 border-orange-200'
              : 'bg-rose-50/60 border-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tổng điểm toàn bài
              </span>
              <Trophy className={`w-5 h-5 ${isExcellent ? 'text-amber-500' : 'text-orange-600'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                {report.finalScore}
              </span>
              <span className="text-slate-500 font-semibold text-lg">/ 10.0</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <span className={`font-bold ${isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isExcellent ? 'Xuất sắc 🎉' : isPassed ? 'Đạt chuẩn yêu cầu ✓' : 'Cần ôn tập thêm ⚠️'}
              </span>
            </div>
          </div>

          {/* MCQ Score */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Điểm trắc nghiệm
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {report.mcqScore}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({report.correctMcqCount}/{report.totalMcqCount} câu đúng)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Chấm tức thì &lt; 50ms bằng Deterministic Engine
            </p>
          </div>

          {/* Essay Score */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Điểm tự luận Rubric
              </span>
              <Award className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                {report.essayScore}
              </span>
              <span className="text-xs text-rose-700 font-medium">
                (Thẩm định AI)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Đánh giá bám sát từng tiêu chí barem Rubric
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
