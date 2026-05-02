import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  currentPage: string
  theme: 'light' | 'dark'
  toggleSidebar: () => void
  setCurrentPage: (p: string) => void
  toggleTheme: () => void
  setTheme: (t: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      currentPage: 'dashboard',
      theme: 'light',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setCurrentPage: (currentPage) => set({ currentPage }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'mediscribe-ui' }
  )
)
