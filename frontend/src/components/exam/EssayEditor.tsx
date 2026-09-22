import React from 'react';
import { PenLine, FileText, Info } from 'lucide-react';

interface EssayEditorProps {
  value: string;
  onChange: (text: string) => void;
  rubricCount?: number;
}

export const EssayEditor: React.FC<EssayEditorProps> = ({
  value,
  onChange,
  rubricCount = 0,
}) => {
  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="my-6 space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 font-medium">
          <PenLine className="w-3.5 h-3.5 text-orange-600" />
          <span>Khung soạn thảo bài làm tự luận</span>
        </div>
        {rubricCount > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <Info className="w-3.5 h-3.5" />
            <span>Chấm theo barem {rubricCount} tiêu chí Rubric</span>
          </span>
        )}
      </div>

      <div className="relative rounded-2xl border border-slate-300 bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 shadow-xs transition-all">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder="Nhập nội dung bài làm tự luận của bạn tại đây... Hãy lập luận chặt chẽ, chia rõ các luận điểm theo yêu cầu của đề bài để đạt điểm barem tối đa."
          className="w-full p-4 bg-transparent text-slate-800 placeholder-slate-400 text-sm leading-relaxed outline-none resize-y"
        />

        {/* Footer info bar */}
        <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Số từ: <strong className="text-slate-800">{wordCount}</strong> từ
            </span>
          </div>
          <span className="italic text-slate-500">Tự động lưu sau 2 giây dừng gõ</span>
        </div>
      </div>
    </div>
  );
};
