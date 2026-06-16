import { Link, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface GuestLayoutProps {
  children?: React.ReactNode
  showBackground?: boolean
}

export function GuestLayout({ children, showBackground = true }: GuestLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      {showBackground && (
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-primary to-emerald-400 flex-col justify-center items-center p-12 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          <div className="relative z-10 text-center max-w-md">
            <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold">G</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Go</h1>
            <p className="text-lg text-primary-foreground/80">
              Your reliable ride-hailing platform. Fast, safe, and affordable transportation at your fingertips.
            </p>
          </div>
        </div>
      )}

      <div className={cn(
        'flex-1 flex flex-col justify-center items-center p-8',
        !showBackground && 'w-full'
      )}>
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">G</span>
              </div>
              <span className="font-bold text-2xl">Go</span>
            </Link>
          </div>
          {children ?? <Outlet />}
        </div>
      </div>
    </div>
  )
}
