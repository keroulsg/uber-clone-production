import apiClient from './client'
import type { ApiResponse, AuthResponse, User } from '../types'

export const login = (
  email: string,
  password: string,
  deviceToken?: string
): Promise<ApiResponse<AuthResponse>> =>
  apiClient
    .post('/auth/login', { email, password, device_token: deviceToken })
    .then((r) => r.data)

export const register = (
  name: string,
  email: string,
  phone: string,
  password: string,
  passwordConfirmation: string,
  role: string
): Promise<ApiResponse<AuthResponse>> =>
  apiClient
    .post('/auth/register', {
      name,
      email,
      phone,
      password,
      password_confirmation: passwordConfirmation,
      role,
    })
    .then((r) => r.data)

export const logout = (): Promise<ApiResponse<null>> =>
  apiClient.post('/auth/logout').then((r) => r.data)

export const getUser = (): Promise<ApiResponse<User>> =>
  apiClient.get('/auth/user').then((r) => r.data)

export const updateProfile = (data: FormData): Promise<ApiResponse<User>> =>
  apiClient.post('/auth/profile', data).then((r) => r.data)

export const changePassword = (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<null>> =>
  apiClient
    .post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    .then((r) => r.data)

export const forgotPassword = (email: string): Promise<ApiResponse<null>> =>
  apiClient.post('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (
  email: string,
  token: string,
  password: string,
  passwordConfirmation: string
): Promise<ApiResponse<null>> =>
  apiClient
    .post('/auth/reset-password', { email, token, password, password_confirmation: passwordConfirmation })
    .then((r) => r.data)

export const sendOtp = (): Promise<ApiResponse<null>> =>
  apiClient.post('/auth/send-otp').then((r) => r.data)

export const verifyOtp = (otp: string): Promise<ApiResponse<null>> =>
  apiClient.post('/auth/verify-otp', { otp }).then((r) => r.data)
