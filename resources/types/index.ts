export type RideStatus = 'pending' | 'searching_driver' | 'driver_assigned' | 'driver_arrived' | 'ride_started' | 'ride_completed' | 'cancelled'

export type DriverStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type VehicleStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'maintenance' | 'retired'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface UserBrief {
  id: string
  name: string
  phone?: string
  avatarUrl?: string
  rating?: number
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  gender?: string
  avatarUrl?: string
  isActive: boolean
  roles: string[]
  emailVerifiedAt?: string
  phoneVerifiedAt?: string
  createdAt: string
  blockedAt?: string | null
  blockedById?: string | null
  blockReason?: string | null
}

export interface UserBanHistoryEntry {
  id: number
  user_id: number
  action: 'blocked' | 'unblocked'
  reason: string | null
  acted_by: { id: number; name: string } | null
  auto_blocked: boolean
  created_at: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface DriverBrief {
  id: string
  user: UserBrief
  averageRating: number
  totalRides: number
  gender?: string
  vehicle?: VehicleBrief
}

export interface Driver {
  id: string
  userId: string
  user: User
  licenseNumber?: string
  isOnline: boolean
  isApproved: boolean
  isVerified: boolean
  status: DriverStatus
  averageRating: number
  totalRides: number
  totalEarnings: number
  currentBalance: number
  acceptanceRate: number
  completionRate: number
  vehicle?: Vehicle
  profilePhotoUrl?: string
  licenseFrontImage?: string
  licenseBackImage?: string
  identityFrontImage?: string
  identityBackImage?: string
  criminalRecord?: string
  verificationDocument?: Record<string, string>
  address?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  createdAt: string
}

export interface Rider {
  id: string
  userId: string
  user: User
  gender?: string
  totalRides: number
  totalSpent: number
  averageRating: number
  createdAt: string
}

export interface VehicleType {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  base_fare: number
  per_km_rate: number
  per_minute_rate: number
  minimum_fare: number
  cancellation_fee: number
  seating_capacity: number
  image_url?: string
  is_active: boolean
}

export interface VehicleBrief {
  id: string
  make: string
  model: string
  year: number
  color: string
  licensePlate: string
  imageUrl?: string
}

export interface Vehicle {
  id: string
  driverId: string
  make: string
  model: string
  year: number
  color: string
  licensePlate: string
  registrationNumber?: string
  vehicleType: VehicleType
  features?: string[]
  status: VehicleStatus
  isActive: boolean
  imageUrl?: string
  createdAt: string
}

export interface FareBreakdown {
  base: number
  distance: number
  time: number
  fuel_cost?: number
  surge: number
  surge_multiplier?: number
  night: number
  peak: number
  discount: number
  promo: number
  waiting: number
  toll: number
  cancellation: number
  total: number
}

export interface Ride {
  id: string
  bookingId: string
  rider: UserBrief
  driver?: DriverBrief
  vehicle?: VehicleBrief
  vehicleType: VehicleType
  pickup: { address: string; lat: number; lng: number }
  destination: { address: string; lat: number; lng: number }
  status: RideStatus
  estimatedDistance?: number
  estimatedDuration?: number
  estimatedFare: number
  actualDistance?: number
  actualDuration?: number
  actualFare?: number
  surge_multiplier?: number
  fareBreakdown: FareBreakdown
  paymentMethod?: string
  paymentStatus: PaymentStatus
  routePolyline?: string
  createdAt: string
  pickedUpAt?: string
  droppedAt?: string
  completedAt?: string
  cancelledAt?: string
  cancelledBy?: string
  cancellationReason?: string
  femaleDriverPreferred?: boolean
  femaleDriverUnavailable?: boolean
  fallbackAvailable?: boolean
  fallbackToAnyDriverAccepted?: boolean
  driverRated: boolean
  riderRated: boolean
}

export interface RideBrief {
  id: string
  bookingId: string
  pickup: { address: string; lat?: number; lng?: number }
  destination: { address: string; lat?: number; lng?: number }
  status: RideStatus
  estimatedFare: number
  actualFare?: number
  createdAt: string
}

export interface Payment {
  id: string
  rideId: string
  amount: number
  platformFee: number
  driverAmount: number
  taxAmount: number
  currency: string
  paymentMethod?: string
  status: string
  transactionId?: string
  paidAt?: string
  refundedAt?: string
  rider?: UserBrief
  driver?: UserBrief
  appliedCommissionRate?: number
  companyCommission?: number
  driver_amount?: number
  platform_fee?: number
  payment_method?: string
  transaction_id?: string
}

export interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description?: string
  referenceType?: string
  referenceId?: string
  status: string
  createdAt: string
}

export interface Wallet {
  id: string
  balance: number
  currency: string
  isActive: boolean
  lastTransactionAt?: string
}

export interface Rating {
  id: string
  rideId: string
  rater: UserBrief
  rating: number
  comment?: string
  createdAt: string
}

export interface TicketMessage {
  id: string
  user: UserBrief
  message: string
  isStaff: boolean
  createdAt: string
  readAt?: string
}

export interface Ticket {
  id: string
  ticketId: string
  user: UserBrief
  subject: string
  message: string
  priority: TicketPriority
  status: TicketStatus
  category?: string
  assignedTo?: UserBrief
  createdAt: string
  resolvedAt?: string
  messages: TicketMessage[]
}

export interface Notification {
  id: string
  type: string
  title?: string
  message?: string
  data: any
  readAt?: string
  createdAt: string
}

export interface DashboardStats {
  totalUsers: number
  totalDrivers: number
  totalRides: number
  activeDrivers: number
  onlineRiders: number
  todayRevenue: number
  weeklyRevenue: number
  monthlyRevenue: number
  totalRevenue: number
  growthPercentages: {
    users: number
    drivers: number
    rides: number
    revenue: number
  }
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
  }[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number
    to: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  trace_id?: string
  service?: string
}

export interface RoutePoint {
  lat: number
  lng: number
}

export interface ApiErrorResponse {
  success: false
  message?: string
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
    status: number
  }
  trace_id?: string
  service?: string
}
