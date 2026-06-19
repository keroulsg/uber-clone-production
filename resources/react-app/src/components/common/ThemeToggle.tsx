import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { useUIStore } from '@/stores/uiStore'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const isDark = theme === 'dark'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
        id="theme-toggle"
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
