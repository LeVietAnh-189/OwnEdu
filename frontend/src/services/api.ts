import axios from 'axios';
import { DocumentItem, DocumentChunk, Exam, GradeReport, User, UserRole, UserTier, Course, Chapter, VideoItem, AdminStats, TokenUsageLog, SystemServiceConfig } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const DocumentAPI = {
  list: async () => {
    const res = await api.get<{ success: boolean; data: DocumentItem[] }>('/documents');
    return res.data.data;
  },
  get: async (id: string) => {
    const res = await api.get<{ success: boolean; data: DocumentItem }>(`/documents/${id}`);
    return res.data.data;
  },
  chunks: async (id: string) => {
    const res = await api.get<{ success: boolean; data: DocumentChunk[] }>(`/documents/${id}/chunks`);
    return res.data.data;
  },
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ success: boolean; data: DocumentItem }>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { deleted: boolean } }>(`/documents/${id}`);
    return res.data.data;
  },
};

export const ExamAPI = {
  list: async () => {
    const res = await api.get<{ success: boolean; data: Exam[] }>('/exams');
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { deleted: boolean } }>(`/exams/${id}`);
    return res.data.data;
  },
  get: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Exam }>(`/exams/${id}`);
    return res.data.data;
  },
  generate: async (payload: { document_id: string; title: string; config: any }) => {
    const res = await api.post<{ success: boolean; data: { job_id: string; status: string } }>('/exams/generate', payload);
    return res.data.data;
  },
  updateQuestion: async (examId: string, qId: string, data: any) => {
    const res = await api.put<{ success: boolean; data: any }>(`/exams/${examId}/questions/${qId}`, data);
    return res.data.data;
  },
  publish: async (id: string) => {
    const res = await api.post<{ success: boolean; data: Exam }>(`/exams/${id}/publish`);
    return res.data.data;
  },
  startAttempt: async (examId: string) => {
    const res = await api.post<{
      success: boolean;
      data: {
        attempt_id: string;
        exam_id: string;
        exam_title: string;
        duration_minutes: number;
        expires_at: string;
        questions: any[];
        answers: Record<string, any>;
      };
    }>(`/exams/${examId}/start`);
    return res.data.data;
  },
};

export const AttemptAPI = {
  get: async (attemptId: string) => {
    const res = await api.get<{
      success: boolean;
      data: {
        attempt_id: string;
        exam_id: string;
        exam_title: string;
        duration_minutes: number;
        expires_at: string;
        status: string;
        questions: any[];
        answers: Record<string, any>;
      };
    }>(`/attempts/${attemptId}`);
    return res.data.data;
  },
  saveAnswer: async (attemptId: string, questionId: string, payload: any) => {
    const res = await api.put<{ success: boolean; data: { question_id: string; saved_at: string } }>(
      `/attempts/${attemptId}/answers/${questionId}`,
      payload
    );
    return res.data.data;
  },
  toggleFlag: async (attemptId: string, questionId: string) => {
    const res = await api.put<{ success: boolean; data: { question_id: string; is_flagged: boolean } }>(
      `/attempts/${attemptId}/flags`,
      { question_id: questionId }
    );
    return res.data.data;
  },
  submit: async (attemptId: string, submissionType = 'MANUAL') => {
    const res = await api.post<{
      success: boolean;
      data: {
        attempt_id: string;
        status: string;
        submitted_at: string;
        grade_report: GradeReport;
      };
    }>(`/attempts/${attemptId}/submit`, { submission_type: submissionType });
    return res.data.data;
  },
  getResult: async (attemptId: string) => {
    const res = await api.get<{
      success: boolean;
      data: {
        report: GradeReport;
        exam_title: string;
        questions: any[];
      };
    }>(`/attempts/${attemptId}/result`);
    return res.data.data;
  },
  overrideGrade: async (attemptId: string, payload: { question_id: string; new_score: number; override_reason: string }) => {
    const res = await api.post<{ success: boolean; data: GradeReport }>(
      `/attempts/${attemptId}/override-grade`,
      payload
    );
    return res.data.data;
  },
};

export interface SystemSettingsData {
  activeModel: string;
  geminiApiKey: string;
  hasGeminiKey: boolean;
  geminiApiKeyMasked: string;
  openaiApiKey: string;
  hasOpenAiKey: boolean;
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2BucketName: string;
  r2PublicDomain: string;
  hasR2Config: boolean;
}

export const SettingsAPI = {
  get: async () => {
    const res = await api.get<{
      success: boolean;
      data: SystemSettingsData;
    }>('/settings');
    return res.data.data;
  },
  save: async (payload: {
    gemini_api_key?: string;
    openai_api_key?: string;
    active_model?: string;
    r2_account_id?: string;
    r2_access_key_id?: string;
    r2_secret_access_key?: string;
    r2_bucket_name?: string;
    r2_public_domain?: string;
  }) => {
    const res = await api.post<{
      success: boolean;
      data: {
        activeModel: string;
        hasGeminiKey: boolean;
        hasR2Config: boolean;
        message: string;
      };
    }>('/settings', payload);
    return res.data.data;
  },
  testAI: async (payload?: { provider?: 'gemini' | 'openai'; apiKey?: string; model?: string }) => {
    const res = await api.post<{
      success: boolean;
      data: {
        connected: boolean;
        provider: string;
        model?: string;
        latencyMs: number;
        message: string;
      };
    }>('/settings/test-ai', payload || {});
    return res.data.data;
  },
  testR2: async (payload?: {
    accountId?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    bucketName?: string;
  }) => {
    const res = await api.post<{
      success: boolean;
      data: {
        connected: boolean;
        bucket: string;
        latencyMs: number;
        message: string;
      };
    }>('/settings/test-r2', payload || {});
    return res.data.data;
  },
};

export const UserAPI = {
  me: async () => {
    const res = await api.get<{ success: boolean; data: User }>('/users/me');
    return res.data.data;
  },
  switchRole: async (role: UserRole) => {
    const res = await api.post<{ success: boolean; data: User }>('/users/switch-role', { role });
    return res.data.data;
  },
  list: async () => {
    const res = await api.get<{ success: boolean; data: User[] }>('/users');
    return res.data.data;
  },
  create: async (payload: { fullName: string; email: string; role?: UserRole; tier?: UserTier }) => {
    const res = await api.post<{ success: boolean; data: User }>('/users', payload);
    return res.data.data;
  },
  update: async (id: string, payload: Partial<User>) => {
    const res = await api.patch<{ success: boolean; data: User }>(`/users/${id}`, payload);
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/users/${id}`);
    return res.data.data;
  },
};

export const AdminAPI = {
  getStats: async () => {
    const res = await api.get<{ success: boolean; data: AdminStats }>('/admin/stats');
    return res.data.data;
  },
  getCourses: async () => {
    const res = await api.get<{ success: boolean; data: Course[] }>('/admin/courses');
    return res.data.data;
  },
  createCourse: async (payload: {
    code: string;
    name: string;
    description?: string;
    department?: string;
    topic?: string;
    isFreeTier?: boolean;
    tierRequired?: 'FREE' | 'PRO';
    documentIds?: string[];
    videoIds?: string[];
    chapters?: Chapter[];
    status?: 'draft' | 'published';
  }) => {
    const res = await api.post<{ success: boolean; data: Course }>('/admin/courses', payload);
    return res.data.data;
  },
  updateCourse: async (id: string, payload: Partial<Course>) => {
    const res = await api.put<{ success: boolean; data: Course }>(`/admin/courses/${id}`, payload);
    return res.data.data;
  },
  deleteCourse: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/admin/courses/${id}`);
    return res.data.data;
  },
  getTokens: async () => {
    const res = await api.get<{
      success: boolean;
      data: {
        logs: TokenUsageLog[];
        summary: { totalTokens: number; estimatedCostUsd: number; callCount: number };
      };
    }>('/admin/tokens');
    return res.data.data;
  },
  getResources: async () => {
    const res = await api.get<{
      success: boolean;
      data: {
        documents: DocumentItem[];
        storage: { totalStorageBytes: number; totalStorageMB: string; documentCount: number };
      };
    }>('/admin/resources');
    return res.data.data;
  },
};

export const VideoAPI = {
  list: async (courseId?: string) => {
    const params = courseId ? { courseId } : {};
    const res = await api.get<{ success: boolean; data: VideoItem[] }>('/videos', { params });
    return res.data.data;
  },
  get: async (id: string) => {
    const res = await api.get<{ success: boolean; data: VideoItem }>(`/videos/${id}`);
    return res.data.data;
  },
  upload: async (file: File, title?: string, courseId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (courseId) formData.append('courseId', courseId);

    const res = await api.post<{ success: boolean; data: VideoItem }>('/videos/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  addYoutube: async (payload: { youtubeUrl: string; title?: string; courseId?: string }) => {
    const res = await api.post<{ success: boolean; data: VideoItem }>('/videos/youtube', payload);
    return res.data.data;
  },
  presign: async (filename: string, contentType?: string) => {
    const res = await api.post<{
      success: boolean;
      data: { isR2Active: boolean; presignedUrl?: string; key?: string; message?: string };
    }>('/videos/presign', { filename, contentType });
    return res.data.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<{ success: boolean; data: { message: string } }>(`/videos/${id}`);
    return res.data.data;
  },
};

export const ImageAPI = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{ success: boolean; data: { url: string; filename: string; originalName: string; sizeBytes: number } }>(
      '/images/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data.data;
  },
};

export const SystemServiceAPI = {
  list: async () => {
    const res = await api.get<{ success: boolean; data: SystemServiceConfig[] }>('/system/services');
    return res.data.data;
  },
  getStatusMap: async () => {
    const res = await api.get<{
      success: boolean;
      data: Record<string, { inMaintenance: boolean; name: string; message?: string; estimatedEndTime?: string }>;
    }>('/system/services/status');
    return res.data.data;
  },
  toggleMaintenance: async (id: string, payload: {
    status?: 'RUNNING' | 'MAINTENANCE';
    maintenanceMessage?: string;
    estimatedEndTime?: string;
    allowAdminBypass?: boolean;
  }) => {
    const res = await api.post<{ success: boolean; data: SystemServiceConfig }>(`/system/services/${id}/toggle`, payload);
    return res.data.data;
  },
  testPaymentCheckout: async () => {
    const res = await api.post<{ success: boolean; data: { transactionId: string; status: string; message: string } }>('/payments/checkout');
    return res.data.data;
  }
};

export default api;

