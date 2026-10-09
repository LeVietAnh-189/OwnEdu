import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Database,
  Code2,
  Table as TableIcon,
  AlertCircle,
  RefreshCw,
  X,
  FileCode,
  Globe,
  Sparkles,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { SyntaxCodeEditor } from '../common/SyntaxCodeEditor';
import { executeCode, ExecutionResult } from '../../utils/codeRunner';
import { SqlSandbox } from '../sql/SqlSandbox';
import { Course } from '../../types';

export interface CourseSandboxProps {
  course?: Course | null;
  defaultLanguage?: string;
  isEmbedded?: boolean;
  onClose?: () => void;
}

export const SUPPORTED_LANGUAGES = [
  { id: 'sql', label: 'SQL (PostgreSQL / SQLite)', icon: Database, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'python', label: 'Python 3 (Pyodide WebAssembly)', icon: Terminal, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'javascript', label: 'JavaScript (ES6+)', icon: Code2, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'typescript', label: 'TypeScript', icon: FileCode, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'html', label: 'HTML / CSS / Web Preview', icon: Globe, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'universal', label: 'Đa ngôn ngữ (Tự chọn)', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

export const DEFAULT_STARTER_CODES: Record<string, string> = {
  python: `# Chương trình Python 3 chạy trực tiếp trên trình duyệt (WebAssembly)
def chao_mung(ten):
    return f"Xin chào {ten}, chào mừng đến với OwnEdu Sandbox!"

sinh_vien = ["Anh", "Bình", "Châu", "Dũng"]
for sv in sinh_vien:
    print(chao_mung(sv))

print("\\nTổng số sinh viên:", len(sinh_vien))
`,
  javascript: `// Chương trình JavaScript ES6+
function tinhTong(arr) {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

const diemSo = [8.5, 9.0, 7.5, 10, 8.0];
const tongDiem = tinhTong(diemSo);
const trungBinh = (tongDiem / diemSo.length).toFixed(2);

console.log("Danh sách điểm:", diemSo);
console.log("Tổng điểm:", tongDiem);
console.log("Điểm trung bình:", trungBinh);
`,
  typescript: `// Chương trình TypeScript
interface HocVien {
  id: number;
  hoTen: string;
  khoaHoc: string;
  daHoanThanh: boolean;
}

const hocVienMoi: HocVien = {
  id: 101,
  hoTen: "Lê Văn Nam",
  khoaHoc: "Lập trình TypeScript",
  daHoanThanh: true
};

console.log("Thông tin học viên:", JSON.stringify(hocVienMoi, null, 2));
`,
  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #fafafa; }
    .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    h2 { color: #ea580c; margin-top: 0; }
    button { background: #ea580c; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; }
    button:hover { background: #c2410c; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Thực hành giao diện Web với HTML & CSS</h2>
    <p>Chỉnh sửa mã HTML bên cạnh để xem kết quả hiển thị trực tiếp tại đây!</p>
    <button onclick="alert('Chúc bạn học tốt!')">Bấm thử vào tôi</button>
  </div>
</body>
</html>
`,
  sql: `-- Truy vấn SQL với cơ sở dữ liệu PGlite tích hợp
SELECT ma_sv, ho_ten, email, diem_tb
FROM sinh_vien
ORDER BY diem_tb DESC
LIMIT 5;
`
};

export const CourseSandbox: React.FC<CourseSandboxProps> = ({
  course,
  defaultLanguage,
  isEmbedded = false,
  onClose,
}) => {
  // Determine configured language
  const configuredLang = (defaultLanguage || course?.sandboxLanguage || 'universal').toLowerCase().trim();
  const [selectedLang, setSelectedLang] = useState<string>(
    configuredLang === 'universal' ? 'python' : configuredLang
  );

  // If the course specifically configured SQL, delegate directly to the dedicated full-featured SqlSandbox
  if (configuredLang === 'sql' && selectedLang === 'sql') {
    return (
      <SqlSandbox
        isEmbedded={isEmbedded}
        onClose={onClose}
        initialSql={course?.sandboxInitialCode || DEFAULT_STARTER_CODES.sql}
      />
    );
  }

  const [code, setCode] = useState<string>(() => {
    if (course?.sandboxInitialCode && configuredLang !== 'universal') {
      return course.sandboxInitialCode;
    }
    return DEFAULT_STARTER_CODES[selectedLang] || DEFAULT_STARTER_CODES.python;
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'console' | 'table' | 'preview'>('console');

  // Handle switching language in universal mode
  const handleLanguageChange = (newLang: string) => {
    setSelectedLang(newLang);
    setCode(DEFAULT_STARTER_CODES[newLang] || '');
    setResult(null);
    setError(null);
  };

  const handleRun = async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setError(null);

    try {
      const res = await executeCode(code, selectedLang);
      setResult(res);
      if (res.type === 'table') {
        setActiveOutputTab('table');
      } else if (res.type === 'html') {
        setActiveOutputTab('preview');
      } else {
        setActiveOutputTab('console');
      }

      if ('error' in res && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi thực thi mã nguồn');
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

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleReset = () => {
    if (course?.sandboxInitialCode && selectedLang === configuredLang) {
      setCode(course.sandboxInitialCode);
    } else {
      setCode(DEFAULT_STARTER_CODES[selectedLang] || '');
    }
    setError(null);
    setResult(null);
  };

  const currentLangConfig = SUPPORTED_LANGUAGES.find(l => l.id === selectedLang) || SUPPORTED_LANGUAGES[1];
  const LangIcon = currentLangConfig.icon;

  const sandboxTitle = course?.sandboxTitle || `${currentLangConfig.label.split(' ')[0]} Sandbox`;

  return (
    <div className="h-full flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`p-1.5 rounded-xl border flex items-center justify-center shrink-0 ${currentLangConfig.color}`}>
            <LangIcon className="w-4 h-4" />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                {sandboxTitle}
              </h3>
              {configuredLang === 'universal' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                  Đa ngôn ngữ
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Thực hành & chạy code trực tiếp (Bấm Ctrl + Enter để chạy)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language selector if universal */}
          {configuredLang === 'universal' && (
            <div className="relative">
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold py-1.5 pl-2.5 pr-7 rounded-xl focus:outline-none focus:border-orange-500 shadow-2xs cursor-pointer"
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML / Web</option>
                <option value="sql">SQL (PGlite)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Chạy code (Phím tắt: Ctrl + Enter)"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang chạy...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Chạy code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Khôi phục code ban đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Sao chép toàn bộ code"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ml-1"
              title="Đóng sandbox"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace (Split View: Code Editor on Top / Left, Output on Bottom / Right) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 min-h-[300px] flex flex-col border-b border-slate-200/90 relative bg-slate-50/20">
          <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 font-mono">
              <Code2 className="w-3.5 h-3.5 text-orange-600" />
              <span>Trình soạn thảo ({selectedLang.toUpperCase()})</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Nhấn <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono">Ctrl + Enter</kbd> để chạy
            </span>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <SyntaxCodeEditor
              value={code}
              onChange={setCode}
              language={selectedLang}
              placeholder="Nhập mã code để thực thi..."
              onKeyDown={handleKeyDown}
              minHeight="100%"
              className="h-full border-none rounded-none text-xs"
            />
          </div>
        </div>

        {/* Output Area */}
        <div className="h-[280px] sm:h-[320px] flex flex-col bg-slate-50/50 shrink-0">
          {/* Output Header Tabs */}
          <div className="px-3 py-1.5 bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveOutputTab('console')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeOutputTab === 'console'
                    ? 'bg-white text-orange-700 shadow-2xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Output</span>
              </button>

              {result?.type === 'table' && (
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeOutputTab === 'table'
                      ? 'bg-white text-orange-700 shadow-2xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Bảng kết quả ({result.rows.length})</span>
                </button>
              )}

              {selectedLang === 'html' && (
                <button
                  type="button"
                  onClick={() => setActiveOutputTab('preview')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeOutputTab === 'preview'
                      ? 'bg-white text-orange-700 shadow-2xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Web Preview</span>
                </button>
              )}
            </div>

            {/* Execution time indicator */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {result && (
                <span className="font-mono text-emerald-600 font-bold">
                  ⚡ {result.executionTimeMs}ms
                </span>
              )}
              {error && (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Lỗi</span>
                </span>
              )}
            </div>
          </div>

          {/* Output Content Body */}
          <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-800 bg-white">
            {error && (
              <div className="p-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-sans text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Thông báo lỗi thực thi:</span>
                </div>
                <pre className="font-mono text-[11px] whitespace-pre-wrap text-rose-800 pl-5">
                  {error}
                </pre>
              </div>
            )}

            {activeOutputTab === 'table' && result?.type === 'table' && (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans">
                  <thead className="bg-slate-50 text-slate-700 font-bold">
                    <tr>
                      {result.fields.map((f, idx) => (
                        <th key={idx} className="px-3 py-2 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {result.rows.length === 0 ? (
                      <tr>
                        <td colSpan={result.fields.length || 1} className="px-3 py-4 text-center text-slate-400 italic">
                          Không có dòng dữ liệu nào được trả về.
                        </td>
                      </tr>
                    ) : (
                      result.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          {result.fields.map((f, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap text-slate-700 font-mono text-xs">
                              {row[f] !== null && row[f] !== undefined ? String(row[f]) : <span className="text-slate-300 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeOutputTab === 'preview' && (
              <div className="w-full h-full min-h-[220px] rounded-xl border border-slate-200 overflow-hidden bg-white">
                <iframe
                  title="Web Sandbox Preview"
                  srcDoc={code}
                  sandbox="allow-scripts"
                  className="w-full h-full border-none"
                />
              </div>
            )}

            {activeOutputTab === 'console' && (
              <div className="h-full">
                {result && 'output' in result && result.output ? (
                  <pre className="whitespace-pre-wrap leading-relaxed text-slate-800">
                    {result.output}
                  </pre>
                ) : !error && !result ? (
                  <div className="h-full flex items-center justify-center text-center text-slate-400 italic font-sans text-xs">
                    Bấm "Chạy code" hoặc nhấn tổ hợp phím Ctrl + Enter để xem kết quả thực thi tại đây.
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSandbox;
