import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ToggleLeft, ToggleRight, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { getFeatures, toggleFeature } from '@/api/admin'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'

const categoryOrder = [
  'Ride Features', 'Finance Features', 'Safety Features',
  'Premium Features', 'Operations Features', 'Marketing Features',
  'Payment Features', 'Mobile Features', 'Advanced Features',
]

const categoryIcons: Record<string, string> = {
  'Ride Features': '🚗',
  'Finance Features': '💰',
  'Safety Features': '🛡️',
  'Premium Features': '⭐',
  'Operations Features': '⚙️',
  'Marketing Features': '📢',
  'Payment Features': '💳',
  'Mobile Features': '📱',
  'Advanced Features': '🔧',
}

export default function AdminFeatureManagementPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'features'],
    queryFn: () => getFeatures(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ code, isEnabled }: { code: string; isEnabled: boolean }) => toggleFeature(code, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'features'] })
      toast.success('Feature updated')
    },
    onError: () => toast.error('Failed to update feature'),
  })

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  const result = data?.data as any
  const features: any[] = result?.features ?? []
  const categories: string[] = result?.categories ?? []

  const grouped = categoryOrder
    .filter((c) => categories.includes(c))
    .map((category) => ({
      category,
      features: features.filter((f: any) => f.category === category).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Management"
        description="Enable or disable platform features. Disabled features are hidden from users and blocked at the API level."
      />

      {grouped.map((group) => (
        <Card key={group.category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{categoryIcons[group.category] || '📋'}</span>
              {group.category}
              <Badge variant="secondary" className="ml-2 text-xs">{group.features.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.features.map((feature: any) => (
                <div key={feature.code} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{feature.name}</span>
                      <Badge variant={feature.is_enabled ? 'default' : 'secondary'} className="text-[10px]">
                        {feature.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    {feature.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{feature.code}</p>
                  </div>
                  <Button
                    variant={feature.is_enabled ? 'default' : 'outline'}
                    size="sm"
                    className="ml-2 gap-1 shrink-0"
                    onClick={() => toggleMutation.mutate({ code: feature.code, isEnabled: !feature.is_enabled })}
                    disabled={toggleMutation.isPending}
                  >
                    {feature.is_enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    {feature.is_enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
