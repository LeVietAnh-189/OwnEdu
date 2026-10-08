import React, { useState, useEffect, useRef } from 'react';
import { PGlite } from '@electric-sql/pglite';
import {
  Play,
  RotateCcw,
  Database,
  Table,
  Terminal,
  AlertCircle,
  RefreshCw,
  X,
  History,
  Trash2,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

// --- SEED DATABASE DATA ---
export const DEFAULT_SQL_SEED = `
-- 1. BẢNG LỚP HỌC
CREATE TABLE IF NOT EXISTS lop_hoc (
  ma_lop VARCHAR(20) PRIMARY KEY,
  ten_lop VARCHAR(100) NOT NULL,
  khoa_vien VARCHAR(100) NOT NULL,
  nien_khoa VARCHAR(20) NOT NULL
);

INSERT INTO lop_hoc (ma_lop, ten_lop, khoa_vien, nien_khoa) VALUES
('K65-CNTT1', 'Khoa học máy tính 01', 'CNTT & Truyền thông', '2020-2024'),
('K65-CNTT2', 'Hệ thống thông tin 01', 'CNTT & Truyền thông', '2020-2024'),
('K66-KTPM', 'Kỹ thuật phần mềm 01', 'CNTT & Truyền thông', '2021-2025'),
('K66-ATTT', 'An toàn không gian số', 'An toàn thông tin', '2021-2025')
ON CONFLICT (ma_lop) DO NOTHING;

-- 2. BẢNG SINH VIÊN
CREATE TABLE IF NOT EXISTS sinh_vien (
  ma_sv VARCHAR(20) PRIMARY KEY,
  ho_ten VARCHAR(100) NOT NULL,
  gioi_tinh VARCHAR(10) NOT NULL,
  chuyen_nganh VARCHAR(100) NOT NULL,
  gpa NUMERIC(3, 2) NOT NULL,
  hoc_phi_da_dong BOOLEAN NOT NULL DEFAULT true,
  ma_lop VARCHAR(20) REFERENCES lop_hoc(ma_lop)
);

INSERT INTO sinh_vien (ma_sv, ho_ten, gioi_tinh, chuyen_nganh, gpa, hoc_phi_da_dong, ma_lop) VALUES
('SV2021001', 'Nguyễn Văn An', 'Nam', 'Khoa học máy tính', 3.65, true, 'K65-CNTT1'),
('SV2021002', 'Trần Thị Bình', 'Nữ', 'Hệ thống thông tin', 3.82, true, 'K65-CNTT2'),
('SV2021003', 'Lê Hoàng Cường', 'Nam', 'Kỹ thuật phần mềm', 2.85, false, 'K66-KTPM'),
('SV2021004', 'Phạm Minh Đức', 'Nam', 'Khoa học máy tính', 3.40, true, 'K65-CNTT1'),
('SV2021005', 'Vũ Thị Hoa', 'Nữ', 'An toàn thông tin', 3.92, true, 'K66-ATTT'),
('SV2021006', 'Đặng Tuấn Kiệt', 'Nam', 'Kỹ thuật phần mềm', 3.10, false, 'K66-KTPM'),
('SV2021007', 'Hoàng Bảo Ngọc', 'Nữ', 'Khoa học máy tính', 3.75, true, 'K65-CNTT1'),
('SV2021008', 'Ngô Quang Phúc', 'Nam', 'Hệ thống thông tin', 2.95, true, 'K65-CNTT2')
ON CONFLICT (ma_sv) DO NOTHING;

-- 3. BẢNG MÔN HỌC
CREATE TABLE IF NOT EXISTS mon_hoc (
  ma_mh VARCHAR(20) PRIMARY KEY,
  ten_mon VARCHAR(150) NOT NULL,
  so_tin_chi INT NOT NULL,
  giang_vien VARCHAR(100) NOT NULL
);

INSERT INTO mon_hoc (ma_mh, ten_mon, so_tin_chi, giang_vien) VALUES
('CS101', 'Cơ sở dữ liệu & SQL', 3, 'TS. Nguyễn Hữu Dũng'),
('CS102', 'Cấu trúc dữ liệu & Giải thuật', 4, 'ThS. Trần Thu Hà'),
('CS103', 'Lập trình Web hiện đại', 3, 'Kỹ sư Lê Văn Nam'),
('SEC201', 'Mạng máy tính & Bảo mật', 3, 'TS. Hoàng Đức Thịnh')
ON CONFLICT (ma_mh) DO NOTHING;

-- 4. BẢNG ĐIỂM
CREATE TABLE IF NOT EXISTS bang_diem (
  id SERIAL PRIMARY KEY,
  ma_sv VARCHAR(20) REFERENCES sinh_vien(ma_sv),
  ma_mh VARCHAR(20) REFERENCES mon_hoc(ma_mh),
  diem_qt NUMERIC(4, 1) NOT NULL,
  diem_thi NUMERIC(4, 1) NOT NULL
);

INSERT INTO bang_diem (ma_sv, ma_mh, diem_qt, diem_thi) VALUES
('SV2021001', 'CS101', 8.5, 9.0),
('SV2021001', 'CS102', 7.5, 8.0),
('SV2021002', 'CS101', 9.5, 9.8),
('SV2021002', 'CS103', 9.0, 9.5),
('SV2021003', 'CS101', 6.0, 6.5),
('SV2021004', 'CS101', 8.0, 8.5),
('SV2021005', 'CS101', 10.0, 9.5),
('SV2021005', 'SEC201', 9.5, 9.0),
('SV2021006', 'CS103', 7.0, 7.5),
('SV2021007', 'CS101', 9.0, 9.0);
`;

export interface SqlHistoryItem {
  id: string;
  sql: string;
  timestamp: number;
  success: boolean;
  executionTimeMs?: number;
  rowCount?: number;
  errorMessage?: string;
}

export interface SqlSandboxProps {
  initialSql?: string;
  customSeedSql?: string;
  isEmbedded?: boolean;
  onClose?: () => void;
}

const DRAFT_SQL_KEY = 'ownedu_sql_sandbox_draft';
const HISTORY_SQL_KEY = 'ownedu_sql_sandbox_history';

// Singleton PGlite cache & in-memory state preservation across toggles
let cachedPgInstance: PGlite | null = null;
let cachedSqlDraft: string | null = null;
let cachedSqlHistory: SqlHistoryItem[] | null = null;
let cachedQueryResult: {
  fields: string[];
  rows: any[];
  executionTimeMs: number;
  affectedRows?: number;
} | null = null;
let cachedQueryError: string | null = null;

export const SqlSandbox: React.FC<SqlSandboxProps> = ({
  initialSql = 'SELECT * FROM sinh_vien LIMIT 10;',
  customSeedSql,
  isEmbedded = false,
  onClose,
}) => {
  const [pg, setPg] = useState<PGlite | null>(cachedPgInstance);
  const [isInitializing, setIsInitializing] = useState(!cachedPgInstance);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize SQL code with draft from memory or localStorage, falling back to initialSql
  const [sqlCode, setSqlCode] = useState<string>(() => {
    if (cachedSqlDraft !== null) return cachedSqlDraft;
    try {
      const saved = localStorage.getItem(DRAFT_SQL_KEY);
      if (saved !== null) return saved;
    } catch {
      // ignore
    }
    return initialSql;
  });

  const handleSqlChange = (val: string) => {
    setSqlCode(val);
    cachedSqlDraft = val;
    try {
      localStorage.setItem(DRAFT_SQL_KEY, val);
    } catch {
      // ignore
    }
  };

  // Execution states (restored from cached result if previously run)
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<{
    fields: string[];
    rows: any[];
    executionTimeMs: number;
    affectedRows?: number;
  } | null>(cachedQueryResult);
  const [queryError, setQueryError] = useState<string | null>(cachedQueryError);

  // History states
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SqlHistoryItem[]>(() => {
    if (cachedSqlHistory !== null) return cachedSqlHistory;
    try {
      const saved = localStorage.getItem(HISTORY_SQL_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        cachedSqlHistory = parsed;
        return parsed;
      }
    } catch {}
    cachedSqlHistory = [];
    return [];
  });

  const addHistoryEntry = (item: Omit<SqlHistoryItem, 'id' | 'timestamp'>) => {
    const entry: SqlHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    setHistory((prev) => {
      if (prev.length > 0 && prev[0].sql === entry.sql && entry.timestamp - prev[0].timestamp < 2000) {
        return prev;
      }
      const updated = [entry, ...prev].slice(0, 50);
      cachedSqlHistory = updated;
      try {
        localStorage.setItem(HISTORY_SQL_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    cachedSqlHistory = [];
    try {
      localStorage.removeItem(HISTORY_SQL_KEY);
    } catch {}
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      cachedSqlHistory = updated;
      try {
        localStorage.setItem(HISTORY_SQL_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize PGlite WebAssembly Database
  const initDb = async () => {
    try {
      setIsInitializing(true);
      setInitError(null);
      if (!cachedPgInstance) {
        const db = new PGlite();
        const seed = customSeedSql || DEFAULT_SQL_SEED;
        await db.exec(seed);
        cachedPgInstance = db;
      }

      setPg(cachedPgInstance);
      setIsInitializing(false);
    } catch (err: any) {
      console.error('Failed to initialize PGlite:', err);
      setInitError(err.message || 'Không thể khởi tạo WebAssembly SQL Engine.');
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (cachedPgInstance) {
      setPg(cachedPgInstance);
      setIsInitializing(false);
      return;
    }

    // Delay initialization slightly (150ms) to allow UI sliding animations to run at 60fps
    const timer = setTimeout(() => {
      if (!isCancelled) {
        initDb();
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [customSeedSql]);

  // Execute current SQL
  const handleExecute = async () => {
    const trimmed = sqlCode.trim();
    if (!pg || !trimmed || isRunning) return;

    setIsRunning(true);
    setQueryError(null);
    const startTime = performance.now();

    try {
      // Execute query
      const res = await pg.query(trimmed);
      const endTime = performance.now();
      const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

      const fields = res.fields ? res.fields.map((f: any) => f.name) : [];
      const rows = res.rows || [];

      const resultData = {
        fields,
        rows,
        executionTimeMs,
        affectedRows: (res as any).affectedRows,
      };
      setQueryResult(resultData);
      cachedQueryResult = resultData;
      setQueryError(null);
      cachedQueryError = null;

      addHistoryEntry({
        sql: trimmed,
        success: true,
        executionTimeMs,
        rowCount: rows.length,
      });
    } catch (err: any) {
      console.error('SQL Execution Error:', err);
      const errMsg = err.message || 'Lỗi cú pháp hoặc lỗi thực thi câu lệnh SQL.';
      setQueryError(errMsg);
      cachedQueryError = errMsg;
      setQueryResult(null);
      cachedQueryResult = null;

      addHistoryEntry({
        sql: trimmed,
        success: false,
        errorMessage: errMsg,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter to run
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  // Reset Database to pristine state
  const handleResetDatabase = async () => {
    if (!confirm('Bạn có chắc chắn muốn khôi phục lại cơ sở dữ liệu mẫu về trạng thái ban đầu không?')) return;
    await initDb();
    setQueryResult(null);
    cachedQueryResult = null;
    setQueryError(null);
    cachedQueryError = null;
  };

  return (
    <div className={`relative flex flex-col bg-white text-slate-800 rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm ${isEmbedded ? 'h-full min-h-[580px]' : 'min-h-[80vh]'}`}>
      {/* Top Main Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Terminal className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">SQL Sandbox</h2>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDatabase}
            title="Khôi phục lại dữ liệu mẫu ban đầu"
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Reset</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace: Code Editor & Results Output */}
      <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
        {/* Editor Header Bar */}
        <div className="flex items-center justify-end gap-2 px-4 py-2 bg-slate-50/80 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              showHistory
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Lịch sử các lần chạy"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] rounded-full font-bold">
                {history.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSqlChange('')}
            className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            title="Clear"
          >
            Clear
          </button>

          {/* Run Query Button */}
          <button
            type="button"
            onClick={handleExecute}
            disabled={isRunning || !sqlCode.trim() || isInitializing}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>
        </div>

        {/* Text Editor Area */}
        <div className="relative border-b border-slate-200 bg-slate-50/40 font-mono">
          <textarea
            ref={textareaRef}
            value={sqlCode}
            onChange={(e) => handleSqlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            rows={7}
            className="w-full p-4 bg-transparent text-slate-800 text-xs sm:text-sm font-mono leading-relaxed outline-none resize-y placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-indigo-300 transition-colors"
          />
        </div>

        {/* Error Banner (if SQL error) */}
        {queryError && (
          <div className="p-3.5 mx-4 mt-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono text-[11px] leading-relaxed break-all">
              <span className="font-bold block text-rose-700 mb-1">Lỗi cú pháp SQL:</span>
              {queryError}
            </div>
          </div>
        )}

        {/* Result Stats Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50/70 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-indigo-600" /> Output
            </span>
            {queryResult && (
              <span className="px-2 py-0.5 rounded-md bg-white text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                {queryResult.rows.length} dòng
              </span>
            )}
          </div>
        </div>

        {/* Result Table Grid */}
        <div className="flex-1 overflow-auto p-4 min-h-[220px]">
          {isInitializing ? (
            <div className="py-16 text-center space-y-3 text-slate-500">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs font-bold text-slate-700">Đang khởi tạo SQL Engine...</p>
              <p className="text-[11px] text-slate-400">Khởi tạo dữ liệu mẫu quản lý sinh viên</p>
            </div>
          ) : queryResult ? (
            queryResult.rows.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-1">
                <p className="text-xs font-bold text-slate-600">Truy vấn thành công nhưng không có dòng dữ liệu nào được trả về.</p>
                {queryResult.affectedRows !== undefined && (
                  <p className="text-[11px] text-emerald-700 font-mono font-bold">Số dòng bị ảnh hưởng: {queryResult.affectedRows}</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-mono border-b border-slate-200">
                      <th className="p-2.5 text-slate-400 w-12 text-center border-r border-slate-200">#</th>
                      {queryResult.fields.map((col) => (
                        <th key={col} className="p-2.5 font-bold tracking-wider text-slate-700 border-r border-slate-200 last:border-r-0">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {queryResult.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition">
                        <td className="p-2 text-slate-400 text-center border-r border-slate-100 text-[11px] bg-slate-50/50">
                          {idx + 1}
                        </td>
                        {queryResult.fields.map((col) => {
                          const val = row[col];
                          return (
                            <td
                              key={col}
                              className="p-2 border-r border-slate-100 last:border-r-0 text-slate-800 text-[11px] whitespace-nowrap"
                            >
                              {val === null ? (
                                <span className="text-slate-400 italic">NULL</span>
                              ) : typeof val === 'boolean' ? (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                  {val ? 'TRUE' : 'FALSE'}
                                </span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Database className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Chưa có output</p>
            </div>
          )}
        </div>
      </div>

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs z-30 flex justify-end animate-in fade-in duration-150">
          <div className="w-full sm:w-96 bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">Lịch sử chạy SQL</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
                  {history.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {history.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-500">Chưa có lịch sử chạy</p>
                  <p className="text-[11px] text-slate-400">Mỗi lần bạn bấm Run, câu lệnh sẽ được lưu lại tại đây.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.success ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="text-slate-500 font-mono text-[10px]">
                          {new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        {item.rowCount !== undefined && (
                          <span className="text-slate-400 text-[10px]">
                            ({item.rowCount} dòng)
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                        title="Xóa bản ghi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <pre className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded-xl border border-slate-200/80 overflow-x-auto whitespace-pre-wrap line-clamp-3">
                      {item.sql}
                    </pre>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          handleSqlChange(item.sql);
                          setShowHistory(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Sử dụng</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SqlSandbox;
