import { PGlite } from '@electric-sql/pglite';
import { DEFAULT_SQL_SEED } from '../components/sql/SqlSandbox';

// Shared PGlite singleton instance
let sharedPgInstance: PGlite | null = null;
let pgInitPromise: Promise<PGlite> | null = null;

export async function getSharedPgInstance(): Promise<PGlite> {
  if (sharedPgInstance) return sharedPgInstance;
  if (pgInitPromise) return pgInitPromise;

  pgInitPromise = (async () => {
    const db = new PGlite();
    await db.exec(DEFAULT_SQL_SEED);
    sharedPgInstance = db;
    return db;
  })();

  return pgInitPromise;
}

export type ExecutionResult =
  | {
      type: 'table';
      fields: string[];
      rows: any[];
      executionTimeMs: number;
      affectedRows?: number;
    }
  | {
      type: 'console';
      output: string;
      error?: string;
      executionTimeMs: number;
    }
  | {
      type: 'html';
      html: string;
      executionTimeMs: number;
    }
  | {
      type: 'json';
      formatted: string;
      error?: string;
      executionTimeMs: number;
    };

// Pyodide loader
let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

async function loadPyodideEngine(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = new Promise((resolve, reject) => {
    if ((window as any).loadPyodide) {
      (window as any)
        .loadPyodide()
        .then((py: any) => {
          pyodideInstance = py;
          resolve(py);
        })
        .catch(reject);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).loadPyodide) {
        (window as any)
          .loadPyodide()
          .then((py: any) => {
            pyodideInstance = py;
            resolve(py);
          })
          .catch(reject);
      } else {
        reject(new Error('Pyodide script loaded but loadPyodide function is missing.'));
      }
    };
    script.onerror = () => reject(new Error('Không thể tải Pyodide WebAssembly từ CDN.'));
    document.head.appendChild(script);
  });

  return pyodideLoadingPromise;
}

/**
 * Universal code runner for SQL, JS, TS, Python, HTML, JSON, Bash
 */
export async function executeCode(code: string, language: string): Promise<ExecutionResult> {
  const lang = (language || 'sql').toLowerCase().trim();
  const startTime = performance.now();

  // 1. SQL
  if (lang === 'sql') {
    try {
      const pg = await getSharedPgInstance();
      const res = await pg.query(code);
      const endTime = performance.now();
      const timeMs = Math.round((endTime - startTime) * 100) / 100;

      const fields = res.fields ? res.fields.map((f: any) => f.name) : [];
      const rows = res.rows || [];

      return {
        type: 'table',
        fields,
        rows,
        affectedRows: (res as any).affectedRows,
        executionTimeMs: timeMs,
      };
    } catch (err: any) {
      const endTime = performance.now();
      throw new Error(err.message || 'Lỗi cú pháp SQL');
    }
  }

  // 2. JavaScript / TypeScript
  if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
      info: (...args: any[]) => {
        logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
      warn: (...args: any[]) => {
        logs.push('[WARN] ' + args.map((a) => String(a)).join(' '));
      },
      error: (...args: any[]) => {
        logs.push('[ERROR] ' + args.map((a) => String(a)).join(' '));
      },
    };

    try {
      // Basic TypeScript type stripping if TS
      let executableJs = code;
      if (lang === 'typescript' || lang === 'ts') {
        // Strip basic type annotations like: : string, : number, interface ..., type ...
        executableJs = executableJs
          .replace(/:\s*(string|number|boolean|any|void|unknown|never|Record<[^>]+>|[A-Z][a-zA-Z0-9]*(\[\])?)\b/g, '')
          .replace(/(interface|type)\s+[A-Za-z0-9_]+\s*(=|{)[^}]+}?/g, '');
      }

      // Safe evaluation with isolated console
      const runFn = new Function('console', executableJs);
      const result = runFn(customConsole);

      if (result !== undefined && logs.length === 0) {
        logs.push(typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
      }

      const endTime = performance.now();
      return {
        type: 'console',
        output: logs.length > 0 ? logs.join('\n') : '(Chương trình thực thi thành công nhưng không có lệnh console.log in ra)',
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      };
    } catch (err: any) {
      const endTime = performance.now();
      return {
        type: 'console',
        output: logs.join('\n'),
        error: `${err.name}: ${err.message}`,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      };
    }
  }

  // 3. Python
  if (lang === 'python' || lang === 'py') {
    try {
      const py = await loadPyodideEngine();
      // Redirect python stdout
      py.runPython(`
import sys
import io
sys_stdout_backup = sys.stdout
sys_stderr_backup = sys.stderr
string_io_buffer = io.StringIO()
sys.stdout = string_io_buffer
sys.stderr = string_io_buffer
      `);

      let pyError: string | undefined = undefined;
      try {
        py.runPython(code);
      } catch (err: any) {
        pyError = err.message || String(err);
      }

      const stdoutOutput = py.runPython(`
output_val = string_io_buffer.getvalue()
sys.stdout = sys_stdout_backup
sys.stderr = sys_stderr_backup
output_val
      `);

      const endTime = performance.now();
      return {
        type: 'console',
        output: stdoutOutput || (pyError ? '' : '(Code Python chạy thành công nhưng không có lệnh print in ra)'),
        error: pyError,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      };
    } catch (cdnErr: any) {
      // Fallback simple Python print simulator if offline or WASM fails
      const lines = code.split('\n');
      const outputs: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        const printMatch = trimmed.match(/^print\((.*)\)$/);
        if (printMatch) {
          const rawArg = printMatch[1].trim();
          if ((rawArg.startsWith('"') && rawArg.endsWith('"')) || (rawArg.startsWith("'") && rawArg.endsWith("'"))) {
            outputs.push(rawArg.slice(1, -1));
          } else {
            try {
              outputs.push(String(new Function(`return ${rawArg}`)()));
            } catch {
              outputs.push(rawArg);
            }
          }
        }
      }
      const endTime = performance.now();
      return {
        type: 'console',
        output: outputs.length > 0 ? outputs.join('\n') : `(Chạy thử nghiệm Python):\n${code}`,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      };
    }
  }

  // 4. HTML
  if (lang === 'html' || lang === 'htm') {
    const endTime = performance.now();
    return {
      type: 'html',
      html: code,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    };
  }

  // 5. JSON
  if (lang === 'json') {
    try {
      const parsed = JSON.parse(code);
      const formatted = JSON.stringify(parsed, null, 2);
      const endTime = performance.now();
      return {
        type: 'json',
        formatted,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      };
    } catch (err: any) {
      const endTime = performance.now();
      return {
        type: 'json',
        formatted: code,
        error: `Lỗi định dạng JSON: ${err.message}`,
        executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      };
    }
  }

  // 6. Bash / Terminal Simulator
  if (lang === 'bash' || lang === 'sh' || lang === 'terminal') {
    const lines = code.split('\n');
    const logs: string[] = [];

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      logs.push(`$ ${line}`);

      if (line.startsWith('echo ')) {
        logs.push(line.slice(5).replace(/^['"]|['"]$/g, ''));
      } else if (line === 'pwd') {
        logs.push('/home/student/project');
      } else if (line === 'whoami') {
        logs.push('student');
      } else if (line === 'date') {
        logs.push(new Date().toUTCString());
      } else if (line.startsWith('ls')) {
        logs.push('index.html  main.py  package.json  src/  README.md');
      } else if (line.startsWith('cat ')) {
        logs.push(`[Nội dung tệp ${line.slice(4)}]`);
      } else {
        logs.push(`[Đã thực thi lệnh: ${line}]`);
      }
    }

    const endTime = performance.now();
    return {
      type: 'console',
      output: logs.join('\n'),
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
    };
  }

  // Fallback default
  const endTime = performance.now();
  return {
    type: 'console',
    output: code,
    executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
  };
}
