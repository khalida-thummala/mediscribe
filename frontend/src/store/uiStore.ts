import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  currentPage: string
  toggleSidebar: () => void
  setCurrentPage: (p: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentPage: 'dashboard',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCurrentPage: (currentPage) => set({ currentPage }),
}))
