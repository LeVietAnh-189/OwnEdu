import React from 'react';
import { KnowledgeGap } from '../../types';
import { AlertOctagon, BookOpen, ArrowRight } from 'lucide-react';

interface KnowledgeGapListProps {
  gaps: KnowledgeGap[];
}

export const KnowledgeGapList: React.FC<KnowledgeGapListProps> = ({ gaps }) => {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm text-center text-slate-500">
        <p className="text-sm">Không phát hiện lỗ hổng kiến thức nghiêm trọng! Chúc mừng bạn đã nắm rất tốt bài giảng.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertOctagon className="w-5 h-5 text-amber-500" />
        <h3 className="font-bold text-base text-slate-800">
          Lỗ Hổng Kiến Thức & Gợi Ý Ôn Tập
        </h3>
      </div>

      <div className="space-y-3">
        {gaps.map((gap, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs"
          >
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] text-amber-700">
                {idx + 1}
              </span>
              <span>{gap.topic}</span>
            </div>

            <p className="text-slate-700 pl-7 leading-relaxed">
              {gap.issue}
            </p>

            <div className="pl-7 pt-1 flex items-center gap-2 text-orange-600 font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{gap.recommendedStudy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
