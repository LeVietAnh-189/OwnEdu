import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/hybridStore.js';
import { parsePdfBuffer, parseDocxBuffer, chunkText } from '../services/documentParser.js';
import { generateExamJob } from '../ai/examGenerator.js';
import { gradeExamAttempt, overrideTeacherGrade } from '../services/gradingService.js';
import { DocumentItem, ExamAttempt } from '../types.js';

export const apiRouter = Router();

const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max per RULE-DOC-INGEST-001
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.pdf') ||
        file.originalname.endsWith('.docx')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ tải lên tệp định dạng .pdf hoặc .docx'));
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
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

    const cleanFilename = decodeFilename(file.originalname);

    // Parse file contents
    const parseResult = isPdf 
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
      fileType: isPdf ? 'pdf' : 'docx',
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      storagePath: `/uploads/${cleanFilename}`,
      pageCount: parseResult.pageCount,
      status: 'PARSED',
      extractedOutline: parseResult.outline,
      rawText: parseResult.text.slice(0, 1000), // Preview sample
      markdownText: parseResult.markdownText || parseResult.text,
      parserEngine: parseResult.parserEngine || (isPdf ? 'pdf-parse' : 'mammoth'),
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
  return successResponse(res, {
    activeModel: settings.activeModel || 'gemini-1.5-flash',
    hasGeminiKey: Boolean(effectiveGemini),
    geminiApiKeyMasked: effectiveGemini ? `${effectiveGemini.slice(0, 8)}...${effectiveGemini.slice(-4)}` : '',
    hasOpenAiKey: Boolean(settings.openaiApiKey || process.env.OPENAI_API_KEY),
  });
});

apiRouter.post('/settings', (req, res) => {
  const currentUser = db.getCurrentUser();
  if (currentUser?.role !== 'ADMIN') {
    return errorResponse(res, 'E-AUTH-403', 'Từ chối truy cập: Chỉ tài khoản Quản trị viên (ADMIN) mới có quyền cấu hình API Key và mô hình AI.', 403);
  }

  const { gemini_api_key, openai_api_key, active_model } = req.body;
  const updated = db.updateSettings({
    ...(gemini_api_key !== undefined && { geminiApiKey: gemini_api_key }),
    ...(openai_api_key !== undefined && { openaiApiKey: openai_api_key }),
    ...(active_model !== undefined && { activeModel: active_model }),
  });
  return successResponse(res, {
    activeModel: updated.activeModel,
    hasGeminiKey: Boolean(updated.geminiApiKey || process.env.GEMINI_API_KEY),
    message: 'Đã lưu cấu hình AI thành công!',
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

apiRouter.post('/admin/courses', (req, res) => {
  const { code, name, description, department, topic } = req.body;
  if (!code || !name) {
    return errorResponse(res, 'E-CRS-001', 'Mã môn học và tên môn học là bắt buộc.', 400);
  }
  const newCourse = db.addCourse({
    id: `crs_${uuidv4().slice(0, 8)}`,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    description: (description || '').trim(),
    department: (department || 'Khoa Công nghệ Thông tin').trim(),
    topic: (topic || 'Lập trình').trim(),
    createdAt: new Date().toISOString()
  });
  return successResponse(res, newCourse, 201);
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

