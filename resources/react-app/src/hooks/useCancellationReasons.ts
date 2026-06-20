import { useQuery } from '@tanstack/react-query'
import * as cancellationReasonsApi from '../api/cancellation-reasons'

export function useCancellationReasons(actor: string = 'rider') {
  return useQuery({
    queryKey: ['cancellation-reasons', actor],
    queryFn: () => cancellationReasonsApi.getCancellationReasons(actor),
  })
}
