import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DocumentAPI, ExamAPI } from '../services/api';
import { DocumentItem, Exam } from '../types';
import { 
  BookOpen, 
  UploadCloud, 
  Sparkles, 
  Play, 
  Clock, 
  FileText, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  TrendingUp,
  FileCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docs, exms] = await Promise.all([DocumentAPI.list(), ExamAPI.list()]);
        setDocuments(docs);
        setExams(exms);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartExam = async (examId: string) => {
    try {
      const data = await ExamAPI.startAttempt(examId);
      navigate(`/exams/${examId}/take?attempt=${data.attempt_id}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Không thể khởi tạo phiên thi');
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Hero Banner (Light & Vibrant Red-Orange Gradient) */}
      <div className="relative rounded-3xl p-8 sm:p-10 overflow-hidden bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 shadow-xl border border-orange-500/20 text-white">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Nền tảng Khảo thí Thông minh AI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Biến Mọi Tài Liệu Giáo Trình Thành Bộ Đề Thi & Chấm AI
          </h1>
          <p className="text-sm sm:text-base text-orange-100 leading-relaxed font-normal">
            Hỗ trợ phân tích ngữ nghĩa tài liệu PDF & DOCX, tự động sinh trắc nghiệm khách quan 4 phương án, câu hỏi tự luận theo barem Rubric và đánh giá năng lực toàn diện Bloom Taxonomy.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/documents/upload"
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white hover:bg-slate-50 text-orange-700 shadow-lg shadow-orange-950/20 flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4 text-orange-600" />
              <span>Tải tài liệu mới lên</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tài liệu đã bóc tách</p>
            <h4 className="text-2xl font-black text-slate-900">{documents.length}</h4>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Bộ đề thi khả dụng</p>
            <h4 className="text-2xl font-black text-slate-900">{exams.length}</h4>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Câu hỏi đã sinh</p>
            <h4 className="text-2xl font-black text-slate-900">
              {exams.reduce((sum, e) => sum + e.questions.length, 0)}
            </h4>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Chuẩn khảo thí</p>
            <h4 className="text-base font-extrabold text-slate-900">Bloom Taxonomy</h4>
          </div>
        </div>
      </div>

      {/* Main Section: Exams & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Exams List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
              <span>Ngân Hàng Đề Thi Khả Dụng</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              Đang tải danh sách đề thi...
            </div>
          ) : exams.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
              <p className="text-slate-500 text-sm">Chưa có đề thi nào được tạo.</p>
              <Link
                to="/documents/upload"
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-500 font-semibold text-sm"
              >
                <span>Tải tài liệu lên để tạo đề ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          exam.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {exam.status === 'PUBLISHED' ? 'Đã Xuất Bản' : 'Đang Biên Tập'}
                      </span>
                      {exam.accessCode && (
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Mã: {exam.accessCode}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {exam.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {exam.suggestedDurationMinutes} phút
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-slate-700">{exam.questions.length}</strong> câu hỏi (MCQ + Tự luận Rubric)
                      </span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">
                        Thang điểm: {exam.totalScore}đ
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {exam.status === 'PUBLISHED' ? (
                      <button
                        onClick={() => handleStartExam(exam.id)}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all active:scale-[0.98]"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Vào phòng thi</span>
                      </button>
                    ) : (
                      <Link
                        to={`/exams/${exam.id}/review`}
                        className="px-4 py-2.5 rounded-xl font-bold text-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 flex items-center gap-2 transition-colors"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Xem lại & Duyệt đề</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Documents Library */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Tài Liệu Đã Nạp</span>
            </h2>
            <Link
              to="/documents/upload"
              className="text-xs font-bold text-orange-600 hover:text-orange-500"
            >
              + Tải lên
            </Link>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-orange-50 text-orange-700 border border-orange-100">
                      {doc.fileType}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {doc.filename}
                    </h4>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>Số từ bóc tách: <strong className="text-slate-800">{doc.totalWords || 0}</strong> từ</p>
                  <p>Phân đoạn RAG: <strong className="text-slate-800">{doc.chunksCount || 0}</strong> chunks (1.200 ký tự)</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã sẵn sàng sinh đề
                  </span>
                  <Link
                    to={`/documents/${doc.id}/generate`}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tạo đề AI</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
