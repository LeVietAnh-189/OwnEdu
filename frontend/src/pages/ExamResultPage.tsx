import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AttemptAPI } from '../services/api';
import { GradeReport, Question } from '../types';
import { ScoreHeroCard } from '../components/results/ScoreHeroCard';
import { BloomRadarChart } from '../components/results/BloomRadarChart';
import { RubricFeedbackCard } from '../components/results/RubricFeedbackCard';
import { KnowledgeGapList } from '../components/results/KnowledgeGapList';
import { TeacherOverrideModal } from '../components/results/TeacherOverrideModal';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Award, 
  Layers, 
  History, 
  BookOpen 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ExamResultPage: React.FC = () => {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();

  const [report, setReport] = useState<GradeReport | null>(null);
  const [examTitle, setExamTitle] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Override Modal state
  const [overrideQId, setOverrideQId] = useState<string | null>(null);

  const fetchResult = async () => {
    if (!attemptId) return;
    try {
      setIsLoading(true);
      const data = await AttemptAPI.getResult(attemptId);
      setReport(data.report);
      setExamTitle(data.exam_title);
      setQuestions(data.questions);

      if (data.report.finalScore >= 8.0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Không thể tải báo cáo điểm.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const handleTeacherOverrideSubmit = async (newScore: number, reason: string) => {
    if (!attemptId || !overrideQId) return;
    await AttemptAPI.overrideGrade(attemptId, {
      question_id: overrideQId,
      new_score: newScore,
      override_reason: reason,
    });
    // Refresh result
    await fetchResult();
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-16 text-center text-slate-500">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-semibold text-sm">Đang tổng hợp báo cáo điểm & biểu đồ năng lực...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center text-slate-500 space-y-4">
        <p className="text-sm text-rose-600 font-semibold">{error || 'Không tìm thấy kết quả.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>
    );
  }

  const selectedOverrideQuestion = questions.find((q) => q.id === overrideQId);
  const selectedEval = report.rubricEvaluations.find((e) => e.questionId === overrideQId);

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về thư viện bài thi</span>
        </Link>
      </div>

      {/* Hero Score Card */}
      <ScoreHeroCard report={report} examTitle={examTitle} />

      {/* Radar Chart & Knowledge Gaps Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 h-full">
          <BloomRadarChart bloomAnalytics={report.bloomAnalytics} />
        </div>
        <div className="lg:col-span-6 h-full">
          <KnowledgeGapList gaps={report.knowledgeGaps} />
        </div>
      </div>

      {/* Detailed Questions & AI Feedback */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-600" />
            <span>Chi Tiết Từng Câu Hỏi & Thẩm Định Của AI</span>
          </h2>
        </div>

        {/* MCQ Results */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Phần I: Câu hỏi trắc nghiệm khách quan (MCQ)
          </h3>

          <div className="space-y-3">
            {report.mcqDetails.map((detail, idx) => {
              const q = questions.find((item) => item.id === detail.questionId);
              return (
                <div
                  key={detail.questionId}
                  className={`p-5 rounded-2xl border text-xs transition-all ${
                    detail.isCorrect
                      ? 'bg-white border-emerald-200 shadow-xs'
                      : 'bg-white border-rose-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {detail.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-800 text-sm">
                        Câu {(idx + 1).toString().padStart(2, '0')}: {q?.content}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-lg font-bold shrink-0 ${
                        detail.isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {detail.points} / {q?.points} đ
                    </span>
                  </div>

                  <div className="pl-6 space-y-1.5 pt-1 text-slate-600">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span>
                        Đáp án bạn chọn:{' '}
                        <strong
                          className={detail.isCorrect ? 'text-emerald-700' : 'text-rose-600'}
                        >
                          [{detail.selectedOption || 'Bỏ trống'}]
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Đáp án chuẩn: <strong className="text-emerald-700">[{detail.correctAnswer}]</strong>
                      </span>
                    </div>

                    <p className="text-slate-500 italic mt-1 leading-relaxed">
                      Giải thích: {detail.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Essay Results with Rubrics */}
        {report.rubricEvaluations && report.rubricEvaluations.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Phần II: Câu hỏi tự luận thẩm định theo barem Rubric
            </h3>

            {report.rubricEvaluations.map((evalItem) => {
              const q = questions.find((item) => item.id === evalItem.questionId);
              return (
                <RubricFeedbackCard
                  key={evalItem.questionId}
                  evaluation={evalItem}
                  question={q}
                  onTeacherOverride={(qId) => setOverrideQId(qId)}
                />
              );
            })}
          </div>
        )}

        {/* Teacher Audit Trail Log */}
        {report.auditLogs && report.auditLogs.length > 0 && (
          <div className="p-6 rounded-2xl glass-panel border border-slate-200 bg-white shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <span>Nhật ký can thiệp & sửa điểm của Giáo viên (Audit Trail)</span>
            </h4>

            <div className="space-y-2">
              {report.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800">
                      Giáo viên ({log.teacherId}): Thay đổi điểm từ {log.oldScore}đ ➔ {log.newScore}đ
                    </span>
                    <p className="text-slate-500 italic">"{log.overrideReason}"</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px] shrink-0">
                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Teacher Override Modal */}
      {overrideQId && selectedEval && selectedOverrideQuestion && (
        <TeacherOverrideModal
          isOpen={Boolean(overrideQId)}
          onClose={() => setOverrideQId(null)}
          questionId={overrideQId}
          maxScore={selectedOverrideQuestion.points}
          currentScore={selectedEval.earnedPoints}
          onSubmit={handleTeacherOverrideSubmit}
        />
      )}
    </div>
  );
};
