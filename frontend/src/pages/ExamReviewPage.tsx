import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExamAPI } from '../services/api';
import { Exam, Question } from '../types';
import { 
  FileCheck2, 
  Send, 
  Sparkles, 
  Clock, 
  Layers, 
  Edit2, 
  Check, 
  Play,
  Save,
  CheckCircle2
} from 'lucide-react';

export const ExamReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editAnswer, setEditAnswer] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isSavingQ, setIsSavingQ] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const fetchExam = async () => {
      try {
        const data = await ExamAPI.get(id);
        setExam(data);
      } catch (err) {
        console.error('Error loading exam for review:', err);
      }
    };
    fetchExam();
  }, [id]);

  const handleStartEdit = (q: Question) => {
    setEditingQId(q.id);
    setEditContent(q.content);
    setEditAnswer(q.correctAnswer || 'A');
  };

  const handleSaveEdit = async (qId: string) => {
    if (!id) return;
    try {
      setIsSavingQ(true);
      const updated = await ExamAPI.updateQuestion(id, qId, {
        content: editContent,
        correctAnswer: editAnswer as any,
      });

      if (exam) {
        setExam({
          ...exam,
          questions: exam.questions.map((q) => (q.id === qId ? { ...q, ...updated } : q)),
        });
      }
      setEditingQId(null);
    } catch (err) {
      console.error('Error saving question:', err);
    } finally {
      setIsSavingQ(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    try {
      setIsPublishing(true);
      const updated = await ExamAPI.publish(id);
      setExam(updated);
      alert('Đề thi đã được xuất bản chính thức thành công!');
    } catch (err) {
      console.error('Publish error:', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleStartTake = async () => {
    if (!id) return;
    try {
      const data = await ExamAPI.startAttempt(id);
      navigate(`/exams/${id}/take?attempt=${data.attempt_id}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể bắt đầu làm bài.');
    }
  };

  if (!exam) {
    return <div className="p-12 text-center text-slate-500">Đang tải chi tiết đề thi...</div>;
  }

  const isPublished = exam.status === 'PUBLISHED';

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-10 space-y-8 text-slate-900">
      {/* Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isPublished ? 'Đã Xuất Bản' : 'Sẵn Sàng Review'}
            </span>
            {exam.accessCode && (
              <span className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Mã: {exam.accessCode}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {exam.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap font-medium">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              {exam.suggestedDurationMinutes} phút
            </span>
            <span>•</span>
            <span>{exam.questions.length} câu hỏi</span>
            <span>•</span>
            <span className="text-emerald-600 font-bold">Tổng: {exam.totalScore} điểm</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!isPublished ? (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isPublishing ? 'Đang xuất bản...' : 'Xuất bản đề thi ngay'}</span>
            </button>
          ) : (
            <button
              onClick={handleStartTake}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Bắt đầu thi thử nghiệm</span>
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-orange-600" />
          <span>Danh Sách Câu Hỏi ({exam.questions.length} câu)</span>
        </h2>

        {exam.questions.map((q, idx) => {
          const isEditing = editingQId === q.id;

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 transition-all"
            >
              {/* Question Item Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm text-slate-900">
                    Câu {(idx + 1).toString().padStart(2, '0')}:
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                    {q.type === 'MCQ' ? 'Trắc nghiệm (4 lựa chọn)' : 'Tự luận theo Rubric'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {q.bloomLevel}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{q.points} điểm</span>
                </div>

                {!isEditing && !isPublished && (
                  <button
                    onClick={() => handleStartEdit(q)}
                    className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-bold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa câu hỏi</span>
                  </button>
                )}
              </div>

              {/* Content Body */}
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nội dung câu hỏi:
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      className="w-full p-3 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:border-orange-600 focus:outline-none"
                    />
                  </div>

                  {q.type === 'MCQ' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Đáp án đúng:
                      </label>
                      <select
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:border-orange-600 focus:outline-none"
                      >
                        <option value="A">Phương án A</option>
                        <option value="B">Phương án B</option>
                        <option value="C">Phương án C</option>
                        <option value="D">Phương án D</option>
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setEditingQId(null)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleSaveEdit(q.id)}
                      disabled={isSavingQ}
                      className="px-4 py-2 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {q.content}
                  </p>

                  {/* MCQ Options Rendering */}
                  {q.type === 'MCQ' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2">
                      {q.options.map((opt) => {
                        const isCorrect = q.correctAnswer === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span className="leading-relaxed">{opt.content}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Essay Rubric Rendering */}
                  {q.type === 'ESSAY' && (
                    <div className="pt-2 space-y-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800">Đáp án chuẩn mực (Benchmark Answer):</span>
                        <p className="text-slate-600 mt-1 italic leading-relaxed">
                          "{q.benchmarkAnswer}"
                        </p>
                      </div>

                      {q.rubric && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                            Barem tiêu chí Rubric:
                          </span>
                          {q.rubric.map((r, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between text-slate-800"
                            >
                              <span>• {r.criteria}</span>
                              <span className="font-bold text-emerald-600 font-mono">
                                {r.maxPoints} đ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
