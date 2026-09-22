import { create } from 'zustand';
import { User, UserRole } from '../types';
import { UserAPI } from '../services/api';

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  fetchCurrentUser: () => Promise<void>;
  switchRole: (targetRole: UserRole) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: {
    id: 'usr_default_student',
    email: 'sinhvien@ownedu.vn',
    fullName: 'Nguyễn Văn Nam',
    role: 'USER',
    tier: 'PRO',
  },
  isLoading: false,

  fetchCurrentUser: async () => {
    try {
      set({ isLoading: true });
      const user = await UserAPI.me();
      set({ currentUser: user, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  switchRole: async (targetRole: UserRole) => {
    try {
      set({ isLoading: true });
      const updated = await UserAPI.switchRole(targetRole);
      set({ currentUser: updated, isLoading: false });
    } catch (e) {
      console.error('Failed to switch role:', e);
      set({ isLoading: false });
    }
  },
}));
