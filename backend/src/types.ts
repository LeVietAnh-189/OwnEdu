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
  proExpiresAt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  durationMinutes?: number;
  content: string; // Hypertext markdown with callouts, code blocks, images
  videoUrl?: string; // Optional embedded video / YouTube URL
  updatedAt?: string;
}

export interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  department: string;
  topic?: string;
  isFreeTier?: boolean;
  tierRequired?: UserTier;
  documentIds?: string[];
  videoIds?: string[];
  chapters?: Chapter[];
  status?: 'draft' | 'published';
  createdAt: string;
  hasSandbox?: boolean;
  sandboxLanguage?: string;
  sandboxTitle?: string;
  sandboxInitialCode?: string;
}

export type VideoStatus = 'PROCESSING' | 'READY' | 'FAILED';

export interface VideoItem {
  id: string;
  courseId?: string;
  title: string;
  filename: string;
  originalSizeBytes: number;
  compressedSizeBytes?: number;
  durationSeconds?: number;
  resolution?: string;
  storageUrl: string;
  thumbnailUrl?: string;
  status: VideoStatus;
  compressionRatio?: number;
  sourceType?: 'UPLOAD' | 'YOUTUBE';
  youtubeId?: string;
  youtubeUrl?: string;
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
export type DocumentFileType = 'pdf' | 'docx' | 'md' | 'markdown';

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
  parserEngine?: 'mineru' | 'pdf-parse' | 'mammoth' | 'direct-markdown';
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

export type ServiceStatus = 'RUNNING' | 'MAINTENANCE';

export interface SystemServiceConfig {
  id: string;
  name: string;
  key: 'auth' | 'payment' | 'product' | 'cart';
  port: number;
  status: ServiceStatus;
  description: string;
  maintenanceMessage?: string;
  estimatedEndTime?: string;
  allowAdminBypass?: boolean;
  updatedAt?: string;
}

// Payment & Pro VIP Types (SePay VietQR)
export type PaymentPlanId = 'PRO_MONTHLY' | 'PRO_QUARTERLY' | 'PRO_YEARLY';
export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface PaymentPlan {
  id: PaymentPlanId;
  name: string;
  price: number; // in VNĐ
  durationDays: number;
  description: string;
  features: string[];
  isPopular?: boolean;
}

export interface PaymentOrder {
  id: string;
  orderCode: number;
  paymentCode: string; // e.g. OE123456 (used in transfer description)
  userId: string;
  userEmail?: string;
  planId: PaymentPlanId;
  amount: number;
  status: PaymentOrderStatus;
  description: string;
  qrCode?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  createdAt: string;
  paidAt?: string;
  cancelledAt?: string;
  rawWebhookData?: any;
}
