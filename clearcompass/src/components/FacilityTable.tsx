'use client'

import { formatCurrency } from '@/lib/estimate'

interface Facility {
  id: string
  name: string
  address: string
  qualityScore: number
  network: boolean
  distance: number
  negotiatedRates: Array<{
    cashPrice: number
    minAllowed: number
    maxAllowed: number
    payerAllowed: number | null
  }>
}

interface FacilityTableProps {
  facilities: Facility[]
  onSelectFacility: (facilityId: string) => void
  isLoading?: boolean
}

export default function FacilityTable({ facilities, onSelectFacility, isLoading = false }: FacilityTableProps) {
  const getEstimatedRange = (facility: Facility) => {
    const rate = facility.negotiatedRates[0]
    if (!rate) return { low: 0, high: 0 }
    
    const allowedAmount = facility.network && rate.payerAllowed 
      ? rate.payerAllowed 
      : (rate.cashPrice + rate.minAllowed + rate.maxAllowed) / 3
    
    // Rough patient cost estimate (20% coinsurance + $100 copay for in-network)
    const basePatientCost = facility.network 
      ? (allowedAmount * 0.2) + 100 
      : allowedAmount * 0.4 // Higher for out-of-network
    
    return {
      low: Math.round(basePatientCost * 0.85),
      high: Math.round(basePatientCost * 1.15)
    }
  }

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score)
    const hasHalfStar = score % 1 >= 0.5
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-sm ${
              i < fullStars
                ? 'text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
        <span className="ml-1 text-sm text-gray-600">({score})</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (facilities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">No facilities found in your area.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Facilities Near You
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Click on a facility to get a detailed cost estimate
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Facility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Network
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Est. Cost Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quality
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {facilities.map((facility) => {
              const range = getEstimatedRange(facility)
              return (
                <tr key={facility.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {facility.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {facility.address}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        facility.network
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {facility.network ? 'In-Network' : 'Out-of-Network'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatCurrency(range.low)} - {formatCurrency(range.high)}
                  </td>
                  <td className="px-6 py-4">
                    {renderStars(facility.qualityScore)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {facility.distance} mi
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onSelectFacility(facility.id)}
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Get Estimate
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
