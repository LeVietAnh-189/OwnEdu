import { create } from 'zustand';
import { User, UserRole } from '../types';
import { UserAPI, AuthAPI } from '../services/api';

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  googleClientId: string;
  fetchCurrentUser: () => Promise<void>;
  fetchAuthConfig: () => Promise<string>;
  switchRole: (targetRole: UserRole) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<User>;
  loginWithMockGoogle: (payload: { email: string; name?: string; picture?: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const getInitialUser = (): User | null => {
  try {
    const raw = localStorage.getItem('ownedu_user');
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
};

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: getInitialUser(),
  isLoading: false,
  googleClientId: '',

  fetchAuthConfig: async () => {
    try {
      const config = await AuthAPI.getConfig();
      set({ googleClientId: config.googleClientId || '' });
      return config.googleClientId || '';
    } catch (err) {
      console.warn('Failed to fetch auth config:', err);
      return '';
    }
  },

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true });
      const user = await UserAPI.me();
      if (user) {
        localStorage.setItem('ownedu_user', JSON.stringify(user));
        localStorage.setItem('ownedu_active_user_id', user.id);
        set({ currentUser: user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  switchRole: async (targetRole: UserRole) => {
    try {
      set({ isLoading: true });
      const updated = await UserAPI.switchRole(targetRole);
      localStorage.setItem('ownedu_user', JSON.stringify(updated));
      localStorage.setItem('ownedu_active_user_id', updated.id);
      set({ currentUser: updated, isLoading: false });
    } catch (e) {
      console.error('Failed to switch role:', e);
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async (credential: string) => {
    try {
      set({ isLoading: true });
      const result = await AuthAPI.loginWithGoogle(credential);
      const user = result.user;
      localStorage.setItem('ownedu_user', JSON.stringify(user));
      localStorage.setItem('ownedu_active_user_id', user.id);
      set({ currentUser: user, isLoading: false });
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loginWithMockGoogle: async (payload) => {
    try {
      set({ isLoading: true });
      const result = await AuthAPI.loginWithMockGoogle(payload);
      const user = result.user;
      localStorage.setItem('ownedu_user', JSON.stringify(user));
      localStorage.setItem('ownedu_active_user_id', user.id);
      set({ currentUser: user, isLoading: false });
      return user;
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await AuthAPI.logout();
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      localStorage.removeItem('ownedu_user');
      localStorage.removeItem('ownedu_active_user_id');
      set({ currentUser: null, isLoading: false });
    }
  },
}));
