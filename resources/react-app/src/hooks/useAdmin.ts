import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import * as adminApi from '../api/admin'
import type { ApiResponse, PaginatedResponse, Ticket } from '../types'

function useAdminToken() {
  return useAuthStore((s) => s.token)
}

export function useDashboard() {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
    enabled: !!token,
    retry: 1,
  })
}

export function useCharts(period?: string, from?: string, to?: string) {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'charts', period, from, to],
    queryFn: () => adminApi.getCharts(period, from, to),
    enabled: !!token,
    retry: 1,
  })
}

export function useActivities() {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'activities'],
    queryFn: () => adminApi.getActivities(),
    enabled: !!token,
    refetchInterval: 30000,
  })
}

export function useAdminUsers(params?: Record<string, unknown>) {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.getUsers(params),
    enabled: !!token,
  })
}

export function useAdminDrivers(params?: Record<string, unknown>) {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'drivers', params],
    queryFn: () => adminApi.getDrivers(params),
    enabled: !!token,
  })
}

export function useAdminRides(params?: Record<string, unknown>) {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'rides', params],
    queryFn: () => adminApi.getAllRides(params),
    enabled: !!token,
  })
}

export function useAdminPayments(params?: Record<string, unknown>) {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'payments', params],
    queryFn: () => adminApi.getPayments(params),
    enabled: !!token,
  })
}

export function useApproveDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.approveDriver(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] }) },
  })
}

export function useRejectDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectDriver(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] }) },
  })
}

export function useSuspendDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendDriver(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] }) },
  })
}

export function useReactivateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.reactivateDriver(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] }) },
  })
}

export function useAdminSettings() {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings(),
    enabled: !!token,
  })
}

export function useUpdateSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => adminApi.updateSetting(key, value),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }) },
  })
}

export function useAuditLogs(params?: Record<string, unknown>) {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminApi.getAuditLogs(params),
    enabled: !!token,
  })
}

export function useStats() {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    enabled: !!token,
  })
}

export function useCreateDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => adminApi.createDriver(formData),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'drivers'] }) },
  })
}

export function useDriverDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'driver', id],
    queryFn: () => adminApi.getDriverDetail(id),
    enabled: !!id,
  })
}

export function useAddDriverWarning() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminApi.addDriverWarning(id, data),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'driver', vars.id] }) },
  })
}

export function useAddDriverPenalty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => adminApi.addDriverPenalty(id, data),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'driver', vars.id] }) },
  })
}

export function useDriverRides(id: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'driver', id, 'rides', params],
    queryFn: () => adminApi.getDriverRides(id, params),
    enabled: !!id,
  })
}

export function useDriverPayments(id: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'driver', id, 'payments', params],
    queryFn: () => adminApi.getDriverPayments(id, params),
    enabled: !!id,
  })
}

export function useRiderDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'rider', id],
    queryFn: () => adminApi.getRiderDetail(id),
    enabled: !!id,
  })
}

export function useSuspendRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendRider(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'riders'] }) },
  })
}

export function useReactivateRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.reactivateRider(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'riders'] }) },
  })
}

export function useRiderRides(id: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'rider', id, 'rides', params],
    queryFn: () => adminApi.getRiderRides(id, params),
    enabled: !!id,
  })
}

export function useRiderPayments(id: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['admin', 'rider', id, 'payments', params],
    queryFn: () => adminApi.getRiderPayments(id, params),
    enabled: !!id,
  })
}

export function useAdminRideDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'ride', id],
    queryFn: () => adminApi.getAdminRideDetail(id),
    enabled: !!id,
  })
}

export function usePaymentDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'payment', id],
    queryFn: () => adminApi.getPaymentDetail(id),
    enabled: !!id,
  })
}

export function useAdminRiders(params?: Record<string, unknown>) {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'riders', params],
    queryFn: () => adminApi.getRiders(params),
    enabled: !!token,
  })
}

export function useAdminVehicles(params?: Record<string, unknown>) {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'vehicles', params],
    queryFn: () => adminApi.getAdminVehicles(params),
    enabled: !!token,
  })
}

export function useApproveVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.approveVehicle(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'vehicles'] }) },
  })
}

export function useRejectVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.rejectVehicle(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'vehicles'] }) },
  })
}

export function useSuspendVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminApi.suspendVehicle(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'vehicles'] }) },
  })
}

export function useAdminTickets(params?: Record<string, unknown>) {
  const token = useAdminToken()
  return useQuery<ApiResponse<PaginatedResponse<Ticket>>>({
    queryKey: ['admin', 'tickets', params],
    queryFn: () => adminApi.getAdminTickets(params) as Promise<ApiResponse<PaginatedResponse<Ticket>>>,
    enabled: !!token,
  })
}

export function useBlockDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.blockDriver(id, reason),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'driver', vars.id] }) },
  })
}

export function useUnblockDriver() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.unblockDriver(id, reason),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'driver', vars.id] }) },
  })
}

export function useBlockRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.blockRider(id, reason),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'rider', vars.id] }) },
  })
}

export function useUnblockRider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => adminApi.unblockRider(id, reason),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['admin', 'rider', vars.id] }) },
  })
}

export function useBanHistory(userId: string) {
  return useQuery({
    queryKey: ['admin', 'ban-history', userId],
    queryFn: () => adminApi.getBanHistory(userId),
    enabled: !!userId,
  })
}

export function useLiveDrivers() {
  const token = useAdminToken()
  return useQuery({
    queryKey: ['admin', 'live-drivers'],
    queryFn: () => adminApi.getLiveDrivers(),
    enabled: !!token,
    refetchInterval: 15000,
  })
}

export function useSurgeData(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['admin', 'surge-data', lat, lng],
    queryFn: () => adminApi.getSurgeData(lat, lng),
    refetchInterval: 30000,
    enabled: lat != null && lng != null,
  })
}
