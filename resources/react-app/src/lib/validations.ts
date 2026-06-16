import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passwordConfirmation: z.string(),
}).refine(data => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passwordConfirmation: z.string(),
}).refine(data => data.password === data.passwordConfirmation, {
  message: 'Passwords do not match',
  path: ['passwordConfirmation'],
})

export const createRideSchema = z.object({
  pickup: z.object({
    address: z.string().min(1, 'Pickup address is required'),
    lat: z.number(),
    lng: z.number(),
  }),
  destination: z.object({
    address: z.string().min(1, 'Destination address is required'),
    lat: z.number(),
    lng: z.number(),
  }),
  vehicleTypeId: z.string(),
})

export const cancelRideSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
})

export const rateDriverSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
})

export const createTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  category: z.string().optional(),
})

export const ticketMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Please enter a valid phone number').optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  newPasswordConfirmation: z.string(),
}).refine(data => data.newPassword === data.newPasswordConfirmation, {
  message: 'Passwords do not match',
  path: ['newPasswordConfirmation'],
})

export const vehicleRegistrationSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(2000).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Color is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
  registrationNumber: z.string().optional(),
  vehicleTypeId: z.string().min(1, 'Vehicle type is required'),
  features: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreateRideInput = z.infer<typeof createRideSchema>
export type CancelRideInput = z.infer<typeof cancelRideSchema>
export type RateDriverInput = z.infer<typeof rateDriverSchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type TicketMessageInput = z.infer<typeof ticketMessageSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type VehicleRegistrationInput = z.infer<typeof vehicleRegistrationSchema>
