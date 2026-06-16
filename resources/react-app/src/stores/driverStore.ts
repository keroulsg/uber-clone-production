import { create } from 'zustand'
import type { Driver, Vehicle } from '../types'

interface DriverState {
  driverProfile: Driver | null
  isOnline: boolean
  vehicle: Vehicle | null
  setDriver: (driver: Driver) => void
  setOnlineStatus: (online: boolean) => void
  setVehicle: (vehicle: Vehicle | null) => void
  updateLocation: (lat: number, lng: number, bearing?: number) => void
}

export const useDriverStore = create<DriverState>()((set) => ({
  driverProfile: null,
  isOnline: false,
  vehicle: null,
  setDriver: (driver) =>
    set({ driverProfile: driver, isOnline: driver.isOnline, vehicle: driver.vehicle ?? null }),
  setOnlineStatus: (online) => set({ isOnline: online }),
  setVehicle: (vehicle) => set({ vehicle }),
  updateLocation: () => {},
}))
