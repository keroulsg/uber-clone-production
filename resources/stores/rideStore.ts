import { create } from 'zustand'
import type { Ride, RideBrief } from '../types'

interface RideState {
  currentRide: Ride | null
  rideHistory: RideBrief[]
  isLoading: boolean
  setCurrentRide: (ride: Ride | null) => void
  clearCurrentRide: () => void
  setRideHistory: (rides: RideBrief[]) => void
  setLoading: (loading: boolean) => void
}

export const useRideStore = create<RideState>()((set) => ({
  currentRide: null,
  rideHistory: [],
  isLoading: false,
  setCurrentRide: (ride) => set({ currentRide: ride }),
  clearCurrentRide: () => set({ currentRide: null }),
  setRideHistory: (rides) => set({ rideHistory: rides }),
  setLoading: (loading) => set({ isLoading: loading }),
}))
