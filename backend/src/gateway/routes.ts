import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { db } from '../db/hybridStore.js';
import { parsePdfBuffer, parseDocxBuffer, parseMarkdownBuffer, chunkText } from '../services/documentParser.js';
import { generateExamJob } from '../ai/examGenerator.js';
import { gradeExamAttempt, overrideTeacherGrade } from '../services/gradingService.js';
import { DocumentItem, ExamAttempt, PaymentPlanId, PaymentOrder } from '../types.js';
import { VideoService, reloadR2Config } from '../services/videoService.js';
import { sepayService, SePayWebhookPayload } from '../services/sepayService.js';

export const apiRouter = Router();
const videoService = new VideoService(db);

const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max per RULE-DOC-INGEST-001
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'text/markdown' ||
        file.mimetype === 'text/x-markdown' ||
        file.mimetype === 'text/plain' ||
        name.endsWith('.pdf') ||
        name.endsWith('.docx') ||
        name.endsWith('.md') ||
        name.endsWith('.markdown')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ tải lên tệp định dạng .pdf, .docx hoặc .md'));
    }
  }
});

const MAX_VIDEO_SIZE_MB = parseInt(process.env.MAX_VIDEO_SIZE_MB || '2048', 10);

const imageStorageDir = path.resolve(process.cwd(), 'data/uploads/images');
if (!fs.existsSync(imageStorageDir)) {
  fs.mkdirSync(imageStorageDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imageStorageDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const safeName = `img_${uuidv4().slice(0, 8)}_${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max per image
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (file.mimetype.startsWith('image/') ||
        name.endsWith('.png') ||
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.webp') ||
        name.endsWith('.gif') ||
        name.endsWith('.svg')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ tệp hình ảnh định dạng .png, .jpg, .jpeg, .webp, .gif hoặc .svg'));
    }
  }
});

const videoUpload = multer({
  dest: path.resolve(process.cwd(), 'uploads/temp'),
  limits: { fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024 }, // Mặc định 2GB (2048MB) cho video bài giảng
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (file.mimetype.startsWith('video/') ||
        name.endsWith('.mp4') ||
        name.endsWith('.webm') ||
        name.endsWith('.mov') ||
        name.endsWith('.mkv')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ tệp video định dạng .mp4, .webm, .mov hoặc .mkv'));
    }
  }
});

// Helper for standard envelope
function decodeFilename(name: string): string {
  try {
    const decoded = Buffer.from(name, 'latin1').toString('utf8');
    if (decoded && (/[À-ỹ]/.test(decoded) || /Ä|á»|Æ|áº/.test(name))) {
      return decoded;
    }
  } catch {}
  return name;
}

function successResponse<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    }
  });
}

function errorResponse(res: Response, code: string, message: string, status = 400, details?: any[]) {
  return res.status(status).json({
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: uuidv4()
    }
  });
}

// Middleware to check if a specific system service is under maintenance
export function serviceMaintenanceMiddleware(serviceKey: 'auth' | 'payment' | 'product' | 'cart') {
  return (req: Request, res: Response, next: () => void) => {
    const svc = db.getServiceByKey(serviceKey);
    if (!svc || svc.status !== 'MAINTENANCE') {
      return next();
    }

    const roleHeader = req.headers['x-user-role'] as string;
    const currentUser = db.getCurrentUser();
    const isAdmin = roleHeader ? (roleHeader === 'ADMIN') : (currentUser?.role === 'ADMIN');

    // If admin is performing actions and bypass is permitted, allow with bypass header
    if (isAdmin && (svc.allowAdminBypass !== false)) {
      res.setHeader('X-Service-Maintenance-Bypass', 'true');
      return next();
    }

    return res.status(503).json({
      success: false,
      error: {
        code: 'E-SERVICE-MAINTENANCE',
        message: svc.maintenanceMessage || `Dịch vụ ${svc.name} đang trong chế độ bảo trì định kỳ.`,
        serviceKey: svc.key,
        serviceName: svc.name,
        estimatedEndTime: svc.estimatedEndTime || null
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: uuidv4()
      }
    });
  };
}

// -------------------------------------------------------------
// USER ENDPOINT
// -------------------------------------------------------------
apiRouter.get('/users/me', (req, res) => {
  const user = db.getCurrentUser();
  return successResponse(res, user);
});

apiRouter.post('/users/switch-role', (req, res) => {
  const { role } = req.body;
  if (role !== 'USER' && role !== 'ADMIN') {
    return errorResponse(res, 'E-AUTH-001', 'Role không hợp lệ. Chỉ chấp nhận USER hoặc ADMIN.', 400);
  }
  const switchedUser = db.switchCurrentUserRole(role);
  return successResponse(res, switchedUser);
});

apiRouter.get('/users', (req, res) => {
  const users = db.getUsers();
  return successResponse(res, users);
});

apiRouter.post('/users', (req, res) => {
  const { fullName, email, role, tier } = req.body;
  if (!fullName || !email) {
    return errorResponse(res, 'E-USR-001', 'Họ tên và email không được để trống.', 400);
  }
  const users = db.getUsers();
  const nextNum = users.length + 1;
  const newUser = db.addUser({
    id: `usr_${uuidv4().slice(0, 8)}`,
    code: `OE-${String(nextNum).padStart(4, '0')}`,
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    role: role === 'ADMIN' ? 'ADMIN' : 'USER',
    tier: tier === 'PRO' ? 'PRO' : 'FREE'
  });
  return successResponse(res, newUser, 201);
});

apiRouter.patch('/users/:id', (req, res) => {
  const { id } = req.params;
  const { role, tier, fullName, email, code } = req.body;
  const updated = db.updateUser(id, { role, tier, fullName, email, code });
  if (!updated) {
    return errorResponse(res, 'E-USR-002', 'Không tìm thấy người dùng cần cập nhật.', 404);
  }
  return successResponse(res, updated);
});

apiRouter.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteUser(id);
  if (!deleted) {
    return errorResponse(res, 'E-USR-003', 'Không tìm thấy người dùng cần xóa.', 404);
  }
  return successResponse(res, { message: 'Đã xóa người dùng thành công.' });
});

// -------------------------------------------------------------
// DOCUMENT ENDPOINTS (doc-ingestion)
// -------------------------------------------------------------
apiRouter.get('/documents', (req, res) => {
  const docs = db.getDocuments();
  return successResponse(res, docs);
});

apiRouter.post('/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return errorResponse(res, 'E-DOC-INGEST-002', 'Vui lòng chọn tệp tài liệu .pdf hoặc .docx', 400);
    }

    const docId = uuidv4();
    const currentUser = db.getCurrentUser();
    const ext = path.extname(file.originalname).toLowerCase();
    const isMd = ext === '.md' || ext === '.markdown' || file.mimetype === 'text/markdown' || file.mimetype === 'text/x-markdown';
    const isPdf = ext === '.pdf' || file.mimetype === 'application/pdf';

    const cleanFilename = decodeFilename(file.originalname);

    // Parse file contents:
    // If it's already a markdown (.md) file, parse directly in-memory without MinerU or Mammoth!
    const parseResult = isMd
      ? parseMarkdownBuffer(file.buffer)
      : isPdf 
      ? await parsePdfBuffer(file.buffer, cleanFilename)
      : await parseDocxBuffer(file.buffer);

    if (parseResult.totalWords < 20) {
      return errorResponse(res, 'E-DOC-INGEST-004', 'Tài liệu không chứa lớp văn bản hợp lệ hoặc ít hơn 20 từ.', 422);
    }

    // Chunking text (1000 - 1500 chars with 150 chars overlap, heading-aware)
    const chunks = chunkText(docId, parseResult.markdownText || parseResult.text, parseResult.outline);

    const docItem: DocumentItem = {
      id: docId,
      userId: currentUser.id,
      filename: cleanFilename,
      fileType: isMd ? 'md' : (isPdf ? 'pdf' : 'docx'),
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      storagePath: `/uploads/${cleanFilename}`,
      pageCount: parseResult.pageCount,
      status: 'PARSED',
      extractedOutline: parseResult.outline,
      rawText: parseResult.text.slice(0, 1000), // Preview sample
      markdownText: parseResult.markdownText || parseResult.text,
      parserEngine: parseResult.parserEngine || (isMd ? 'direct-markdown' : (isPdf ? 'pdf-parse' : 'mammoth')),
      totalWords: parseResult.totalWords,
      chunksCount: chunks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addDocument(docItem);
    db.addChunks(chunks);

    return successResponse(res, docItem, 201);
  } catch (err: any) {
    console.error('Upload error:', err);
    return errorResponse(res, 'E-DOC-INGEST-005', err.message || 'Lỗi bóc tách tài liệu', 500);
  }
});

apiRouter.get('/documents/:id', (req, res) => {
  const doc = db.getDocumentById(req.params.id);
  if (!doc) {
    return errorResponse(res, 'E-DOC-404', 'Không tìm thấy tài liệu yêu cầu', 404);
  }
  return successResponse(res, doc);
});

apiRouter.get('/documents/:id/chunks', (req, res) => {
  const chunks = db.getChunksByDocumentId(req.params.id);
  return successResponse(res, chunks);
});

apiRouter.delete('/documents/:id', (req, res) => {
  const success = db.deleteDocument(req.params.id);
  if (!success) {
    return errorResponse(res, 'E-DOC-404', 'Không tìm thấy tài liệu để xóa', 404);
  }
  return successResponse(res, { deleted: true });
});

// -------------------------------------------------------------
// EXAM ENDPOINTS (ai-exam-generator)
// -------------------------------------------------------------
apiRouter.get('/exams', (req, res) => {
  const exams = db.getExams();
  return successResponse(res, exams);
});

apiRouter.post('/exams/generate', async (req, res) => {
  const { document_id, title, config } = req.body;
  if (!document_id) {
    return errorResponse(res, 'E-GEN-001', 'Thiếu document_id tài liệu nguồn', 400);
  }

  const jobId = uuidv4();

  // Asynchronous execution via Event / Worker pattern
  setTimeout(async () => {
    try {
      await generateExamJob(jobId, document_id, title, {
        mcqCount: Number(config?.mcq_count) || 5,
        essayCount: Number(config?.essay_count) || 1,
        bloomLevels: config?.bloom_levels || ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'],
        targetAudience: config?.target_audience || 'UNIVERSITY',
        language: config?.language || 'vi',
        timeLimitMinutes: Number(config?.time_limit_minutes) || 45,
      });
    } catch (err: any) {
      db.emitSSEProgress({
        jobId,
        progressPercent: 0,
        step: 'FAILED',
        message: 'Lỗi sinh đề: ' + err.message,
        error: err.message
      });
    }
  }, 100);

  // Return 202 Accepted with job_id per spec
  return successResponse(res, {
    job_id: jobId,
    status: 'QUEUED',
    message: 'Yêu cầu tạo đề đã được tiếp nhận và đưa vào hàng đợi xử lý'
  }, 202);
});

// SSE Streaming Progress Endpoint
apiRouter.get('/exams/jobs/:jobId/stream', (req, res) => {
  const { jobId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendSSE = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Initial ping
  sendSSE({ jobId, progressPercent: 5, step: 'QUEUED', message: 'Đang kết nối tới AI Engine Worker...' });

  db.registerSSEClient(jobId, sendSSE);

  req.on('close', () => {
    db.unregisterSSEClient(jobId);
  });
});

apiRouter.get('/exams/:id', (req, res) => {
  const exam = db.getExamById(req.params.id);
  if (!exam) {
    return errorResponse(res, 'E-EXAM-404', 'Không tìm thấy đề thi', 404);
  }
  return successResponse(res, exam);
});

apiRouter.put('/exams/:id/questions/:qId', (req, res) => {
  const { id, qId } = req.params;
  const updatedQ = db.updateQuestion(id, qId, req.body);
  if (!updatedQ) {
    return errorResponse(res, 'E-QUESTION-404', 'Không tìm thấy câu hỏi để cập nhật', 404);
  }
  return successResponse(res, updatedQ);
});

apiRouter.post('/exams/:id/publish', (req, res) => {
  const exam = db.updateExam(req.params.id, { status: 'PUBLISHED' });
  if (!exam) {
    return errorResponse(res, 'E-EXAM-404', 'Không tìm thấy đề thi', 404);
  }
  return successResponse(res, exam);
});

apiRouter.delete('/exams/:id', (req, res) => {
  const success = db.deleteExam(req.params.id);
  if (!success) {
    return errorResponse(res, 'E-EXAM-404', 'Không tìm thấy đề thi để xóa', 404);
  }
  return successResponse(res, { deleted: true });
});

// -------------------------------------------------------------
// INTERACTIVE TESTING ROOM ENDPOINTS (interactive-testing)
// -------------------------------------------------------------
apiRouter.post('/exams/:id/start', (req, res) => {
  const exam = db.getExamById(req.params.id);
  if (!exam) {
    return errorResponse(res, 'E-TEST-001', 'Đề thi không tồn tại hoặc đã bị xóa', 404);
  }
  if (exam.status !== 'PUBLISHED') {
    return errorResponse(res, 'E-TEST-001', 'Đề thi chưa được xuất bản chính thức', 400);
  }

  const currentUser = db.getCurrentUser();
  const attemptId = uuidv4();
  const now = new Date();
  const durationMs = (exam.suggestedDurationMinutes || 45) * 60 * 1000;
  const expiresAt = new Date(now.getTime() + durationMs).toISOString();

  const newAttempt: ExamAttempt = {
    id: attemptId,
    examId: exam.id,
    userId: currentUser.id,
    startedAt: now.toISOString(),
    expiresAt,
    status: 'IN_PROGRESS',
    answers: {},
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  db.addAttempt(newAttempt);

  // Return attempt info and questions with hidden correct answers
  const safeQuestions = exam.questions.map(q => ({
    id: q.id,
    orderIndex: q.orderIndex,
    type: q.type,
    bloomLevel: q.bloomLevel,
    content: q.content,
    points: q.points,
    options: q.options?.map(opt => ({ key: opt.key, content: opt.content })),
    rubricCount: q.rubric?.length || 0,
  }));

  return successResponse(res, {
    attempt_id: attemptId,
    exam_id: exam.id,
    exam_title: exam.title,
    duration_minutes: exam.suggestedDurationMinutes,
    expires_at: expiresAt,
    questions: safeQuestions,
    answers: newAttempt.answers
  });
});

apiRouter.get('/attempts/:id', (req, res) => {
  const attempt = db.getAttemptById(req.params.id);
  if (!attempt) {
    return errorResponse(res, 'E-ATTEMPT-404', 'Không tìm thấy phiên làm bài', 404);
  }
  const exam = db.getExamById(attempt.examId);
  if (!exam) {
    return errorResponse(res, 'E-EXAM-404', 'Không tìm thấy đề thi tương ứng', 404);
  }

  const safeQuestions = exam.questions.map(q => ({
    id: q.id,
    orderIndex: q.orderIndex,
    type: q.type,
    bloomLevel: q.bloomLevel,
    content: q.content,
    points: q.points,
    options: q.options?.map(opt => ({ key: opt.key, content: opt.content })),
    rubricCount: q.rubric?.length || 0,
  }));

  return successResponse(res, {
    attempt_id: attempt.id,
    exam_id: exam.id,
    exam_title: exam.title,
    duration_minutes: exam.suggestedDurationMinutes,
    expires_at: attempt.expiresAt,
    status: attempt.status,
    questions: safeQuestions,
    answers: attempt.answers
  });
});

// Auto-Save Endpoint (< 100ms response time per spec)
apiRouter.put('/attempts/:id/answers/:qId', (req, res) => {
  try {
    const { id, qId } = req.params;
    const { answer_type, selected_option, essay_text } = req.body;

    const result = db.saveAttemptAnswer(id, qId, {
      type: answer_type || 'MCQ',
      selectedOption: selected_option,
      essayText: essay_text
    });

    return successResponse(res, {
      question_id: qId,
      saved_at: result.savedAt
    });
  } catch (err: any) {
    return errorResponse(res, 'E-TEST-003', err.message, 400);
  }
});

// Toggle Question Flag
apiRouter.put('/attempts/:id/flags', (req, res) => {
  const { id } = req.params;
  const { question_id } = req.body;
  const isFlagged = db.toggleAttemptFlag(id, question_id);
  return successResponse(res, { question_id, is_flagged: isFlagged });
});

// Submit Attempt & Handover to Grading
apiRouter.post('/attempts/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const attempt = db.getAttemptById(id);
    if (!attempt) {
      return errorResponse(res, 'E-ATTEMPT-404', 'Không tìm thấy phiên làm bài', 404);
    }
    if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      return errorResponse(res, 'E-TEST-002', 'Bài thi đã được nộp trước đó', 409);
    }

    const submittedAt = new Date().toISOString();
    attempt.status = 'SUBMITTED';
    attempt.submittedAt = submittedAt;
    attempt.submissionType = req.body.submission_type || 'MANUAL';
    db.updateAttempt(id, attempt);

    // Trigger instant grading pipeline
    const gradeReport = await gradeExamAttempt(attempt);

    return successResponse(res, {
      attempt_id: attempt.id,
      status: 'GRADED',
      submitted_at: submittedAt,
      grade_report: gradeReport
    });
  } catch (err: any) {
    return errorResponse(res, 'E-GRADE-002', err.message, 500);
  }
});

// -------------------------------------------------------------
// GRADING & FEEDBACK ENDPOINTS (ai-grading-feedback)
// -------------------------------------------------------------
apiRouter.get('/attempts/:id/result', (req, res) => {
  const { id } = req.params;
  const report = db.getGradeReportByAttemptId(id);
  if (!report) {
    return errorResponse(res, 'E-GRADE-001', 'Bài thi chưa có kết quả chấm điểm', 404);
  }
  const exam = db.getExamById(report.examId);

  return successResponse(res, {
    report,
    exam_title: exam?.title || 'Bài thi',
    questions: exam?.questions || []
  });
});

apiRouter.post('/attempts/:id/override-grade', (req, res) => {
  try {
    const { id } = req.params;
    const { question_id, teacher_id, new_score, override_reason } = req.body;

    if (new_score === undefined) {
      return errorResponse(res, 'E-GRADE-003', 'Thiếu điểm số mới cần ghi đè', 400);
    }

    const updatedReport = overrideTeacherGrade(
      id, 
      question_id, 
      teacher_id || 'teacher_instructor', 
      Number(new_score), 
      override_reason
    );

    return successResponse(res, updatedReport);
  } catch (err: any) {
    return errorResponse(res, 'E-GRADE-004', err.message, 400);
  }
});

// -------------------------------------------------------------
// SETTINGS ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/settings', (req, res) => {
  const settings = db.getSettings();
  const effectiveGemini = settings.geminiApiKey || process.env.GEMINI_API_KEY || '';
  const effectiveOpenAi = settings.openaiApiKey || process.env.OPENAI_API_KEY || '';

  return successResponse(res, {
    activeModel: settings.activeModel || 'gemini-2.5-flash',
    geminiApiKey: effectiveGemini,
    hasGeminiKey: Boolean(effectiveGemini),
    geminiApiKeyMasked: effectiveGemini ? `${effectiveGemini.slice(0, 8)}...${effectiveGemini.slice(-4)}` : '',
    openaiApiKey: effectiveOpenAi,
    hasOpenAiKey: Boolean(effectiveOpenAi),
    // Cloudflare R2 Credentials & Config
    r2AccountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID || '',
    r2AccessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
    r2BucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'ownedu-videos',
    r2PublicDomain: process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || '',
    hasR2Config: Boolean(
      process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    )
  });
});

apiRouter.post('/settings', (req, res) => {
  const roleHeader = req.headers['x-user-role'] as string;
  const currentUser = db.getCurrentUser();
  const isAdmin = roleHeader === 'ADMIN' || currentUser?.role === 'ADMIN' || process.env.NODE_ENV !== 'production';

  if (!isAdmin) {
    return errorResponse(res, 'E-AUTH-403', 'Từ chối truy cập: Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền cấu hình hệ thống.', 403);
  }

  const {
    gemini_api_key,
    openai_api_key,
    active_model,
    r2_account_id,
    r2_access_key_id,
    r2_secret_access_key,
    r2_bucket_name,
    r2_public_domain
  } = req.body;

  const updated = db.updateSettings({
    ...(gemini_api_key !== undefined && { geminiApiKey: gemini_api_key }),
    ...(openai_api_key !== undefined && { openaiApiKey: openai_api_key }),
    ...(active_model !== undefined && { activeModel: active_model }),
  });

  // Update runtime process.env
  if (gemini_api_key !== undefined) process.env.GEMINI_API_KEY = gemini_api_key;
  if (openai_api_key !== undefined) process.env.OPENAI_API_KEY = openai_api_key;
  if (r2_account_id !== undefined) process.env.CLOUDFLARE_R2_ACCOUNT_ID = r2_account_id;
  if (r2_access_key_id !== undefined) process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = r2_access_key_id;
  if (r2_secret_access_key !== undefined) process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = r2_secret_access_key;
  if (r2_bucket_name !== undefined) process.env.CLOUDFLARE_R2_BUCKET_NAME = r2_bucket_name;
  if (r2_public_domain !== undefined) process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN = r2_public_domain;

  // Sync to .env files
  try {
    const envPaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '../.env')
    ];
    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        let content = fs.readFileSync(envPath, 'utf8');

        const updateEnvVar = (key: string, val: string | undefined) => {
          if (val === undefined) return;
          const regex = new RegExp(`^${key}=.*$`, 'm');
          if (regex.test(content)) {
            content = content.replace(regex, `${key}=${val}`);
          } else {
            content += `\n${key}=${val}`;
          }
        };

        updateEnvVar('GEMINI_API_KEY', gemini_api_key);
        updateEnvVar('OPENAI_API_KEY', openai_api_key);
        updateEnvVar('CLOUDFLARE_R2_ACCOUNT_ID', r2_account_id);
        updateEnvVar('CLOUDFLARE_R2_ACCESS_KEY_ID', r2_access_key_id);
        updateEnvVar('CLOUDFLARE_R2_SECRET_ACCESS_KEY', r2_secret_access_key);
        updateEnvVar('CLOUDFLARE_R2_BUCKET_NAME', r2_bucket_name);
        updateEnvVar('CLOUDFLARE_R2_PUBLIC_DOMAIN', r2_public_domain);

        fs.writeFileSync(envPath, content, 'utf8');
      }
    }
  } catch (err: any) {
    console.warn('[Settings] Could not sync .env file:', err.message);
  }

  // Reload R2 client with new credentials
  reloadR2Config();

  return successResponse(res, {
    activeModel: updated.activeModel,
    hasGeminiKey: Boolean(updated.geminiApiKey || process.env.GEMINI_API_KEY),
    hasR2Config: Boolean(
      process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    ),
    message: 'Đã lưu cấu hình hệ thống thành công và tự động đồng bộ vào tệp .env!',
  });
});

/**
 * Kiểm tra kết nối API Key AI (Google Gemini hoặc OpenAI)
 */
apiRouter.post('/settings/test-ai', async (req, res) => {
  const { provider = 'gemini', apiKey, model } = req.body;
  const keyToTest = apiKey || (provider === 'gemini' ? (db.getSettings().geminiApiKey || process.env.GEMINI_API_KEY) : (db.getSettings().openaiApiKey || process.env.OPENAI_API_KEY));
  
  if (!keyToTest) {
    return errorResponse(res, 'E-KEY-MISSING', `Chưa cung cấp ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI'} API Key. Vui lòng nhập khóa API trước khi kiểm tra.`, 400);
  }

  const startTime = Date.now();
  try {
    if (provider === 'gemini') {
      const currentActive = db.getSettings().activeModel;
      const testModel = model || (currentActive && currentActive !== 'offline-smart' ? currentActive : 'gemini-3.5-flash');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${keyToTest}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Ping test. Reply with one word: PONG' }] }]
        })
      });
      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as any;
        const errMsg = errData?.error?.message || response.statusText;
        return errorResponse(res, 'E-AI-CONN-FAILED', `Google Gemini từ chối kết nối (Mã lỗi ${response.status}): ${errMsg}`, 400);
      }
      return successResponse(res, {
        connected: true,
        provider: 'Google Gemini',
        model: testModel,
        latencyMs,
        message: `Kết nối Google Gemini thành công! (Mô hình: ${testModel}, Độ trễ: ${latencyMs}ms)`
      });
    } else {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${keyToTest}` }
      });
      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as any;
        const errMsg = errData?.error?.message || response.statusText;
        return errorResponse(res, 'E-AI-CONN-FAILED', `OpenAI từ chối kết nối (Mã lỗi ${response.status}): ${errMsg}`, 400);
      }
      return successResponse(res, {
        connected: true,
        provider: 'OpenAI',
        latencyMs,
        message: `Kết nối OpenAI API thành công! (Độ trễ: ${latencyMs}ms)`
      });
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return errorResponse(res, 'E-AI-CONN-ERROR', `Không thể kết nối đến máy chủ AI (${latencyMs}ms): ${err.message}`, 500);
  }
});

/**
 * Kiểm tra kết nối Cloudflare R2 Credentials
 */
apiRouter.post('/settings/test-r2', async (req, res) => {
  const {
    accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID,
    accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'ownedu-videos'
  } = req.body;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return errorResponse(res, 'E-R2-KEY-MISSING', 'Vui lòng điền đủ Account ID, Access Key ID và Secret Access Key của Cloudflare R2.', 400);
  }

  const startTime = Date.now();
  try {
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const testClient = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    await testClient.send(new HeadBucketCommand({ Bucket: bucketName }));
    const latencyMs = Date.now() - startTime;

    return successResponse(res, {
      connected: true,
      bucket: bucketName,
      latencyMs,
      message: `Kết nối Cloudflare R2 thành công! Bucket "${bucketName}" tồn tại và sẵn sàng lưu trữ (Độ trễ: ${latencyMs}ms).`
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    const statusCode = err.$metadata?.httpStatusCode;
    let msg = err.message;
    if (statusCode === 404) {
      msg = `Bucket "${bucketName}" không tồn tại trên tài khoản Cloudflare R2 này.`;
    } else if (statusCode === 403) {
      msg = 'Sai Access Key hoặc Secret Access Key, hoặc Token không có quyền truy cập Bucket này.';
    }
    return errorResponse(res, 'E-R2-CONN-FAILED', `Lỗi kết nối Cloudflare R2 (${latencyMs}ms): ${msg}`, 400);
  }
});

// -------------------------------------------------------------
// SYSTEM SERVICES MAINTENANCE ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/system/services', (_req, res) => {
  const services = db.getServices();
  return successResponse(res, services);
});

apiRouter.get('/system/services/status', (_req, res) => {
  const services = db.getServices();
  const statusMap: Record<string, { inMaintenance: boolean; name: string; message?: string; estimatedEndTime?: string }> = {};
  services.forEach(s => {
    statusMap[s.key] = {
      inMaintenance: s.status === 'MAINTENANCE',
      name: s.name,
      message: s.maintenanceMessage,
      estimatedEndTime: s.estimatedEndTime
    };
  });
  return successResponse(res, statusMap);
});

apiRouter.post('/system/services/:id/toggle', (req, res) => {
  const roleHeader = req.headers['x-user-role'] as string;
  const currentUser = db.getCurrentUser();
  const isAdmin = roleHeader === 'ADMIN' || currentUser?.role === 'ADMIN' || process.env.NODE_ENV !== 'production';

  if (!isAdmin) {
    return errorResponse(res, 'E-AUTH-403', 'Từ chối truy cập: Chỉ Quản trị viên (ADMIN) mới có quyền bật/tắt bảo trì dịch vụ.', 403);
  }

  const { id } = req.params;
  const { status, maintenanceMessage, estimatedEndTime, allowAdminBypass } = req.body;

  const targetService = db.getServiceByKey(id);
  if (!targetService) {
    return errorResponse(res, 'E-SVC-404', `Không tìm thấy dịch vụ với mã hoặc ID: ${id}`, 404);
  }

  const nextStatus = status ? status : (targetService.status === 'RUNNING' ? 'MAINTENANCE' : 'RUNNING');

  const updated = db.updateService(targetService.id, {
    status: nextStatus,
    ...(maintenanceMessage !== undefined && { maintenanceMessage: String(maintenanceMessage).trim() }),
    ...(estimatedEndTime !== undefined && { estimatedEndTime: String(estimatedEndTime).trim() }),
    ...(allowAdminBypass !== undefined && { allowAdminBypass: Boolean(allowAdminBypass) })
  });

  return successResponse(res, updated);
});

// Test Payment Endpoint (Guarded by Payment Service Maintenance Middleware)
apiRouter.post('/payments/checkout', serviceMaintenanceMiddleware('payment'), (req, res) => {
  return successResponse(res, {
    transactionId: `tx_${Date.now()}`,
    status: 'COMPLETED',
    message: 'Thanh toán thành công (Môi trường thử nghiệm Sandbox).'
  });
});

// -------------------------------------------------------------
// ADMIN ENDPOINTS (System, Resources, Courses, Tokens, API Keys)
// -------------------------------------------------------------
apiRouter.get('/admin/stats', (req, res) => {
  const stats = db.getAdminStats();
  return successResponse(res, stats);
});

apiRouter.get('/admin/courses', (req, res) => {
  const courses = db.getCourses();
  return successResponse(res, courses);
});

apiRouter.get('/courses', (req, res) => {
  const courses = db.getCourses();
  return successResponse(res, courses);
});

apiRouter.post('/admin/courses', (req, res) => {
  const { code, name, description, department, topic, isFreeTier, tierRequired, documentIds, videoIds, chapters, status } = req.body;
  if (!code || !name) {
    return errorResponse(res, 'E-CRS-001', 'Mã môn học và tên môn học là bắt buộc.', 400);
  }
  const isFree = isFreeTier !== false && tierRequired !== 'PRO';
  const tier = isFree ? 'FREE' : 'PRO';
  const docIds = Array.isArray(documentIds) ? documentIds.map((id: any) => String(id).trim()).filter(Boolean) : [];
  const vIds = Array.isArray(videoIds) ? videoIds.map((id: any) => String(id).trim()).filter(Boolean) : [];
  const courseChapters = Array.isArray(chapters) ? chapters : [];
  const courseStatus = status === 'published' ? 'published' : 'draft';

  const newCourse = db.addCourse({
    id: `crs_${uuidv4().slice(0, 8)}`,
    code: code.trim(),
    name: name.trim(),
    description: (description || '').trim(),
    department: (department || topic || 'Chung').trim(),
    topic: (topic || 'Lập trình').trim(),
    isFreeTier: isFree,
    tierRequired: tier,
    documentIds: docIds,
    videoIds: vIds,
    chapters: courseChapters,
    status: courseStatus,
    createdAt: new Date().toISOString()
  });
  return successResponse(res, newCourse, 201);
});

apiRouter.put('/admin/courses/:id', (req, res) => {
  const { id } = req.params;
  const { code, name, description, department, topic, isFreeTier, tierRequired, documentIds, videoIds, chapters, status } = req.body;

  const existing = db.getCourse(id);
  if (!existing) {
    return errorResponse(res, 'E-CRS-002', 'Không tìm thấy khóa học cần cập nhật.', 404);
  }

  const updates: Partial<typeof existing> = {};
  if (code !== undefined) updates.code = String(code).trim();
  if (name !== undefined) updates.name = String(name).trim();
  if (description !== undefined) updates.description = String(description).trim();
  if (department !== undefined) updates.department = String(department).trim();
  if (topic !== undefined) updates.topic = String(topic).trim();
  if (isFreeTier !== undefined || tierRequired !== undefined) {
    const isFree = isFreeTier !== false && tierRequired !== 'PRO';
    updates.isFreeTier = isFree;
    updates.tierRequired = isFree ? 'FREE' : 'PRO';
  }
  if (documentIds !== undefined && Array.isArray(documentIds)) {
    updates.documentIds = documentIds.map((d: any) => String(d).trim()).filter(Boolean);
  }
  if (videoIds !== undefined && Array.isArray(videoIds)) {
    updates.videoIds = videoIds.map((v: any) => String(v).trim()).filter(Boolean);
  }
  if (chapters !== undefined && Array.isArray(chapters)) {
    updates.chapters = chapters;
  }
  if (status !== undefined) {
    updates.status = status === 'published' ? 'published' : 'draft';
  }

  const updated = db.updateCourse(id, updates);
  return successResponse(res, updated);
});

apiRouter.delete('/admin/courses/:id', (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteCourse(id);
  if (!deleted) {
    return errorResponse(res, 'E-CRS-002', 'Không tìm thấy khóa học cần xóa.', 404);
  }
  return successResponse(res, { message: 'Đã xóa khóa học thành công.' });
});

apiRouter.get('/admin/tokens', (req, res) => {
  const tokenLogs = db.getTokenLogs();
  const totalTokens = tokenLogs.reduce((acc, t) => acc + (t.totalTokens || 0), 0);
  const totalCost = tokenLogs.reduce((acc, t) => acc + (t.costUsd || 0), 0);
  return successResponse(res, {
    logs: tokenLogs,
    summary: {
      totalTokens,
      estimatedCostUsd: Number(totalCost.toFixed(4)),
      callCount: tokenLogs.length
    }
  });
});

apiRouter.get('/admin/resources', (req, res) => {
  const documents = db.getDocuments();
  const totalStorageBytes = documents.reduce((acc, d) => acc + (d.fileSizeBytes || 0), 0);
  return successResponse(res, {
    documents,
    storage: {
      totalStorageBytes,
      totalStorageMB: (totalStorageBytes / (1024 * 1024)).toFixed(2),
      documentCount: documents.length
    }
  });
});

// ==========================================
// IMAGE UPLOADS FOR HYPERTEXT LESSONS
// ==========================================
apiRouter.post('/images/upload', imageUpload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return errorResponse(res, 'E-IMG-001', 'Vui lòng đính kèm tệp hình ảnh để tải lên.', 400);
  }

  const url = `/api/v1/images/${file.filename}`;
  return successResponse(res, {
    url,
    filename: file.filename,
    originalName: decodeFilename(file.originalname),
    sizeBytes: file.size
  }, 201);
});

apiRouter.get('/images/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(imageStorageDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Không tìm thấy hình ảnh.');
  }

  const ext = path.extname(safeFilename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  fs.createReadStream(filePath).pipe(res);
});

// ==========================================
// VIDEO LECTURES & MULTIMEDIA ENDPOINTS
// ==========================================

// 1. Danh sách video (hỗ trợ lọc ?courseId=...)
apiRouter.get('/videos', (req, res) => {
  const { courseId } = req.query;
  let videos = db.getVideos();
  if (courseId) {
    videos = videos.filter(v => v.courseId === String(courseId));
  }
  return successResponse(res, videos);
});

// 2. Chi tiết 1 video & trạng thái nén
apiRouter.get('/videos/:id', (req, res) => {
  const { id } = req.params;
  const video = db.getVideo(id);
  if (!video) {
    return errorResponse(res, 'E-VID-001', 'Không tìm thấy video.', 404);
  }
  return successResponse(res, video);
});

// 3. Tải lên video trực tiếp qua Backend & Chạy nén ngầm FFmpeg
apiRouter.post('/videos/upload', videoUpload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return errorResponse(res, 'E-VID-002', 'Vui lòng đính kèm tệp video để tải lên.', 400);
  }

  const { title, courseId } = req.body;
  const videoId = `vid_${uuidv4().slice(0, 8)}`;
  const originalFilename = decodeFilename(file.originalname);

  // Kích hoạt pipeline xử lý ngầm (Asynchronous Worker Job)
  videoService.processUploadedVideo(
    videoId,
    file.path,
    originalFilename,
    title,
    courseId
  );

  const initialItem = db.getVideo(videoId);
  return successResponse(res, initialItem, 202);
});

// 3b. Gắn link video YouTube (Không tốn lưu trữ R2, tối ưu cho khóa học Free)
apiRouter.post('/videos/youtube', async (req, res) => {
  const { youtubeUrl, title, courseId } = req.body;
  if (!youtubeUrl || typeof youtubeUrl !== 'string') {
    return errorResponse(res, 'E-VID-YT-001', 'Vui lòng cung cấp đường dẫn video YouTube hợp lệ.', 400);
  }

  const youtubeId = videoService.extractYoutubeId(youtubeUrl);
  if (!youtubeId) {
    return errorResponse(res, 'E-VID-YT-002', 'Đường dẫn YouTube không đúng định dạng (ví dụ: https://www.youtube.com/watch?v=... hoặc https://youtu.be/...).', 400);
  }

  const videoId = `yt_${youtubeId}_${uuidv4().slice(0, 4)}`;
  const videoItem = videoService.createYoutubeVideo(videoId, youtubeUrl, title, courseId);
  if (!videoItem) {
    return errorResponse(res, 'E-VID-YT-003', 'Không thể tạo bản ghi video YouTube.', 500);
  }

  return successResponse(res, videoItem, 201);
});

// 4. Lấy Presigned URL để Direct-to-Cloud Upload lên Cloudflare R2 (giống Bloomfit)
apiRouter.post('/videos/presign', async (req, res) => {
  const { filename, contentType } = req.body;
  if (!filename) {
    return errorResponse(res, 'E-VID-003', 'Tên tệp là bắt buộc.', 400);
  }

  const presignData = await videoService.getPresignedUploadUrl(filename, contentType);
  if (!presignData) {
    return successResponse(res, {
      isR2Active: false,
      message: 'Cloudflare R2 chưa được cấu hình. Hệ thống sẽ tự động dùng API tải trực tiếp (/api/v1/videos/upload).'
    });
  }

  return successResponse(res, {
    isR2Active: true,
    presignedUrl: presignData.presignedUrl,
    key: presignData.key
  });
});

// 5. Stream video cục bộ hỗ trợ chuẩn HTTP Range Request (RFC 7233)
apiRouter.get('/videos/:id/stream', (req, res) => {
  const { id } = req.params;
  const video = db.getVideo(id);
  if (!video) {
    return res.status(404).send('Video không tồn tại.');
  }

  // Nếu storageUrl là link CDN/R2 ngoài (https://...), redirect thẳng đến CDN
  if (video.storageUrl.startsWith('http://') || video.storageUrl.startsWith('https://')) {
    return res.redirect(video.storageUrl);
  }

  const videoPath = videoService.getLocalVideoPath(id);
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Tệp video chưa sẵn sàng hoặc đang trong quá trình nén.');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// 6. Phục vụ Thumbnail của video
apiRouter.get('/videos/:id/thumbnail', (req, res) => {
  const { id } = req.params;
  const thumbPath = videoService.getLocalThumbnailPath(id);
  if (!fs.existsSync(thumbPath)) {
    return res.status(404).send('Không tìm thấy thumbnail.');
  }
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(thumbPath).pipe(res);
});

// 7. Xóa video
apiRouter.delete('/videos/:id', (req, res) => {
  const { id } = req.params;
  const video = db.getVideo(id);
  if (!video) {
    return errorResponse(res, 'E-VID-004', 'Không tìm thấy video để xóa.', 404);
  }

  // Xóa file local nếu có
  const localVid = videoService.getLocalVideoPath(id);
  const localThumb = videoService.getLocalThumbnailPath(id);
  try { if (fs.existsSync(localVid)) fs.unlinkSync(localVid); } catch {}
  try { if (fs.existsSync(localThumb)) fs.unlinkSync(localThumb); } catch {}

  // Gỡ khỏi khóa học nếu có
  if (video.courseId) {
    const course = db.getCourse(video.courseId);
    if (course && course.videoIds) {
      db.updateCourse(video.courseId, {
        videoIds: course.videoIds.filter(vId => vId !== id)
      });
    }
  }

  db.deleteVideo(id);
  return successResponse(res, { message: 'Đã xóa video thành công.' });
});

// -------------------------------------------------------------
// PAYMENT & PRO VIP (SePay VietQR) ENDPOINTS
// -------------------------------------------------------------

// 1. Lấy danh sách các gói cước Pro VIP & cấu hình SePay
apiRouter.get('/payment/plans', (_req, res) => {
  const plans = db.getPaymentPlans();
  const sepayConfig = sepayService.getConfig();
  return successResponse(res, {
    plans,
    bankInfo: {
      bankName: sepayConfig.bankName,
      accountNumber: sepayConfig.accountNumber,
      accountName: sepayConfig.accountName,
      isConfigured: sepayService.isConfigured()
    }
  });
});

// 2. Tạo đơn hàng thanh toán & sinh mã VietQR SePay
apiRouter.post('/payment/create', async (req, res) => {
  try {
    const { planId } = req.body as { planId: PaymentPlanId };

    if (!planId) {
      return errorResponse(res, 'E-PAY-001', 'Vui lòng chọn gói cước cần nâng cấp.', 400);
    }

    const plan = db.getPaymentPlan(planId);
    if (!plan) {
      return errorResponse(res, 'E-PAY-002', 'Gói cước không tồn tại trong hệ thống.', 404);
    }

    const currentUser = db.getCurrentUser();
    const sepayConfig = sepayService.getConfig();

    // Sinh mã đơn hàng số nguyên 6 chữ số ngẫu nhiên
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderCode = randomSuffix;
    const paymentCode = `OE${orderCode}`; // Chuỗi ngắn gọn tối ưu cho SMS ngân hàng: e.g. "OE892014"

    const description = `Thanh toan ${plan.name} ${paymentCode}`;

    // Sinh ảnh mã QR SePay VietQR
    const qrCodeUrl = sepayService.generateQrUrl({
      amount: plan.price,
      paymentCode
    });

    const newOrder: PaymentOrder = {
      id: `ord_${uuidv4().slice(0, 8)}`,
      orderCode,
      paymentCode,
      userId: currentUser.id,
      userEmail: currentUser.email,
      planId: plan.id,
      amount: plan.price,
      status: 'PENDING',
      description,
      qrCode: qrCodeUrl,
      accountName: sepayConfig.accountName,
      accountNumber: sepayConfig.accountNumber,
      bankName: sepayConfig.bankName,
      createdAt: new Date().toISOString()
    };

    db.createPaymentOrder(newOrder);

    return successResponse(res, {
      order: newOrder,
      bankInfo: {
        bankName: sepayConfig.bankName,
        accountNumber: sepayConfig.accountNumber,
        accountName: sepayConfig.accountName,
        amount: plan.price,
        paymentCode
      }
    }, 201);
  } catch (err: any) {
    console.error('[Payment API] Lỗi khi tạo đơn hàng SePay:', err);
    return errorResponse(res, 'E-PAY-500', err?.message || 'Không thể tạo đơn hàng thanh toán.', 500);
  }
});

// 3. Lấy lịch sử giao dịch đơn hàng của học viên hiện tại
apiRouter.get('/payment/orders', (_req, res) => {
  const currentUser = db.getCurrentUser();
  const orders = db.getPaymentOrders(currentUser.id);
  return successResponse(res, orders);
});

// 4. Lấy chi tiết đơn hàng theo orderCode & kiểm tra trạng thái
apiRouter.get('/payment/orders/:orderCode', async (req, res) => {
  const orderCode = parseInt(req.params.orderCode, 10);
  if (isNaN(orderCode)) {
    return errorResponse(res, 'E-PAY-003', 'Mã đơn hàng không hợp lệ.', 400);
  }

  let order = db.getPaymentOrderByCode(orderCode);
  if (!order) {
    return errorResponse(res, 'E-PAY-004', 'Không tìm thấy đơn hàng.', 404);
  }

  // Tự động kiểm tra trực tiếp qua SePay API nếu đơn hàng đang PENDING (Cơ chế Dual Check)
  if (order.status === 'PENDING') {
    try {
      const matchedTx = await sepayService.checkTransactionFromSePay(order.paymentCode, order.amount);
      if (matchedTx) {
        const updated = db.updatePaymentOrderStatus(
          order.orderCode,
          'PAID',
          matchedTx.transaction_date || new Date().toISOString(),
          matchedTx
        );
        if (updated) {
          order = updated;
          console.log(`[Payment] Đơn hàng ${order.paymentCode} đã được kích hoạt thành công qua SePay API sync!`);
        }
      }
    } catch (e) {
      console.error('[Payment] Error auto-syncing SePay API:', e);
    }
  }

  return successResponse(res, order);
});

// 5. Webhook tiếp nhận biến động số dư từ SePay
apiRouter.post('/payment/sepay-webhook', (req, res) => {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!sepayService.verifyWebhookAuthorization(authHeader)) {
      console.warn('[SePay Webhook] Chữ ký xác thực API Key không hợp lệ.');
      return res.status(401).json({ success: false, message: 'Unauthorized SePay Webhook' });
    }

    const payload: SePayWebhookPayload = req.body;
    console.log('[SePay Webhook] Nhận tín hiệu biến động số dư:', JSON.stringify(payload));

    // Bóc tách nội dung chuyển khoản để tìm mã đơn hàng (e.g. OE123456)
    const transferText = `${payload.content || ''} ${payload.description || ''}`;
    const paymentCode = sepayService.extractPaymentCode(transferText);

    if (!paymentCode) {
      console.log('[SePay Webhook] Không tìm thấy mã đơn hàng dạng OE... trong nội dung CK:', transferText);
      return res.status(200).json({ success: true, message: 'Đã nhận webhook (không có mã OE tương ứng).' });
    }

    const order = db.getPaymentOrderByPaymentCode(paymentCode);
    if (!order) {
      console.log(`[SePay Webhook] Không tìm thấy đơn hàng cho mã: ${paymentCode}`);
      return res.status(200).json({ success: true, message: `Không tìm thấy đơn hàng cho mã ${paymentCode}.` });
    }

    // Kiểm tra là giao dịch tiền vào (transferType = "in") và số tiền nhận >= số tiền đơn hàng
    const transferType = (payload.transferType || 'in').toLowerCase();
    const transferAmount = Number(payload.transferAmount || 0);

    if (transferType === 'in' && transferAmount >= order.amount) {
      if (order.status !== 'PAID') {
        db.updatePaymentOrderStatus(
          order.orderCode,
          'PAID',
          payload.transactionDate || new Date().toISOString(),
          payload
        );
        console.log(`[SePay Webhook] Đơn hàng #${order.orderCode} (${order.paymentCode}) đã thanh toán thành công ${transferAmount}đ! Đã nâng cấp Pro VIP cho User ${order.userId}.`);
      }
    } else {
      console.warn(`[SePay Webhook] Giao dịch không hợp lệ hoặc thiếu tiền: Cần ${order.amount}đ, nhận ${transferAmount}đ`);
    }

    return res.status(200).json({ success: true, message: 'Đã nhận và xử lý SePay webhook thành công.' });
  } catch (err: any) {
    console.error('[SePay Webhook] Lỗi khi xử lý webhook:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Lỗi xử lý webhook' });
  }
});

// 6. Mô phỏng thanh toán thành công (Sandbox Simulator trên Localhost / Phòng bảo vệ đồ án)
apiRouter.post('/payment/mock-pay/:orderCode', (req, res) => {
  const orderCode = parseInt(req.params.orderCode, 10);
  if (isNaN(orderCode)) {
    return errorResponse(res, 'E-PAY-003', 'Mã đơn hàng không hợp lệ.', 400);
  }

  const order = db.getPaymentOrderByCode(orderCode);
  if (!order) {
    return errorResponse(res, 'E-PAY-004', 'Không tìm thấy đơn hàng để mô phỏng.', 404);
  }

  if (order.status === 'PAID') {
    return successResponse(res, { message: 'Đơn hàng này đã được thanh toán trước đó.', order });
  }

  const updatedOrder = db.updatePaymentOrderStatus(
    orderCode, 
    'PAID', 
    new Date().toISOString(), 
    { simulated: true, gateway: 'SePay Sandbox Simulator', note: 'Test Pay for Localhost Demo' }
  );

  const updatedUser = db.getCurrentUser();

  return successResponse(res, {
    message: 'Mô phỏng thanh toán SePay thành công! Tài khoản đã được nâng cấp Pro VIP.',
    order: updatedOrder,
    user: updatedUser
  });
});

// 7. Hủy đơn hàng thanh toán
apiRouter.post('/payment/cancel/:orderCode', (req, res) => {
  const orderCode = parseInt(req.params.orderCode, 10);
  if (isNaN(orderCode)) {
    return errorResponse(res, 'E-PAY-003', 'Mã đơn hàng không hợp lệ.', 400);
  }

  const order = db.getPaymentOrderByCode(orderCode);
  if (!order) {
    return errorResponse(res, 'E-PAY-004', 'Không tìm thấy đơn hàng.', 404);
  }

  const updated = db.updatePaymentOrderStatus(orderCode, 'CANCELLED');
  return successResponse(res, { message: 'Đã hủy đơn hàng.', order: updated });
});


