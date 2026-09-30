import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { apiRouter } from './gateway/routes.js';

// Load root .env file so all settings are unified in 1 place
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend Vite development
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ownedu-gateway', timestamp: new Date().toISOString() });
});

// Mount API Gateway Router at /api/v1
app.use('/api/v1', apiRouter);

// Global error handling middleware (handles Multer errors, validation errors, etc.)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Backend Error]', err);
  const status = typeof err.status === 'number' ? err.status : (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  let message = err.message || 'Đã xảy ra lỗi máy chủ nội bộ.';
  if (err.code === 'LIMIT_FILE_SIZE' || err.message === 'File too large') {
    const maxMb = process.env.MAX_VIDEO_SIZE_MB || '2048';
    message = `Dung lượng tệp vượt quá giới hạn tối đa cho phép (${maxMb}MB / 2GB). Vui lòng chọn tệp nhỏ hơn hoặc nén lại trước khi tải lên.`;
  }
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'E-SERVER-ERROR',
      message,
    },
  });
});

// Start server

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 OwnEdu Backend API Gateway running on port ${PORT}`);
  console.log(`👉 Health check: http://localhost:${PORT}/health`);
  console.log(`👉 API Endpoints: http://localhost:${PORT}/api/v1/...`);
  console.log(`====================================================`);
});
