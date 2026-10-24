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
  fileType: 'pdf' | 'docx' | 'md' | 'markdown';
  mimeType: string;
  fileSizeBytes: number;
  storagePath: string;
  pageCount?: number;
  status: 'UPLOADING' | 'PROCESSING' | 'PARSED' | 'FAILED' | 'ARCHIVED';
  extractedOutline?: Array<{ title: string; page?: number }>;
  rawText?: string;
  totalWords?: number;
  chunksCount?: number;
  parserEngine?: 'mineru' | 'pdf-parse' | 'mammoth' | 'direct-markdown';
  markdownText?: string;
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
  proExpiresAt?: string;
  avatarUrl?: string;
  googleId?: string;
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
  sandboxLanguage?: 'sql' | 'python' | 'javascript' | 'typescript' | 'html' | 'universal' | string;
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
  paymentCode: string;
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
}

// User Lesson Progress & Gamification Leaderboard
export interface UserCompletedLesson {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  completedAt: string;
}

export type RankTier = 'NEWBIE' | 'DILIGENT' | 'WARRIOR' | 'ELITE' | 'MASTER';

export interface RankBadge {
  tier: RankTier;
  title: string;       // "Tân Binh", "Chăm Chỉ", "Chiến Thần", "Tinh Anh", "Huyền Thoại"
  icon: string;        // "🥉", "🥈", "🥇", "💎", "👑"
  minLessons: number;  // 0, 10, 30, 60, 100
  color: string;
  bgGradient: string;
}

export interface UserRankProfile {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  tier: UserTier;
  avatarChar: string;
  totalCompletedLessons: number;
  weeklyCompletedLessons: number;
  currentStreakDays: number;
  rankBadge: RankBadge;
  rankPosition: number;
  lastActiveAt?: string;
}

export interface LeaderboardResponse {
  timeframe: 'weekly' | 'all';
  leaderboard: UserRankProfile[];
  myRank: UserRankProfile;
  stats: {
    totalStudents: number;
    totalCompletedLessons: number;
    topPerformer: UserRankProfile | null;
  };
}

// --- License Key & Device DRM Types ---
export type LicenseStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface LicenseDeviceBinding {
  deviceId: string;
  deviceFingerprint: string;
  deviceName: string;
  activatedAt: string;
  lastIp: string;
  lastActiveAt: string;
}

export interface LicenseKeyItem {
  id: string;
  key: string;              // e.g. OE-PRO-98B2-A41F
  userId: string;
  userEmail: string;
  orderCode?: number;
  slotIndex: 1 | 2;         // 1: Thiết bị 1, 2: Thiết bị 2
  status: LicenseStatus;
  boundDevice?: LicenseDeviceBinding | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseChatMessage {
  id: string;
  senderId: string;
  senderRole: 'USER' | 'ADMIN';
  senderName: string;
  message: string;
  timestamp: string;
  deviceInfoSnapshot?: string;
}

export interface LicenseChatTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  targetKeyId?: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  messages: LicenseChatMessage[];
  createdAt: string;
  updatedAt: string;
}

