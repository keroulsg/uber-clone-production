import { cn } from '@/lib/utils'

interface Action {
  label: string
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: Action[]
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
