export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE';
export type QuestionType = 'MCQ' | 'ESSAY';

export interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  content: string;
}

export interface RubricCriterion {
  criteria: string;
  maxPoints: number;
}

export interface Question {
  id: string;
  examId?: string;
  orderIndex: number;
  type: QuestionType;
  bloomLevel: BloomLevel;
  content: string;
  points: number;
  options?: MCQOption[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  rubric?: RubricCriterion[];
  benchmarkAnswer?: string;
  rubricCount?: number;
}

export interface ExamConfig {
  mcqCount: number;
  essayCount: number;
  bloomLevels: BloomLevel[];
  targetAudience: 'HIGH_SCHOOL' | 'UNIVERSITY' | 'PROFESSIONAL';
  language: 'vi' | 'en';
  timeLimitMinutes?: number;
}

export interface Exam {
  id: string;
  documentId: string;
  creatorUserId: string;
  title: string;
  description?: string;
  suggestedDurationMinutes: number;
  totalScore: number;
  status: 'GENERATING' | 'READY_FOR_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  accessCode?: string;
  config: ExamConfig;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  chapterTitle?: string;
  contentText: string;
  tokenEstimate: number;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  filename: string;
  fileType: 'pdf' | 'docx';
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  pageCount?: number;
  status: 'UPLOADING' | 'PROCESSING' | 'PARSED' | 'FAILED' | 'ARCHIVED';
  extractedOutline?: Array<{ title: string; page?: number }>;
  rawText?: string;
  totalWords?: number;
  chunksCount?: number;
  createdAt: string;
}

export interface AnswerPayload {
  type: QuestionType;
  selectedOption?: string;
  essayText?: string;
  wordCount?: number;
  isFlagged?: boolean;
  savedAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  userId: string;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ABANDONED';
  answers: Record<string, AnswerPayload>;
}

export interface RubricEvaluationItem {
  criteria: string;
  earnedPoints: number;
  maxPoints: number;
  feedback: string;
}

export interface EssayGradingResult {
  questionId: string;
  earnedPoints: number;
  maxPoints: number;
  generalComment: string;
  rubricEvaluations: RubricEvaluationItem[];
}

export interface BloomAnalyticsItem {
  correctOrEarned: number;
  total: number;
  percentage: number;
}

export interface KnowledgeGap {
  topic: string;
  issue: string;
  recommendedStudy: string;
}

export interface GradeAuditLog {
  id: string;
  questionId: string;
  teacherId: string;
  oldScore: number;
  newScore: number;
  overrideReason: string;
  createdAt: string;
}

export interface GradeReport {
  id: string;
  attemptId: string;
  examId: string;
  userId: string;
  mcqScore: number;
  essayScore: number;
  finalScore: number;
  aiScore: number;
  status: 'PROCESSING' | 'FINALIZED' | 'OVERRIDDEN';
  correctMcqCount: number;
  totalMcqCount: number;
  completionTimeSeconds: number;
  mcqDetails: Array<{
    questionId: string;
    selectedOption?: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    explanation: string;
  }>;
  rubricEvaluations: EssayGradingResult[];
  bloomAnalytics: Record<BloomLevel, BloomAnalyticsItem>;
  knowledgeGaps: KnowledgeGap[];
  auditLogs: GradeAuditLog[];
}

export type UserRole = 'USER' | 'ADMIN';
export type UserTier = 'FREE' | 'PRO';

export interface User {
  id: string;
  code?: string;
  email: string;
  fullName: string;
  role: UserRole;
  tier: UserTier;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  department: string;
  topic?: string;
  createdAt: string;
}

export interface TokenUsageLog {
  id: string;
  timestamp: string;
  feature: 'EXAM_GENERATION' | 'ESSAY_GRADING' | 'DOCUMENT_PARSING';
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  refId: string;
}

export interface AdminStats {
  usersCount: number;
  documentsCount: number;
  totalStorageBytes: number;
  totalChunks: number;
  examsCount: number;
  attemptsCount: number;
  coursesCount: number;
  tokensTotal: number;
  estimatedCostUsd: number;
  activeModel: string;
  serverUptimeSeconds: number;
  users: User[];
  courses: Course[];
}
