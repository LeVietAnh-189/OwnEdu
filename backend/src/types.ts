// OwnEdu Backend Types - Matching PostgreSQL Hybrid Schema & API Contracts

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

export type DocumentStatus = 'UPLOADING' | 'PROCESSING' | 'PARSED' | 'FAILED' | 'ARCHIVED';
export type DocumentFileType = 'pdf' | 'docx';

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber?: number;
  chapterTitle?: string;
  contentText: string;
  tokenEstimate: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  userId: string;
  filename: string;
  fileType: DocumentFileType;
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  pageCount?: number;
  status: DocumentStatus;
  errorMessage?: string;
  extractedOutline?: Array<{ title: string; page?: number; level?: number }>;
  rawText?: string;
  markdownText?: string;
  parserEngine?: 'mineru' | 'pdf-parse' | 'mammoth';
  totalWords?: number;
  chunksCount?: number;
  createdAt: string;
  updatedAt: string;
}

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
  examId: string;
  orderIndex: number;
  type: QuestionType;
  bloomLevel: BloomLevel;
  content: string;
  points: number;
  
  // MCQ specific
  options?: MCQOption[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  evidence?: string;

  // Essay specific
  rubric?: RubricCriterion[];
  benchmarkAnswer?: string;
}

export type ExamStatus = 'GENERATING' | 'READY_FOR_REVIEW' | 'PUBLISHED' | 'ARCHIVED';

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
  status: ExamStatus;
  accessCode?: string;
  config: ExamConfig;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'ABANDONED';
export type SubmissionType = 'MANUAL' | 'AUTO_TIMEOUT';

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
  status: AttemptStatus;
  submissionType?: SubmissionType;
  answers: Record<string, AnswerPayload>;
  createdAt: string;
  updatedAt: string;
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
  gradeReportId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface GenerationProgressEvent {
  jobId: string;
  progressPercent: number;
  step: 'FETCHING_CONTEXT' | 'CALLING_LLM' | 'VALIDATING_SCHEMA' | 'COMPLETED' | 'FAILED';
  message: string;
  examId?: string;
  error?: string;
}
