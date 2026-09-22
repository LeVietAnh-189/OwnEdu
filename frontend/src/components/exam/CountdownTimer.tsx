import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useExamStore } from '../../store/examStore';

interface CountdownTimerProps {
  onExpire: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ onExpire }) => {
  const { expiresAt, updateRemainingTime } = useExamStore();
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!expiresAt) return 45 * 60;
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      updateRemainingTime(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire, updateRemainingTime]);

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isWarning = secondsLeft <= 300 && secondsLeft > 60; // < 5 mins
  const isDanger = secondsLeft <= 60; // < 1 min

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition-all ${
        isDanger
          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse shadow-sm'
          : isWarning
          ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm'
          : 'bg-slate-100 text-slate-800 border-slate-200'
      }`}
    >
      {isDanger ? (
        <AlertTriangle className="w-4 h-4 text-rose-600" />
      ) : (
        <Clock className={`w-4 h-4 ${isWarning ? 'text-amber-600' : 'text-orange-600'}`} />
      )}
      <span>{formatTime(secondsLeft)}</span>
      <span className="text-[10px] font-sans uppercase tracking-wider text-slate-500 font-semibold hidden md:inline">
        ⏱
      </span>
    </div>
  );
};
