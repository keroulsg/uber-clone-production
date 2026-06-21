import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Car, Navigation, History, Wallet, CreditCard,
  Heart, User, Settings, Menu, ChevronDown, Bell, LifeBuoy, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { getInitials } from '@/lib/utils'
import { useLogout } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { NotificationBell } from '@/components/common/NotificationBell'
import { useUnreadCount, useMarkAllAsRead, useMarkAsRead, useNotifications } from '@/hooks/useNotifications'
import { queryClient } from '@/lib/queryClient'

const navItems = [
  { icon: Car, label: 'Book Ride', href: '/rider' },
  { icon: Navigation, label: 'Current Ride', href: '/rider/current-ride' },
  { icon: History, label: 'Ride History', href: '/rider/history' },
  { icon: Wallet, label: 'Wallet', href: '/rider/wallet' },
  { icon: CreditCard, label: 'Payments', href: '/rider/payments' },
  { icon: Heart, label: 'Favorites', href: '/rider/favorites' },
  { icon: Star, label: 'Ratings', href: '/rider/ratings' },
  { icon: User, label: 'Profile', href: '/rider/profile' },
  { icon: Settings, label: 'Settings', href: '/rider/settings' },
  { icon: Bell, label: 'Notifications', href: '/rider/notifications' },
  { icon: LifeBuoy, label: 'Support', href: '/rider/support' },
]

export function RiderLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useLogout()
  const { user, isAuthenticated } = useAuthStore()
  const { data: notifData, isLoading: notifLoading, isError: notifError } = useNotifications(undefined, { enabled: isAuthenticated, refetchInterval: 5000 })
  const { data: unreadCount } = useUnreadCount({ enabled: isAuthenticated })
  const markAllAsRead = useMarkAllAsRead()
  const markAsRead = useMarkAsRead()
  const notifications = notifData?.data?.data ?? []

  if (!user) return null

  const sidebar = (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="flex items-center h-16 px-6 border-b">
        <Link to="/rider" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">G</span>
          </div>
          <span className="font-bold text-xl">Go</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">Rider</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex lg:flex-col w-64 fixed inset-y-0 z-30">
        {sidebar}
      </aside>

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center h-16 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button variant="ghost" size="icon" className="lg:hidden mr-3" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="ml-auto flex items-center gap-3">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount ?? 0}
              onMarkAllRead={() => markAllAsRead.mutate()}
              onMarkAsRead={(id) => markAsRead.mutate(id)}
              viewAllHref="/rider/notifications"
              isLoading={notifLoading}
              isError={notifError}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/rider/profile">Profile</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/rider/settings">Settings</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => { queryClient.cancelQueries(); queryClient.clear(); logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) }) }}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
