import { create } from 'zustand'
import apiClient from '@/api/client'
import { setCurrencyDefaults } from '@/lib/utils'

interface AppConfig {
  defaultCurrency: string
  currencyLocale: string
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
}

export const useAppConfig = create<AppConfig>((set) => ({
  defaultCurrency: 'USD',
  currencyLocale: 'en-US',
  loaded: false,
  loading: false,
  load: async () => {
    if (useAppConfig.getState().loaded || useAppConfig.getState().loading) return
    set({ loading: true })
    try {
      const res = await apiClient.get('/config')
      const data = res.data?.data
      if (data) {
        const currency = data.default_currency || 'USD'
        const locale = data.currency_locale || 'en-US'
        setCurrencyDefaults(locale, currency)
        set({ defaultCurrency: currency, currencyLocale: locale, loaded: true, loading: false })
      }
    } catch {
      set({ loaded: true, loading: false })
    }
  },
}))
