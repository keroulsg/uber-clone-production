import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { Card as CardUI } from '@/components/ui/card'
import { apiClient } from '@/api/client'
import { formatCurrency } from '@/lib/utils'
import { Calculator, Fuel, TrendingUp, DollarSign, UserCheck } from 'lucide-react'
import type { ApiResponse } from '@/types'

interface FareResult {
  base_fare: number
  fuel_cost: number
  distance_fare: number
  time_fare: number
  vehicle_multiplier: number
  subtotal: number
  surge_multiplier: number
  surge_amount: number
  total_fare: number
  company_commission: number
  driver_amount: number
}

export default function AdminPricingCalculatorPage() {
  const [pickupKm, setPickupKm] = useState(5)
  const [distanceKm, setDistanceKm] = useState(10)
  const [durationMin, setDurationMin] = useState(20)
  const [vehicleTypeId, setVehicleTypeId] = useState('1')
  const [gasPrice, setGasPrice] = useState(15)
  const [fuelConsumption, setFuelConsumption] = useState(8.5)
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.0)
  const [vehicleTypes, setVehicleTypes] = useState<Array<{id: number, name: string}>>([])
  const [result, setResult] = useState<FareResult | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiClient.get('/vehicle-types').then((r: any) => {
      if (r.data?.data) setVehicleTypes(r.data.data)
      else if (Array.isArray(r.data)) setVehicleTypes(r.data)
    }).catch(() => {})
  }, [])

  const calculate = async () => {
    setLoading(true)
    try {
      const res = await apiClient.post('/rides/estimate-fare', {
        pickup_latitude: 30.05,
        pickup_longitude: 31.24,
        destination_latitude: 30.05 + distanceKm * 0.009,
        destination_longitude: 31.24 + distanceKm * 0.009,
        vehicle_type_id: parseInt(vehicleTypeId),
        distance: distanceKm,
        duration: durationMin,
      })
      const data = (res.data as any)?.data ?? res.data
      setResult(data as FareResult)
    } catch (e) {
      console.error('Calculation error', e)
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const netEarning = result ? (result.driver_amount - result.fuel_cost) : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Pricing Calculator" description="Estimate fares, commissions, and driver earnings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" /> Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <Select value={vehicleTypeId} onValueChange={setVehicleTypeId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.filter((vt: any) => vt.is_active !== false).map((vt: any) => (
                      <SelectItem key={vt.id} value={String(vt.id)}>{vt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Surge Multiplier</Label>
                <Input type="number" step="0.1" min="1.0" max="3.0" value={surgeMultiplier} onChange={e => setSurgeMultiplier(parseFloat(e.target.value) || 1)} />
              </div>
              <div className="space-y-2">
                <Label>Pickup Distance (km)</Label>
                <Input type="number" min="0" step="0.5" value={pickupKm} onChange={e => setPickupKm(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Trip Distance (km)</Label>
                <Input type="number" min="0" step="0.5" value={distanceKm} onChange={e => setDistanceKm(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Trip Duration (min)</Label>
                <Input type="number" min="1" value={durationMin} onChange={e => setDurationMin(parseInt(e.target.value) || 1)} />
              </div>
              <div className="space-y-2">
                <Label><Fuel className="h-3 w-3 inline" /> Gasoline Price (EGP/L)</Label>
                <Input type="number" min="0" step="0.5" value={gasPrice} onChange={e => setGasPrice(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Fuel Consumption (L/100km)</Label>
                <Input type="number" min="0" step="0.1" value={fuelConsumption} onChange={e => setFuelConsumption(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <Button onClick={calculate} disabled={loading} className="w-full">
              {loading ? 'Calculating...' : 'Calculate Fare'}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Fare Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Base Fare</p>
                  <p className="text-lg font-bold">{formatCurrency(result.base_fare)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground"><Fuel className="h-3 w-3 inline" /> Fuel Cost</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(result.fuel_cost)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Distance Fare</p>
                  <p className="text-lg font-bold">{formatCurrency(result.distance_fare)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Time Fare</p>
                  <p className="text-lg font-bold">{formatCurrency(result.time_fare)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Vehicle Multiplier</p>
                  <p className="text-lg font-bold">×{result.vehicle_multiplier}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Surge</p>
                  <p className="text-lg font-bold text-red-600">×{result.surge_multiplier} (+{formatCurrency(result.surge_amount)})</p>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(result.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Company Commission ({((result.total_fare > 0 ? result.company_commission / result.total_fare : 0) * 100).toFixed(0)}%)</span>
                  <span className="font-medium text-blue-600">{formatCurrency(result.company_commission)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span><DollarSign className="h-4 w-4 inline" /> Rider Fare</span>
                  <span className="text-green-600">{formatCurrency(result.total_fare)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span><UserCheck className="h-3 w-3 inline" /> Driver Amount</span>
                  <span className="font-medium">{formatCurrency(result.driver_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span><Fuel className="h-3 w-3 inline" /> Estimated Fuel Cost</span>
                  <span className="font-medium text-orange-600">{formatCurrency(result.fuel_cost)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Net Driver Earning</span>
                  <span className={netEarning >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(netEarning)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
