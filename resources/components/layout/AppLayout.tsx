import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
  active?: boolean
}

interface AppLayoutProps {
  sidebarItems: SidebarItem[]
  headerTitle?: string
  headerAction?: React.ReactNode
  children: React.ReactNode
  sidebarFooter?: React.ReactNode
}

export function AppLayout({ sidebarItems, headerTitle, headerAction, children, sidebarFooter }: AppLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:block">
        <Sidebar
          items={sidebarItems}
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          footer={sidebarFooter}
        />
      </aside>

      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar
            items={sidebarItems}
            isCollapsed={false}
            onToggle={() => {}}
            onNavClick={() => setIsMobileSidebarOpen(false)}
            footer={sidebarFooter}
          />
        </SheetContent>
      </Sheet>

      <div className={cn('flex-1 flex flex-col transition-all duration-300', isSidebarCollapsed ? 'ml-16' : 'ml-64')}>
        <Header
          title={headerTitle}
          action={headerAction}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
