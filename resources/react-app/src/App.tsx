import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { useAppConfig } from './stores/appConfigStore'
import { useUser } from './hooks/useAuth'

// Layouts
import { GuestLayout } from './components/layout/GuestLayout'
import { AdminLayout } from './components/layout/AdminLayout'
import { DriverLayout } from './components/layout/DriverLayout'
import { RiderLayout } from './components/layout/RiderLayout'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminRidesPage from './pages/admin/AdminRidesPage'
import AdminDriversPage from './pages/admin/AdminDriversPage'
import AdminRidersPage from './pages/admin/AdminRidersPage'
import AdminVehiclesPage from './pages/admin/AdminVehiclesPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminPricingCalculatorPage from './pages/admin/AdminPricingCalculatorPage'
import AdminDriverProfilePage from './pages/admin/AdminDriverProfilePage'
import AdminRiderProfilePage from './pages/admin/AdminRiderProfilePage'
import AdminRideDetailPage from './pages/admin/AdminRideDetailPage'

// Driver Pages
import DriverDashboardPage from './pages/driver/DriverDashboardPage'
import DriverRideRequestsPage from './pages/driver/DriverRideRequestsPage'
import DriverCurrentRidePage from './pages/driver/DriverCurrentRidePage'
import DriverEarningsPage from './pages/driver/DriverEarningsPage'
import DriverRideHistoryPage from './pages/driver/DriverRideHistoryPage'
import DriverRatingPage from './pages/driver/DriverRatingPage'
import DriverProfilePage from './pages/driver/DriverProfilePage'
import DriverVehiclePage from './pages/driver/DriverVehiclePage'
import DriverDocumentsPage from './pages/driver/DriverDocumentsPage'
import DriverSettingsPage from './pages/driver/DriverSettingsPage'
import DriverWalletPage from './pages/driver/DriverWalletPage'
import DriverNotificationsPage from './pages/driver/DriverNotificationsPage'
import DriverSupportPage from './pages/driver/DriverSupportPage'

// Rider Pages
import RiderDashboardPage from './pages/rider/RiderDashboardPage'
import RiderCurrentRidePage from './pages/rider/RiderCurrentRidePage'
import RiderRideHistoryPage from './pages/rider/RiderRideHistoryPage'
import RiderWalletPage from './pages/rider/RiderWalletPage'
import RiderPaymentsPage from './pages/rider/RiderPaymentsPage'
import RiderFavoritesPage from './pages/rider/RiderFavoritesPage'
import RiderProfilePage from './pages/rider/RiderProfilePage'
import RiderSettingsPage from './pages/rider/RiderSettingsPage'
import RiderNotificationsPage from './pages/rider/RiderNotificationsPage'
import RiderSupportPage from './pages/rider/RiderSupportPage'

// Components
import { LoadingScreen } from './components/common/LoadingScreen'

// Protected Route wrapper
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  
  if (!_hasHydrated) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && user && !roles.some(r => user.roles?.includes(r))) {
    if (user.roles?.includes('super-admin') || user.roles?.includes('admin')) return <Navigate to="/admin" replace />
    if (user.roles?.includes('driver')) return <Navigate to="/driver" replace />
    if (user.roles?.includes('rider')) return <Navigate to="/rider" replace />
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

// Redirect authenticated users away from guest pages
function GuestRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  if (!_hasHydrated) return <LoadingScreen />
  if (isAuthenticated && user) {
    if (user.roles?.includes('super-admin') || user.roles?.includes('admin')) return <Navigate to="/admin" replace />
    if (user.roles?.includes('driver')) return <Navigate to="/driver" replace />
    return <Navigate to="/rider" replace />
  }
  return <>{children}</>
}

// Role-based redirect
function RoleRedirect() {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()
  if (!_hasHydrated) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.roles?.includes('super-admin') || user?.roles?.includes('admin')) return <Navigate to="/admin" replace />
  if (user?.roles?.includes('driver')) return <Navigate to="/driver" replace />
  if (user?.roles?.includes('rider')) return <Navigate to="/rider" replace />
  return <Navigate to="/login" replace />
}

function CurrencyInitializer() {
  const loadConfig = useAppConfig((s) => s.load)
  useEffect(() => { loadConfig() }, [loadConfig])
  return null
}

export default function App() {
  const token = useAuthStore((s) => s.token)
  const _hasHydrated = useAuthStore((s) => s._hasHydrated)
  const { isLoading, isError } = useUser()

  // Wait for zustand persist hydration before any route rendering
  if (!_hasHydrated) return <LoadingScreen />
  // Show loading while initial auth is being resolved
  if (token && isLoading) return <LoadingScreen />


  return (
    <>
      <CurrencyInitializer />
      <Routes>
      {/* Public / Auth Routes (redirect to dashboard if already logged in) */}
      <Route element={<GuestLayout />}>
        <Route path="/login" element={<GuestRedirect><LoginPage /></GuestRedirect>} />
        <Route path="/register" element={<GuestRedirect><RegisterPage /></GuestRedirect>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin', 'super-admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="rides" element={<AdminRidesPage />} />
        <Route path="rides/:id" element={<AdminRideDetailPage />} />
        <Route path="drivers" element={<AdminDriversPage />} />
        <Route path="drivers/:id" element={<AdminDriverProfilePage />} />
        <Route path="riders" element={<AdminRidersPage />} />
        <Route path="riders/:id" element={<AdminRiderProfilePage />} />
        <Route path="vehicles" element={<AdminVehiclesPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="pricing-calculator" element={<AdminPricingCalculatorPage />} />
      </Route>

      {/* Driver Routes */}
      <Route path="/driver" element={<ProtectedRoute roles={['driver']}><DriverLayout /></ProtectedRoute>}>
        <Route index element={<DriverDashboardPage />} />
        <Route path="rides" element={<DriverRideRequestsPage />} />
        <Route path="current-ride" element={<DriverCurrentRidePage />} />
        <Route path="earnings" element={<DriverEarningsPage />} />
        <Route path="wallet" element={<DriverWalletPage />} />
        <Route path="history" element={<DriverRideHistoryPage />} />
        <Route path="ratings" element={<DriverRatingPage />} />
        <Route path="profile" element={<DriverProfilePage />} />
        <Route path="vehicle" element={<DriverVehiclePage />} />
        <Route path="documents" element={<DriverDocumentsPage />} />
        <Route path="settings" element={<DriverSettingsPage />} />
        <Route path="notifications" element={<DriverNotificationsPage />} />
        <Route path="support" element={<DriverSupportPage />} />
      </Route>

      {/* Rider Routes */}
      <Route path="/rider" element={<ProtectedRoute roles={['rider']}><RiderLayout /></ProtectedRoute>}>
        <Route index element={<RiderDashboardPage />} />
        <Route path="current-ride" element={<RiderCurrentRidePage />} />
        <Route path="history" element={<RiderRideHistoryPage />} />
        <Route path="wallet" element={<RiderWalletPage />} />
        <Route path="payments" element={<RiderPaymentsPage />} />
        <Route path="favorites" element={<RiderFavoritesPage />} />
        <Route path="profile" element={<RiderProfilePage />} />
        <Route path="settings" element={<RiderSettingsPage />} />
        <Route path="notifications" element={<RiderNotificationsPage />} />
        <Route path="support" element={<RiderSupportPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
