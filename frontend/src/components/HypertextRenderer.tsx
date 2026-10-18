import React, { useState } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  AlertTriangle, 
  Info, 
  BookOpen, 
  ExternalLink,
  HelpCircle,
  Check,
  X,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  LayoutGrid,
  Eye
} from 'lucide-react';
import { InteractiveCodeBlock } from './common/InteractiveCodeBlock';

const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.trim().match(regExp);
  return match ? match[1] : null;
};

// Helper to parse inline styles: **bold**, *italic*, `code`, [link](url)
const renderInline = (text: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/;

  while (remaining.length > 0) {
    const match = remaining.match(tokenRegex);
    if (!match) {
      elements.push(remaining);
      break;
    }

    const matchIdx = match.index || 0;
    if (matchIdx > 0) {
      elements.push(remaining.substring(0, matchIdx));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      elements.push(
        <strong key={`b-${keyIdx++}`} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      const inner = token.slice(1, -1);
      elements.push(
        <em key={`i-${keyIdx++}`} className="italic text-slate-800">
          {inner}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      const inner = token.slice(1, -1);
      elements.push(
        <code
          key={`c-${keyIdx++}`}
          className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-xs md:text-[13px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/90 shadow-2xs inline-block"
        >
          {inner}
        </code>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const labelMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (labelMatch) {
        const [, label, url] = labelMatch;
        elements.push(
          <a
            key={`a-${keyIdx++}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-orange-600 hover:text-orange-700 underline font-semibold inline-flex items-center gap-0.5 transition-colors"
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        );
      } else {
        elements.push(token);
      }
    } else {
      elements.push(token);
    }

    remaining = remaining.substring(matchIdx + token.length);
  }

  return elements;
};

// Interactive Quiz Subcomponent for Learners
const InteractiveQuizBlock: React.FC<{
  title?: string;
  question: string;
  options: { text: string; isCorrect: boolean }[];
  explanation?: string;
}> = ({ title, question, options, explanation }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  return (
    <div className="my-6 rounded-3xl border border-purple-200/90 bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
          <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
          <span>{title || 'Câu hỏi trắc nghiệm tương tác'}</span>
        </span>
      </div>

      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
        {renderInline(question)}
      </h4>

      <div className="space-y-2.5">
        {options.map((opt, idx) => {
          const letter = String.fromCharCode(65 + idx);
          const isSelected = selectedIdx === idx;
          const cleanText = opt.text.replace(/^[A-Da-d][.)\s-]\s*/, '').trim() || opt.text;
          let btnStyle = 'border-slate-200 bg-white hover:border-purple-300 text-slate-800';

          if (hasSubmitted) {
            if (opt.isCorrect) {
              btnStyle = 'border-emerald-400 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-400/30';
            } else if (isSelected && !opt.isCorrect) {
              btnStyle = 'border-rose-300 bg-rose-50 text-rose-950 ring-2 ring-rose-400/30';
            } else {
              btnStyle = 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
            }
          } else if (isSelected) {
            btnStyle = 'border-purple-500 bg-purple-50/80 text-purple-950 ring-2 ring-purple-400/30 font-semibold';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={hasSubmitted}
              onClick={() => setSelectedIdx(idx)}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${btnStyle}`}
            >
              <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                hasSubmitted && opt.isCorrect
                  ? 'bg-emerald-600 text-white'
                  : hasSubmitted && isSelected && !opt.isCorrect
                    ? 'bg-rose-500 text-white'
                    : isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600'
              }`}>
                {hasSubmitted && opt.isCorrect ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : hasSubmitted && isSelected && !opt.isCorrect ? (
                  <X className="w-4 h-4 stroke-[3]" />
                ) : (
                  letter
                )}
              </span>
              <span className="text-xs sm:text-sm flex-1">{cleanText}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        {!hasSubmitted ? (
          <button
            type="button"
            disabled={selectedIdx === null}
            onClick={() => setHasSubmitted(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 transition cursor-pointer shadow-sm shadow-purple-600/20"
          >
            Kiểm tra kết quả
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setHasSubmitted(false);
              setSelectedIdx(null);
            }}
            className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
          >
            Làm lại câu này
          </button>
        )}
      </div>

      {hasSubmitted && explanation && (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="font-bold text-slate-900 block">💡 Giải thích chi tiết:</span>
          <p className="leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
};

// Interactive 3D Flashcard Subcomponent for Learners
export interface FlashcardItem {
  id?: string;
  front: string;
  back: string;
}

const InteractiveFlashcardBlock: React.FC<{
  title?: string;
  description?: string;
  cards: FlashcardItem[];
}> = ({ title, description, cards }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [viewMode, setViewMode] = useState<'deck' | 'grid'>('deck');

  if (!cards || cards.length === 0) return null;

  const currentCard = cards[currentIndex] || cards[0];
  const isCurrentFlipped = !!flippedCards[currentIndex];

  const toggleFlip = (index: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
  };

  const handleFlipAll = (flipTo: boolean) => {
    const updated: Record<number, boolean> = {};
    cards.forEach((_, idx) => {
      updated[idx] = flipTo;
    });
    setFlippedCards(updated);
  };

  return (
    <div className="my-7 rounded-3xl border border-indigo-200/90 bg-gradient-to-b from-indigo-50/40 via-white to-purple-50/30 p-5 sm:p-7 shadow-sm space-y-5">
      {/* Block Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>{title || 'Ôn nhanh bằng flashcard'}</span>
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
              {cards.length} thẻ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            {description || 'Nhấp vào từng thẻ để lật và tự kiểm tra trước khi làm quiz.'}
          </p>
        </div>

        {cards.length > 1 && (
          <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('deck')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'deck' ? 'bg-white text-indigo-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Lật từng thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-white text-indigo-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Dạng lưới</span>
            </button>
          </div>
        )}
      </div>

      {/* Mode 1: DECK (1-by-1 focused study) */}
      {viewMode === 'deck' ? (
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* Card Component with 3D Flip */}
          <div
            onClick={() => toggleFlip(currentIndex)}
            className="relative w-full h-[240px] sm:h-[270px] cursor-pointer group perspective-1000 select-none"
            title="Nhấp vào thẻ để lật"
          >
            <div
              className={`w-full h-full rounded-3xl transition-transform duration-500 transform-style-3d shadow-md hover:shadow-xl relative ${
                isCurrentFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT (Khái niệm / Câu hỏi) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border-2 border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-end">
                  <span className="text-xs font-bold text-slate-500 bg-white/70 px-2.5 py-1 rounded-full border border-indigo-100 shadow-2xs">
                    Thẻ {currentIndex + 1} / {cards.length}
                  </span>
                </div>

                <div className="my-auto py-2 text-center overflow-y-auto max-h-[140px] px-2">
                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-relaxed">
                    {renderInline(currentCard.front)}
                  </h4>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600/80 group-hover:text-indigo-600 transition-colors">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Nhấp vào thẻ để lật</span>
                </div>
              </div>

              {/* BACK (Đáp án / Giải thích) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-end">
                  <span className="text-xs font-bold text-emerald-700 bg-white/70 px-2.5 py-1 rounded-full border border-emerald-100 shadow-2xs">
                    Thẻ {currentIndex + 1} / {cards.length}
                  </span>
                </div>

                <div className="my-auto py-2 text-center overflow-y-auto max-h-[140px] px-2">
                  <p className="text-sm sm:text-base md:text-[17px] font-medium text-slate-800 leading-relaxed">
                    {renderInline(currentCard.back)}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700/80 group-hover:text-emerald-700 transition-colors">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Nhấp vào thẻ để lật lại</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={cards.length <= 1}
              onClick={handlePrev}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Thẻ trước</span>
            </button>

            <div className="text-xs font-bold text-slate-500">
              Thẻ {currentIndex + 1} / {cards.length}
            </div>

            <button
              type="button"
              disabled={cards.length <= 1}
              onClick={handleNext}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-indigo-600/20"
            >
              <span>Thẻ tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Mode 2: GRID VIEW (All cards visible) */
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleFlipAll(true)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Lật tất cả
            </button>
            <button
              type="button"
              onClick={() => handleFlipAll(false)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Úp tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card, idx) => {
              const isFlipped = !!flippedCards[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleFlip(idx)}
                  className="relative w-full h-[220px] cursor-pointer group perspective-1000 select-none"
                  title="Nhấp vào thẻ để lật"
                >
                  <div
                    className={`w-full h-full rounded-2xl transition-transform duration-500 transform-style-3d shadow-xs hover:shadow-md relative ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    {/* FRONT */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Thẻ #{idx + 1}
                        </span>
                        <RotateCw className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition" />
                      </div>
                      <div className="my-auto py-2 text-center overflow-y-auto max-h-[110px] px-1">
                        <h5 className="text-sm font-bold text-slate-900 leading-snug">
                          {renderInline(card.front)}
                        </h5>
                      </div>
                      <div className="text-[11px] text-center font-medium text-indigo-600">
                        Nhấp vào thẻ để lật
                      </div>
                    </div>

                    {/* BACK */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                          Thẻ #{idx + 1}
                        </span>
                        <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <div className="my-auto py-2 text-center overflow-y-auto max-h-[110px] px-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                          {renderInline(card.back)}
                        </p>
                      </div>
                      <div className="text-[11px] text-center font-medium text-emerald-700">
                        Nhấp vào thẻ để lật lại
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface HypertextRendererProps {
  content: string;
  className?: string;
}

export const HypertextRenderer: React.FC<HypertextRendererProps> = ({ content, className = '' }) => {

  // Block-level parsing
  const parseBlocks = (raw: string) => {
    const lines = raw.split(/\r?\n/);
    const blocks: React.ReactNode[] = [];
    let i = 0;
    let blockId = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty lines
      if (line.trim().length === 0) {
        i++;
        continue;
      }

      // 0. Check for Flashcard Block (:::flashcard [title])
      if (line.trim().startsWith(':::flashcard')) {
        const rawTitle = line.trim().slice(12).trim();
        const flashcardLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(':::')) {
          flashcardLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith(':::')) {
          i++;
        }

        const cards: FlashcardItem[] = [];
        const cardChunks: string[][] = [[]];
        for (const fLine of flashcardLines) {
          if (fLine.trim() === '---' || fLine.trim() === '===') {
            cardChunks.push([]);
          } else {
            cardChunks[cardChunks.length - 1].push(fLine);
          }
        }

        for (const chunk of cardChunks) {
          if (chunk.length === 0) continue;
          let front = '';
          let back = '';
          let activeField: 'front' | 'back' | null = null;

          for (const cLine of chunk) {
            const trimmed = cLine.trim();
            if (!trimmed) continue;

            const frontMatch = trimmed.match(/^(?:Front|Mặt\s*trước|Hỏi|\*\*Hỏi\*\*|Q):\s*(.*)$/i);
            const backMatch = trimmed.match(/^(?:Back|Mặt\s*sau|Trả\s*lời|\*\*Trả\s*lời\*\*|A|Đáp\s*án):\s*(.*)$/i);

            if (frontMatch) {
              activeField = 'front';
              front = (front ? front + '\n' : '') + frontMatch[1].trim();
            } else if (backMatch) {
              activeField = 'back';
              back = (back ? back + '\n' : '') + backMatch[1].trim();
            } else if (activeField === 'front') {
              front = (front ? front + '\n' : '') + trimmed;
            } else if (activeField === 'back') {
              back = (back ? back + '\n' : '') + trimmed;
            } else if (!front) {
              front = trimmed;
              activeField = 'front';
            } else {
              back = (back ? back + '\n' : '') + trimmed;
              activeField = 'back';
            }
          }

          if (front && back) {
            cards.push({ front: front.trim(), back: back.trim() });
          } else if (front) {
            cards.push({ front: front.trim(), back: 'Chưa có nội dung mặt sau' });
          }
        }

        if (cards.length > 0) {
          blocks.push(
            <InteractiveFlashcardBlock
              key={`flashcard-${blockId++}`}
              title={rawTitle || 'Ôn nhanh bằng flashcard'}
              cards={cards}
            />
          );
          continue;
        }
      }

      // 1. Check for Quiz Block (:::quiz [title])
      if (line.trim().startsWith(':::quiz')) {
        const rawQuizHeader = line.trim().slice(7).trim();
        const quizLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(':::')) {
          quizLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith(':::')) {
          i++;
        }

        let title = rawQuizHeader;
        const options: { text: string; isCorrect: boolean }[] = [];
        let explanation = '';
        const questionLines: string[] = [];

        for (const qL of quizLines) {
          const trimmed = qL.trim();
          const optMatch = trimmed.match(/^-\s*\[([ xX*])\]\s*(.*)$/) || trimmed.match(/^-\s*\(([ xX*])\)\s*(.*)$/);
          if (optMatch) {
            const isCorrect = optMatch[1].toLowerCase() === 'x' || optMatch[1] === '*';
            options.push({ text: optMatch[2].trim(), isCorrect });
          } else if (trimmed.startsWith('- ')) {
            options.push({ text: trimmed.slice(2).trim(), isCorrect: options.length === 0 });
          } else if (trimmed.startsWith('>')) {
            explanation = (explanation ? explanation + '\n' : '') + trimmed.replace(/^>\s*/, '').trim();
          } else if (trimmed.length > 0 && options.length === 0) {
            questionLines.push(trimmed.replace(/^\*\*|\*\*$/g, '').trim());
          }
        }

        let question = '';
        if (questionLines.length > 1 && !title) {
          if (questionLines[0].length < 45 && !questionLines[0].includes('?')) {
            title = questionLines[0];
            question = questionLines.slice(1).join('\n\n');
          } else {
            question = questionLines.join('\n\n');
          }
        } else {
          question = questionLines.join('\n\n');
        }

        if (!question && title) {
          question = title;
          title = '';
        }

        if (options.length === 0) {
          options.push({ text: 'Phương án A', isCorrect: true }, { text: 'Phương án B', isCorrect: false });
        }

        blocks.push(
          <InteractiveQuizBlock
            key={`quiz-${blockId++}`}
            title={title}
            question={question || 'Câu hỏi trắc nghiệm:'}
            options={options}
            explanation={explanation}
          />
        );
        continue;
      }

      // 1. Check for Video Block (:::video [caption]\nurl\n:::)
      if (line.trim().startsWith(':::video')) {
        const caption = line.trim().slice(8).trim();
        const vidLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(':::')) {
          vidLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith(':::')) {
          i++;
        }
        const url = vidLines.join('\n').trim();
        if (url) {
          const ytId = extractYoutubeId(url);
          blocks.push(
            <figure key={`vid-${blockId++}`} className="my-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-950 aspect-video max-w-3xl mx-auto">
                {ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={caption || 'Video bài giảng'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={url}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              {caption && (
                <figcaption className="text-xs text-slate-500 mt-2.5 text-center font-medium italic">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }
        continue;
      }

      // 2. Check for Callout Block (e.g., :::keypoint, :::tip, :::warning, :::info)
      if (line.trim().startsWith(':::')) {
        const calloutHeader = line.trim().slice(3).trim();
        const spaceIdx = calloutHeader.indexOf(' ');
        const type = (spaceIdx !== -1 ? calloutHeader.slice(0, spaceIdx) : calloutHeader).toLowerCase() || 'keypoint';
        const customTitle = spaceIdx !== -1 ? calloutHeader.slice(spaceIdx + 1).trim() : '';

        const calloutLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith(':::')) {
          calloutLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith(':::')) {
          i++; // skip closing :::
        }

        // Tự động chuyển đổi các khối Callout chứa Hỏi/Trả lời thành Flashcard tương tác
        const hasQAPairs = calloutLines.some(l => /\b(hỏi|\*\*hỏi\*\*|front)\b/i.test(l)) &&
                           calloutLines.some(l => /\b(trả lời|\*\*trả lời\*\*|back)\b/i.test(l));
        if (hasQAPairs) {
          const cards: FlashcardItem[] = [];
          let front = '';
          let back = '';
          let active: 'front' | 'back' | null = null;
          for (const cL of calloutLines) {
            const tr = cL.trim();
            if (!tr) continue;
            const fM = tr.match(/^(?:Front|Mặt\s*trước|Hỏi|\*\*Hỏi\*\*|Q):\s*(.*)$/i);
            const bM = tr.match(/^(?:Back|Mặt\s*sau|Trả\s*lời|\*\*Trả\s*lời\*\*|A|Đáp\s*án):\s*(.*)$/i);
            if (fM) {
              if (front && back) {
                cards.push({ front, back });
                front = '';
                back = '';
              }
              active = 'front';
              front = fM[1].trim();
            } else if (bM) {
              active = 'back';
              back = bM[1].trim();
            } else if (active === 'front') {
              front = (front ? front + '\n' : '') + tr;
            } else if (active === 'back') {
              back = (back ? back + '\n' : '') + tr;
            }
          }
          if (front && back) {
            cards.push({ front, back });
          }
          if (cards.length > 0) {
            blocks.push(
              <InteractiveFlashcardBlock
                key={`flashcard-${blockId++}`}
                title={customTitle || 'Ôn nhanh bằng flashcard'}
                cards={cards}
              />
            );
            continue;
          }
        }

        // Style configurations for Callouts matching modern UI (like Sydexa / Notion)
        let borderClass = 'border-indigo-400 bg-indigo-50/50 text-indigo-950';
        let barClass = 'bg-indigo-600';
        let iconElem = <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />;
        let defaultTitle = 'Điểm Then Chốt Của Bài Học:';

        if (type === 'tip') {
          borderClass = 'border-emerald-300 bg-emerald-50/50 text-emerald-950';
          barClass = 'bg-emerald-500';
          iconElem = <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
          defaultTitle = 'Mẹo Hay / Lưu Ý Nhỏ:';
        } else if (type === 'warning') {
          borderClass = 'border-amber-300 bg-amber-50/50 text-amber-950';
          barClass = 'bg-amber-500';
          iconElem = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
          defaultTitle = 'Cảnh Báo Quan Trọng:';
        } else if (type === 'info') {
          borderClass = 'border-sky-300 bg-sky-50/50 text-sky-950';
          barClass = 'bg-sky-500';
          iconElem = <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />;
          defaultTitle = 'Thông Tin Bổ Sung:';
        } else if (type === 'exercise' || type === 'baitap' || type === 'task') {
          borderClass = 'border-orange-300 bg-orange-50/50 text-orange-950';
          barClass = 'bg-orange-500';
          iconElem = <BookOpen className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />;
          defaultTitle = 'Bài tập:';
        }

        const displayTitle = customTitle || defaultTitle;

        blocks.push(
          <div
            key={`callout-${blockId++}`}
            className={`my-5 rounded-2xl border ${borderClass} p-4 sm:p-5 shadow-xs relative overflow-hidden transition-all`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${barClass}`} />
            <div className="flex items-start gap-3">
              {iconElem}
              <div className="space-y-1.5 flex-1 min-w-0">
                {displayTitle && (
                  <h4 className="font-bold text-sm md:text-base text-slate-900 tracking-tight">
                    {displayTitle}
                  </h4>
                )}
                <div className="text-xs md:text-sm text-slate-700 leading-relaxed space-y-1.5">
                  {calloutLines.map((cL, cIdx) => (
                    <p key={`c-p-${cIdx}`}>
                      {renderInline(cL)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
        continue;
      }

      // 2. Check for Code Block (```lang)
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim() || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length && lines[i].trim().startsWith('```')) {
          i++;
        }
        const fullCode = codeLines.join('\n');
        const currentCodeIdx = blockId++;

        // Check if code contains ===solution=== or is immediately followed by :::solution
        const SOLUTION_REGEX = /\r?\n\s*(?:--|\/\/|#|\/\*|<!--)?\s*===solution===\s*(?:\*\/|-->)?\r?\n?/i;
        let starterCode = fullCode;
        let solutionCode: string | undefined = undefined;

        if (SOLUTION_REGEX.test(fullCode)) {
          const parts = fullCode.split(SOLUTION_REGEX);
          starterCode = parts[0];
          solutionCode = parts.slice(1).join('\n').trim();
        } else {
          // Check if followed by :::solution
          let lookAhead = i;
          while (lookAhead < lines.length && lines[lookAhead].trim().length === 0) {
            lookAhead++;
          }
          if (lookAhead < lines.length && lines[lookAhead].trim().startsWith(':::solution')) {
            i = lookAhead + 1;
            const solLines: string[] = [];
            while (i < lines.length && !lines[i].trim().startsWith(':::')) {
              solLines.push(lines[i]);
              i++;
            }
            if (i < lines.length && lines[i].trim().startsWith(':::')) {
              i++;
            }
            solutionCode = solLines.join('\n').trim();
          }
        }

        blocks.push(
          <InteractiveCodeBlock
            key={`code-${currentCodeIdx}`}
            initialCode={starterCode}
            solutionCode={solutionCode}
            language={lang}
          />
        );
        continue;
      }

      // 3. Headings
      if (line.startsWith('# ')) {
        blocks.push(
          <h1
            key={`h1-${blockId++}`}
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-6 mb-3 tracking-tight border-b border-slate-100 pb-2"
          >
            {renderInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push(
          <h2
            key={`h2-${blockId++}`}
            className="text-xl sm:text-2xl font-bold text-slate-900 mt-5 mb-2.5 tracking-tight flex items-center gap-2"
          >
            {renderInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        blocks.push(
          <h3
            key={`h3-${blockId++}`}
            className="text-lg font-bold text-slate-800 mt-4 mb-2 tracking-tight"
          >
            {renderInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        blocks.push(
          <h4
            key={`h4-${blockId++}`}
            className="text-base font-bold text-slate-800 mt-3.5 mb-2 tracking-tight"
          >
            {renderInline(line.slice(5))}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith('##### ') || line.startsWith('###### ')) {
        const hashCount = line.startsWith('###### ') ? 7 : 6;
        blocks.push(
          <h5
            key={`h5-${blockId++}`}
            className="text-sm font-bold text-slate-700 mt-3 mb-1.5 tracking-tight"
          >
            {renderInline(line.slice(hashCount))}
          </h5>
        );
        i++;
        continue;
      }

      // 4. Image: ![alt](url)
      const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imageMatch) {
        const [, alt, url] = imageMatch;
        blocks.push(
          <figure key={`img-${blockId++}`} className="my-5 text-center">
            <img
              src={url}
              alt={alt || 'Minh họa bài học'}
              className="rounded-2xl max-w-full border border-slate-200 shadow-sm mx-auto object-cover max-h-[450px]"
            />
            {alt && (
              <figcaption className="text-xs text-slate-500 mt-2 font-medium italic">
                {alt}
              </figcaption>
            )}
          </figure>
        );
        i++;
        continue;
      }

      // 5. Unordered List Items (- or *)
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
          listItems.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push(
          <ul key={`ul-${blockId++}`} className="space-y-1.5 my-3 pl-5 list-disc text-slate-700 text-sm leading-relaxed marker:text-orange-500">
            {listItems.map((item, liIdx) => (
              <li key={`li-${liIdx}`}>
                {renderInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // 6. Ordered List Items (1. )
      if (/^\d+\.\s/.test(line.trim())) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
          i++;
        }
        blocks.push(
          <ol key={`ol-${blockId++}`} className="space-y-1.5 my-3 pl-5 list-decimal text-slate-700 text-sm leading-relaxed marker:text-orange-600 font-medium">
            {listItems.map((item, liIdx) => (
              <li key={`oli-${liIdx}`}>
                <span className="font-normal text-slate-700">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // 7. Divider (---)
      if (line.trim() === '---' || line.trim() === '***') {
        blocks.push(<hr key={`hr-${blockId++}`} className="my-6 border-slate-200" />);
        i++;
        continue;
      }

      // 8. Markdown Table (| Col 1 | Col 2 |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const isSep = nextLine.startsWith('|') && nextLine.endsWith('|') && nextLine.slice(1, -1).split('|').every(c => /^[\s:-]+$/.test(c) && c.includes('-'));
          if (isSep) {
            const rawHeaders = line.trim().slice(1, -1).split('|').map(s => s.trim());
            const sepCells = nextLine.slice(1, -1).split('|').map(s => s.trim());
            const alignments: ('left' | 'center' | 'right')[] = sepCells.map(c => {
              const hasLeft = c.startsWith(':');
              const hasRight = c.endsWith(':');
              if (hasLeft && hasRight) return 'center';
              if (hasRight) return 'right';
              return 'left';
            });

            i += 2; // skip header line and separator line
            const tableRows: string[][] = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
              const rowCells = lines[i].trim().slice(1, -1).split('|').map(s => s.trim());
              while (rowCells.length < rawHeaders.length) rowCells.push('');
              tableRows.push(rowCells.slice(0, rawHeaders.length));
              i++;
            }

            blocks.push(
              <div key={`table-${blockId++}`} className="my-5 overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200">
                      {rawHeaders.map((headerText, colIdx) => (
                        <th
                          key={`th-${colIdx}`}
                          className="px-4 py-3 font-bold text-slate-800 tracking-wide text-xs uppercase text-center border-l border-slate-200 first:border-l-0"
                        >
                          {renderInline(headerText)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableRows.map((r, rIdx) => (
                      <tr key={`tr-${rIdx}`} className="hover:bg-slate-50/70 transition-colors">
                        {r.map((cellText, colIdx) => (
                          <td
                            key={`td-${rIdx}-${colIdx}`}
                            className="px-4 py-2.5 text-slate-700 text-sm text-left border-l border-slate-100 first:border-l-0"
                          >
                            {renderInline(cellText)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
            continue;
          }
        }
      }

      // 9. Normal Paragraph or Empty Line
      if (line.trim().length === 0) {
        // Empty line
        i++;
        continue;
      }

      // Accumulate consecutive paragraph lines
      const pLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim().length > 0 &&
        !lines[i].trim().startsWith(':::') &&
        !lines[i].trim().startsWith('```') &&
        !lines[i].startsWith('#') &&
        !lines[i].trim().startsWith('- ') &&
        !lines[i].trim().startsWith('* ') &&
        !/^\d+\.\s/.test(lines[i].trim()) &&
        lines[i].trim() !== '---' &&
        !lines[i].trim().startsWith('|')
      ) {
        pLines.push(lines[i]);
        i++;
      }

      blocks.push(
        <p key={`p-${blockId++}`} className="text-sm md:text-base text-slate-700 leading-relaxed my-3 font-normal">
          {renderInline(pLines.join(' '))}
        </p>
      );
    }

    return blocks;
  };

  return (
    <div className={`prose-ownedu text-slate-800 max-w-none ${className}`}>
      {parseBlocks(content)}
    </div>
  );
};
