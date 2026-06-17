import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  _hasHydrated: boolean
  setUser: (user: User) => void
  setToken: (token: string) => void
  setAuth: (user: User, token: string) => void
  logout: () => void
  _setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('auth_token')
        sessionStorage.removeItem('auth-storage')
        set({ user: null, token: null, isAuthenticated: false })
      },
      _setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'auth-storage',
      storage: typeof window !== 'undefined' ? {
        getItem: async (name: string) => {
          const raw = sessionStorage.getItem(name)
          return raw ? JSON.parse(raw) : null
        },
        setItem: async (name: string, value: unknown) => {
          sessionStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: async (name: string) => {
          sessionStorage.removeItem(name)
        },
      } : undefined,
      onRehydrateStorage: () => (state) => {
        state?._setHydrated()
      },
    }
  )
)
