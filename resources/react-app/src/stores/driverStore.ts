import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Driver, Vehicle } from '../types'

interface DriverState {
  driverProfile: Driver | null
  isOnline: boolean
  vehicle: Vehicle | null
  _hasHydrated: boolean
  setDriver: (driver: Driver) => void
  setOnlineStatus: (online: boolean) => void
  setVehicle: (vehicle: Vehicle | null) => void
  updateLocation: (lat: number, lng: number, bearing?: number) => void
  _setHydrated: () => void
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      driverProfile: null,
      isOnline: false,
      vehicle: null,
      _hasHydrated: false,
      setDriver: (driver) =>
        set({ driverProfile: driver, isOnline: driver.isOnline, vehicle: driver.vehicle ?? null }),
      setOnlineStatus: (online) => set({ isOnline: online }),
      setVehicle: (vehicle) => set({ vehicle }),
      updateLocation: () => {},
      _setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: 'driver-storage',
      partialize: (state) => ({ isOnline: state.isOnline }),
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
