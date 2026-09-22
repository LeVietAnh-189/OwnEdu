import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, BrainCircuit, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ExamWaitingPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [progress, setProgress] = useState<number>(10);
  const [currentStep, setCurrentStep] = useState<string>('QUEUED');
  const [message, setMessage] = useState<string>('Đang khởi động hàng đợi tác vụ AI...');
  const [examId, setExamId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Connect to Server-Sent Events stream
    const eventSource = new EventSource(`/api/v1/exams/jobs/${jobId}/stream`);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.progressPercent) setProgress(data.progressPercent);
        if (data.step) setCurrentStep(data.step);
        if (data.message) setMessage(data.message);

        if (data.step === 'COMPLETED' && data.examId) {
          setExamId(data.examId);
          eventSource.close();

          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });

          // Redirect to Review Screen after a brief pause
          setTimeout(() => {
            navigate(`/exams/${data.examId}/review`);
          }, 1400);
        }

        if (data.step === 'FAILED') {
          setError(data.error || 'Có lỗi phát sinh trong quá trình sinh đề.');
          eventSource.close();
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = (e) => {
      console.warn('SSE connection error:', e);
    };

    return () => {
      eventSource.close();
    };
  }, [jobId, navigate]);

  const steps = [
    { key: 'FETCHING_CONTEXT', label: '1. Bóc tách & Tập hợp Chunks', percent: 15 },
    { key: 'CALLING_LLM', label: '2. Prompt Engine & Sinh đề Bloom', percent: 45 },
    { key: 'VALIDATING_SCHEMA', label: '3. Thẩm định Rubric & Schema JSON', percent: 85 },
    { key: 'COMPLETED', label: '4. Hoàn tất & Sẵn sàng Review', percent: 100 },
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-16 space-y-8 text-center max-w-3xl mx-auto">
      {/* Animated AI Brain Icon */}
      <div className="relative inline-block">
        <div className="w-24 h-24 rounded-3xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 mx-auto shadow-md">
          <BrainCircuit className="w-12 h-12 animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          AI Đang Thiết Kế Bộ Đề Thi Khảo Thí
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          Quá trình kết hợp kỹ thuật Context Injection và cấu trúc hóa Rubric đa tiêu chí đang diễn ra trong thời gian thực.
        </p>
      </div>

      {error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 text-left">
          {/* Progress Bar Header */}
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-slate-800 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
              <span>Tiến độ tạo đề</span>
            </span>
            <span className="text-orange-600 font-mono text-base font-black">{progress}%</span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-600 via-rose-600 to-emerald-500 transition-all duration-500 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current Status Message */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="italic font-medium">{message}</span>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-3 pt-2">
            {steps.map((step) => {
              const isDone = progress >= step.percent;
              const isCurrent = currentStep === step.key;

              return (
                <div
                  key={step.key}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-colors ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : isCurrent
                      ? 'bg-orange-50 border-orange-200 text-orange-800 font-bold'
                      : 'bg-slate-50/50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300" />
                    )}
                    <span className="font-semibold">{step.label}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold">{step.percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
