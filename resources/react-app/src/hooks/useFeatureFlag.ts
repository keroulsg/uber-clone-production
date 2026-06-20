import { useQuery } from '@tanstack/react-query'
import { getFeatures } from '@/api/admin'

let cachedFeatures: Record<string, boolean> | null = null

export function useFeatureFlag(code: string): { enabled: boolean; loading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'features'],
    queryFn: async () => {
      const res = await getFeatures()
      const result = (res as any).data
      const features: any[] = result?.features ?? []
      cachedFeatures = {}
      features.forEach((f: any) => { cachedFeatures![f.code] = f.is_enabled })
      return cachedFeatures
    },
    staleTime: 60000,
  })

  const enabled = data?.[code] ?? cachedFeatures?.[code] ?? true
  return { enabled, loading: isLoading }
}

export function isFeatureEnabled(code: string): boolean {
  return cachedFeatures?.[code] ?? true
}

export function bootstrapFeatures(): void {
  getFeatures().then((res) => {
    const result = (res as any).data
    const features: any[] = result?.features ?? []
    cachedFeatures = {}
    features.forEach((f: any) => { cachedFeatures![f.code] = f.is_enabled })
  }).catch(() => {})
}
