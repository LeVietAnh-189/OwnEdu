import fs from 'fs';
import path from 'path';
import { 
  DocumentItem, 
  DocumentChunk, 
  Exam, 
  Question, 
  ExamAttempt, 
  GradeReport, 
  User, 
  UserRole,
  Course,
  TokenUsageLog,
  GenerationProgressEvent 
} from '../types.js';

export interface SystemSettings {
  geminiApiKey?: string;
  openaiApiKey?: string;
  activeModel: 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gpt-4o-mini' | 'offline-smart';
}

interface DatabaseSchema {
  users: User[];
  documents: DocumentItem[];
  documentChunks: DocumentChunk[];
  exams: Exam[];
  examAttempts: ExamAttempt[];
  gradeReports: GradeReport[];
  settings?: SystemSettings;
  courses?: Course[];
  tokenLogs?: TokenUsageLog[];
  activeUserId?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

function cleanMojibake(str: string): string {
  if (!str) return str;
  if (/Ä|á»|Æ|áº/.test(str)) {
    try {
      const fixed = Buffer.from(str, 'latin1').toString('utf8');
      if (fixed && !/Ä|á»|Æ|áº/.test(fixed)) return fixed;
    } catch {}
  }
  return str;
}

export class HybridStore {
  private data: DatabaseSchema;
  private sseClients: Map<string, (event: GenerationProgressEvent) => void> = new Map();

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        // Auto-clean any existing mojibake strings
        if (parsed.documents) {
          parsed.documents.forEach(d => {
            d.filename = cleanMojibake(d.filename);
          });
        }
        if (parsed.exams) {
          parsed.exams.forEach(e => {
            e.title = cleanMojibake(e.title);
          });
        }
        if (parsed.users) {
          parsed.users.forEach((u: any) => {
            if (u.role === 'STUDENT' || u.role === 'TEACHER') {
              u.role = 'USER';
            }
          });
          if (!parsed.users.some(u => u.role === 'ADMIN')) {
            parsed.users.push({
              id: 'usr_admin_default',
              email: 'admin@ownedu.edu.vn',
              fullName: 'Quản Trị Viên (Admin)',
              role: 'ADMIN',
              tier: 'PRO'
            });
          }
        }
        if (!parsed.courses || parsed.courses.length === 0) {
          parsed.courses = [
            {
              id: 'crs_software_arch',
              code: 'INT3306',
              name: 'Kiến trúc Phần mềm & Microservices',
              description: 'Thiết kế hệ thống phân tán, message broker và cloud architecture.',
              department: 'Khoa Công nghệ Thông tin',
              createdAt: new Date().toISOString()
            },
            {
              id: 'crs_software_testing',
              code: 'INT2204',
              name: 'Đảm bảo Chất lượng & Kiểm thử Phần mềm',
              description: 'Nghiệp vụ QA/QC, Unit test, Integration test và chuẩn ISO/IEC 25010.',
              department: 'Khoa Công nghệ Thông tin',
              createdAt: new Date().toISOString()
            },
            {
              id: 'crs_db_management',
              code: 'INT2207',
              name: 'Cơ sở Dữ liệu & Hệ Phân tán',
              description: 'Mô hình CSDL quan hệ SQL, NoSQL và tối ưu truy vấn.',
              department: 'Khoa Công nghệ Thông tin',
              createdAt: new Date().toISOString()
            }
          ];
        }
        if (!parsed.tokenLogs || parsed.tokenLogs.length === 0) {
          parsed.tokenLogs = [
            {
              id: 'tok_01',
              timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
              feature: 'EXAM_GENERATION',
              model: 'gemini-1.5-flash',
              inputTokens: 3840,
              outputTokens: 1420,
              totalTokens: 5260,
              costUsd: 0.0018,
              refId: 'exam_sample_01'
            },
            {
              id: 'tok_02',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              feature: 'ESSAY_GRADING',
              model: 'gemini-1.5-flash',
              inputTokens: 1250,
              outputTokens: 680,
              totalTokens: 1930,
              costUsd: 0.0007,
              refId: 'attempt_sample_01'
            }
          ];
        }
        if (!parsed.settings) {
          parsed.settings = {
            geminiApiKey: process.env.GEMINI_API_KEY || '',
            openaiApiKey: process.env.OPENAI_API_KEY || '',
            activeModel: (process.env.GEMINI_API_KEY ? 'gemini-1.5-flash' : 'offline-smart') as any
          };
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read store.json, reinitializing memory store.');
    }
    const initial = this.getSeedData();
    this.persist(initial);
    return initial;
  }

  private persist(state: DatabaseSchema = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving to store.json:', err);
    }
  }

  // --- SSE Event Dispatcher for Real-time Progress ---
  public registerSSEClient(jobId: string, callback: (event: GenerationProgressEvent) => void) {
    this.sseClients.set(jobId, callback);
  }

  public unregisterSSEClient(jobId: string) {
    this.sseClients.delete(jobId);
  }

  public emitSSEProgress(event: GenerationProgressEvent) {
    const cb = this.sseClients.get(event.jobId);
    if (cb) {
      cb(event);
    }
  }

  // --- Users & Roles ---
  public getCurrentUser(): User {
    if (this.data.activeUserId) {
      const found = this.data.users.find(u => u.id === this.data.activeUserId);
      if (found) return found;
    }
    return this.data.users[0];
  }

  public switchCurrentUserRole(targetRole: UserRole): User {
    let user = this.data.users.find(u => u.role === targetRole);
    if (!user) {
      if (targetRole === 'ADMIN') {
        user = {
          id: 'usr_admin_default',
          email: 'admin@ownedu.edu.vn',
          fullName: 'Quản Trị Viên (Admin)',
          role: 'ADMIN',
          tier: 'PRO'
        };
        this.data.users.push(user);
      } else {
        user = {
          id: 'usr_default_student',
          email: 'sinhvien@ownedu.vn',
          fullName: 'Nguyễn Văn Nam (Học viên/Giảng viên)',
          role: 'USER',
          tier: 'PRO'
        };
        this.data.users.unshift(user);
      }
    }
    this.data.activeUserId = user.id;
    this.persist();
    return user;
  }

  public getUsers(): User[] {
    if (this.data.users.length < 3) {
      this.data.users = [
        {
          id: 'usr_0001',
          code: 'OE-0001',
          fullName: 'Nguyễn Văn A',
          email: 'anv@gmail.com',
          tier: 'FREE',
          role: 'USER'
        },
        {
          id: 'usr_0002',
          code: 'OE-0002',
          fullName: 'Nguyễn Văn B',
          email: 'bnv@gmail.com',
          tier: 'FREE',
          role: 'USER'
        },
        {
          id: 'usr_0003',
          code: 'OE-0003',
          fullName: 'Nguyễn Văn C',
          email: 'cnv@gmail.com',
          tier: 'PRO',
          role: 'USER'
        },
        {
          id: 'usr_admin_default',
          code: 'OE-0000',
          fullName: 'Quản Trị Viên (Admin)',
          email: 'admin@ownedu.edu.vn',
          tier: 'PRO',
          role: 'ADMIN'
        }
      ];
      this.persist();
    }
    this.data.users.forEach((u, idx) => {
      if (!u.code) {
        u.code = u.role === 'ADMIN' ? 'OE-0000' : `OE-${String(idx + 1).padStart(4, '0')}`;
      }
    });
    return this.data.users;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.tier !== undefined) user.tier = updates.tier;
    if (updates.fullName !== undefined) user.fullName = updates.fullName;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.code !== undefined) user.code = updates.code;
    this.persist();
    return user;
  }

  public addUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public deleteUser(id: string): boolean {
    const initLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.persist();
    return this.data.users.length < initLen;
  }

  // --- Documents ---
  public getDocuments(userId?: string): DocumentItem[] {
    if (userId) {
      return this.data.documents.filter(d => d.userId === userId && d.status !== 'ARCHIVED');
    }
    return this.data.documents.filter(d => d.status !== 'ARCHIVED');
  }

  public getDocumentById(id: string): DocumentItem | undefined {
    return this.data.documents.find(d => d.id === id);
  }

  public addDocument(doc: DocumentItem): DocumentItem {
    this.data.documents.unshift(doc);
    this.persist();
    return doc;
  }

  public updateDocument(id: string, updates: Partial<DocumentItem>): DocumentItem | undefined {
    const doc = this.getDocumentById(id);
    if (doc) {
      Object.assign(doc, updates, { updatedAt: new Date().toISOString() });
      this.persist();
    }
    return doc;
  }

  public deleteDocument(id: string): boolean {
    const doc = this.getDocumentById(id);
    if (doc) {
      doc.status = 'ARCHIVED';
      doc.updatedAt = new Date().toISOString();
      this.persist();
      return true;
    }
    return false;
  }

  // --- Document Chunks ---
  public getChunksByDocumentId(documentId: string): DocumentChunk[] {
    return this.data.documentChunks
      .filter(c => c.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  public addChunks(chunks: DocumentChunk[]): void {
    this.data.documentChunks.push(...chunks);
    this.persist();
  }

  // --- Exams ---
  public getExams(): Exam[] {
    return this.data.exams;
  }

  public getExamById(id: string): Exam | undefined {
    return this.data.exams.find(e => e.id === id);
  }

  public addExam(exam: Exam): Exam {
    this.data.exams.unshift(exam);
    this.persist();
    return exam;
  }

  public updateExam(id: string, updates: Partial<Exam>): Exam | undefined {
    const exam = this.getExamById(id);
    if (exam) {
      Object.assign(exam, updates, { updatedAt: new Date().toISOString() });
      this.persist();
    }
    return exam;
  }

  public updateQuestion(examId: string, qId: string, updates: Partial<Question>): Question | undefined {
    const exam = this.getExamById(examId);
    if (exam) {
      const q = exam.questions.find(item => item.id === qId);
      if (q) {
        Object.assign(q, updates);
        exam.updatedAt = new Date().toISOString();
        this.persist();
        return q;
      }
    }
    return undefined;
  }

  // --- Attempts (Phiên thi) ---
  public getAttempts(userId?: string): ExamAttempt[] {
    if (userId) {
      return this.data.examAttempts.filter(a => a.userId === userId);
    }
    return this.data.examAttempts;
  }

  public getAttemptById(id: string): ExamAttempt | undefined {
    return this.data.examAttempts.find(a => a.id === id);
  }

  public addAttempt(attempt: ExamAttempt): ExamAttempt {
    this.data.examAttempts.unshift(attempt);
    this.persist();
    return attempt;
  }

  // Fast Auto-Save with JSONB atomic emulation
  public saveAttemptAnswer(
    attemptId: string, 
    questionId: string, 
    payload: { type: 'MCQ' | 'ESSAY'; selectedOption?: string; essayText?: string }
  ): { savedAt: string } {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) {
      throw new Error('ATTEMPT_NOT_FOUND');
    }
    if (attempt.status !== 'IN_PROGRESS') {
      throw new Error('ATTEMPT_ALREADY_SUBMITTED');
    }

    const savedAt = new Date().toISOString();
    const existing = attempt.answers[questionId] || { isFlagged: false };

    attempt.answers[questionId] = {
      type: payload.type,
      selectedOption: payload.selectedOption,
      essayText: payload.essayText,
      wordCount: payload.essayText ? payload.essayText.trim().split(/\s+/).filter(Boolean).length : 0,
      isFlagged: existing.isFlagged || false,
      savedAt,
    };
    attempt.updatedAt = savedAt;
    this.persist();

    return { savedAt };
  }

  public toggleAttemptFlag(attemptId: string, questionId: string): boolean {
    const attempt = this.getAttemptById(attemptId);
    if (!attempt) return false;
    const existing = attempt.answers[questionId] || { 
      type: 'MCQ', 
      isFlagged: false, 
      savedAt: new Date().toISOString() 
    };
    existing.isFlagged = !existing.isFlagged;
    attempt.answers[questionId] = existing;
    attempt.updatedAt = new Date().toISOString();
    this.persist();
    return existing.isFlagged;
  }

  public updateAttempt(id: string, updates: Partial<ExamAttempt>): ExamAttempt | undefined {
    const attempt = this.getAttemptById(id);
    if (attempt) {
      Object.assign(attempt, updates, { updatedAt: new Date().toISOString() });
      this.persist();
    }
    return attempt;
  }

  // --- Grade Reports ---
  public getGradeReportByAttemptId(attemptId: string): GradeReport | undefined {
    return this.data.gradeReports.find(r => r.attemptId === attemptId);
  }

  public addGradeReport(report: GradeReport): GradeReport {
    const existingIdx = this.data.gradeReports.findIndex(r => r.attemptId === report.attemptId);
    if (existingIdx >= 0) {
      this.data.gradeReports[existingIdx] = report;
    } else {
      this.data.gradeReports.unshift(report);
    }
    this.persist();
    return report;
  }

  public updateGradeReport(attemptId: string, updates: Partial<GradeReport>): GradeReport | undefined {
    const report = this.getGradeReportByAttemptId(attemptId);
    if (report) {
      Object.assign(report, updates, { updatedAt: new Date().toISOString() });
      this.persist();
    }
    return report;
  }

  // --- Settings ---
  public getSettings(): SystemSettings {
    if (!this.data.settings) {
      this.data.settings = {
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        activeModel: (process.env.GEMINI_API_KEY ? 'gemini-3.5-flash' : 'offline-smart') as any,
      };
    }
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    this.data.settings = { ...current, ...updates };
    this.persist();
    return this.data.settings;
  }

  // --- Courses Management (Admin) ---
  public getCourses(): Course[] {
    return this.data.courses || [];
  }

  public addCourse(course: Course): Course {
    if (!this.data.courses) this.data.courses = [];
    this.data.courses.unshift(course);
    this.persist();
    return course;
  }

  public deleteCourse(id: string): boolean {
    if (!this.data.courses) return false;
    const initialLen = this.data.courses.length;
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    this.persist();
    return this.data.courses.length < initialLen;
  }

  // --- Token Logs & Analytics (Admin) ---
  public getTokenLogs(): TokenUsageLog[] {
    return this.data.tokenLogs || [];
  }

  public logTokenUsage(log: TokenUsageLog): void {
    if (!this.data.tokenLogs) this.data.tokenLogs = [];
    this.data.tokenLogs.unshift(log);
    this.persist();
  }

  // --- Admin System Stats ---
  public getAdminStats() {
    const documents = this.getDocuments();
    const totalStorageBytes = documents.reduce((acc, d) => acc + (d.fileSizeBytes || 0), 0);
    const totalChunks = this.data.documentChunks.length;
    const exams = this.getExams();
    const attempts = this.data.examAttempts;
    const tokens = this.getTokenLogs();
    const totalTokens = tokens.reduce((acc, t) => acc + (t.totalTokens || 0), 0);
    const totalCost = tokens.reduce((acc, t) => acc + (t.costUsd || 0), 0);

    const userList = this.getUsers();
    return {
      usersCount: userList.length,
      documentsCount: documents.length,
      totalStorageBytes,
      totalChunks,
      examsCount: exams.length,
      attemptsCount: attempts.length,
      coursesCount: (this.data.courses || []).length,
      tokensTotal: totalTokens,
      estimatedCostUsd: Number(totalCost.toFixed(4)),
      activeModel: this.getSettings().activeModel,
      serverUptimeSeconds: Math.floor(process.uptime()),
      users: userList,
      courses: this.data.courses || []
    };
  }

  // --- Seed Data Initializer ---
  private getSeedData(): DatabaseSchema {
    const defaultUser: User = {
      id: 'usr_default_student',
      email: 'sinhvien@ownedu.vn',
      fullName: 'Nguyễn Văn Nam (Học viên/Giảng viên)',
      role: 'USER',
      tier: 'PRO'
    };

    const adminUser: User = {
      id: 'usr_admin_default',
      email: 'admin@ownedu.edu.vn',
      fullName: 'Quản Trị Viên (Admin)',
      role: 'ADMIN',
      tier: 'PRO'
    };

    const doc1Id = 'doc_microservices_sample';
    const sampleDoc: DocumentItem = {
      id: doc1Id,
      userId: defaultUser.id,
      filename: 'Kien_truc_Phan_mem_Microservices.pdf',
      fileType: 'pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2458000,
      storagePath: '/uploads/Kien_truc_Phan_mem_Microservices.pdf',
      pageCount: 38,
      status: 'PARSED',
      totalWords: 8420,
      chunksCount: 6,
      extractedOutline: [
        { title: 'Chương 1: Tổng quan Kiến trúc Microservices & Monolith', page: 1 },
        { title: 'Chương 2: Cơ chế Giao tiếp & Message Queue (RabbitMQ)', page: 12 },
        { title: 'Chương 3: Quản trị Dữ liệu Phân tán & Saga Pattern', page: 24 },
        { title: 'Chương 4: Đánh giá & Giám sát Hệ thống Phân tán', page: 32 }
      ],
      createdAt: '2026-09-18T10:00:00.000Z',
      updatedAt: '2026-09-18T10:05:00.000Z'
    };

    const chunks: DocumentChunk[] = [
      {
        id: 'chunk_1',
        documentId: doc1Id,
        chunkIndex: 0,
        pageNumber: 1,
        chapterTitle: 'Chương 1: Khái niệm Cốt lõi',
        contentText: 'Kiến trúc Microservices là một mô hình phát triển phần mềm trong đó ứng dụng được cấu thành từ nhiều dịch vụ nhỏ, độc lập, có thể triển khai riêng rẽ và tự quản lý dữ liệu. Mỗi dịch vụ tập trung vào một nghiệp vụ chuyên biệt (Domain-Driven Design).',
        tokenEstimate: 280,
        createdAt: '2026-09-18T10:02:00.000Z'
      },
      {
        id: 'chunk_2',
        documentId: doc1Id,
        chunkIndex: 1,
        pageNumber: 12,
        chapterTitle: 'Chương 2: Giao tiếp Bất đồng bộ qua Message Queue',
        contentText: 'Trong môi trường phân tán, gọi đồng bộ HTTP/REST API dễ dẫn đến nghẽn chuỗi (cascading failure). Việc sử dụng Message Queue như RabbitMQ hoặc Kafka giúp phân tách (decoupling) dịch vụ, cân bằng tải (load leveling) và tăng tính chịu lỗi.',
        tokenEstimate: 310,
        createdAt: '2026-09-18T10:03:00.000Z'
      },
      {
        id: 'chunk_3',
        documentId: doc1Id,
        chunkIndex: 2,
        pageNumber: 24,
        chapterTitle: 'Chương 3: Quản trị Giao dịch Phân tán với Saga Pattern',
        contentText: 'Do quy tắc Database-per-Service, ta không thể sử dụng Two-Phase Commit (2PC) vì gây khóa tài nguyên diện rộng và độ trễ cao. Saga Pattern chia giao dịch lớn thành chuỗi các local transactions, mỗi bước thành công sẽ kích hoạt bước kế tiếp. Khi xảy ra lỗi, Saga kích hoạt các hành động bù trừ (compensating transactions) để hoàn tác trạng thái.',
        tokenEstimate: 340,
        createdAt: '2026-09-18T10:04:00.000Z'
      }
    ];

    const examId = 'exam_microservices_midterm';
    const sampleExam: Exam = {
      id: examId,
      documentId: doc1Id,
      creatorUserId: defaultUser.id,
      title: 'Kiểm tra Giữa kỳ - Kiến trúc Phần mềm Microservices',
      description: 'Đề kiểm tra trắc nghiệm kết hợp tự luận đánh giá năng lực theo 4 mức độ nhận thức Bloom Taxonomy.',
      suggestedDurationMinutes: 45,
      totalScore: 10.0,
      status: 'PUBLISHED',
      accessCode: 'MICRO-2026',
      config: {
        mcqCount: 4,
        essayCount: 1,
        bloomLevels: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'],
        targetAudience: 'UNIVERSITY',
        language: 'vi',
        timeLimitMinutes: 45
      },
      questions: [
        {
          id: 'q_01',
          examId,
          orderIndex: 1,
          type: 'MCQ',
          bloomLevel: 'REMEMBER',
          content: 'Đặc trưng nào sau đây KHÔNG PHẢI là nguyên lý cốt lõi của kiến trúc Microservices?',
          points: 1.5,
          options: [
            { key: 'A', content: 'Mỗi dịch vụ sở hữu cơ sở dữ liệu độc lập (Database per Service)' },
            { key: 'B', content: 'Triển khai tất cả dịch vụ trong cùng một tệp nén WAR/JAR duy nhất' },
            { key: 'C', content: 'Có khả năng co giãn (scale) độc lập từng dịch vụ' },
            { key: 'D', content: 'Giao tiếp qua mạng thông qua API hoặc Event Bus' }
          ],
          correctAnswer: 'B',
          explanation: 'Việc gom toàn bộ code vào một tệp nén đơn khối là đặc điểm của Monolithic Architecture, trái ngược với tính chất độc lập của Microservices.'
        },
        {
          id: 'q_02',
          examId,
          orderIndex: 2,
          type: 'MCQ',
          bloomLevel: 'UNDERSTAND',
          content: 'Trong kiến trúc phân tán, cơ chế nào giải quyết tốt nhất bài toán giao dịch đa dịch vụ mà không gây khóa dữ liệu tập trung (Distributed Lock)?',
          points: 2.0,
          options: [
            { key: 'A', content: 'Giao thức Two-Phase Commit (2PC)' },
            { key: 'B', content: 'Saga Pattern (Choreography hoặc Orchestration)' },
            { key: 'C', content: 'Shared Database Pattern' },
            { key: 'D', content: 'Distributed Mutex Lock' }
          ],
          correctAnswer: 'B',
          explanation: 'Saga Pattern chia giao dịch thành chuỗi các local transactions kèm compensating actions, phù hợp nhất với hệ thống phân tán vì bảo đảm tính nhất quán sau cùng (Eventual Consistency) mà không khóa DB.'
        },
        {
          id: 'q_03',
          examId,
          orderIndex: 3,
          type: 'MCQ',
          bloomLevel: 'APPLY',
          content: 'Khi một hệ thống thương mại điện tử gặp tình trạng traffic tăng vọt vào ngày Black Friday, giải pháp kiến trúc nào giúp bảo vệ Document Service & AI Worker không bị quá tải HTTP?',
          points: 2.0,
          options: [
            { key: 'A', content: 'Tăng timeout của HTTP Request từ 30s lên 5 phút' },
            { key: 'B', content: 'Chuyển toàn bộ cuộc gọi sang giao thức gRPC đồng bộ' },
            { key: 'C', content: 'Đưa các tác vụ nặng vào Message Queue để xử lý bất đồng bộ theo cơ chế Backpressure' },
            { key: 'D', content: 'Khởi động lại toàn bộ máy chủ mỗi 15 phút' }
          ],
          correctAnswer: 'C',
          explanation: 'Message Queue cho phép áp dụng kỹ thuật Rate Limiting / Load Leveling, worker tiêu thụ tin nhắn theo năng lực xử lý (Backpressure), ngăn ngừa sập dịch vụ.'
        },
        {
          id: 'q_04',
          examId,
          orderIndex: 4,
          type: 'MCQ',
          bloomLevel: 'ANALYZE',
          content: 'Điều gì xảy ra nếu một bước trong chuỗi Saga Choreography bị thất bại giữa chừng?',
          points: 2.0,
          options: [
            { key: 'A', content: 'Cơ sở dữ liệu tự động rollback bằng lệnh ROLLBACK SQL của máy chủ chính' },
            { key: 'B', content: 'Hệ thống phát sinh sự kiện thất bại để các dịch vụ trước đó thực hiện giao dịch bù trừ (Compensating Transactions)' },
            { key: 'C', content: 'Hệ thống dừng hoạt động và yêu cầu can thiệp thủ công ngay lập tức' },
            { key: 'D', content: 'Bỏ qua bước lỗi và tiếp tục các bước còn lại' }
          ],
          correctAnswer: 'B',
          explanation: 'Saga duy trì tính nhất quán bằng cách phát sự kiện lỗi để kích hoạt các hàm bồi hoàn (Compensating transactions) đã chuẩn bị sẵn theo thứ tự đảo ngược.'
        },
        {
          id: 'q_05',
          examId,
          orderIndex: 5,
          type: 'ESSAY',
          bloomLevel: 'ANALYZE',
          content: 'Hãy phân tích ưu và nhược điểm của việc tách riêng Document Service và AI Worker Service qua Message Queue thay vì gọi đồng bộ qua REST API. Đưa ra ví dụ minh họa gắn với bài toán OwnEdu.',
          points: 2.5,
          benchmarkAnswer: 'Ưu điểm: Tách riêng qua Message Queue giúp giảm tải API Gateway, loại bỏ rủi ro HTTP Timeout khi LLM xử lý lâu (30-60s), cho phép scale AI Worker theo số lượng GPU độc lập. Nhược điểm: Tăng độ phức tạp kiến trúc và phải xây dựng kênh báo tiến độ bất đồng bộ (SSE/WebSocket). Ví dụ: Khi người dùng tải tài liệu 50 trang, Document Service bóc tách xong đẩy job vào queue, AI Worker nhận job xử lý ngầm và gửi tiến độ % qua SSE.',
          rubric: [
            {
              criteria: 'Phân tích được ít nhất 2 ưu điểm cốt lõi (chống nghẽn HTTP timeout, scale độc lập theo tải GPU)',
              maxPoints: 1.0
            },
            {
              criteria: 'Chỉ ra được ít nhất 1 nhược điểm thực tế (độ phức tạp vận hành, cần cơ chế SSE để báo kết quả)',
              maxPoints: 0.5
            },
            {
              criteria: 'Lấy được ví dụ minh họa thực tế gắn liền với luồng xử lý tài liệu của OwnEdu',
              maxPoints: 1.0
            }
          ]
        }
      ],
      createdAt: '2026-09-18T10:10:00.000Z',
      updatedAt: '2026-09-18T10:15:00.000Z'
    };

    const attemptId = 'att_sample_student_01';
    const sampleAttempt: ExamAttempt = {
      id: attemptId,
      examId,
      userId: defaultUser.id,
      startedAt: '2026-09-18T14:00:00.000Z',
      expiresAt: '2026-09-18T14:45:00.000Z',
      submittedAt: '2026-09-18T14:35:12.000Z',
      status: 'GRADED',
      submissionType: 'MANUAL',
      answers: {
        'q_01': {
          type: 'MCQ',
          selectedOption: 'B',
          savedAt: '2026-09-18T14:05:10.000Z',
          isFlagged: false
        },
        'q_02': {
          type: 'MCQ',
          selectedOption: 'B',
          savedAt: '2026-09-18T14:12:30.000Z',
          isFlagged: false
        },
        'q_03': {
          type: 'MCQ',
          selectedOption: 'C',
          savedAt: '2026-09-18T14:18:45.000Z',
          isFlagged: false
        },
        'q_04': {
          type: 'MCQ',
          selectedOption: 'A', // Chọn sai để thấy được phân tích lỗ hổng kiến thức
          savedAt: '2026-09-18T14:22:10.000Z',
          isFlagged: true
        },
        'q_05': {
          type: 'ESSAY',
          essayText: 'Việc tách riêng Document Service và AI Worker qua Message Queue mang lại ưu điểm vượt trội: chống nghẽn đường truyền HTTP do LLM sinh bài mất 30-45s, đồng thời có thể co giãn số lượng worker tùy theo card đồ họa GPU. Nhược điểm là phát sinh độ trễ bất đồng bộ và hệ thống cần thêm kênh SSE để báo % về cho giao diện web. Ví dụ: khi học sinh gửi lệnh sinh đề 15 câu trắc nghiệm, hệ thống xếp job vào hàng đợi RabbitMQ thay vì bắt trình duyệt chờ đơ trang.',
          wordCount: 104,
          savedAt: '2026-09-18T14:34:00.000Z',
          isFlagged: false
        }
      },
      createdAt: '2026-09-18T14:00:00.000Z',
      updatedAt: '2026-09-18T14:35:12.000Z'
    };

    const sampleGradeReport: GradeReport = {
      id: 'rep_sample_01',
      attemptId,
      examId,
      userId: defaultUser.id,
      mcqScore: 5.5,
      essayScore: 2.5,
      finalScore: 8.0,
      aiScore: 8.0,
      status: 'FINALIZED',
      correctMcqCount: 3,
      totalMcqCount: 4,
      completionTimeSeconds: 2112, // ~35 minutes
      mcqDetails: [
        {
          questionId: 'q_01',
          selectedOption: 'B',
          correctAnswer: 'B',
          isCorrect: true,
          points: 1.5,
          explanation: 'Đúng. Việc gom vào WAR/JAR là bản chất của kiến trúc Monolith.'
        },
        {
          questionId: 'q_02',
          selectedOption: 'B',
          correctAnswer: 'B',
          isCorrect: true,
          points: 2.0,
          explanation: 'Đúng. Saga Pattern chia nhỏ thành local transactions và duy trì Eventual Consistency.'
        },
        {
          questionId: 'q_03',
          selectedOption: 'C',
          correctAnswer: 'C',
          isCorrect: true,
          points: 2.0,
          explanation: 'Đúng. Message Queue áp dụng Backpressure ngăn ngừa sập hệ thống.'
        },
        {
          questionId: 'q_04',
          selectedOption: 'A',
          correctAnswer: 'B',
          isCorrect: false,
          points: 0.0,
          explanation: 'Sai. Trong Saga không thể dùng ROLLBACK SQL tập trung mà phải dùng Compensating Transactions.'
        }
      ],
      rubricEvaluations: [
        {
          questionId: 'q_05',
          earnedPoints: 2.5,
          maxPoints: 2.5,
          generalComment: 'Bài viết lập luận rất sắc sảo, nêu bật được bản chất chống nghẽn HTTP và khả năng co giãn độc lập của AI Worker.',
          rubricEvaluations: [
            {
              criteria: 'Phân tích được ít nhất 2 ưu điểm cốt lõi (chống nghẽn HTTP timeout, scale độc lập theo tải GPU)',
              earnedPoints: 1.0,
              maxPoints: 1.0,
              feedback: 'Rất tốt. Đã phân tích đúng khía cạnh tránh treo kết nối HTTP và scale GPU.'
            },
            {
              criteria: 'Chỉ ra được ít nhất 1 nhược điểm thực tế (độ phức tạp vận hành, cần cơ chế SSE để báo kết quả)',
              earnedPoints: 0.5,
              maxPoints: 0.5,
              feedback: 'Chính xác. Đã chỉ rõ thách thức về độ trễ bất đồng bộ và cần kênh SSE.'
            },
            {
              criteria: 'Lấy được ví dụ minh họa thực tế gắn liền với luồng xử lý tài liệu của OwnEdu',
              earnedPoints: 1.0,
              maxPoints: 1.0,
              feedback: 'Ví dụ sinh đề 15 câu qua RabbitMQ rất thực tế và gắn sát bối cảnh OwnEdu.'
            }
          ]
        }
      ],
      bloomAnalytics: {
        REMEMBER: { correctOrEarned: 1.5, total: 1.5, percentage: 100 },
        UNDERSTAND: { correctOrEarned: 2.0, total: 2.0, percentage: 100 },
        APPLY: { correctOrEarned: 2.0, total: 2.0, percentage: 100 },
        ANALYZE: { correctOrEarned: 2.5, total: 4.5, percentage: 55.6 }
      },
      knowledgeGaps: [
        {
          topic: 'Cơ chế Phục hồi Lỗi trong Saga Pattern (Compensating Transactions)',
          issue: 'Bạn nhầm lẫn việc rollback cơ sở dữ liệu phân tán với lệnh ROLLBACK của SQL truyền thống ở Câu 04.',
          recommendedStudy: 'Đọc lại Chương 3 (Trang 24-28 trong tài liệu: Kien_truc_Phan_mem_Microservices.pdf)'
        }
      ],
      auditLogs: [],
      createdAt: '2026-09-18T14:35:15.000Z',
      updatedAt: '2026-09-18T14:35:15.000Z'
    };

    return {
      users: [defaultUser, adminUser],
      documents: [],
      documentChunks: [],
      exams: [],
      examAttempts: [],
      gradeReports: []
    };
  }
}

export const db = new HybridStore();
