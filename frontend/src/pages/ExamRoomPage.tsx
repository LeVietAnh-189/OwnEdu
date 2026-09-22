import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AttemptAPI, ExamAPI } from '../services/api';
import { useExamStore } from '../store/examStore';
import { ExamHeader } from '../components/layout/ExamHeader';
import { QuestionViewer } from '../components/exam/QuestionViewer';
import { QuestionPalette } from '../components/exam/QuestionPalette';
import { SubmitModal } from '../components/exam/SubmitModal';
import { AlertCircle, WifiOff } from 'lucide-react';

export const ExamRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const attemptIdParam = searchParams.get('attempt');
  const navigate = useNavigate();

  const {
    initSession,
    attemptId,
    setOfflineStatus,
    isOffline,
  } = useExamStore();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize Session
  useEffect(() => {
    const startOrRestore = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let data: any;
        if (attemptIdParam) {
          data = await AttemptAPI.get(attemptIdParam);
        } else if (id) {
          data = await ExamAPI.startAttempt(id);
        } else {
          throw new Error('Thiếu tham số đề thi hoặc phiên thi.');
        }

        if (data.status === 'SUBMITTED' || data.status === 'GRADED') {
          // Already submitted, redirect to results
          navigate(`/exams/${data.exam_id}/results/${data.attempt_id}`);
          return;
        }

        initSession({
          attemptId: data.attempt_id,
          examId: data.exam_id,
          examTitle: data.exam_title,
          expiresAt: data.expires_at,
          questions: data.questions,
          initialAnswers: data.answers || {},
        });
      } catch (err: any) {
        console.error('Exam Room load error:', err);
        setError(err.response?.data?.error?.message || err.message || 'Lỗi tải phòng thi.');
      } finally {
        setIsLoading(false);
      }
    };

    startOrRestore();
  }, [id, attemptIdParam, initSession, navigate]);

  // Handle BeforeUnload and Network Status
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Bạn đang trong phòng thi! Đồng hồ vẫn đang tiếp tục đếm ngược.';
      return e.returnValue;
    };

    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

  const handleSubmitAttempt = async (type = 'MANUAL') => {
    if (!attemptId) return;

    try {
      setIsSubmitting(true);
      const res = await AttemptAPI.submit(attemptId, type);
      setIsSubmitModalOpen(false);

      // Redirect to Result screen
      navigate(`/exams/${id}/results/${attemptId}`);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Có lỗi xảy ra khi nộp bài.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-semibold text-sm">Đang tải và đồng bộ phòng thi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="glass-panel max-w-md w-full rounded-2xl p-6 text-center space-y-4 border border-rose-200 bg-white shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Không Thể Vào Phòng Thi</h3>
          <p className="text-xs text-slate-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            Quay lại trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Exam Focus Header */}
      <ExamHeader onAutoSubmit={() => handleSubmitAttempt('AUTO_TIMEOUT')} />

      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-800 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600" />
          <span>Bạn đang mất kết nối mạng. Mọi bài làm đang được lưu tạm trên thiết bị và sẽ tự động gửi lên máy chủ khi có mạng lại.</span>
        </div>
      )}

      {/* Exam Main Arena (70% Question / 30% Palette Layout) */}
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
          {/* Question Viewer: 70% / 8 Cols */}
          <div className="lg:col-span-8 h-full">
            <QuestionViewer />
          </div>

          {/* Question Palette: 30% / 4 Cols */}
          <div className="lg:col-span-4 h-full">
            <QuestionPalette onSubmitClick={() => setIsSubmitModalOpen(true)} />
          </div>
        </div>
      </main>

      {/* Final Submit Confirmation Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={() => handleSubmitAttempt('MANUAL')}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
