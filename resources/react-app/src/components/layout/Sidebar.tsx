import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/lib/utils'

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  active?: boolean
}

interface SidebarProps {
  items: SidebarItem[]
  isCollapsed: boolean
  onToggle: () => void
  onNavClick?: () => void
  footer?: React.ReactNode
  user?: { name: string; avatarUrl?: string; email?: string }
}

export function Sidebar({ items, isCollapsed, onToggle, onNavClick, footer, user }: SidebarProps) {
  const location = useLocation()

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-card border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex items-center h-16 px-4 border-b', isCollapsed && 'justify-center')}>
        {!isCollapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-xl">Go</span>
          </Link>
        )}
        {isCollapsed && (
          <Link to="/">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">G</span>
            </div>
          </Link>
        )}
      </div>

      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = item.active ?? location.pathname === item.href
            const Icon = item.icon
            return (
              <Tooltip key={item.href} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    onClick={onNavClick}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 mx-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      isCollapsed && 'justify-center mx-auto w-10 h-10 p-0'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="flex items-center gap-4">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>
      </TooltipProvider>

      <Separator />

      {footer ? (
        <div className="p-4">{footer}</div>
      ) : user ? (
        <div className={cn('p-4', isCollapsed && 'flex justify-center')}>
          {isCollapsed ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : null}

      <div className={cn('border-t p-2', isCollapsed && 'flex justify-center')}>
        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'default'}
          className={cn('w-full justify-start', isCollapsed && 'w-10 h-10')}
          onClick={onToggle}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!isCollapsed && <span className="text-xs text-muted-foreground">Collapse</span>}
        </Button>
      </div>
    </div>
  )
}
