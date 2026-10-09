import React, { useRef, useMemo } from 'react';
import { highlightCode } from '../../utils/syntaxHighlighter';

interface SyntaxCodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  language?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
  minHeight?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export const SyntaxCodeEditor: React.FC<SyntaxCodeEditorProps> = ({
  value,
  onChange,
  language = 'sql',
  placeholder = 'Nhập code ở đây...',
  rows = 5,
  className = '',
  minHeight,
  onKeyDown,
  textareaRef: externalRef,
}) => {
  const internalRef = useRef<HTMLTextAreaElement | null>(null);
  const activeTextareaRef = externalRef || internalRef;
  const preRef = useRef<HTMLPreElement | null>(null);

  // Sync scroll positions between transparent textarea and background pre
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Handle Tab key to insert spaces instead of losing focus
  const handleInternalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updatedValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(updatedValue);
      // Restore cursor position after inserted spaces
      setTimeout(() => {
        if (target) {
          target.selectionStart = target.selectionEnd = start + 2;
        }
      }, 0);
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const highlightedHtml = useMemo(() => {
    if (!value) return '';
    return highlightCode(value, language);
  }, [value, language]);

  return (
    <div
      className={`relative font-mono text-xs sm:text-sm leading-relaxed overflow-hidden ${className}`}
      style={minHeight ? { minHeight } : undefined}
    >
      {/* Background layer: highlighted code */}
      <pre
        ref={preRef}
        aria-hidden="true"
        className="w-full h-full p-4 m-0 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none select-none text-slate-800 overflow-auto"
        style={{
          tabSize: 2,
          minHeight: minHeight || (rows ? `${rows * 1.5 + 2}rem` : undefined),
        }}
      >
        <code
          dangerouslySetInnerHTML={{
            __html: value ? highlightedHtml + (value.endsWith('\n') ? '<br />' : '') : '',
          }}
        />
        {!value && (
          <span className="text-slate-400 select-none">{placeholder}</span>
        )}
      </pre>

      {/* Foreground layer: native interactive textarea with transparent text */}
      <textarea
        ref={activeTextareaRef as any}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleInternalKeyDown}
        onScroll={handleScroll}
        spellCheck={false}
        rows={rows}
        className="absolute inset-0 w-full h-full p-4 m-0 bg-transparent text-transparent caret-slate-900 font-mono text-xs sm:text-sm leading-relaxed outline-none resize-y whitespace-pre-wrap break-words focus:outline-none selection:bg-orange-500/20 selection:text-transparent"
        style={{
          tabSize: 2,
          minHeight: minHeight || (rows ? `${rows * 1.5 + 2}rem` : undefined),
        }}
      />
    </div>
  );
};
