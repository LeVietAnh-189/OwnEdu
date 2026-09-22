import { spawn, ChildProcess } from "child_process";
import path from "path";

const rootDir = process.cwd();
const backendDir = path.join(rootDir, "backend");
const frontendDir = path.join(rootDir, "frontend");

const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const magenta = (text: string) => `\x1b[35m${text}\x1b[0m`;
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

console.log(bold(green("\n===========================================================")));
console.log(bold(green("   🎓 OWNEDU — Khởi chạy hệ thống toàn diện bằng Bun")));
console.log(bold(green("===========================================================")));
console.log(`📡 ${cyan("Backend API:")}   http://localhost:3000 (Health: http://localhost:3000/health)`);
console.log(`🖥️ ${magenta("Frontend Web:")}  http://localhost:5173`);
console.log(yellow("Nhấn Ctrl+C để dừng toàn bộ hệ thống bất kỳ lúc nào.\n"));

let backendProcess: ChildProcess | null = null;
let frontendProcess: ChildProcess | null = null;

function logPrefixed(prefix: string, data: Buffer | string) {
  const lines = data.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().length > 0) {
      console.log(`${prefix} ${line}`);
    }
  }
}

// Start Backend
backendProcess = spawn("bun", ["run", "dev"], {
  cwd: backendDir,
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
  env: { ...process.env, PORT: "3000" }
});

const backendPrefix = cyan("[backend]");
backendProcess.stdout?.on("data", (data: Buffer) => logPrefixed(backendPrefix, data));
backendProcess.stderr?.on("data", (data: Buffer) => logPrefixed(backendPrefix, data));

// Start Frontend
frontendProcess = spawn("bun", ["run", "dev"], {
  cwd: frontendDir,
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
  env: { ...process.env }
});

const frontendPrefix = magenta("[frontend]");
frontendProcess.stdout?.on("data", (data: Buffer) => logPrefixed(frontendPrefix, data));
frontendProcess.stderr?.on("data", (data: Buffer) => logPrefixed(frontendPrefix, data));

function cleanup() {
  console.log(yellow("\nĐang dừng tất cả các dịch vụ OwnEdu..."));
  if (backendProcess) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", backendProcess.pid!.toString(), "/T", "/F"]);
      } else {
        backendProcess.kill("SIGTERM");
      }
    } catch {
      // Ignore cleanup error
    }
  }
  if (frontendProcess) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", frontendProcess.pid!.toString(), "/T", "/F"]);
      } else {
        frontendProcess.kill("SIGTERM");
      }
    } catch {
      // Ignore cleanup error
    }
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", () => {
  if (backendProcess?.pid) {
    try { spawn("taskkill", ["/pid", backendProcess.pid.toString(), "/T", "/F"]); } catch {}
  }
  if (frontendProcess?.pid) {
    try { spawn("taskkill", ["/pid", frontendProcess.pid.toString(), "/T", "/F"]); } catch {}
  }
});
