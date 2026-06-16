export const APP_NAME = 'Go'

export const RIDE_STATUS = {
  pending: { label: 'Pending', color: 'yellow', icon: 'Clock' },
  searching_driver: { label: 'Searching Driver', color: 'blue', icon: 'Search' },
  driver_assigned: { label: 'Driver Assigned', color: 'indigo', icon: 'UserCheck' },
  driver_arrived: { label: 'Driver Arrived', color: 'purple', icon: 'MapPin' },
  ride_started: { label: 'Ride Started', color: 'orange', icon: 'Play' },
  ride_completed: { label: 'Completed', color: 'green', icon: 'CheckCircle' },
  cancelled: { label: 'Cancelled', color: 'red', icon: 'XCircle' },
} as const

export const VEHICLE_TYPES = [
  { slug: 'economy', label: 'Economy', icon: 'Car' },
  { slug: 'standard', label: 'Standard', icon: 'Car' },
  { slug: 'premium', label: 'Premium', icon: 'Car' },
  { slug: 'xl', label: 'XL', icon: 'Truck' },
  { slug: 'luxury', label: 'Luxury', icon: 'Car' },
] as const

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
  DRIVER: 'driver',
  RIDER: 'rider',
} as const

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    ME: '/api/auth/me',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password',
  },
  DRIVERS: {
    BASE: '/api/drivers',
    PROFILE: '/api/drivers/profile',
    VEHICLES: '/api/drivers/vehicles',
    EARNINGS: '/api/drivers/earnings',
    STATUS: '/api/drivers/status',
    DOCUMENTS: '/api/drivers/documents',
  },
  RIDES: {
    BASE: '/api/rides',
    CREATE: '/api/rides',
    ESTIMATE: '/api/rides/estimate',
    ACTIVE: '/api/rides/active',
    HISTORY: '/api/rides/history',
    CANCEL: (id: string) => `/api/rides/${id}/cancel`,
    RATE: (id: string) => `/api/rides/${id}/rate`,
  },
  VEHICLES: {
    TYPES: '/api/vehicles/types',
    BASE: '/api/vehicles',
  },
  PAYMENTS: {
    BASE: '/api/payments',
    METHODS: '/api/payments/methods',
    WALLET: '/api/payments/wallet',
    TRANSACTIONS: '/api/payments/transactions',
  },
  RATINGS: {
    BASE: '/api/ratings',
  },
  SUPPORT: {
    TICKETS: '/api/support/tickets',
    MESSAGES: (id: string) => `/api/support/tickets/${id}/messages`,
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_READ: (id: string) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
  },
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    DRIVERS: '/api/admin/drivers',
    RIDES: '/api/admin/rides',
    VEHICLES: '/api/admin/vehicles',
    STATISTICS: '/api/admin/statistics',
  },
} as const

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 10,
  PER_PAGE_OPTIONS: [10, 25, 50, 100],
} as const
