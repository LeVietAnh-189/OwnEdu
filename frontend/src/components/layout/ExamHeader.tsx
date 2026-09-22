import React from 'react';
import { Sparkles, CheckCircle2, Loader2, WifiOff, LogOut } from 'lucide-react';
import { CountdownTimer } from '../exam/CountdownTimer';
import { useExamStore } from '../../store/examStore';
import { useNavigate } from 'react-router-dom';

interface ExamHeaderProps {
  onAutoSubmit: () => void;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({ onAutoSubmit }) => {
  const navigate = useNavigate();
  const { examTitle, isSyncing, lastSavedAt, isOffline } = useExamStore();

  const handleExit = () => {
    const confirm = window.confirm(
      'Bạn đang trong phòng thi! Toàn bộ bài làm đã được lưu nhưng đồng hồ vẫn tiếp tục đếm ngược. Bạn có chắc muốn rời phòng thi?'
    );
    if (confirm) {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
      {/* Brand & Exam Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/20">
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900 hidden md:inline">
            OwnEdu
          </span>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden md:block" />

        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 max-w-md md:max-w-xl truncate">
            {examTitle || 'Đề thi trực tuyến'}
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Chế độ thi tập trung (Fullscreen Focus)</p>
        </div>
      </div>

      {/* Sync Status & Timer & Exit */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Auto-save Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          {isOffline ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-medium">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Đang Offline (Lưu tạm máy)</span>
            </span>
          ) : isSyncing ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-medium animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang lưu...</span>
            </span>
          ) : lastSavedAt ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã tự động lưu {lastSavedAt} ✓</span>
            </span>
          ) : null}
        </div>

        {/* Countdown Timer */}
        <CountdownTimer onExpire={onAutoSubmit} />

        {/* Exit Button */}
        <button
          onClick={handleExit}
          title="Rời phòng thi"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
