import React from 'react';
import { MCQOption } from '../../types';

interface MCQOptionsGroupProps {
  options: MCQOption[];
  selectedOption?: string;
  onSelect: (key: string) => void;
}

export const MCQOptionsGroup: React.FC<MCQOptionsGroupProps> = ({
  options,
  selectedOption,
  onSelect,
}) => {
  return (
    <div className="space-y-3 my-6">
      {options.map((opt) => {
        const isSelected = selectedOption === opt.key;

        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
              isSelected
                ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {/* Key badge */}
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                isSelected
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {opt.key}
            </span>

            {/* Option content */}
            <span className="text-sm sm:text-base leading-relaxed pt-1 flex-1 font-normal">
              {opt.content}
            </span>
          </button>
        );
      })}
    </div>
  );
};
