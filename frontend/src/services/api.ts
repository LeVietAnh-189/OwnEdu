import axios from 'axios';
import { DocumentItem, DocumentChunk, Exam, GradeReport, User, UserRole, UserTier, Course, AdminStats, TokenUsageLog } from '../types';

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

export const SettingsAPI = {
  get: async () => {
    const res = await api.get<{
      success: boolean;
      data: {
        activeModel: string;
        hasGeminiKey: boolean;
        geminiApiKeyMasked: string;
        hasOpenAiKey: boolean;
      };
    }>('/settings');
    return res.data.data;
  },
  save: async (payload: { gemini_api_key?: string; openai_api_key?: string; active_model?: string }) => {
    const res = await api.post<{
      success: boolean;
      data: {
        activeModel: string;
        hasGeminiKey: boolean;
        message: string;
      };
    }>('/settings', payload);
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
  createCourse: async (payload: { code: string; name: string; description?: string; department?: string; topic?: string }) => {
    const res = await api.post<{ success: boolean; data: Course }>('/admin/courses', payload);
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

export default api;

