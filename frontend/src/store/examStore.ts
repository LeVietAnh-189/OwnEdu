import { create } from 'zustand';
import axios from 'axios';
import { Question } from '../types';

export interface AnswerItem {
  questionId: string;
  type: 'MCQ' | 'ESSAY';
  selectedOption?: string;
  essayText?: string;
  isFlagged: boolean;
  isDirty: boolean;
}

export interface ExamState {
  attemptId: string | null;
  examId: string | null;
  examTitle: string;
  expiresAt: string | null;
  timeRemainingSeconds: number;
  currentIndex: number;
  questions: Question[];
  answers: Record<string, AnswerItem>;
  isSyncing: boolean;
  lastSavedAt: string | null;
  isOffline: boolean;

  // Actions
  initSession: (data: {
    attemptId: string;
    examId: string;
    examTitle: string;
    expiresAt: string;
    questions: Question[];
    initialAnswers?: Record<string, any>;
  }) => void;
  selectOption: (questionId: string, optionKey: string) => void;
  updateEssayText: (questionId: string, text: string) => void;
  toggleFlag: (questionId: string) => void;
  goToQuestion: (index: number) => void;
  saveAnswerToServer: (questionId: string) => Promise<void>;
  setOfflineStatus: (isOffline: boolean) => void;
  updateRemainingTime: (seconds: number) => void;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useExamStore = create<ExamState>((set, get) => ({
  attemptId: null,
  examId: null,
  examTitle: '',
  expiresAt: null,
  timeRemainingSeconds: 0,
  currentIndex: 0,
  questions: [],
  answers: {},
  isSyncing: false,
  lastSavedAt: null,
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,

  initSession: ({ attemptId, examId, examTitle, expiresAt, questions, initialAnswers = {} }) => {
    const formattedAnswers: Record<string, AnswerItem> = {};

    questions.forEach((q) => {
      const existing = initialAnswers[q.id];
      formattedAnswers[q.id] = {
        questionId: q.id,
        type: q.type,
        selectedOption: existing?.selectedOption || undefined,
        essayText: existing?.essayText || '',
        isFlagged: existing?.isFlagged || false,
        isDirty: false,
      };
    });

    const secondsLeft = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

    set({
      attemptId,
      examId,
      examTitle,
      expiresAt,
      timeRemainingSeconds: secondsLeft,
      questions,
      answers: formattedAnswers,
      currentIndex: 0,
    });
  },

  selectOption: (questionId: string, optionKey: string) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...(state.answers[questionId] || { questionId, type: 'MCQ', isFlagged: false }),
          type: 'MCQ',
          selectedOption: optionKey,
          isDirty: true,
        },
      },
    }));

    // Trắc nghiệm: Gửi lưu tức thì lên Backend
    get().saveAnswerToServer(questionId);
  },

  updateEssayText: (questionId: string, text: string) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...(state.answers[questionId] || { questionId, type: 'ESSAY', isFlagged: false }),
          type: 'ESSAY',
          essayText: text,
          isDirty: true,
        },
      },
    }));

    // Tự luận: Debounce 2000ms trước khi gửi PUT
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      get().saveAnswerToServer(questionId);
    }, 2000);
  },

  toggleFlag: async (questionId: string) => {
    const current = get().answers[questionId];
    const newFlagState = !current?.isFlagged;

    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: {
          ...state.answers[questionId],
          isFlagged: newFlagState,
        },
      },
    }));

    const attemptId = get().attemptId;
    if (attemptId && !get().isOffline) {
      try {
        await axios.put(`/api/v1/attempts/${attemptId}/flags`, { question_id: questionId });
      } catch (e) {
        console.warn('Flag update sync error', e);
      }
    }
  },

  goToQuestion: (index: number) => {
    const total = get().questions.length;
    if (index >= 0 && index < total) {
      set({ currentIndex: index });
    }
  },

  saveAnswerToServer: async (questionId: string) => {
    const { attemptId, answers, isOffline } = get();
    const item = answers[questionId];
    if (!attemptId || !item) return;

    if (isOffline) {
      // Lưu tạm vào localStorage nếu đang mất mạng
      localStorage.setItem(`offline_attempt_${attemptId}`, JSON.stringify(answers));
      return;
    }

    try {
      set({ isSyncing: true });
      await axios.put(`/api/v1/attempts/${attemptId}/answers/${questionId}`, {
        answer_type: item.type,
        selected_option: item.selectedOption || null,
        essay_text: item.essayText || null,
      });

      set({
        isSyncing: false,
        lastSavedAt: new Date().toLocaleTimeString('vi-VN'),
        answers: {
          ...get().answers,
          [questionId]: { ...item, isDirty: false },
        },
      });
    } catch (err) {
      console.error('Auto-save error:', err);
      set({ isSyncing: false });
    }
  },

  setOfflineStatus: (isOffline: boolean) => {
    set({ isOffline });
    if (!isOffline) {
      // Re-synching after coming back online
      const attemptId = get().attemptId;
      if (attemptId) {
        const cached = localStorage.getItem(`offline_attempt_${attemptId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            Object.keys(parsed).forEach((qId) => {
              get().saveAnswerToServer(qId);
            });
            localStorage.removeItem(`offline_attempt_${attemptId}`);
          } catch (e) {
            console.error('Error replaying offline cache:', e);
          }
        }
      }
    }
  },

  updateRemainingTime: (seconds: number) => {
    set({ timeRemainingSeconds: seconds });
  },
}));
