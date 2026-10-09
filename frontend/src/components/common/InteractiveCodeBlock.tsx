import React, { useState, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Database,
  Code2,
  Table,
  AlertCircle,
  RefreshCw,
  X,
  FileCode,
  Globe,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SyntaxCodeEditor } from './SyntaxCodeEditor';
import { executeCode, ExecutionResult } from '../../utils/codeRunner';

export interface InteractiveCodeBlockProps {
  initialCode: string;
  solutionCode?: string;
  language?: string;
  className?: string;
}

const SOLUTION_SEPARATOR_REGEX = /\r?\n\s*(?:--|\/\/|#|\/\*|<!--)?\s*===solution===\s*(?:\*\/|-->)?\r?\n?/i;

export const InteractiveCodeBlock: React.FC<InteractiveCodeBlockProps> = ({
  initialCode,
  solutionCode,
  language = 'sql',
  className = '',
}) => {
  // Extract initial code vs auto-parsed solution if embedded with ===solution===
  const { cleanInitialCode, embeddedSolution } = useMemo(() => {
    if (SOLUTION_SEPARATOR_REGEX.test(initialCode)) {
      const parts = initialCode.split(SOLUTION_SEPARATOR_REGEX);
      return {
        cleanInitialCode: parts[0].trimEnd(),
        embeddedSolution: parts.slice(1).join('\n').trim(),
      };
    }
    return { cleanInitialCode: initialCode, embeddedSolution: undefined };
  }, [initialCode]);

  const effectiveSolution = solutionCode || embeddedSolution;

  const [code, setCode] = useState<string>(cleanInitialCode);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showOutput, setShowOutput] = useState<boolean>(false);

  // Solution viewer states
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [isSolutionCopied, setIsSolutionCopied] = useState<boolean>(false);
  const [isSolutionRunning, setIsSolutionRunning] = useState<boolean>(false);
  const [solutionResult, setSolutionResult] = useState<ExecutionResult | null>(null);
  const [solutionError, setSolutionError] = useState<string | null>(null);

  const cleanLang = (language || 'sql').toLowerCase().trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    setCode(cleanInitialCode);
    setError(null);
  };

  const handleRun = async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);
    setShowOutput(true);

    try {
      const res = await executeCode(code, cleanLang);
      setResult(res);
      if ('error' in res && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thực thi mã code');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  // Solution actions
  const handleCopySolution = () => {
    if (!effectiveSolution) return;
    navigator.clipboard.writeText(effectiveSolution);
    setIsSolutionCopied(true);
    setTimeout(() => setIsSolutionCopied(false), 2000);
  };

  const handleApplySolution = () => {
    if (!effectiveSolution) return;
    setCode(effectiveSolution);
    setError(null);
  };

  const handleRunSolution = async () => {
    if (!effectiveSolution || isSolutionRunning) return;
    setIsSolutionRunning(true);
    setSolutionError(null);
    try {
      const res = await executeCode(effectiveSolution, cleanLang);
      setSolutionResult(res);
      if ('error' in res && res.error) {
        setSolutionError(res.error);
      }
    } catch (err: any) {
      setSolutionError(err.message || 'Lỗi khi chạy đáp án');
      setSolutionResult(null);
    } finally {
      setIsSolutionRunning(false);
    }
  };

  const getLanguageLabel = () => {
    switch (cleanLang) {
      case 'sql':
        return { name: 'SQL', icon: Database, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 'python':
      case 'py':
        return { name: 'Python', icon: Terminal, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'javascript':
      case 'js':
        return { name: 'JavaScript', icon: Code2, color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'typescript':
      case 'ts':
        return { name: 'TypeScript', icon: FileCode, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'html':
        return { name: 'HTML Preview', icon: Globe, color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case 'bash':
      case 'sh':
      case 'terminal':
        return { name: 'Bash / Shell', icon: Terminal, color: 'text-slate-700 bg-slate-100 border-slate-300' };
      default:
        return { name: cleanLang.toUpperCase(), icon: Code2, color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  const langMeta = getLanguageLabel();
  const LangIcon = langMeta.icon;

  return (
    <div className={`my-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden ${className}`}>
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b border-slate-200/80 bg-slate-50/80 text-xs">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${langMeta.color}`}>
            <LangIcon className="w-3.5 h-3.5" />
            <span>{langMeta.name}</span>
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (Bấm Ctrl + Enter để chạy)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Nút Xem đáp án */}
          {effectiveSolution && (
            <button
              type="button"
              onClick={() => setShowSolution(!showSolution)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95 ${
                showSolution
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
              }`}
              title={showSolution ? 'Ẩn đáp án mẫu' : 'Xem đáp án mẫu để đối chiếu bài làm'}
            >
              <Lightbulb className={`w-3.5 h-3.5 ${showSolution ? 'text-amber-600 fill-amber-500' : 'text-emerald-600'}`} />
              <span>{showSolution ? 'Ẩn đáp án' : 'Xem đáp án'}</span>
            </button>
          )}

          {code !== cleanInitialCode && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
              title="Khôi phục lại đoạn mã ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer text-xs font-medium shadow-2xs"
            title="Sao chép đoạn mã"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Sao chép</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 active:scale-95 text-white transition cursor-pointer text-xs font-bold shadow-xs disabled:opacity-50"
            title="Thực thi đoạn mã (Phím tắt: Ctrl + Enter)"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Đang chạy...' : 'Run'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="bg-slate-50/40 focus-within:bg-white transition-colors">
        <SyntaxCodeEditor
          value={code}
          onChange={setCode}
          language={cleanLang}
          placeholder="Nhập code ở đây..."
          rows={Math.max(4, Math.min(16, code.split('\n').length + 1))}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Solution Drawer / Panel */}
      {showSolution && effectiveSolution && (
        <div className="border-t border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-emerald-950 flex items-center gap-1.5">
                  <span>Đáp án mẫu / Lời giải tham khảo</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Chính xác
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-800/80">
                  Đối chiếu với bài làm của bạn hoặc bấm "Áp dụng vào bài làm" để nạp trực tiếp vào khung code.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleApplySolution}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
                title="Thay thế code trong khung soạn thảo bằng đáp án này"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Áp dụng vào bài làm</span>
              </button>

              <button
                type="button"
                onClick={handleRunSolution}
                disabled={isSolutionRunning}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs shadow-2xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Chạy thử đáp án để xem output mẫu"
              >
                {isSolutionRunning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Chạy thử đáp án</span>
              </button>

              <button
                type="button"
                onClick={handleCopySolution}
                className="p-1.5 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-800 transition cursor-pointer"
                title="Sao chép đáp án"
              >
                {isSolutionCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
              </button>

              <button
                type="button"
                onClick={() => setShowSolution(false)}
                className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 transition cursor-pointer ml-1"
                title="Đóng đáp án"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Solution Code Highlighted Box */}
          <div className="rounded-xl border border-emerald-200 bg-white shadow-2xs overflow-hidden">
            <div className="px-3 py-1 bg-emerald-100/50 border-b border-emerald-200/60 flex items-center justify-between text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono">
              <span>Mã nguồn đáp án ({cleanLang.toUpperCase()})</span>
              <span>Được biên soạn bởi giảng viên</span>
            </div>
            <pre className="p-3.5 font-mono text-xs leading-relaxed overflow-x-auto text-slate-800 bg-white">
              <code>{effectiveSolution}</code>
            </pre>
          </div>

          {/* Solution Run Result if student clicked "Chạy thử đáp án" */}
          {solutionResult && (
            <div className="rounded-xl border border-emerald-300 bg-white p-3 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Kết quả chạy của đáp án mẫu:</span>
                </span>
                <span className="font-mono text-emerald-600 font-bold">
                  ⚡ {solutionResult.executionTimeMs}ms
                </span>
              </div>

              {solutionError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-mono text-xs">
                  {solutionError}
                </div>
              )}

              {solutionResult.type === 'table' && (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-emerald-50/70 text-emerald-900 font-bold border-b border-slate-200">
                        <th className="p-1.5 text-center text-slate-400 w-8 border-r border-slate-200">#</th>
                        {solutionResult.fields.map(f => (
                          <th key={f} className="p-1.5 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                            {f}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {solutionResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-1.5 text-center text-slate-400 border-r border-slate-100">{idx + 1}</td>
                          {solutionResult.fields.map(f => (
                            <td key={f} className="p-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap font-mono">
                              {row[f] !== null && row[f] !== undefined ? String(row[f]) : 'null'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {solutionResult.type === 'console' && (
                <pre className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800">
                  {solutionResult.output}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {/* Output Panel */}
      {showOutput && (
        <div className="border-t border-slate-200 bg-slate-50/70">
          {/* Output Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200/80 bg-slate-100/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-orange-600" />
                <span>Output</span>
              </span>
              {result && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ({result.executionTimeMs}ms)
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowOutput(false)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition cursor-pointer"
              title="Đóng kết quả"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Output Content */}
          <div className="p-4 max-h-72 overflow-auto text-xs font-mono">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 mb-2 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="break-all leading-relaxed whitespace-pre-wrap">{error}</div>
              </div>
            )}

            {/* SQL Table Result */}
            {result?.type === 'table' && (
              <div>
                {result.rows.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 font-sans">
                    <p className="font-semibold">Truy vấn thành công nhưng không trả về dòng dữ liệu nào.</p>
                    {result.affectedRows !== undefined && (
                      <p className="text-[11px] text-emerald-700 font-mono mt-1 font-bold">
                        Số dòng bị ảnh hưởng: {result.affectedRows}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2 text-slate-400 w-10 text-center border-r border-slate-200">#</th>
                          {result.fields.map((field) => (
                            <th key={field} className="p-2 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                              {field}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                            <td className="p-2 text-slate-400 text-center border-r border-slate-100 font-sans">
                              {rIdx + 1}
                            </td>
                            {result.fields.map((field) => (
                              <td key={field} className="p-2 border-r border-slate-100 last:border-r-0 whitespace-nowrap text-slate-800">
                                {row[field] !== null && row[field] !== undefined ? String(row[field]) : (
                                  <span className="text-slate-300 italic">null</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Console / Output String */}
            {result?.type === 'console' && (
              <pre className="whitespace-pre-wrap leading-relaxed text-slate-800">
                {result.output}
              </pre>
            )}

            {/* HTML Preview Frame */}
            {result?.type === 'html' && (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <iframe
                  title="HTML Preview"
                  srcDoc={result.html}
                  sandbox="allow-scripts"
                  className="w-full h-48 border-none"
                />
              </div>
            )}

            {/* JSON Output */}
            {result?.type === 'json' && (
              <pre className="whitespace-pre-wrap leading-relaxed text-indigo-700">
                {result.formatted}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveCodeBlock;
