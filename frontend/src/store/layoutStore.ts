import { create } from 'zustand';

interface LayoutState {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isSqlSandboxOpen: boolean;
  setSqlSandboxOpen: (open: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed: boolean) => set({ isSidebarCollapsed: collapsed }),
  isSqlSandboxOpen: false,
  setSqlSandboxOpen: (open: boolean) => {
    set({
      isSqlSandboxOpen: open,
      isSidebarCollapsed: open ? true : false,
    });
  },
  toggleSidebar: () => {
    const { isSidebarCollapsed } = get();
    if (isSidebarCollapsed) {
      // Expanding sidebar automatically closes SQL sandbox if it was open
      set({
        isSidebarCollapsed: false,
        isSqlSandboxOpen: false,
      });
    } else {
      set({
        isSidebarCollapsed: true,
      });
    }
  },
}));
